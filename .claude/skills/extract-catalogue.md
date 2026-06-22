---
description: Use this skill to extract structured product data from a manufacturer's PDF catalogue and output it as Supabase-ready SQL INSERT statements. Trigger when the user provides a PDF catalogue file and asks to import, extract, or load products from it. Also trigger for phrases like "extract this catalogue", "load products from PDF", "import manufacturer data".
argument-hint: path/to/catalogue.pdf  (e.g. /Users/melia/Downloads/ntw-catalogue-2025.pdf)
---

# Manufacturer Catalogue Extractor

You are extracting building product data from a manufacturer's PDF catalogue into the BuildQuote Manufacturer Portal Supabase database.

## Target Schema

The output must match these exact tables:

### `manufacturers`
```sql
id           UUID  (auto)
name         TEXT  -- e.g. "James Hardie"
slug         TEXT  -- e.g. "james-hardie"  (lowercase, hyphens, no spaces)
logo_url     TEXT  -- leave NULL unless URL is known
website_url  TEXT  -- e.g. "https://jameshardie.com.au"
description  TEXT  -- 1–2 sentence brand summary
```

### `systems`
```sql
id                  UUID  (auto)
manufacturer_id     UUID  -- FK to manufacturers.id
source_document_id  UUID  -- FK to catalogue_sources.id — always populate
name                TEXT  -- e.g. "HardiePlank Cladding", "GL13 Glulam Beam"
product_code        TEXT  -- exactly as printed on catalogue
slug                TEXT  -- e.g. "hardiplank-cladding-hw4200"
category            TEXT  -- MUST be one of the allowed values listed below
subcategory         TEXT  -- finer classification within category
description         TEXT  -- product description from catalogue
dimensions          TEXT  -- use only when ALL sizes share one dimension; otherwise NULL (use system_profiles)
length_m            NUMERIC -- standard length in metres; NULL for sheet products or variable-length structural
sheet_format        TEXT  -- for sheet products: e.g. "1200 × 2400mm" — NULL for linear products
double_sided        BOOLEAN
fire_rating         TEXT  -- e.g. "FRL 60/60/60", "BAL-40", "Group 1" — NULL if not rated/stated
acoustic_rating     TEXT  -- e.g. "Rw 45", "STC 52" — NULL if not stated
moisture_resistant  BOOLEAN DEFAULT false
structural_grade    TEXT  -- e.g. "GL13", "LVL 13", "F17", "MGP15" — NULL for non-structural products
hero_image_url      TEXT  -- leave NULL (images added manually via Supabase Storage)
website_url         TEXT  -- direct URL to this product's page on the manufacturer's site (if findable in catalogue)
source_url          TEXT  -- URL to the source document or page this data was extracted from
source_label        TEXT  -- human-readable label for source_url, e.g. "James Hardie Product Guide 2025"
install_guide_url   TEXT  -- URL to installation guide PDF — leave NULL if not in catalogue; fill manually later
tech_data_url       TEXT  -- URL to technical data sheet PDF — leave NULL if not in catalogue; fill manually later
notes               TEXT  -- installation notes, warranty, species, treatment class, certifications
sort_order          INTEGER

-- Note: hero_image_url, install_guide_url, and tech_data_url are typically filled manually
-- after extraction. If a URL appears directly in the catalogue, populate it; otherwise leave NULL.
```

#### Allowed `category` values

| Category | What goes here |
|---|---|
| `Decking` | composite, timber, aluminium deck boards |
| `Exterior Cladding` | exterior wall — fibre cement weatherboard, composite, timber |
| `Screening & Fencing` | battens, privacy screens, fencing |
| `Soffit & Fascia` | soffit lining, fascia boards, eave linings |
| `Internal Wall Lining` | plasterboard (Gyprock), fibre cement internal sheets |
| `Ceiling` | ceiling boards, acoustic ceiling tiles |
| `Feature Wall` | decorative groove panels, textured/architectural wall systems |
| `Flooring` | sheet flooring, fibre cement subfloor, composite flooring |
| `Roofing` | roof cladding, sarking, insulated panels |
| `Structural Timber` | glulam beams, LVL, CLT, hardwood structural sections, engineered timber |

