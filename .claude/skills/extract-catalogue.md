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
-- One row per brand. Usually already exists — confirm with user before inserting.
id           UUID  (auto)
name         TEXT  -- e.g. "NewTech Wood"
slug         TEXT  -- e.g. "newtech-wood"  (lowercase, hyphens, no spaces)
logo_url     TEXT  -- leave NULL unless URL is known
website_url  TEXT  -- e.g. "https://newtechwood.com"
description  TEXT  -- 1–2 sentence brand summary
```

### `systems`
```sql
-- One row per product profile / board profile.
id              UUID  (auto)
manufacturer_id UUID  -- FK to manufacturers.id
name            TEXT  -- e.g. "Avenue Range"
product_code    TEXT  -- e.g. "US92"   (exactly as printed on catalogue)
slug            TEXT  -- e.g. "avenue-range-us92"
category        TEXT  -- MUST be one of: "Decking" | "Cladding" | "Screening & Fencing"
subcategory     TEXT  -- e.g. "Grooved Decking", "Solid Decking", "Shadowline Cladding"
description     TEXT  -- product description from catalogue
dimensions      TEXT  -- e.g. "138mm x 29mm"
length_m        NUMERIC -- e.g. 4.88  (convert feet to metres if needed: 1ft = 0.3048m)
double_sided    BOOLEAN -- true if reversible / dual-finish profile
hero_image_url  TEXT  -- leave NULL (images added separately)
notes           TEXT  -- installation notes, warranty, special properties
sort_order      INTEGER -- within category, 0-based, preserve catalogue order
```

### `system_colours`
```sql
-- One row per colour option per system.
id          UUID  (auto)
system_id   UUID  -- FK to systems.id
colour_name TEXT  -- e.g. "Antique", "Teak", "Blackbutt", "Charcoal"
image_url   TEXT  -- leave NULL (swatch images added separately)
is_stocked  BOOLEAN DEFAULT true
sort_order  INTEGER -- preserve catalogue order
```

### `components`
```sql
-- Fixings, clips, screws, trims — shared across systems.
id              UUID  (auto)
manufacturer_id UUID  -- FK to manufacturers.id
sku             TEXT  -- e.g. "NT-CLIP-01"  (use catalogue part number if present)
name            TEXT  -- e.g. "Hidden Clip", "Starter Profile 3.6m", "Composite Screw"
description     TEXT
category        TEXT  -- "Clips" | "Screws" | "Trims" | "Starter Profile" | "Spacers" | "Joists" | "Other"
unit            TEXT  -- "pack", "each", "box", "lm", "sheet"
sort_order      INTEGER
```

### `system_components`
```sql
-- Which components are needed for each system.
id           UUID  (auto)
system_id    UUID  -- FK to systems.id
component_id UUID  -- FK to components.id
role         TEXT  -- "required" | "recommended" | "optional"
notes        TEXT  -- e.g. "1 clip per fixing point", "use with grooved profile only"
sort_order   INTEGER
```

---

## Extraction Process

Follow these steps in order. Do not skip steps.

### Step 1 — Read the PDF
Use the PDF reading tool to load the file at the path provided by the user. If no path is given, ask for it.

Read the entire document before extracting anything. Note:
- Total page count
- Document structure (sections, chapters, product families)
- Any index or table of contents

### Step 2 — Identify the Manufacturer
Extract:
- Brand name (exact, as printed)
- Website URL (if present)
- A 1–2 sentence description of what they make

Check with the user: **"Does [manufacturer name] already exist in the database? If so, provide the manufacturer UUID so I can link systems to it. If not, I'll generate an INSERT for it."**

### Step 3 — Map Product Categories
Before extracting individual products, identify how the catalogue organises products and map them to the three allowed categories:

| Catalogue section | → | BuildQuote category |
|---|---|---|
| Decking, deck boards, grooved, solid | → | `Decking` |
| Cladding, wall panels, facades, weatherboard | → | `Cladding` |
| Screening, fencing, battens, privacy | → | `Screening & Fencing` |

Note any products that are ambiguous and flag them to the user.

### Step 4 — Extract Systems (Product Profiles)
For each distinct board/panel profile:
- Extract `product_code` exactly as printed (e.g. "US92", "US49C", "UH61")
- Extract `name` — the marketing name (e.g. "Avenue Range", "Terrace Range")
- Determine `category` and `subcategory`
- Extract dimensions in mm (width × depth/thickness) — convert from inches if needed
- Extract length(s) in metres — if multiple lengths, take the longest standard length; note others in `notes`
- Check for double-sided / reversible mentions
- Extract description and any special notes (warranty, material, FSC certified, etc.)
- Assign `sort_order` based on position in catalogue

### Step 5 — Extract Colours per System
For each system, list every colour/finish option:
- Use the exact colour name from the catalogue
- Note if any colours are described as "special order", "limited", or "discontinued" → set `is_stocked = false`
- Preserve the order they appear in the catalogue for `sort_order`

### Step 6 — Extract Components
Scan the fixings, accessories, and hardware sections:
- Extract each component with its SKU/part number, name, description, category, and unit
- De-duplicate: if the same clip appears for multiple systems, it's one `components` row
- Assign category from: Clips | Screws | Trims | Starter Profile | Spacers | Joists | Other

### Step 7 — Map System → Components
For each system, identify which components are required, recommended, or optional:
- "Required" = must use (structural clips, hidden fasteners, starter profiles)
- "Recommended" = advised (matching screws, colour-matched trims)
- "Optional" = supplementary (edge trims, fascia boards, joists)

Add notes where the catalogue specifies quantities or conditions (e.g. "1 clip per 300mm span").

---

## Output Format

Output as a single SQL file with clearly labelled sections. Use placeholder UUIDs in the format `'[manufacturer-uuid]'` if the manufacturer already exists, or generate `gen_random_uuid()` references inline.

```sql
-- ============================================================
-- [MANUFACTURER NAME] — Catalogue Import
-- Source: [filename]
-- Extracted: [today's date]
-- ============================================================

-- ── MANUFACTURER (skip if already in DB) ──────────────────
INSERT INTO manufacturers (name, slug, website_url, description)
VALUES (
  'NewTech Wood',
  'newtech-wood',
  'https://newtechwood.com',
  'NewTech Wood manufactures co-extruded composite decking, cladding and screening products.'
);

-- ── SYSTEMS ───────────────────────────────────────────────
-- Use a CTE so we can reference the manufacturer UUID by slug
WITH mf AS (SELECT id FROM manufacturers WHERE slug = 'newtech-wood')
INSERT INTO systems (manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, notes, sort_order)
SELECT
  mf.id,
  'Avenue Range', 'US92', 'avenue-range-us92',
  'Decking', 'Grooved Decking',
  'Co-extruded composite decking with hidden clip fixing system.',
  '138mm x 29mm', 4.88, false,
  'Lengths: 2.44m, 3.66m, 4.88m. FSC certified.',
  0
FROM mf;
-- ... repeat for each system ...

-- ── COLOURS ───────────────────────────────────────────────
WITH sys AS (SELECT id FROM systems WHERE product_code = 'US92')
INSERT INTO system_colours (system_id, colour_name, is_stocked, sort_order)
SELECT sys.id, 'Antique',   true, 0 FROM sys UNION ALL
SELECT sys.id, 'Teak',      true, 1 FROM sys UNION ALL
SELECT sys.id, 'Blackbutt', true, 2 FROM sys UNION ALL
SELECT sys.id, 'Charcoal',  true, 3 FROM sys;
-- ... repeat for each system ...

-- ── COMPONENTS ────────────────────────────────────────────
WITH mf AS (SELECT id FROM manufacturers WHERE slug = 'newtech-wood')
INSERT INTO components (manufacturer_id, sku, name, description, category, unit, sort_order)
SELECT mf.id, 'NT-CLIP-01', 'Hidden Clip', 'Stainless steel hidden fixing clip', 'Clips', 'pack', 0 FROM mf
UNION ALL
SELECT mf.id, 'NT-SCREW-SS', 'Composite Screw SS', 'A4 stainless 50mm composite screw', 'Screws', 'box', 1 FROM mf;
-- ... repeat for each component ...

-- ── SYSTEM → COMPONENTS ───────────────────────────────────
WITH
  sys AS (SELECT id FROM systems WHERE product_code = 'US92'),
  clip AS (SELECT id FROM components WHERE sku = 'NT-CLIP-01')
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT sys.id, clip.id, 'required', '1 clip per fixing point', 0
FROM sys, clip;
-- ... repeat for each system-component relationship ...
```

---

## Quality Checks

Before presenting the output, verify:

- [ ] Every `product_code` is unique within the manufacturer
- [ ] Every `slug` is unique and URL-safe (lowercase, hyphens only)
- [ ] Every `category` is exactly one of the three allowed values
- [ ] `length_m` values are in metres (not feet or mm)
- [ ] `dimensions` are in `WIDTHmm x DEPTHmm` format
- [ ] No colour appears twice for the same system
- [ ] No component SKU is duplicated
- [ ] All `system_components` reference valid system product codes and component SKUs
- [ ] SQL runs as a single transaction with no orphaned foreign keys

---

## Asking for Clarification

Pause and ask the user if you encounter:
- A product that doesn't fit any of the three categories
- Dimensions in non-standard units (e.g. inches only)
- A product code that looks like it might be a colour variant rather than a separate profile
- Components with no clear SKU — ask if you should generate one or leave NULL
- A colour listed only in a swatch chart with no name — describe what you see

---

## Handling Multiple Catalogues

If the user is processing catalogues from several manufacturers in one session:
- Output a separate SQL block per manufacturer, clearly separated
- Use consistent component naming across manufacturers where the same product type exists (e.g. hidden clips)
- At the end, produce a summary table:

```
| Manufacturer | Systems | Colours | Components |
|---|---|---|---|
| NewTech Wood | 7 | 42 | 12 |
```

---

## Tips for Common Building Product Catalogue Formats

- **NewTech Wood / WPC products**: Product code is usually printed near the profile cross-section diagram. Lengths are often listed in both metric and imperial.
- **Fibre cement (James Hardie etc.)**: Products are often named by width — e.g. "HardiePlank 180mm". The "product code" may be a SKU like "HW4200".
- **Aluminium screening**: Often sold in standard lengths (6m). Colours may be powder coat names.
- **Timber products**: Watch for "F17", "MGP10" structural grades — add these to `notes`.
- **Colour charts**: Often appear as a separate section at the back — cross-reference with individual product pages to confirm which colours apply to each profile.
