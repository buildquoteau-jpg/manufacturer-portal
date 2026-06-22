---
name: catalogue-schema-reference
description: Live Supabase column reference for manufacturer catalogue extraction. Load this alongside extract-catalogue.md for accurate INSERT statements.
---

# Catalogue Extraction — Live Schema Reference

Supabase project: `oxvhmulxuvlfjyjzleki.supabase.co`  
Last verified: 2026-05-07 · Full schema: `supabase/schema_complete.sql`

---

## Tables used in catalogue extraction

### `catalogue_sources` — insert first, get ID for systems rows

| column | type | notes |
|---|---|---|
| `id` | uuid | auto |
| `manufacturer_id` | uuid | FK → manufacturers.id |
| `document_name` | text | exact title from cover page |
| `document_url` | text | URL to PDF if public, else NULL |
| `document_date` | text | as printed e.g. "December 2025" |
| `extracted_at` | timestamptz | use `now()` |
| `extracted_by` | text | `'Claude extract-catalogue skill'` |
| `notes` | text | pages used, sections excluded |

---

### `manufacturers` — skip if already in DB

| column | type | notes |
|---|---|---|
| `id` | uuid | auto |
| `name` | text | e.g. "James Hardie" |
| `slug` | text | lowercase-hyphenated, unique |
| `logo_url` | text | NULL — set manually |
| `hero_image_url` | text | NULL — set manually |
| `website_url` | text | e.g. "https://jameshardie.com.au" |
| `description` | text | 1–2 sentence brand summary |
| `abn` | text | if in catalogue |
| `phone` | text | if in catalogue |

---

### `systems` — one row per product line

| column | type | notes |
|---|---|---|
| `id` | uuid | auto |
| `manufacturer_id` | uuid | FK → manufacturers.id |
| `source_document_id` | uuid | FK → catalogue_sources.id — **always populate** |
| `name` | text | marketing name e.g. "HardiePlank Cladding" |
| `product_code` | text | exactly as printed |
| `slug` | text | url-safe, unique per manufacturer |
| `category` | text | **must be one of the 10 allowed values** ↓ |
| `subcategory` | text | finer classification |
| `description` | text | product description |
| `dimensions` | text | only if ALL sizes share one spec; else NULL |
| `length_m` | numeric | standard length in m; NULL for sheet/variable |
| `sheet_format` | text | e.g. "1200 × 2400mm" — NULL for linear |
| `double_sided` | boolean | default false |
| `fire_rating` | text | e.g. "FRL 60/60/60", "BAL-40", "Group 1" |
| `acoustic_rating` | text | e.g. "Rw 45", "STC 52" |
| `moisture_resistant` | boolean | default false |
| `structural_grade` | text | e.g. "GL13", "LVL 13", "F17", "MGP15" |
| `hero_image_url` | text | NULL — set manually |
| `website_url` | text | direct product URL if in catalogue |
| `source_url` | text | URL of source document |
| `source_label` | text | e.g. "James Hardie Product Guide 2025" |
| `install_guide_url` | text | NULL unless URL in catalogue |
| `tech_data_url` | text | NULL unless URL in catalogue |
| `notes` | text | warranty, species, treatment, certifications |
| `sort_order` | integer | within manufacturer |

**Allowed `category` values:**
`Decking` · `Exterior Cladding` · `Screening & Fencing` · `Soffit & Fascia` · `Internal Wall Lining` · `Ceiling` · `Feature Wall` · `Flooring` · `Roofing` · `Structural Timber`

> **Rule:** If a system has multiple sizes, widths, or SKUs → leave `dimensions`, `length_m`, `sheet_format` NULL and use `system_profiles` rows instead.

---

### `system_profiles` — size/SKU variants within a system

| column | type | notes |
|---|---|---|
| `id` | uuid | auto |
| `system_id` | uuid | FK → systems.id |
| `name` | text | human-readable label on RFQ e.g. "230mm × 4.2m" |
| `product_code` | text | SKU for this specific size |
| `dimensions` | text | cross-section e.g. "7.5mm × 230mm" |
| `length_m` | numeric | NULL for sheet products |
| `sheet_format` | text | e.g. "1200 × 2400mm" — NULL for linear |
| `sort_order` | integer | |