If a product genuinely doesn't fit any category, flag it to the user before proceeding.

> **Important:** If a system comes in multiple widths, thicknesses, lengths, or sheet sizes — do NOT cram them into one row. Use `system_profiles` (see below). Leave `systems.dimensions` / `systems.length_m` / `systems.sheet_format` NULL and let the profiles carry the detail.

### `system_profiles`
```sql
-- One row per distinct size/SKU variant within a system.
-- Use when a product comes in multiple widths, thicknesses, lengths, or sheet formats.
id          UUID  (auto)
system_id   UUID  -- FK to systems.id
sku         TEXT  -- e.g. "DP-230-4200", "HW6000", "GL13-240x45"
label       TEXT  -- human-readable label on RFQ — e.g. "230mm × 4.2m", "1200 × 2400mm sheet", "240 × 45mm × 6.0m"
dimensions  TEXT  -- cross-section: e.g. "7.5mm × 230mm", "240mm × 45mm"
length_m    NUMERIC -- length in metres; NULL for sheet products
sheet_format TEXT -- for sheet products: "1200 × 2400mm"; NULL for linear products
sort_order  INTEGER
```

**When to use `system_profiles` vs `systems` fields:**
- One size only → put spec on the `systems` row directly. No profiles needed.
- Two or more sizes, different lengths, or different sheet dimensions → always use `system_profiles`. One row per SKU.
- Different SKUs per size → always use `system_profiles`.

### `system_colours`
```sql
id          UUID  (auto)
system_id   UUID  -- FK to systems.id
colour_name TEXT  -- exact name from catalogue
sku         TEXT  -- colour-specific SKU if different colours have different part numbers (e.g. NTW)
                  -- NULL if colour does not change the SKU
image_url   TEXT  -- leave NULL
is_stocked  BOOLEAN DEFAULT true
sort_order  INTEGER
```

> **Colour SKUs:** Some manufacturers (e.g. NewTech Wood) assign a unique part number per colour-profile combination. Populate `system_colours.sku` in those cases. Where all colours share the same base SKU, leave it NULL.

### `components`
```sql
id              UUID  (auto)
manufacturer_id UUID  -- FK to manufacturers.id
sku             TEXT  -- catalogue part number; generate readable one if absent (flag in comment)
name            TEXT  -- short and specific: "Hidden Clip", "Starter Corner 230mm", "Sikaflex 300ml Sausage"
description     TEXT  -- FULL PHYSICAL SPEC STRING — see rules below ★
category        TEXT  -- see allowed values below
unit            TEXT  -- "pack" | "each" | "box" | "lm" | "sheet" | "tube" | "sausage" | "pail" | "roll"
sort_order      INTEGER
```

#### Allowed `components.category` values
`Clips` | `Screws` | `Trims` | `Starter Profile` | `Spacers` | `Joists` | `Adhesive` | `Structural Connectors` | `Insulation` | `Membrane` | `Other`

#### ★ Rules for `components.description` — READ CAREFULLY

The `description` field is the **SPECS column on the RFQ**. Builders read this to know exactly what they're ordering. Every measurable spec must be here. Write it as a compact spec string — not a marketing sentence.

**Always capture:**

