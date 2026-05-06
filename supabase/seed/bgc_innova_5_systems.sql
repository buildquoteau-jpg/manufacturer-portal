-- ============================================================
-- Innova / BGC Fibre Cement — Catalogue Import (5 Systems)
-- Source: Innova Australia Product Range Guide — December 2025
-- Extracted: 5 May 2026
-- Manufacturer slug: etex-innova-bgc
-- Manufacturer ID:   65ee9f06-05d2-4d36-9877-223cd1cf96a6
-- ============================================================
--
-- TABLES POPULATED
--   catalogue_sources  1 row
--   systems            5 rows  (Nuline, Stratum, Contour, Duraplank, Duragroove)
--   system_profiles   26 rows  (Nuline 4 · Stratum 5 · Contour 0 · Duraplank 4 · Duragroove 13)
--   system_colours     0 rows  (pre-primed for site painting — no factory colours)
--   components        31 rows
--   system_components 49 links
--
-- NOTE: fire_rating and moisture_resistant columns are included
-- per the updated skill schema. If these columns do not yet exist,
-- run: ALTER TABLE systems ADD COLUMN IF NOT EXISTS fire_rating TEXT;
--      ALTER TABLE systems ADD COLUMN IF NOT EXISTS moisture_resistant BOOLEAN DEFAULT false;
--
-- NOTE: system_profiles uses columns product_code + name (real DB column names).
-- The skill file refers to these as sku + label — same columns, different aliases.
--
-- ROLLBACK (paste this first in a separate run if anything looks wrong):
-- DELETE FROM system_components WHERE system_id IN (SELECT id FROM systems WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6');
-- DELETE FROM system_profiles    WHERE system_id IN (SELECT id FROM systems WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6');
-- DELETE FROM system_colours     WHERE system_id IN (SELECT id FROM systems WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6');
-- DELETE FROM components         WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';
-- DELETE FROM systems            WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';
-- DELETE FROM catalogue_sources  WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';
-- ============================================================


-- ── CATALOGUE SOURCE ─────────────────────────────────────────

WITH mf AS (SELECT id FROM manufacturers WHERE slug = 'etex-innova-bgc')
INSERT INTO catalogue_sources (
  manufacturer_id, document_name, document_url, document_date, extracted_by, notes
)
SELECT
  mf.id,
  'Innova Australia Product Range Guide — December 2025',
  NULL,
  'December 2025',
  'Claude extract-catalogue skill',
  'All 79 pages used. Covers: Weatherboards (Nuline, Stratum, Contour, Duraplank), Exterior Facades (Duragroove, Durascape, Duragrid, Duracom), Exterior Base Sheets (Duratex, Stonesheet), Pre-finished Facades (Montage), Interior Linings (Duraliner, Intergroove), Eaves & Soffits (Durasheet, Duralux), Flooring (Durafloor, compressed, ceramic tile underlay), Effects trims. This run covers 5 systems: Nuline, Stratum, Contour, Duraplank, Duragroove.'
FROM mf;


-- ── SYSTEMS ──────────────────────────────────────────────────
-- Contour is the only single-SKU system — dimensions go on the systems row.
-- All others have multiple SKUs — dimensions go in system_profiles; systems fields left NULL.

WITH
  mf  AS (SELECT id FROM manufacturers WHERE slug = 'etex-innova-bgc'),
  src AS (SELECT id FROM catalogue_sources
          WHERE manufacturer_id = (SELECT id FROM manufacturers WHERE slug = 'etex-innova-bgc')
          ORDER BY created_at DESC LIMIT 1)
INSERT INTO systems (
  manufacturer_id, source_document_id,
  name, product_code, slug,
  category, subcategory, description,
  dimensions, length_m,
  fire_rating, moisture_resistant,
  double_sided, notes,
  website_url, source_url, source_label, install_guide_url, tech_data_url,
  sort_order
)

-- 1. Nuline® — multiple SKUs (Square/Bullnose × 175mm/205mm) — sizes in system_profiles
SELECT mf.id, src.id,
  'Nuline®', 'NULINE', 'nuline',
  'Exterior Cladding', 'Fibre Cement Weatherboard',
  'Sleek, weatherboard-style cladding system delivering a modern and sophisticated aesthetic with the timeless charm of traditional weatherboards, without ongoing timber maintenance. Tongue-and-groove design ensures perfectly consistent joins with a 25mm bearing face on the stud. Available in Square and Bullnose profiles. Pre-primed and ready to paint.',
  NULL::TEXT, NULL::NUMERIC,
  'BAL-40', true,
  false,
  'Pre-primed, ready to paint. Pack of 120. BAL-40 compliant per AS 3959. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  10
FROM mf, src

UNION ALL

-- 2. Stratum® — multiple SKUs (5 surface profiles, all 12mm × 300mm × 4200mm) — SKUs in system_profiles
SELECT mf.id, src.id,
  'Stratum®', 'STRATUM', 'stratum',
  'Exterior Cladding', 'Fibre Cement Weatherboard',
  'Innovative weatherboard range with 5 unique profiles — Standard, Woodgrain, Duo, Duo Woodgrain, and Trio — mix and match for eye-catching original cladding. Shiplap joining for a seamless finish. Face-fix or conceal-fix. Pre-primed and ready to paint.',
  NULL, NULL,
  'BAL-40', true,
  false,
  'Pre-primed, ready to paint. Pack of 90. BAL-40 compliant per AS 3959. CMI Certified CM40406. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  20
FROM mf, src

UNION ALL

-- 3. Contour® — single SKU (10mm × 170mm × 4200mm, code 4092772) — dimensions on systems row
SELECT mf.id, src.id,
  'Contour®', '4092772', 'contour',
  'Exterior Cladding', 'Fibre Cement Weatherboard',
  'Replicates the charm of older-style weatherboard homes with a rebate at the top of each plank to enhance the shadowline for a more defined, traditional appearance. Narrower 170mm profile with concealed fixing. Pre-primed and ready to paint.',
  '10mm × 170mm', 4.2,
  'BAL-40', true,
  false,
  'Pre-primed, ready to paint. Pack of 180. Effective cover 141mm per board (24mm overlap). BAL-40 compliant per AS 3959. CMI Certified CM40407. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  30
FROM mf, src

UNION ALL

-- 4. Duraplank® — multiple SKUs (Smooth/Woodgrain × 230mm/300mm) — sizes in system_profiles
SELECT mf.id, src.id,
  'Duraplank®', 'DURAPLANK', 'duraplank',
  'Exterior Cladding', 'Fibre Cement Weatherboard',
  'Combines the timeless appeal of traditional weatherboards with modern durability and ease of installation. Resistant to decay, rot, and termite damage. Available in Smooth and Woodgrain finishes in 230mm and 300mm widths.',
  NULL, NULL,
  'BAL-29', true,
  false,
  'Pack of 120. BAL-29 compliant per AS 3959. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  40
FROM mf, src

UNION ALL

-- 5. Duragroove® — multiple SKUs (4 profiles × up to 4 lengths) — sizes in system_profiles
SELECT mf.id, src.id,
  'Duragroove®', 'DURAGROOVE', 'duragroove',
  'Exterior Cladding', 'Fibre Cement Facade Panel',
  'Highly versatile, vertically grooved large panel facade with shiplap join for seamless appearance and efficient installation. Four profiles: Narrow (100mm groove spacing), Wide (150mm), Extra Wide (400mm with enhanced groove width), and Wide Woodgrain. Acrylic-sealed panels improve paint adhesion. No taped-and-filled joints required.',
  NULL, NULL,
  'BAL-40', true,
  false,
  'Panels resistant to termites, air, steam, salt and sunlight. Pack of 40. BAL-40 compliant per AS 3959. CMI Certified CM40413. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  50
FROM mf, src;


-- ── SYSTEM PROFILES ──────────────────────────────────────────
-- Note: DB columns are product_code and name (the skill file calls these sku and label).
-- Contour has no profiles — its single size is on the systems row above.

-- Nuline — 4 SKUs (Square/Bullnose × 175mm/205mm)
WITH sys AS (
  SELECT id FROM systems
  WHERE product_code = 'NULINE'
    AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'
)
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
SELECT sys.id, '4092767', 'Square 175mm × 4.2m',   '14mm × 175mm', 4.2, 0 FROM sys UNION ALL
SELECT sys.id, '4092768', 'Square 205mm × 4.2m',   '14mm × 205mm', 4.2, 1 FROM sys UNION ALL
SELECT sys.id, '4092762', 'Bullnose 175mm × 4.2m', '14mm × 175mm', 4.2, 2 FROM sys UNION ALL
SELECT sys.id, '4092763', 'Bullnose 205mm × 4.2m', '14mm × 205mm', 4.2, 3 FROM sys;

-- Stratum — 5 SKUs (5 surface profiles, all 12mm × 300mm × 4200mm)
WITH sys AS (
  SELECT id FROM systems
  WHERE product_code = 'STRATUM'
    AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'
)
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
SELECT sys.id, '4092780', 'Standard 300mm × 4.2m',      '12mm × 300mm', 4.2, 0 FROM sys UNION ALL
SELECT sys.id, '4092787', 'Woodgrain 300mm × 4.2m',     '12mm × 300mm', 4.2, 1 FROM sys UNION ALL
SELECT sys.id, '4092775', 'Duo 300mm × 4.2m',           '12mm × 300mm', 4.2, 2 FROM sys UNION ALL
SELECT sys.id, '4092777', 'Duo Woodgrain 300mm × 4.2m', '12mm × 300mm', 4.2, 3 FROM sys UNION ALL
SELECT sys.id, '4092783', 'Trio 300mm × 4.2m',          '12mm × 300mm', 4.2, 4 FROM sys;

-- Duraplank — 4 SKUs (Smooth/Woodgrain × 230mm/300mm)
WITH sys AS (
  SELECT id FROM systems
  WHERE product_code = 'DURAPLANK'
    AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'
)
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
SELECT sys.id, '4092793', 'Smooth 230mm × 4.2m',    '7.5mm × 230mm', 4.2, 0 FROM sys UNION ALL
SELECT sys.id, '4092794', 'Smooth 300mm × 4.2m',    '7.5mm × 300mm', 4.2, 1 FROM sys UNION ALL
SELECT sys.id, '4092796', 'Woodgrain 230mm × 4.2m', '7.5mm × 230mm', 4.2, 2 FROM sys UNION ALL
SELECT sys.id, '4092797', 'Woodgrain 300mm × 4.2m', '7.5mm × 300mm', 4.2, 3 FROM sys;

-- Duragroove — 13 SKUs (4 profiles × available lengths)
-- Panel product: length_m = panel height. Width (1200mm) captured in profile name.
WITH sys AS (
  SELECT id FROM systems
  WHERE product_code = 'DURAGROOVE'
    AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'
)
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
-- Smooth Narrow (100mm groove spacing) — 3 lengths
SELECT sys.id, '4092596', 'Smooth Narrow · 1200 × 2450mm',     '9mm × 1200mm', 2.45, 0  FROM sys UNION ALL
SELECT sys.id, '4092597', 'Smooth Narrow · 1200 × 2750mm',     '9mm × 1200mm', 2.75, 1  FROM sys UNION ALL
SELECT sys.id, '4092598', 'Smooth Narrow · 1200 × 3000mm',     '9mm × 1200mm', 3.0,  2  FROM sys UNION ALL
-- Smooth Wide (150mm groove spacing) — 4 lengths
SELECT sys.id, '4092599', 'Smooth Wide · 1200 × 2450mm',       '9mm × 1200mm', 2.45, 10 FROM sys UNION ALL
SELECT sys.id, '4092600', 'Smooth Wide · 1200 × 2750mm',       '9mm × 1200mm', 2.75, 11 FROM sys UNION ALL
SELECT sys.id, '4092601', 'Smooth Wide · 1200 × 3000mm',       '9mm × 1200mm', 3.0,  12 FROM sys UNION ALL
SELECT sys.id, '4092602', 'Smooth Wide · 1200 × 3600mm',       '9mm × 1200mm', 3.6,  13 FROM sys UNION ALL
-- Smooth Extra Wide (400mm groove spacing) — 3 lengths
SELECT sys.id, '4092590', 'Smooth Extra Wide · 1200 × 2450mm', '9mm × 1200mm', 2.45, 20 FROM sys UNION ALL
SELECT sys.id, '4092591', 'Smooth Extra Wide · 1200 × 2750mm', '9mm × 1200mm', 2.75, 21 FROM sys UNION ALL
SELECT sys.id, '4092592', 'Smooth Extra Wide · 1200 × 3000mm', '9mm × 1200mm', 3.0,  22 FROM sys UNION ALL
-- Wide Woodgrain (150mm groove spacing, woodgrain texture) — 3 lengths
SELECT sys.id, '4092603', 'Wide Woodgrain · 1200 × 2450mm',    '9mm × 1200mm', 2.45, 30 FROM sys UNION ALL
SELECT sys.id, '4092604', 'Wide Woodgrain · 1200 × 2750mm',    '9mm × 1200mm', 2.75, 31 FROM sys UNION ALL
SELECT sys.id, '4092605', 'Wide Woodgrain · 1200 × 3000mm',    '9mm × 1200mm', 3.0,  32 FROM sys;


-- ── SYSTEM COLOURS ───────────────────────────────────────────
-- BGC / Innova fibre cement products are supplied pre-primed for site painting.
-- No factory colour options exist for these 5 systems — section intentionally omitted.


-- ── COMPONENTS ───────────────────────────────────────────────
-- 31 unique accessories extracted from catalogue pages 10, 13, 16, 19, 24.
-- Shared accessories (Sikaflex, Thermal Break, EPDM Gasket, Corner Snap-ons)
-- appear across multiple systems and are inserted once here.

WITH mf AS (SELECT id FROM manufacturers WHERE slug = 'etex-innova-bgc')
INSERT INTO components (manufacturer_id, sku, name, description, category, unit, sort_order)

-- ── Shared across multiple systems ──
SELECT mf.id, '4094941', 'Sikaflex 11 FC+ Sealant Adhesive',
  '300g cartridge · polyurethane sealant and adhesive · weatherproof · paintable · suits all Innova fibre cement systems',
  'Adhesive', 'tube', 10 FROM mf
UNION ALL
SELECT mf.id, '4092824', 'Thermal Break Strip',
  '12500mm × 8mm roll · EPDM foam · reduces thermal bridging when fixing to steel frame · use behind all Innova cladding on steel frames',
  'Insulation', 'each', 20 FROM mf
UNION ALL
SELECT mf.id, '4092813', 'EPDM Foam Gasket',
  '25000mm × 48mm × 3mm roll · EPDM foam · secondary weatherproofing protection at sheet joins · suits Stratum, Contour, Duragroove',
  'Other', 'each', 30 FROM mf
UNION ALL
SELECT mf.id, '4092918', 'Aluminium External Corner Snap-on Part B',
  '3600mm long · powder-coated aluminium · snap-on external corner Part B · suits Stratum, Contour, Duraplank, Duragroove',
  'Trims', 'each', 40 FROM mf
UNION ALL
SELECT mf.id, '4092919', 'Aluminium External Corner Snap-on Part C',
  '3600mm long · powder-coated aluminium · snap-on external corner Part C · suits Stratum, Duragroove',
  'Trims', 'each', 50 FROM mf
UNION ALL
SELECT mf.id, '4093794', 'PVC Starter Strip',
  '3000mm × 13mm · PVC · starter strip for base course · suits Nuline, Duraplank',
  'Starter Profile', 'each', 60 FROM mf

-- ── Nuline-specific ──
UNION ALL
SELECT mf.id, '4092823', 'Aluminium Internal Corner — Nuline',
  '3000mm × 36mm · powder-coated aluminium · internal corner for Nuline weatherboard · each',
  'Trims', 'each', 70 FROM mf
UNION ALL
SELECT mf.id, '4092819', 'Aluminium External Corner — Nuline',
  '3000mm × 36mm · powder-coated aluminium · external corner for Nuline weatherboard · each',
  'Trims', 'each', 80 FROM mf
UNION ALL
SELECT mf.id, '4094306', 'Nuline External Corner Soaker 175mm',
  '175mm wide · powder-coated aluminium · external corner soaker for Nuline 175mm profiles · 25 per pack',
  'Trims', 'pack', 90 FROM mf
UNION ALL
SELECT mf.id, '4094307', 'Nuline External Corner Soaker 205mm',
  '205mm wide · powder-coated aluminium · external corner soaker for Nuline 205mm profiles · 25 per pack',
  'Trims', 'pack', 100 FROM mf
UNION ALL
SELECT mf.id, '4092811', 'J Mould',
  '2700mm × 14mm · aluminium · J mould finishing trim for window and door reveals · each',
  'Trims', 'each', 110 FROM mf

-- ── Stratum-specific ──
UNION ALL
SELECT mf.id, '4092822', 'Aluminium Internal Corner — Stratum',
  '3000mm × 17mm · powder-coated aluminium · internal corner for Stratum weatherboard · each',
  'Trims', 'each', 120 FROM mf
UNION ALL
SELECT mf.id, '4092818', 'Aluminium External Corner — Stratum',
  '3000mm × 17mm · powder-coated aluminium · external corner for Stratum weatherboard · each',
  'Trims', 'each', 130 FROM mf
UNION ALL
SELECT mf.id, '4092920', 'Stratum Joiner',
  '3000mm long · aluminium · vertical joint and control joint joiner for Stratum planks · optional at sheet ends · each',
  'Trims', 'each', 140 FROM mf

-- ── Contour / Duraplank shared 25mm corners ──
UNION ALL
SELECT mf.id, '4092916', 'Aluminium Internal Corner — 25mm',
  '3000mm × 25mm · powder-coated aluminium · internal corner · suits Contour and Duraplank · each',
  'Trims', 'each', 150 FROM mf
UNION ALL
SELECT mf.id, '4092914', 'Aluminium External Corner — 25mm',
  '3000mm × 25mm · powder-coated aluminium · external corner · suits Contour and Duraplank · each',
  'Trims', 'each', 160 FROM mf
UNION ALL
SELECT mf.id, '4092917', 'Aluminium External Corner Snap-on Part A',
  '3600mm long · powder-coated aluminium · snap-on external corner Part A · suits Contour and Duraplank · each',
  'Trims', 'each', 170 FROM mf
UNION ALL
SELECT mf.id, '4092882', 'Powdercoated Steel Starter Strip',
  '3000mm long · powder-coated steel · starter strip for base course · suits Contour · each',
  'Starter Profile', 'each', 180 FROM mf

-- ── Duraplank-specific ──
UNION ALL
SELECT mf.id, '4092808', 'PVC Joiner Smooth — 230mm',
  '230mm wide · PVC · off-stud joiner for Duraplank Smooth 230mm · each',
  'Trims', 'each', 190 FROM mf
UNION ALL
SELECT mf.id, '4092874', 'PVC Joiner Smooth — 300mm',
  '300mm wide · PVC · off-stud joiner for Duraplank Smooth 300mm · each',
  'Trims', 'each', 200 FROM mf
UNION ALL
SELECT mf.id, '4092875', 'PVC Joiner Woodgrain — 230mm',
  '230mm wide · PVC · off-stud joiner for Duraplank Woodgrain 230mm · each',
  'Trims', 'each', 210 FROM mf
UNION ALL
SELECT mf.id, '4092876', 'PVC Joiner Woodgrain — 300mm',
  '300mm wide · PVC · off-stud joiner for Duraplank Woodgrain 300mm · each',
  'Trims', 'each', 220 FROM mf
UNION ALL
SELECT mf.id, '4094302', 'Duraplank Internal Corner Soaker — 230mm',
  '230mm wide · powder-coated aluminium · internal corner soaker for Duraplank 230mm · 25 per pack',
  'Trims', 'pack', 230 FROM mf
UNION ALL
SELECT mf.id, '4094304', 'Duraplank Internal Corner Soaker — 300mm',
  '300mm wide · powder-coated aluminium · internal corner soaker for Duraplank 300mm · 25 per pack',
  'Trims', 'pack', 240 FROM mf
UNION ALL
SELECT mf.id, '4094303', 'Duraplank External Corner Soaker — 230mm',
  '230mm wide · powder-coated aluminium · external corner soaker for Duraplank 230mm · 25 per pack',
  'Trims', 'pack', 250 FROM mf
UNION ALL
SELECT mf.id, '4094305', 'Duraplank External Corner Soaker — 300mm',
  '300mm wide · powder-coated aluminium · external corner soaker for Duraplank 300mm · 25 per pack',
  'Trims', 'pack', 260 FROM mf
UNION ALL
SELECT mf.id, '4094308', 'Off Stud Joiner — 230mm',
  '230mm wide · PVC · off-stud joiner for Duraplank 230mm · 25 per pack',
  'Trims', 'pack', 270 FROM mf
UNION ALL
SELECT mf.id, '4094310', 'Off Stud Joiner — 300mm',
  '300mm wide · PVC · off-stud joiner for Duraplank 300mm · 25 per pack',
  'Trims', 'pack', 280 FROM mf

-- ── Duragroove-specific ──
UNION ALL
SELECT mf.id, '4092821', 'Aluminium Internal Corner — Duragroove',
  '3000mm × 12mm · powder-coated aluminium · internal corner for Duragroove panels · each',
  'Trims', 'each', 290 FROM mf
UNION ALL
SELECT mf.id, '4092817', 'Aluminium External Corner — Duragroove',
  '3000mm × 12mm · powder-coated aluminium · external corner for Duragroove panels · each',
  'Trims', 'each', 300 FROM mf
UNION ALL
SELECT mf.id, '4092820', 'Horizontal H Flashing',
  '3000mm long · aluminium · horizontal H flashing for Duragroove panel joins · each',
  'Trims', 'each', 310 FROM mf;


-- ── SYSTEM → COMPONENTS ──────────────────────────────────────
-- Uses a VALUES join on SKU so each system block is self-contained.
-- manufacturer_id scoped to avoid cross-manufacturer SKU collisions.

-- Nuline components (8 links)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'NULINE'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id,
  v.role,
  v.notes,
  v.sort_order
FROM (VALUES
  ('4092823', 'required',    'Aluminium internal corner — match to profile width',  10),
  ('4092819', 'required',    'Aluminium external corner — match to profile width',  20),
  ('4094306', 'required',    '175mm soaker — use with Square/Bullnose 175mm SKUs',  30),
  ('4094307', 'required',    '205mm soaker — use with Square/Bullnose 205mm SKUs',  40),
  ('4092811', 'recommended', 'J mould for window and door reveals',                 50),
  ('4093794', 'required',    'PVC starter strip at base course',                    60),
  ('4094941', 'required',    'Sealant at all joins and penetrations',               70),
  ('4092824', 'recommended', 'Required when fixing to steel frame',                 80)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';

-- Stratum components (8 links)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'STRATUM'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id,
  v.role,
  v.notes,
  v.sort_order
FROM (VALUES
  ('4092822', 'required',    'Aluminium internal corner',                           10),
  ('4092818', 'required',    'Aluminium external corner',                           20),
  ('4092918', 'required',    'Snap-on external corner Part B',                      30),
  ('4092919', 'required',    'Snap-on external corner Part C',                      40),
  ('4092813', 'required',    'EPDM foam gasket at sheet joins',                     50),
  ('4092920', 'required',    'Joiner at vertical joints and control joints',        60),
  ('4094941', 'required',    'Sealant at all joins and penetrations',               70),
  ('4092824', 'recommended', 'Required when fixing to steel frame',                 80)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';

-- Contour components (8 links)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = '4092772'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id,
  v.role,
  v.notes,
  v.sort_order
FROM (VALUES
  ('4092916', 'required',    'Aluminium internal corner',                           10),
  ('4092914', 'required',    'Aluminium external corner',                           20),
  ('4092917', 'required',    'Snap-on external corner Part A',                      30),
  ('4092918', 'required',    'Snap-on external corner Part B',                      40),
  ('4092882', 'required',    'Powdercoated steel starter strip at base course',     50),
  ('4092813', 'required',    'EPDM foam gasket at sheet joins',                     60),
  ('4094941', 'required',    'Sealant at all joins and penetrations',               70),
  ('4092824', 'recommended', 'Required when fixing to steel frame',                 80)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';

-- Duraplank components (17 links)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'DURAPLANK'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id,
  v.role,
  v.notes,
  v.sort_order
FROM (VALUES
  ('4092808', 'required',    'PVC joiner smooth — use with 230mm Smooth SKU',        10),
  ('4092874', 'required',    'PVC joiner smooth — use with 300mm Smooth SKU',        20),
  ('4092875', 'required',    'PVC joiner woodgrain — use with 230mm Woodgrain SKU',  30),
  ('4092876', 'required',    'PVC joiner woodgrain — use with 300mm Woodgrain SKU',  40),
  ('4092916', 'required',    'Aluminium internal corner',                            50),
  ('4092914', 'required',    'Aluminium external corner',                            60),
  ('4092917', 'required',    'Snap-on external corner Part A',                       70),
  ('4092918', 'required',    'Snap-on external corner Part B',                       80),
  ('4094302', 'required',    'Internal corner soaker — use with 230mm SKUs',         90),
  ('4094304', 'required',    'Internal corner soaker — use with 300mm SKUs',        100),
  ('4094303', 'required',    'External corner soaker — use with 230mm SKUs',        110),
  ('4094305', 'required',    'External corner soaker — use with 300mm SKUs',        120),
  ('4094308', 'required',    'Off stud joiner — use with 230mm SKUs',               130),
  ('4094310', 'required',    'Off stud joiner — use with 300mm SKUs',               140),
  ('4093794', 'required',    'PVC starter strip at base course',                    150),
  ('4094941', 'required',    'Sealant at all joins and penetrations',               160),
  ('4092824', 'recommended', 'Required when fixing to steel frame',                 170)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';

-- Duragroove components (8 links)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'DURAGROOVE'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id,
  v.role,
  v.notes,
  v.sort_order
FROM (VALUES
  ('4092821', 'required',    'Aluminium internal corner',                           10),
  ('4092817', 'required',    'Aluminium external corner',                           20),
  ('4092820', 'required',    'Horizontal H flashing at horizontal panel joins',     30),
  ('4092918', 'required',    'Snap-on external corner Part B',                      40),
  ('4092919', 'required',    'Snap-on external corner Part C',                      50),
  ('4092813', 'required',    'EPDM foam gasket at sheet joins',                     60),
  ('4094941', 'required',    'Sealant at all joins and penetrations',               70),
  ('4092824', 'recommended', 'Required when fixing to steel frame',                 80)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';


-- ============================================================
-- SUMMARY
-- ============================================================
-- | Table              | Rows |
-- |--------------------|------|
-- | catalogue_sources  |    1 |
-- | systems            |    5 |
-- | system_profiles    |   26 |
-- | system_colours     |    0 |  (pre-primed — no factory colours)
-- | components         |   31 |
-- | system_components  |   49 |
-- ============================================================
--
-- NEXT: after confirming these 5 systems look correct in the admin panel,
-- continue with the remaining 9 systems from this catalogue:
--   Exterior Cladding:    Durascape, Duragrid, Duracom
--   Exterior Base Sheets: Duratex, Stonesheet
--   Pre-finished Facades: Montage (16 colour/profile variants)
--   Internal Wall Lining: Duraliner, Intergroove
--   Soffit & Fascia:      Durasheet, Duralux
--   Flooring:             Durafloor, Compressed Flooring, Ceramic Tile Underlay
-- ============================================================