---

### `system_colours` — colour options per system

| column | type | notes |
|---|---|---|
| `id` | uuid | auto |
| `system_id` | uuid | FK → systems.id |
| `colour_name` | text | exact name from catalogue |
| `sku` | text | colour-specific SKU (e.g. NTW); NULL if shared SKU |
| `image_url` | text | NULL — set manually |
| `is_stocked` | boolean | false for special order / discontinued |
| `sort_order` | integer | |

---

### `components` — fixings, clips, trims, adhesives

| column | type | notes |
|---|---|---|
| `id` | uuid | auto |
| `manufacturer_id` | uuid | FK → manufacturers.id |
| `sku` | text | catalogue part number |
| `name` | text | short + specific, include size if distinguishing |
| `description` | text | **full spec string** — measurements, material, pack qty |
| `category` | text | see allowed values ↓ |
| `unit` | text | `pack` · `each` · `box` · `lm` · `sheet` · `tube` · `sausage` · `pail` · `roll` |
| `sort_order` | integer | |

**Allowed `category` values:**
`Clips` · `Screws` · `Trims` · `Starter Profile` · `Spacers` · `Joists` · `Adhesive` · `Structural Connectors` · `Insulation` · `Membrane` · `Other`

> **Description format:** `[size] · [material] · [pack qty] · [compatibility note]`  
> Example: `50mm × 10mm · A4 stainless steel · 100 per box · grooved profile only`

---

### `system_components` — which components go with which system

| column | type | notes |
|---|---|---|
| `id` | uuid | auto |
| `system_id` | uuid | FK → systems.id |
| `component_id` | uuid | FK → components.id |
| `role` | text | `required` · `recommended` · `optional` |
| `notes` | text | e.g. "1 clip per fixing point at 600mm centres" |
| `sort_order` | integer | |

---

## Quick SQL pattern

```sql
-- 1. Catalogue source (always first)
WITH mf AS (SELECT id FROM manufacturers WHERE slug = 'your-slug')
INSERT INTO catalogue_sources (manufacturer_id, document_name, document_date, extracted_by, notes)
SELECT id, 'Document Title 2025', 'January 2025', 'Claude extract-catalogue skill', 'All pages'
FROM mf RETURNING id;

-- 2. Systems (reference source via subquery)
WITH
  mf  AS (SELECT id FROM manufacturers WHERE slug = 'your-slug'),
  src AS (SELECT id FROM catalogue_sources WHERE manufacturer_id = (SELECT id FROM manufacturers WHERE slug = 'your-slug') ORDER BY created_at DESC LIMIT 1)
INSERT INTO systems (manufacturer_id, source_document_id, name, product_code, slug, category, ...)
SELECT mf.id, src.id, ... FROM mf, src;

-- 3. System profiles (if multiple sizes)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'XXXX')
INSERT INTO system_profiles (system_id, name, product_code, dimensions, length_m, sort_order)
SELECT sys.id, '230mm × 4.2m', 'XXXX-230', '7.5mm × 230mm', 4.2, 0 FROM sys;

-- 4. Colours
WITH sys AS (SELECT id FROM systems WHERE product_code = 'XXXX')
INSERT INTO system_colours (system_id, colour_name, sku, is_stocked, sort_order)
SELECT sys.id, 'Colour Name', 'SKU-COL', true, 0 FROM sys;

-- 5. Components
WITH mf AS (SELECT id FROM manufacturers WHERE slug = 'your-slug')
INSERT INTO components (manufacturer_id, sku, name, description, category, unit, sort_order)
SELECT id, 'SKU-001', 'Component Name', '50mm × 10mm · A4 stainless · 100 per box', 'Screws', 'box', 0 FROM mf;

-- 6. System → component links
WITH sys AS (SELECT id FROM systems WHERE product_code = 'XXXX'),
     cmp AS (SELECT id FROM components WHERE sku = 'SKU-001')
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT sys.id, cmp.id, 'required', '2 per fixing point', 0 FROM sys, cmp;
```