| Spec type | How to write it | Example |
|---|---|---|
| Dimensions (L × W × T) | full size in mm | `3000mm × 50mm × 12mm` |
| Length only | in metres or mm | `3.6m long` |
| Cross-section | W × D | `90mm × 45mm` |
| Volume (liquids) | with unit | `300ml sausage` / `600ml tube` / `20L pail` |
| Pack / box quantity | explicit count | `100 per box` / `25 per pack` |
| Material / grade | as specified | `A4 stainless steel` / `powder-coated aluminium` / `HDPE` |
| Structural grade | as printed | `GL13` / `F17` / `LVL 13` |
| Treatment class | as printed | `H3 treated` / `H4 treated` |
| Finish | if relevant | `mill finish` / `black anodised` / `primed` |
| Fastener spec | full | `M8 × 50mm countersunk Torx T25` |
| Coverage / yield | if stated | `covers approx. 15m²` / `1 tube per 8m` |
| Fire / acoustic rating | if stated | `FRL 60/60/60` / `Rw 45` |
| Compatibility note | brief | `grooved profile only` / `use with US92 only` |

**Format rules:**
- Separate specs with ` · ` (space-dot-space)
- Lead with size/volume, then material/grade, then pack size, then compatibility note
- No marketing adjectives ("premium", "high quality") — facts only
- If a spec is not stated in the catalogue, omit it; never guess

**Good examples:**
```
3000mm × 75mm × 40mm · powder-coated aluminium · each
50mm × 10mm · A4 stainless steel · 100 per box · use with grooved decking
300ml sausage · polyurethane adhesive · covers approx. 8 linear metres
230mm wide × 3600mm long · powder-coated aluminium starter strip · each
M10 × 75mm · hot-dip galvanised · joist hanger · 25 per box
90mm × 45mm × 6.0m · GL13 glulam · H3 treated · each
```

**Bad examples (never do this):**
```
Starter Corner                         ← no specs at all
High quality aluminium trim piece      ← marketing, no measurements
Available in multiple sizes            ← vague
Adhesive for composite decking         ← missing volume, coverage
```

**Common accessory types and what specs to find:**

| Type | Specs to always capture |
|---|---|
| Corner / starter / end profiles | length (mm or m), width (mm), material, finish |
| Trim / fascia / cap | length, width, thickness, material, finish |
| Clips / hidden fasteners | dimensions (mm), material grade (SS304, A4, galv), qty per pack |
| Screws | diameter × length, head type, drive type, material grade, qty per box |
| Spacers / packers | thickness (mm), material, qty per pack |
| Adhesive (tube / sausage / pail) | volume with unit, product name/formulation, coverage |
| Joists / subframe | length, width, thickness, material, treatment |
| Isolation strips / acoustic tape | length, width, thickness, material |
| End caps | width matching profile, material, qty per pack |
| Joint compounds / fillers | volume/weight, drying time if stated |
| Structural connectors (joist hangers, post bases, brackets) | size, material grade (G300, G450), fastener spec, load rating if stated |
| Beams / structural sections | cross-section (mm × mm), length, grade, species, treatment class |
| Membrane / sarking | roll dimensions (m × m), material type |

### `system_components`
```sql
id           UUID  (auto)
system_id    UUID  -- FK to systems.id
component_id UUID  -- FK to components.id
role         TEXT  -- "required" | "recommended" | "optional"
notes        TEXT  -- e.g. "1 clip per fixing point", "use with grooved profile only"
sort_order   INTEGER
```

### `catalogue_sources`
```sql
id              UUID  (auto)
manufacturer_id UUID  -- FK to manufacturers.id
document_name   TEXT  -- exact title from document cover
document_url    TEXT  -- URL to PDF if publicly available; else NULL
document_date   TEXT  -- as printed on document: e.g. "December 2025"
extracted_at    TIMESTAMPTZ  -- use now()
extracted_by    TEXT  -- "Claude extract-catalogue skill"
notes           TEXT  -- e.g. "Pages 4–38 used. Fire supplement excluded."
```

---

## Extraction Process

Follow these steps in order. Do not skip steps.

### Step 1 — Read the PDF
Load the file at the path provided. If no path is given, ask for it. Read the entire document before extracting anything. Note:
- Total page count
- Document structure (sections, chapters, product families)
- Any index or table of contents

### Step 2 — Identify the Manufacturer and Document
Extract brand name (exact), website URL, a 1–2 sentence brand description, document title, and document date (as printed).

Ask the user: **"Does [manufacturer name] already exist in the database? If so, provide the manufacturer UUID. If not, I'll generate an INSERT."**

### Step 3 — Map Product Categories
Map each catalogue section to an allowed category. Flag any ambiguous products to the user before proceeding.

Category mapping guide:

| Catalogue section | → | BuildQuote category |
|---|---|---|
| Decking, deck boards, grooved, solid | → | `Decking` |
| Exterior cladding, weatherboard, façade, wall panels | → | `Exterior Cladding` |
| Screening, fencing, battens, privacy | → | `Screening & Fencing` |
| Soffit, fascia, eave | → | `Soffit & Fascia` |
| Plasterboard, internal lining, fibre cement internal | → | `Internal Wall Lining` |
| Ceiling boards, acoustic ceiling | → | `Ceiling` |
| Groove panels, feature wall, architectural panels | → | `Feature Wall` |
| Sheet flooring, subfloor, composite floors | → | `Flooring` |
| Roof cladding, sarking, roofing panels | → | `Roofing` |
| Glulam, LVL, CLT, hardwood structural, engineered timber | → | `Structural Timber` |

### Step 4 — Extract Systems (Product Profiles)

For each distinct product profile or structural section:
- Extract `product_code` exactly as printed
- Extract `name` (marketing name)
- Determine `category` and `subcategory`
- Extract description and any special notes

**For structural timber products**, also extract:
- `structural_grade` — e.g. `"GL13"`, `"GL17"`, `"LVL 13"`, `"F17"`, `"MGP15"`
- Treatment class → add to `notes` — e.g. `"H3 treated"`, `"H4 treated"`, `"Untreated"`, `"Seasoned"`
- Species → add to `notes` — e.g. `"Victorian Ash"`, `"Blackbutt"`, `"Douglas Fir"`, `"LVL — Pine"`
- Certifications → add to `notes` — FSC, PEFC, etc.

**For fire-rated products (Gyprock, Hardie, structural timber)**, also extract:
- `fire_rating` — e.g. `"FRL 60/60/60"`, `"Group 1"`, `"BAL-40"`

**For acoustic products (Gyprock)**, also extract:
- `acoustic_rating` — e.g. `"Rw 45"`, `"STC 52"`

**For moisture-resistant products**: set `moisture_resistant = true`

**Dimensions decision — do this for every system:**
1. One size only → put `dimensions` and `length_m` (or `sheet_format`) on the `systems` row. No profiles needed.
2. Multiple widths, thicknesses, or lengths → leave `systems` dimension fields NULL. Create `system_profiles` rows (Step 4b).
3. Different SKUs per size → always use `system_profiles`, one row per SKU.

#### Step 4b — Extract System Profiles (size variants)
For each size variant:
- Extract the SKU for that specific size
- Write a clear `label` that will display well on the RFQ:
  - Linear product: `"230mm × 4.2m"`, `"90 × 45mm × 5.4m"`
  - Sheet product: `"1200 × 2400mm sheet"`, `"1200 × 3000mm sheet"`
  - Structural beam: `"240 × 45mm × 6.0m"`, `"GL13 200 × 63mm × 9.0m"`
- `dimensions` = cross-section (width × depth/thickness, omit length)
- `length_m` = length in metres (NULL for sheet products)
- `sheet_format` = sheet dimensions string (NULL for linear products)

### Step 5 — Extract Colours per System
For each system, list every colour/finish option:
- Use the exact colour name from the catalogue
- Populate `system_colours.sku` if the catalogue assigns colour-specific part numbers
- Set `is_stocked = false` for "special order", "limited", or "discontinued" colours
- Note: structural timber products typically have no colours — skip this step for those

### Step 6 — Extract Components
Scan every fixings, accessories, adhesives, connectors, and hardware section. Do not skip pages — components are often at the back.

For each component:
1. **`sku`** — exact catalogue part number. If absent, generate: `[MFR-ABBREV]-[TYPE]-[SIZE]` and flag in a comment.
2. **`name`** — short and specific, include key size if it distinguishes the item: `"Joist Hanger 90 × 45mm"`, `"Glulam Purlin Hanger GL13"`.
3. **`description`** — build the full spec string. See ★ rules above. Read every line of the catalogue entry.
4. **`category`** — assign from the allowed list. Use `Structural Connectors` for joist hangers, post bases, beam brackets, tie-down straps, hold-down anchors.
5. **`unit`** — `pack` | `each` | `box` | `lm` | `sheet` | `tube` | `sausage` | `pail` | `roll`
6. **De-duplicate** — if the same clip appears for multiple systems, one `components` row with multiple `system_components` links.

### Step 7 — Map System → Components
For each system, identify required / recommended / optional components. Add notes where the catalogue specifies quantities or conditions.

---

## Output Format

```sql
-- ============================================================
-- [MANUFACTURER NAME] — Catalogue Import
-- Source: [document name and date]
-- Extracted: [today's date]
-- ============================================================

-- ── MANUFACTURER (skip if already in DB) ──────────────────
INSERT INTO manufacturers (name, slug, website_url, description)
VALUES (
  'James Hardie',
  'james-hardie',
  'https://jameshardie.com.au',
  'James Hardie manufactures fibre cement building products for cladding, internal lining, flooring, and roofing applications.'
);

-- ── CATALOGUE SOURCE ──────────────────────────────────────
WITH mf AS (SELECT id FROM manufacturers WHERE slug = 'james-hardie')
INSERT INTO catalogue_sources (manufacturer_id, document_name, document_url, document_date, extracted_by, notes)
SELECT mf.id,
  'James Hardie Product Guide 2025',
  NULL,
  'January 2025',
  'Claude extract-catalogue skill',
  'Pages 1–64. Fire supplement excluded.'
FROM mf;

-- ── SYSTEMS ───────────────────────────────────────────────
WITH
  mf  AS (SELECT id FROM manufacturers WHERE slug = 'james-hardie'),
  src AS (SELECT id FROM catalogue_sources
          WHERE manufacturer_id = (SELECT id FROM manufacturers WHERE slug = 'james-hardie')
          ORDER BY created_at DESC LIMIT 1)
INSERT INTO systems (
  manufacturer_id, source_document_id, name, product_code, slug,
  category, subcategory, description,
  dimensions, length_m, sheet_format,
  fire_rating, acoustic_rating, moisture_resistant, structural_grade,
  double_sided, notes,
  website_url, source_url, source_label, install_guide_url, tech_data_url,
  sort_order
)
-- Linear product example (HardiePlank weatherboard)
SELECT mf.id, src.id,
  'HardiePlank Cladding', 'HW4200', 'hardiplank-cladding-hw4200',
  'Exterior Cladding', 'Fibre Cement Weatherboard',
  'Fibre cement weatherboard with a smooth or woodgrain texture finish.',
  NULL, NULL, NULL,   -- NULL: sizes vary — see system_profiles
  'BAL-40', NULL, true,
  NULL,               -- not a structural product
  false,
  'Primed and ready to paint. 15-year warranty.',
  NULL, NULL, 'James Hardie Product Guide 2025', NULL, NULL,  -- fill URLs manually after extraction
  0
FROM mf, src
UNION ALL
-- Sheet product example (HardieFlex sheet)
SELECT mf.id, src.id,
  'HardieFlex Sheet', 'HF4800', 'hardieflex-sheet-hf4800',
  'Internal Wall Lining', 'Fibre Cement Sheet',
  'Multi-purpose fibre cement sheet for wet areas and general internal lining.',
  NULL, NULL, NULL,   -- NULL: sheet sizes vary — see system_profiles
  NULL, NULL, true,
  NULL,
  false,
  'Suitable for wet areas. Install per AS3740.',
  NULL, NULL, 'James Hardie Product Guide 2025', NULL, NULL,
  1
FROM mf, src;

-- ── SYSTEM PROFILES ───────────────────────────────────────
-- Linear product with multiple widths
WITH sys AS (SELECT id FROM systems WHERE product_code = 'HW4200')
INSERT INTO system_profiles (system_id, sku, label, dimensions, length_m, sheet_format, sort_order)
SELECT sys.id, 'HW4200-180', '180mm × 4.2m',   '7.5mm × 180mm', 4.2,  NULL, 0 FROM sys UNION ALL
SELECT sys.id, 'HW4200-230', '230mm × 4.2m',   '7.5mm × 230mm', 4.2,  NULL, 1 FROM sys UNION ALL
SELECT sys.id, 'HW4200-300', '300mm × 4.2m',   '7.5mm × 300mm', 4.2,  NULL, 2 FROM sys;

-- Sheet product with multiple sheet sizes
WITH sys AS (SELECT id FROM systems WHERE product_code = 'HF4800')
INSERT INTO system_profiles (system_id, sku, label, dimensions, length_m, sheet_format, sort_order)
SELECT sys.id, 'HF4800-2400', '1200 × 2400mm sheet', '4.5mm thick', NULL, '1200 × 2400mm', 0 FROM sys UNION ALL
SELECT sys.id, 'HF4800-3000', '1200 × 3000mm sheet', '4.5mm thick', NULL, '1200 × 3000mm', 1 FROM sys;

-- Structural timber example
WITH
  mf  AS (SELECT id FROM manufacturers WHERE slug = 'tilling'),
  src AS (SELECT id FROM catalogue_sources
          WHERE manufacturer_id = (SELECT id FROM manufacturers WHERE slug = 'tilling')
          ORDER BY created_at DESC LIMIT 1)
INSERT INTO systems (
  manufacturer_id, source_document_id, name, product_code, slug,
  category, subcategory, description,
  dimensions, length_m, sheet_format,
  fire_rating, acoustic_rating, moisture_resistant, structural_grade,
  double_sided, notes, sort_order
)
SELECT mf.id, src.id,
  'GL13 Glulam Beam', 'GL13-BEAM', 'gl13-glulam-beam',
  'Structural Timber', 'Glulam',
  'Structural glue-laminated timber beams for spanning applications.',
  NULL, NULL, NULL,   -- sizes vary — see system_profiles
  NULL, NULL, false,
  'GL13',
  false,
  'Species: Douglas Fir. H3 treated. Available in custom lengths to 13.5m. AS/NZS 1328.1 compliant.',
  0
FROM mf, src;

WITH sys AS (SELECT id FROM systems WHERE product_code = 'GL13-BEAM')
INSERT INTO system_profiles (system_id, sku, label, dimensions, length_m, sheet_format, sort_order)
SELECT sys.id, 'GL13-120x45-45',  'GL13 120 × 45mm × 4.5m',   '120mm × 45mm',  4.5, NULL, 0 FROM sys UNION ALL
SELECT sys.id, 'GL13-200x63-60',  'GL13 200 × 63mm × 6.0m',   '200mm × 63mm',  6.0, NULL, 1 FROM sys UNION ALL
SELECT sys.id, 'GL13-240x63-90',  'GL13 240 × 63mm × 9.0m',   '240mm × 63mm',  9.0, NULL, 2 FROM sys UNION ALL
SELECT sys.id, 'GL13-315x63-135', 'GL13 315 × 63mm × 13.5m',  '315mm × 63mm', 13.5, NULL, 3 FROM sys;

-- ── COLOURS ───────────────────────────────────────────────
-- NTW-style: colour = unique SKU
WITH sys AS (SELECT id FROM systems WHERE product_code = 'US92')
INSERT INTO system_colours (system_id, colour_name, sku, is_stocked, sort_order)
SELECT sys.id, 'Antique',   'US92-ANT', true, 0 FROM sys UNION ALL
SELECT sys.id, 'Teak',      'US92-TEA', true, 1 FROM sys;

-- Shared-SKU style: colour does not change part number
WITH sys AS (SELECT id FROM systems WHERE product_code = 'HW4200')
INSERT INTO system_colours (system_id, colour_name, sku, is_stocked, sort_order)
SELECT sys.id, 'Smooth',    NULL, true, 0 FROM sys UNION ALL
SELECT sys.id, 'Woodgrain', NULL, true, 1 FROM sys;

-- ── COMPONENTS ────────────────────────────────────────────
WITH mf AS (SELECT id FROM manufacturers WHERE slug = 'james-hardie')
INSERT INTO components (manufacturer_id, sku, name, description, category, unit, sort_order)
SELECT mf.id, 'HJ-SCREW-50', 'HardieDrive Screw 50mm',
  '6-18 × 50mm · 316 stainless steel · galv-coated · Torx T25 drive · 500 per box',
  'Screws', 'box', 0 FROM mf
UNION ALL
SELECT mf.id, 'HJ-PUTTY-450', 'HardiePatch Filler',
  '450ml tube · acrylic filler for joints and nail holes · paintable · each',
  'Adhesive', 'tube', 1 FROM mf
UNION ALL
-- Structural connector example (Tilling / ITI)
SELECT mf.id, 'TC-JH-90x45', 'Joist Hanger 90 × 45mm',
  '90mm × 45mm · G300 galvanised steel · 2.0mm thick · suits 90 × 45mm joist · 10 per pack',
  'Structural Connectors', 'pack', 2 FROM mf;

-- ── SYSTEM → COMPONENTS ───────────────────────────────────
WITH
  sys   AS (SELECT id FROM systems WHERE product_code = 'HW4200'),
  screw AS (SELECT id FROM components WHERE sku = 'HJ-SCREW-50'),
  putty AS (SELECT id FROM components WHERE sku = 'HJ-PUTTY-450')
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT sys.id, screw.id, 'required',    '2 screws per fixing point at 600mm centres', 0 FROM sys, screw UNION ALL
SELECT sys.id, putty.id, 'recommended', 'Fill nail holes before painting',            1 FROM sys, putty;
```

---

## Quality Checks

Before presenting the output, verify:

- [ ] `catalogue_sources` INSERT is present with document name, date, and `extracted_by`
- [ ] All `systems` rows include `source_document_id`
- [ ] Every `product_code` is unique within the manufacturer
- [ ] Every `slug` is URL-safe (lowercase, hyphens only) and unique
- [ ] Every `category` is exactly one of the ten allowed values
- [ ] `dimensions`, `length_m`, `sheet_format` are NULL on `systems` when `system_profiles` rows exist
- [ ] Every system with multiple sizes or multiple SKUs has `system_profiles` rows — one per SKU
- [ ] `system_profiles.label` reads clearly as a standalone RFQ line item
- [ ] `system_colours.sku` is populated where the catalogue gives colour-specific part numbers
- [ ] `fire_rating` is populated for any product described as fire-rated or BAL-rated
- [ ] `acoustic_rating` is populated for any product with an Rw or STC rating
- [ ] `structural_grade` is populated for all structural timber products
- [ ] Every `components.description` is a spec string with real measurements — no marketing language
- [ ] No colour appears twice for the same system
- [ ] No component SKU is duplicated
- [ ] All `system_components` reference valid product codes and component SKUs
- [ ] SQL has no orphaned foreign keys

---

## Asking for Clarification

Pause and ask the user if you encounter:
- A product that doesn't fit any of the ten categories
- Dimensions in non-standard units (inches only — convert to mm)
- A product code that might be a colour variant rather than a separate profile
- Multiple sizes with no individual SKUs — ask if you should generate them or use one system row
- Components with no clear SKU — ask to generate or leave NULL
- A colour only in a swatch chart with no name — describe what you see
- An adhesive or liquid with no volume stated — ask before leaving description incomplete
- A structural product with no grade specified — flag it; do not guess
- A fire rating mentioned without the full FRL triple (e.g. just "60 minutes fire") — record what is printed

---

## Handling Multiple Catalogues

Output a separate SQL block per manufacturer, clearly separated. At the end, produce a summary table:

```
| Manufacturer  | Systems | Profiles | Colours | Components |
|---|---|---|---|---|
| NewTech Wood  |    7    |    18    |    42   |     12     |
| James Hardie  |   12    |    31    |     8   |      6     |
| Tilling       |    4    |    16    |     0   |      9     |
```

---

## Manufacturer-Specific Tips

### NewTech Wood / WPC composite products
- Product code is near the profile cross-section diagram
- Lengths often listed in both metric and imperial — convert to metres
- **Each colour typically has its own SKU** — always populate `system_colours.sku`
- Accessories section at the back has full part numbers and specs — read every line

### James Hardie (fibre cement)
- Products named by width or thickness — e.g. "HardiePlank 180mm", "HardiePanel 6mm"
- Sheet products: extract every sheet size as a separate `system_profiles` row with `sheet_format`
- Always check for fire rating (FRL or Group number) and BAL rating — populate `fire_rating`
- `moisture_resistant = true` for any product described as suitable for wet areas
- Accessories: HardieDrive screws, joint trim, HardiePatch filler — get full part numbers and pack sizes

### CSR Gyprock (plasterboard)
- Multiple board thicknesses (10mm, 13mm, 16mm) and sheet sizes (1200×2400, 1200×3000, 1200×3600) — use `system_profiles`
- `fire_rating` — Gyprock products often have FRL ratings e.g. `"FRL 60/60/60"`, `"FRL 90/90/90"`
- `acoustic_rating` — populate for any board with an Rw or STC value
- `moisture_resistant = true` for Aquachek, Wetcheck, or any moisture-resistant board
- Accessories: compound, tape, beads, screws, adhesive — all have specific part numbers and coverage rates
- `subcategory` options: `"Standard Board"`, `"Fire-Rated Board"`, `"Moisture-Resistant Board"`, `"Acoustic Board"`, `"Ceiling Board"`

### DesignerGroove / architectural groove panels
- These span interior and exterior — check product spec before assigning `Feature Wall` vs `Cladding`
- Board spacing (groove width) is a key spec — put in `dimensions` or `notes`
- Colours are usually powder coat names — populate `system_colours`
- End profiles, internal/external corners, and joiners are the primary accessories

### Tilling / ITI / structural timber & glulam
- Always populate `structural_grade`: GL13, GL17, LVL 13, F17, F27, MGP10, MGP15
- Treatment class goes in `notes`: H2, H3, H4, H5 (never leave this out — it affects buildability)
- Species goes in `notes`: e.g. "Victorian Ash", "Blackbutt", "Douglas Fir", "Radiata Pine LVL"
- Cross-sections come in many combinations — each unique cross-section × length = one `system_profiles` row
- Lengths may be listed as "custom to Xm" — note maximum span in `notes`; create profiles for standard stock lengths only
- Accessories: joist hangers, post bases, beam brackets, bolts, coach screws, purlin cleats — use `Structural Connectors` category
- `unit` for connectors is usually `each` or `pack`; for structural fixings, `box`
- Load ratings (if stated) go in `components.description`: e.g. `"rated to 12kN vertical load"`

### Fibre cement (general)
- Watch for "F17", "MGP10" structural grades in subfloor products — add to `structural_grade`
- Colour charts at the back often apply to only a subset of profiles — cross-reference carefully

### Aluminium screening
- Sold in standard lengths (typically 6m) — one `system_profiles` row per length offered
- Colours are powder coat names; confirm which colours apply per profile
- End caps, joiner clips, and screw cover strips are critical accessories — get all part numbers
