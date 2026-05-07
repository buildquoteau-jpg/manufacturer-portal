-- ============================================================
-- Innova / BGC Fibre Cement — Catalogue Import (Remaining 16 Systems)
-- Source: Innova Australia Product Range Guide — December 2025
-- Extracted: 5 May 2026
-- Manufacturer slug: etex-innova-bgc
-- Manufacturer ID:   65ee9f06-05d2-4d36-9877-223cd1cf96a6
-- ============================================================
-- Run AFTER bgc_innova_5_systems.sql (references same catalogue_sources row)
-- ============================================================
--
-- SYSTEMS COVERED IN THIS FILE
--   Exterior Cladding   Durascape, Duragrid, Duracom, Duratex, Stonesheet
--   Feature Wall        Montage (16 colour/texture variants)
--   Internal Wall       Duraliner, Intergroove
--   Soffit & Fascia     Durasheet, Duralux, Effects Fascia
--   Flooring            Durafloor, Compressed Flooring, Ceramic Tile Underlay
--   Exterior Cladding   Effects Trims, Effects Base Trim
--
-- COUNTS
--   systems            16
--   system_profiles    73
--   system_colours     15  (Montage only — all others pre-primed for site painting)
--   components         98  (new; excludes 31 already inserted by Part 1)
--   system_components ~120
--
-- ROLLBACK (reverse order):
-- DELETE FROM system_components WHERE system_id IN
--   (SELECT id FROM systems WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'
--    AND product_code NOT IN ('NULINE','STRATUM','4092772','DURAPLANK','DURAGROOVE'));
-- DELETE FROM system_profiles WHERE system_id IN
--   (SELECT id FROM systems WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'
--    AND product_code NOT IN ('NULINE','STRATUM','4092772','DURAPLANK','DURAGROOVE'));
-- DELETE FROM system_colours WHERE system_id IN
--   (SELECT id FROM systems WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'
--    AND product_code NOT IN ('NULINE','STRATUM','4092772','DURAPLANK','DURAGROOVE'));
-- DELETE FROM components WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'
--   AND sku NOT IN ('4094941','4092824','4092813','4092918','4092919','4093794',
--                   '4092823','4092819','4094306','4094307','4092811','4092822',
--                   '4092818','4092920','4092916','4092914','4092917','4092882',
--                   '4092808','4092874','4092875','4092876','4094302','4094304',
--                   '4094303','4094305','4094308','4094310','4092821','4092817','4092820');
-- DELETE FROM systems WHERE manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'
--   AND product_code NOT IN ('NULINE','STRATUM','4092772','DURAPLANK','DURAGROOVE');
-- ============================================================


-- ── SYSTEMS ──────────────────────────────────────────────────

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

-- ── EXTERIOR CLADDING — Facades ──────────────────────────────

SELECT mf.id, src.id,
  'Durascape®', 'DURASCAPE', 'durascape',
  'Exterior Cladding', 'Fibre Cement Facade Panel',
  'Large panel facade system with a 5mm shiplap join creating a subtle vertical shadowline. Minimises movement, reducing risk of cracking. Delivers a sleek rendered finish when coated with textured paint on-site. Compatible with single-storey and medium-height applications.',
  NULL::TEXT, NULL::NUMERIC,
  'BAL-40', true,
  false,
  'Pack of 40. No taped and filled joints required. BAL-40 compliant per AS 3959. CMI Certified CM40414. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  60
FROM mf, src

UNION ALL

SELECT mf.id, src.id,
  'Duragrid®', 'DURAGRID', 'duragrid',
  'Exterior Cladding', 'Fibre Cement Facade Panel',
  'Cladding system with 10mm expressed geometric join for a modern, stylish aesthetic. Installed on timber or lightweight steel battens, creating a cavity that enhances thermal properties. Supports horizontal and vertical installation in brick bond or stack bond patterns.',
  NULL, NULL,
  'BAL-40', true,
  false,
  'Pack of 40. Quick screw-fix installation. Unaffected by termites, air, steam, salt or sunlight. Suitable for residential (timber battens) or light commercial (steel battens). BAL-40 compliant per AS 3959. CMI Certified CM40422. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  70
FROM mf, src

UNION ALL

SELECT mf.id, src.id,
  'Duracom®', 'DURACOM', 'duracom',
  'Exterior Cladding', 'Compressed Fibre Cement Facade Panel',
  'Commercial facade system using compressed fibre cement panels combined with a steel top hat system for exceptional durability and impact resistance. 10mm express join delivers a sophisticated grid-like pattern. Suitable for low-to-medium rise buildings.',
  NULL, NULL,
  'BAL-40', true,
  false,
  'Pre-primed and ready to paint. Compatible with paint to textured coatings. Suitable for high wind zones up to 7kPa. BAL-40 compliant per AS 3959. CMI Certified CM40431. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  80
FROM mf, src

-- ── EXTERIOR CLADDING — Base Sheets ──────────────────────────

UNION ALL

SELECT mf.id, src.id,
  'Duratex®', 'DURATEX', 'duratex',
  'Exterior Cladding', 'Exterior Base Sheet',
  'Durable, non-combustible fibre cement sheet for residential and commercial cladding applications. Provides a high-quality base for textured coatings and acrylic renders. Strong and stable with long-term performance.',
  NULL, NULL,
  NULL, true,
  false,
  'Ideally suited to textured coating finishes. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  90
FROM mf, src

UNION ALL

-- Single SKU: 9mm × 1200mm × 3000mm (code 4092629)
SELECT mf.id, src.id,
  'Stonesheet®', '4092629', 'stonesheet',
  'Exterior Cladding', 'Stone Wall Substrate',
  'Ideal substrate for stone wall facades and true masonry on timber or steel-framed buildings. Flat, square-edged panels for residential interior and exterior. Capable of supporting a maximum stone facade weight of 40kg/m².',
  '9mm thick', 3.0,
  'BAL-40', true,
  false,
  '1200mm wide × 3000mm long. Type A Category 3 for exterior use. Non-structural substrate. Max stone facade weight 40kg/m². Pack of 40. BAL-40 compliant per AS 3959. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  100
FROM mf, src

-- ── FEATURE WALL — Pre-finished ──────────────────────────────

UNION ALL

SELECT mf.id, src.id,
  'Montage®', 'MONTAGE', 'montage',
  'Feature Wall', 'Pre-finished Fibre Cement Panel',
  'Versatile pre-finished fibre cement facade system for internal and external use. Deep form embossed panels in four profiles — Concrete, Slimline Tile, Stackstone, and Woodgrain. Concealed clip fixing system. Colour palette designed to blend or contrast.',
  NULL, NULL,
  'BAL-40', true,
  false,
  'Fully sealed panels — weather resistant, will not rot or burn. All panels 455mm wide × 3030mm long. Stock colours: Woodgrain Light Teak, Woodgrain Black Oak, Concrete Rectangle with Circle, Concrete Smooth Plain. All others made to order. BAL-40 compliant per AS 3959. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  110
FROM mf, src

-- ── INTERNAL WALL LINING ─────────────────────────────────────

UNION ALL

SELECT mf.id, src.id,
  'Duraliner®', 'DURALINER', 'duraliner',
  'Internal Wall Lining', 'Fibre Cement Lining Sheet',
  'General-purpose fibre cement lining board for flush jointing. Ideal for wet areas, interior linings, ceramic wall tile substrate, and fire and acoustically-rated interior walls. Rebated on 3 edges for efficient jointing.',
  NULL, NULL,
  NULL, true,
  false,
  'Available in 6mm, 9mm and 12mm thicknesses. Widths: 900mm, 1200mm, 1350mm. Lengths: 1800mm to 4200mm. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  120
FROM mf, src

UNION ALL

-- Single SKU: 7.5mm × 1200mm × 2700mm (code 4092659)
SELECT mf.id, src.id,
  'Intergroove®', '4092659', 'intergroove',
  'Feature Wall', 'Fibre Cement Groove Panel',
  'Internal wall lining with a 2mm deep V-shaped groove for a modern floor-to-ceiling feature wall or traditional dado wall design. Eliminates the need for taped and filled joints. Factory sealed panels aid paint application.',
  '7.5mm thick', 2.7,
  NULL, true,
  false,
  '1200mm wide × 2700mm long. Pack of 50. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  130
FROM mf, src

-- ── SOFFIT & FASCIA ──────────────────────────────────────────

UNION ALL

SELECT mf.id, src.id,
  'Durasheet®', 'DURASHEET', 'durasheet',
  'Soffit & Fascia', 'Fibre Cement Soffit Sheet',
  'Versatile general-purpose sheet for gable ends, eaves lining, soffits, carports, and external ceilings. Compatible with timber and steel-framed buildings. 4.5mm for residential timber-frame; 6.0mm for light commercial, cyclonic wind zones, and steel frame.',
  NULL, NULL,
  NULL, true,
  false,
  'Can be hand nailed or screwed. Widths: 450mm to 1200mm. Lengths: 1800mm to 3000mm. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  140
FROM mf, src

UNION ALL

SELECT mf.id, src.id,
  'Duralux®', 'DURALUX', 'duralux',
  'Soffit & Fascia', 'Fibre Cement Soffit/Ceiling Sheet',
  'General-purpose fibre cement building board for domestic and commercial soffits, external ceilings, interior lining, wet areas, and ceramic wall tile substrate. Type B Category 2 for applications sheltered from direct weathering. Ideal for expressed joint eaves and ceilings.',
  NULL, NULL,
  NULL, true,
  false,
  'Available in 6mm and 9mm thicknesses. 1200mm wide. Lengths: 2400mm to 3600mm. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  150
FROM mf, src

-- ── FLOORING ─────────────────────────────────────────────────

UNION ALL

SELECT mf.id, src.id,
  'Durafloor®', 'DURAFLOOR', 'durafloor',
  'Flooring', 'Fibre Cement Flooring',
  'Tongue-and-groove fibre cement floor substrate for interior wet areas (bathrooms, laundries) and exterior applications (balconies, verandahs, sundecks). Tongue-and-groove joint eliminates blocking. Lower installation cost versus compressed sheet. Installed by gun-nailing.',
  NULL, NULL,
  NULL, true,
  false,
  '600mm wide. Lengths: 2250mm and 2400mm. Thicknesses: 19mm and 22mm. Pack of 40. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  160
FROM mf, src

UNION ALL

SELECT mf.id, src.id,
  'Innova Compressed Flooring', 'COMPRESS-FLOOR', 'innova-compressed-flooring',
  'Flooring', 'High-Density Compressed Fibre Cement Flooring',
  'High-density compressed flooring for commercial high-load areas, interior wet areas, upper storeys, transportable buildings, and exterior decks. Impact resistant, immune to termite attacks, dimensionally stable, and non-combustible.',
  NULL, NULL,
  NULL, true,
  false,
  'Available in 15mm, 18mm and 24mm thicknesses. Widths: 900mm and 1200mm. Lengths: 1800mm to 3000mm. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  170
FROM mf, src

UNION ALL

-- Single SKU: 6mm × 1200mm × 1800mm (code 4092792)
SELECT mf.id, src.id,
  'Innova Ceramic Tile Underlay', '4092792', 'innova-ceramic-tile-underlay',
  'Flooring', 'Tile Underlay',
  'Specially formulated fibre cement sheet as a stable substrate for slate and ceramic floor tiles. Suitable for dry and wet areas (with waterproof membrane in wet zones). Can be applied over new or existing timber floors.',
  '6mm thick', 1.8,
  NULL, true,
  false,
  '1200mm wide × 1800mm long. Pack of 60. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  180
FROM mf, src

-- ── EXTERIOR CLADDING — Effects Range ────────────────────────

UNION ALL

SELECT mf.id, src.id,
  'Effects® Trims', 'EFFECTS-TRIMS', 'effects-trims',
  'Exterior Cladding', 'Fibre Cement Architectural Trim',
  'Fibre cement trims for window and door surrounds, internal and external corners, and decorative feature accents. Compatible with all Innova weatherboards and facades. Available in 5 sizes across 2 thicknesses. Maintains appearance longer than timber trims.',
  NULL, NULL,
  'BAL-40', true,
  false,
  'Pre-primed and ready to paint. All lengths 3000mm. Note: listed as ''coming soon'' in the December 2025 brochure. BAL-40 compliant per AS 3959.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  190
FROM mf, src

UNION ALL

-- Single SKU: 14mm × 175mm × 4200mm (code 4093793)
SELECT mf.id, src.id,
  'Effects® Fascia', '4093793', 'effects-fascia',
  'Soffit & Fascia', 'Fibre Cement Fascia Board',
  'Specially formulated fibre cement fascia board for long-term durability. Designed to accommodate Durasheet for a seamless eaves transition. Provides a timber look without rot, swelling, or twist. Pre-primed and ready to paint.',
  '14mm × 175mm', 4.2,
  'BAL-19', true,
  false,
  '14mm thick × 175mm wide × 4200mm long. Pack of 120. Gun nailable. BAL-19 compliant per AS 3959. Warranty: refer innovafibrecement.com.au.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  200
FROM mf, src

UNION ALL

SELECT mf.id, src.id,
  'Effects® Base Trim', 'EFFECTS-BASE', 'effects-base-trim',
  'Exterior Cladding', 'Slab Edge Trim',
  'Provides a sleek finish to slab edges. Inbuilt 6mm ledge holds cladding panels during installation. Provides a flashing function pushing moisture away from the building internals. Corrosion-resistant — coastal zone compatible. Compatible with Duratex, Stratum, Durasheet, Duragroove, Duraplank, Durascape, Duragrid, and most Innova cladding systems.',
  NULL, NULL,
  'BAL-40', true,
  false,
  'Ready for priming and painting. BAL-40 compliant per AS 3959. Joiner, external corner and internal corner accessories available.',
  'https://innovafibrecement.com.au',
  NULL, 'Innova Australia Product Range Guide — December 2025', NULL, NULL,
  210
FROM mf, src;


-- ── SYSTEM PROFILES ──────────────────────────────────────────
-- One block per system. Systems with a single SKU on the systems row are skipped.
-- Panel product name format: "profile · width × height" or "thickness · width × length"
-- Sheet product dimensions field: thickness only; length_m = NULL (panels, not linear).

-- Durascape — 4 SKUs (2 widths × 2 lengths)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'DURASCAPE'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
SELECT sys.id, '4092626', '9mm · 900 × 2450mm',  '9mm × 900mm',  NULL::NUMERIC, 0  FROM sys UNION ALL
SELECT sys.id, '4092628', '9mm · 900 × 3000mm',  '9mm × 900mm',  NULL::NUMERIC, 1  FROM sys UNION ALL
SELECT sys.id, '4092625', '9mm · 1200 × 2450mm', '9mm × 1200mm', NULL::NUMERIC, 10 FROM sys UNION ALL
SELECT sys.id, '4092627', '9mm · 1200 × 3000mm', '9mm × 1200mm', NULL::NUMERIC, 11 FROM sys;

-- Duragrid — 4 SKUs (3 panel widths × available lengths)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'DURAGRID'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
SELECT sys.id, '4092588', '9mm · 590 × 1190mm',  '9mm × 590mm',  NULL::NUMERIC, 0  FROM sys UNION ALL
SELECT sys.id, '4092586', '9mm · 890 × 1190mm',  '9mm × 890mm',  NULL::NUMERIC, 10 FROM sys UNION ALL
SELECT sys.id, '4092585', '9mm · 1190 × 1190mm', '9mm × 1190mm', NULL::NUMERIC, 20 FROM sys UNION ALL
SELECT sys.id, '4092589', '9mm · 1190 × 2390mm', '9mm × 1190mm', NULL::NUMERIC, 21 FROM sys;

-- Duracom — 9 SKUs (2 thicknesses × 2 widths × available lengths)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'DURACOM'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
-- 9mm × 900mm wide (3 lengths: 1800, 2400, 3000)
SELECT sys.id, '4092551', '9mm · 900 × 1800mm',  '9mm × 900mm',  NULL::NUMERIC, 0  FROM sys UNION ALL
SELECT sys.id, '4092553', '9mm · 900 × 2400mm',  '9mm × 900mm',  NULL::NUMERIC, 1  FROM sys UNION ALL
SELECT sys.id, '4092556', '9mm · 900 × 3000mm',  '9mm × 900mm',  NULL::NUMERIC, 2  FROM sys UNION ALL
-- 9mm × 1200mm wide (4 lengths: 1800, 2400, 2700, 3000)
SELECT sys.id, '4092550', '9mm · 1200 × 1800mm', '9mm × 1200mm', NULL::NUMERIC, 10 FROM sys UNION ALL
SELECT sys.id, '4092552', '9mm · 1200 × 2400mm', '9mm × 1200mm', NULL::NUMERIC, 11 FROM sys UNION ALL
SELECT sys.id, '4092554', '9mm · 1200 × 2700mm', '9mm × 1200mm', NULL::NUMERIC, 12 FROM sys UNION ALL
SELECT sys.id, '4092555', '9mm · 1200 × 3000mm', '9mm × 1200mm', NULL::NUMERIC, 13 FROM sys UNION ALL
-- 12mm × 1200mm wide (2 lengths: 2400, 2700)
SELECT sys.id, '4093682', '12mm · 1200 × 2400mm','12mm × 1200mm', NULL::NUMERIC, 20 FROM sys UNION ALL
SELECT sys.id, '4092546', '12mm · 1200 × 2700mm','12mm × 1200mm', NULL::NUMERIC, 21 FROM sys;

-- Duratex — 5 SKUs (2 thicknesses × available lengths)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'DURATEX'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
-- 7.5mm × 1200mm (3 lengths: 2400, 2440, 2725)
SELECT sys.id, '4092630', '7.5mm · 1200 × 2400mm', '7.5mm thick', NULL::NUMERIC, 0 FROM sys UNION ALL
SELECT sys.id, '4092631', '7.5mm · 1200 × 2440mm', '7.5mm thick', NULL::NUMERIC, 1 FROM sys UNION ALL
SELECT sys.id, '4092632', '7.5mm · 1200 × 2725mm', '7.5mm thick', NULL::NUMERIC, 2 FROM sys UNION ALL
-- 9mm × 1200mm (2 lengths: 2400, 2440)
SELECT sys.id, '4092633', '9mm · 1200 × 2400mm',   '9mm thick', NULL::NUMERIC, 10 FROM sys UNION ALL
SELECT sys.id, '4092634', '9mm · 1200 × 2440mm',   '9mm thick', NULL::NUMERIC, 11 FROM sys;

-- Stonesheet — single SKU on systems row; no profiles needed.

-- Montage — 4 profiles (by thickness and texture family)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'MONTAGE'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
SELECT sys.id, 'MONTAGE-CONCRETE',   'Concrete · 16mm · 455 × 3030mm',    '16mm × 455mm', 3.03, 0 FROM sys UNION ALL
SELECT sys.id, 'MONTAGE-SLIMTILE',   'Slimline Tile · 18mm · 455 × 3030mm','18mm × 455mm', 3.03, 1 FROM sys UNION ALL
SELECT sys.id, 'MONTAGE-STACKSTONE', 'Stackstone · 18mm · 455 × 3030mm',  '18mm × 455mm', 3.03, 2 FROM sys UNION ALL
SELECT sys.id, 'MONTAGE-WOODGRAIN',  'Woodgrain · 18mm · 455 × 3030mm',   '18mm × 455mm', 3.03, 3 FROM sys;

-- Duraliner — 18 SKUs (3 thicknesses × 3 widths × available lengths)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'DURALINER'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
-- 6mm × 900mm
SELECT sys.id, '4092610', '6mm · 900 × 1800mm',  '6mm thick', NULL::NUMERIC, 0  FROM sys UNION ALL
-- 6mm × 1200mm (6 lengths)
SELECT sys.id, '4092607', '6mm · 1200 × 1800mm', '6mm thick', NULL::NUMERIC, 10 FROM sys UNION ALL
SELECT sys.id, '4092608', '6mm · 1200 × 2400mm', '6mm thick', NULL::NUMERIC, 11 FROM sys UNION ALL
SELECT sys.id, '4092611', '6mm · 1200 × 2700mm', '6mm thick', NULL::NUMERIC, 12 FROM sys UNION ALL
SELECT sys.id, '4092612', '6mm · 1200 × 3000mm', '6mm thick', NULL::NUMERIC, 13 FROM sys UNION ALL
SELECT sys.id, '4092615', '6mm · 1200 × 3600mm', '6mm thick', NULL::NUMERIC, 14 FROM sys UNION ALL
SELECT sys.id, '4092617', '6mm · 1200 × 4200mm', '6mm thick', NULL::NUMERIC, 15 FROM sys UNION ALL
-- 6mm × 1350mm (4 lengths)
SELECT sys.id, '4092609', '6mm · 1350 × 1800mm', '6mm thick', NULL::NUMERIC, 20 FROM sys UNION ALL
SELECT sys.id, '4092613', '6mm · 1350 × 2700mm', '6mm thick', NULL::NUMERIC, 21 FROM sys UNION ALL
SELECT sys.id, '4092616', '6mm · 1350 × 3600mm', '6mm thick', NULL::NUMERIC, 22 FROM sys UNION ALL
SELECT sys.id, '4092618', '6mm · 1350 × 4200mm', '6mm thick', NULL::NUMERIC, 23 FROM sys UNION ALL
-- 9mm × 1200mm (4 lengths)
SELECT sys.id, '4092619', '9mm · 1200 × 1800mm', '9mm thick', NULL::NUMERIC, 30 FROM sys UNION ALL
SELECT sys.id, '4092620', '9mm · 1200 × 2400mm', '9mm thick', NULL::NUMERIC, 31 FROM sys UNION ALL
SELECT sys.id, '4092621', '9mm · 1200 × 2700mm', '9mm thick', NULL::NUMERIC, 32 FROM sys UNION ALL
SELECT sys.id, '4092623', '9mm · 1200 × 3000mm', '9mm thick', NULL::NUMERIC, 33 FROM sys UNION ALL
-- 9mm × 1350mm (2 lengths)
SELECT sys.id, '4092622', '9mm · 1350 × 2400mm', '9mm thick', NULL::NUMERIC, 40 FROM sys UNION ALL
SELECT sys.id, '4092624', '9mm · 1350 × 3600mm', '9mm thick', NULL::NUMERIC, 41 FROM sys UNION ALL
-- 12mm × 1200mm (1 length)
SELECT sys.id, '4092606', '12mm · 1200 × 2400mm','12mm thick', NULL::NUMERIC, 50 FROM sys;

-- Intergroove — single SKU on systems row; no profiles needed.

-- Durasheet — 10 SKUs (2 thicknesses × various widths and lengths)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'DURASHEET'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
-- 4.5mm
SELECT sys.id, '4092559', '4.5mm · 450 × 1800mm',  '4.5mm thick', NULL::NUMERIC, 0  FROM sys UNION ALL
SELECT sys.id, '4092560', '4.5mm · 600 × 1800mm',  '4.5mm thick', NULL::NUMERIC, 1  FROM sys UNION ALL
SELECT sys.id, '4092561', '4.5mm · 750 × 1800mm',  '4.5mm thick', NULL::NUMERIC, 2  FROM sys UNION ALL
SELECT sys.id, '4092562', '4.5mm · 900 × 1800mm',  '4.5mm thick', NULL::NUMERIC, 3  FROM sys UNION ALL
SELECT sys.id, '4092565', '4.5mm · 900 × 2400mm',  '4.5mm thick', NULL::NUMERIC, 4  FROM sys UNION ALL
SELECT sys.id, '4092557', '4.5mm · 1200 × 1800mm', '4.5mm thick', NULL::NUMERIC, 5  FROM sys UNION ALL
SELECT sys.id, '4092558', '4.5mm · 1200 × 2400mm', '4.5mm thick', NULL::NUMERIC, 6  FROM sys UNION ALL
SELECT sys.id, '4092563', '4.5mm · 1200 × 2700mm', '4.5mm thick', NULL::NUMERIC, 7  FROM sys UNION ALL
SELECT sys.id, '4092564', '4.5mm · 1200 × 3000mm', '4.5mm thick', NULL::NUMERIC, 8  FROM sys UNION ALL
-- 6.0mm
SELECT sys.id, '4092569', '6mm · 900 × 2400mm',    '6mm thick', NULL::NUMERIC, 10 FROM sys UNION ALL
SELECT sys.id, '4092572', '6mm · 900 × 3000mm',    '6mm thick', NULL::NUMERIC, 11 FROM sys UNION ALL
SELECT sys.id, '4092566', '6mm · 1200 × 1800mm',   '6mm thick', NULL::NUMERIC, 12 FROM sys UNION ALL
SELECT sys.id, '4092568', '6mm · 1200 × 2400mm',   '6mm thick', NULL::NUMERIC, 13 FROM sys UNION ALL
SELECT sys.id, '4092570', '6mm · 1200 × 2700mm',   '6mm thick', NULL::NUMERIC, 14 FROM sys UNION ALL
SELECT sys.id, '4092571', '6mm · 1200 × 3000mm',   '6mm thick', NULL::NUMERIC, 15 FROM sys;

-- Duralux — 7 SKUs (2 thicknesses, all 1200mm wide)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'DURALUX'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
-- 6mm
SELECT sys.id, '4092635', '6mm · 1200 × 2400mm', '6mm thick', NULL::NUMERIC, 0 FROM sys UNION ALL
SELECT sys.id, '4092637', '6mm · 1200 × 2700mm', '6mm thick', NULL::NUMERIC, 1 FROM sys UNION ALL
SELECT sys.id, '4092638', '6mm · 1200 × 3000mm', '6mm thick', NULL::NUMERIC, 2 FROM sys UNION ALL
SELECT sys.id, '4092639', '6mm · 1200 × 3600mm', '6mm thick', NULL::NUMERIC, 3 FROM sys UNION ALL
-- 9mm
SELECT sys.id, '4092640', '9mm · 1200 × 2400mm', '9mm thick', NULL::NUMERIC, 10 FROM sys UNION ALL
SELECT sys.id, '4092642', '9mm · 1200 × 2700mm', '9mm thick', NULL::NUMERIC, 11 FROM sys UNION ALL
SELECT sys.id, '4092644', '9mm · 1200 × 3000mm', '9mm thick', NULL::NUMERIC, 12 FROM sys;

-- Durafloor — 3 SKUs (2 thicknesses)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'DURAFLOOR'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
SELECT sys.id, '4092582', '19mm × 600mm × 2250mm', '19mm × 600mm', 2.25, 0 FROM sys UNION ALL
SELECT sys.id, '4092583', '19mm × 600mm × 2400mm', '19mm × 600mm', 2.4,  1 FROM sys UNION ALL
SELECT sys.id, '4092584', '22mm × 600mm × 2250mm', '22mm × 600mm', 2.25, 2 FROM sys;

-- Compressed Flooring — 10 SKUs (3 thicknesses × widths × lengths)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'COMPRESS-FLOOR'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
-- 15mm × 1200mm
SELECT sys.id, '4092533', '15mm · 1200 × 1800mm', '15mm × 1200mm', NULL::NUMERIC, 0  FROM sys UNION ALL
SELECT sys.id, '4092535', '15mm · 1200 × 2400mm', '15mm × 1200mm', NULL::NUMERIC, 1  FROM sys UNION ALL
SELECT sys.id, '4092536', '15mm · 1200 × 2700mm', '15mm × 1200mm', NULL::NUMERIC, 2  FROM sys UNION ALL
SELECT sys.id, '4092538', '15mm · 1200 × 3000mm', '15mm × 1200mm', NULL::NUMERIC, 3  FROM sys UNION ALL
-- 18mm × 900mm
SELECT sys.id, '4092541', '18mm · 900 × 2400mm',  '18mm × 900mm',  NULL::NUMERIC, 10 FROM sys UNION ALL
SELECT sys.id, '4092543', '18mm · 900 × 2700mm',  '18mm × 900mm',  NULL::NUMERIC, 11 FROM sys UNION ALL
-- 18mm × 1200mm
SELECT sys.id, '4092539', '18mm · 1200 × 1800mm', '18mm × 1200mm', NULL::NUMERIC, 20 FROM sys UNION ALL
SELECT sys.id, '4092540', '18mm · 1200 × 2400mm', '18mm × 1200mm', NULL::NUMERIC, 21 FROM sys UNION ALL
SELECT sys.id, '4092542', '18mm · 1200 × 2700mm', '18mm × 1200mm', NULL::NUMERIC, 22 FROM sys UNION ALL
-- 24mm × 1200mm
SELECT sys.id, '4092544', '24mm · 1200 × 2400mm', '24mm × 1200mm', NULL::NUMERIC, 30 FROM sys;

-- Ceramic Tile Underlay — single SKU on systems row; no profiles needed.

-- Effects Trims — 5 SKUs (2 thicknesses × 3 + 2 widths, all 3000mm long)
WITH sys AS (SELECT id FROM systems WHERE product_code = 'EFFECTS-TRIMS'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_profiles (system_id, product_code, name, dimensions, length_m, sort_order)
SELECT sys.id, '4094322', '19mm × 57mm × 3000mm',  '19mm × 57mm',  3.0, 0 FROM sys UNION ALL
SELECT sys.id, '4094323', '19mm × 76mm × 3000mm',  '19mm × 76mm',  3.0, 1 FROM sys UNION ALL
SELECT sys.id, '4094324', '19mm × 95mm × 3000mm',  '19mm × 95mm',  3.0, 2 FROM sys UNION ALL
SELECT sys.id, '4094325', '38mm × 50mm × 3000mm',  '38mm × 50mm',  3.0, 3 FROM sys UNION ALL
SELECT sys.id, '4094326', '38mm × 88mm × 3000mm',  '38mm × 88mm',  3.0, 4 FROM sys;

-- Effects Fascia — single SKU on systems row; no profiles needed.
-- Effects Base Trim — single SKU on systems row; no profiles needed.


-- ── SYSTEM COLOURS ───────────────────────────────────────────
-- Montage only. All other systems in this file are pre-primed for site painting.
-- Colour SKUs are product-specific (colour changes the part number).
-- is_stocked: from catalogue note p.41 — 4 stock colours, rest made to order.

WITH sys AS (SELECT id FROM systems WHERE product_code = 'MONTAGE'
  AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6')
INSERT INTO system_colours (system_id, colour_name, sku, is_stocked, sort_order)
-- Concrete (16mm)
SELECT sys.id, 'Concrete — Square with Circle',    '4092705', false, 0  FROM sys UNION ALL
SELECT sys.id, 'Concrete — Rectangle with Circle', '4092704', true,  1  FROM sys UNION ALL
SELECT sys.id, 'Concrete — Smooth Plain',          '4092706', true,  2  FROM sys UNION ALL
-- Slimline Tile (18mm) — all made to order
SELECT sys.id, 'Slimline Tile — Limestone',        '4092673', false, 10 FROM sys UNION ALL
SELECT sys.id, 'Slimline Tile — Sandstone',        '4092674', false, 11 FROM sys UNION ALL
SELECT sys.id, 'Slimline Tile — Basalt',           '4092675', false, 12 FROM sys UNION ALL
SELECT sys.id, 'Slimline Tile — Onyx',             '4092676', false, 13 FROM sys UNION ALL
-- Stackstone (18mm) — all made to order
SELECT sys.id, 'Stackstone — Limestone',           '4092684', false, 20 FROM sys UNION ALL
SELECT sys.id, 'Stackstone — Sandstone',           '4092681', false, 21 FROM sys UNION ALL
SELECT sys.id, 'Stackstone — Basalt',              '4092682', false, 22 FROM sys UNION ALL
SELECT sys.id, 'Stackstone — Onyx',               '4092683', false, 23 FROM sys UNION ALL
-- Woodgrain (18mm) — 2 stocked, 2 made to order
SELECT sys.id, 'Woodgrain — Light Teak',           '4092661', true,  30 FROM sys UNION ALL
SELECT sys.id, 'Woodgrain — Dark Mahogany',        '4092662', false, 31 FROM sys UNION ALL
SELECT sys.id, 'Woodgrain — Grey Oak',             '4092663', false, 32 FROM sys UNION ALL
SELECT sys.id, 'Woodgrain — Black Oak',            '4092664', true,  33 FROM sys;


-- ── COMPONENTS ───────────────────────────────────────────────
-- New accessories not in bgc_innova_5_systems.sql.
-- Components already in DB: 4094941, 4092824, 4092813, 4092918, 4092919, 4093794,
--   4092823, 4092819, 4094306, 4094307, 4092811, 4092822, 4092818, 4092920,
--   4092916, 4092914, 4092917, 4092882, 4092808-4092876, 4094302-4094310,
--   4092821, 4092817, 4092820.

WITH mf AS (SELECT id FROM manufacturers WHERE slug = 'etex-innova-bgc')
INSERT INTO components (manufacturer_id, sku, name, description, category, unit, sort_order)

-- ── Duragrid subframe ──
SELECT mf.id, '4092848', 'Durabatten Timber Ply H5 Treated',
  '2700mm × 75mm × 19mm · H5 treated plywood batten · timber subframe for Duragrid residential',
  'Joists', 'each', 10 FROM mf
UNION ALL
SELECT mf.id, '311584', 'Cladding Top Hat — 70 × 19mm (0.75BMT)',
  '3000mm × 70mm × 19mm · 0.75BMT steel · top hat batten for Duragrid steel subframe',
  'Joists', 'each', 11 FROM mf
UNION ALL
SELECT mf.id, '311655', 'Cladding Top Hat — 70 × 35mm (0.75BMT)',
  '3000mm × 70mm × 35mm · 0.75BMT steel · top hat batten for Duragrid steel subframe',
  'Joists', 'each', 12 FROM mf
UNION ALL
SELECT mf.id, '4092846', 'PVC Cavity Closer',
  '2700mm × 19mm · PVC · cavity closer for Duragrid cavity system · each',
  'Other', 'each', 13 FROM mf
UNION ALL
-- Facade backing strips (shared: Duragrid + Duracom)
SELECT mf.id, '298168', 'Facade Backing Strip — 1190mm',
  '1190mm long · facade backing strip for Duragrid and Duracom panel joints · each',
  'Other', 'each', 14 FROM mf
UNION ALL
SELECT mf.id, '298169', 'Facade Backing Strip — 2390mm',
  '2390mm long · facade backing strip for Duragrid and Duracom panel joints · each',
  'Other', 'each', 15 FROM mf
UNION ALL
SELECT mf.id, '298170', 'Facade Backing Strip — 2990mm',
  '2990mm long · facade backing strip for Duragrid and Duracom panel joints · each',
  'Other', 'each', 16 FROM mf

-- ── Duracom top hat system ──
UNION ALL
SELECT mf.id, '311515', 'Primary Top Hat — 120 × 35mm (0.75BMT)',
  '6000mm × 120mm × 35mm · 0.75BMT galvanised steel · primary vertical top hat for Duracom system · each',
  'Joists', 'each', 20 FROM mf
UNION ALL
SELECT mf.id, '298172', 'Primary Top Hat — 120 × 35mm (1.15BMT)',
  '6000mm × 120mm × 35mm · 1.15BMT galvanised steel · primary vertical top hat for Duracom system (heavy duty) · each',
  'Joists', 'each', 21 FROM mf
UNION ALL
SELECT mf.id, '298296', 'Intermediate Top Hat — 50 × 35mm (0.75BMT)',
  '6000mm × 50mm × 35mm · 0.75BMT galvanised steel · intermediate horizontal top hat for Duracom system · each',
  'Joists', 'each', 22 FROM mf
UNION ALL
SELECT mf.id, '298299', 'Intermediate Top Hat — 50 × 35mm (1.15BMT)',
  '6000mm × 50mm × 35mm · 1.15BMT galvanised steel · intermediate horizontal top hat for Duracom system (heavy duty) · each',
  'Joists', 'each', 23 FROM mf
UNION ALL
SELECT mf.id, '4092581', 'Weather Seal Washer',
  'Neoprene weather seal washer · used with Duracom top hat screws · each',
  'Other', 'each', 24 FROM mf
UNION ALL
SELECT mf.id, '4092658', 'SS Wafer Head Self-Drilling Screw — 10g × 30mm',
  'No.10g × 30mm · 316 stainless steel · wafer head · self-drilling · for fixing Duracom panels to top hat · each',
  'Screws', 'box', 25 FROM mf

-- ── Montage — installation hardware ──
UNION ALL
SELECT mf.id, '4092702', 'Vertical Cavity Starter',
  '150mm long · PVC · vertical installation cavity starter for Montage · each',
  'Clips', 'each', 30 FROM mf
UNION ALL
SELECT mf.id, '4092700', 'Cavity Clip — Vertical',
  '62mm × 50mm × 5mm · steel · cavity clip for Montage vertical installation · each',
  'Clips', 'each', 31 FROM mf
UNION ALL
SELECT mf.id, '4092698', 'Self Adhesive Spacer — Vertical',
  '50mm × 50mm × 5mm · EPDM foam · self-adhesive spacer for Montage vertical installation · each',
  'Spacers', 'each', 32 FROM mf
UNION ALL
SELECT mf.id, '4092690', 'High Hat Joiner — 10mm',
  '3030mm × 10mm · aluminium · high hat joiner for Montage panel joints · each',
  'Trims', 'each', 33 FROM mf
UNION ALL
SELECT mf.id, '4092691', 'High Hat Joiner — 20mm',
  '3030mm × 20mm · aluminium · high hat joiner for Montage panel joints · each',
  'Trims', 'each', 34 FROM mf
UNION ALL
SELECT mf.id, '4092692', 'Single Hat Joiner — 10mm',
  '3030mm × 10mm · aluminium · single hat joiner for Montage panel joints · each',
  'Trims', 'each', 35 FROM mf
UNION ALL
SELECT mf.id, '4092693', 'Single Hat Joiner — 16mm',
  '2000mm × 16mm · aluminium · single hat joiner for Montage panel joints · each',
  'Trims', 'each', 36 FROM mf
UNION ALL
SELECT mf.id, '4092744', 'Top Hat — 75 × 15mm (1.15tct)',
  '3000mm × 75mm × 15mm · 1.15tct steel · top hat framing for Montage horizontal installation · each',
  'Joists', 'each', 37 FROM mf
UNION ALL
SELECT mf.id, '4092703', 'Horizontal Cavity Starter',
  '3030mm long · PVC · horizontal installation cavity starter for Montage · each',
  'Clips', 'each', 38 FROM mf
UNION ALL
SELECT mf.id, '4092701', 'Cavity Clip — Horizontal',
  '60mm × 56mm × 15mm · steel · cavity clip for Montage horizontal installation · each',
  'Clips', 'each', 39 FROM mf
UNION ALL
SELECT mf.id, '4092699', 'Self Adhesive Spacer — Horizontal',
  '50mm × 50mm × 15mm · EPDM foam · self-adhesive spacer for Montage horizontal installation · each',
  'Spacers', 'each', 40 FROM mf
UNION ALL
SELECT mf.id, '4092694', 'Internal Corner Flashing',
  '3050mm × 40mm × 40mm · aluminium · internal corner flashing for Montage · each',
  'Trims', 'each', 41 FROM mf
UNION ALL
SELECT mf.id, '4092695', 'Ring Nail — 65 × 3mm',
  '65mm × 3mm · galvanised ring shank nail · face fixing on timber frame for Montage · pack',
  'Screws', 'pack', 42 FROM mf
UNION ALL
SELECT mf.id, '4092743', 'Primer for Cut Edges and Joints',
  '100g · fibre cement edge and joint primer · apply to all cut edges before installation · each',
  'Other', 'each', 43 FROM mf
UNION ALL
SELECT mf.id, '4092696', 'SS Screw for Clips to Timber Frame',
  '35mm · stainless steel · screw for fixing Montage cavity clips to timber frame · box',
  'Screws', 'box', 44 FROM mf
UNION ALL
SELECT mf.id, '4092697', 'SS Screw for Clips to Steel Frame',
  '19mm × 4mm · stainless steel · self-drilling screw for fixing Montage cavity clips to steel frame · box',
  'Screws', 'box', 45 FROM mf

-- ── Montage — sealants (colour-matched) ──
UNION ALL
SELECT mf.id, '4092825', 'Montage Sealant — Concrete Grey',
  '600ml sausage · polyurethane sealant · colour-matched to Concrete profiles and Stackstone Basalt and Woodgrain Grey Oak · each',
  'Adhesive', 'sausage', 50 FROM mf
UNION ALL
SELECT mf.id, '4092831', 'Montage Sealant — Off White',
  '600ml sausage · polyurethane sealant · colour-matched to Slimline Tile and Stackstone Limestone · each',
  'Adhesive', 'sausage', 51 FROM mf
UNION ALL
SELECT mf.id, '4092829', 'Montage Sealant — Sandstone',
  '600ml sausage · polyurethane sealant · colour-matched to Slimline Tile Sandstone · each',
  'Adhesive', 'sausage', 52 FROM mf
UNION ALL
SELECT mf.id, '4092830', 'Montage Sealant — Dark Grey',
  '600ml sausage · polyurethane sealant · colour-matched to Slimline Tile Basalt and Stackstone Onyx · each',
  'Adhesive', 'sausage', 53 FROM mf
UNION ALL
SELECT mf.id, '4092826', 'Montage Sealant — Black',
  '600ml sausage · polyurethane sealant · colour-matched to Slimline Tile Onyx and Woodgrain Black Oak · each',
  'Adhesive', 'sausage', 54 FROM mf
UNION ALL
SELECT mf.id, '4092827', 'Montage Sealant — Redwood',
  '600ml sausage · polyurethane sealant · colour-matched to Stackstone Sandstone and Woodgrain Light Teak · each',
  'Adhesive', 'sausage', 55 FROM mf
UNION ALL
SELECT mf.id, '4092828', 'Montage Sealant — Dark Amber',
  '600ml sausage · polyurethane sealant · colour-matched to Woodgrain Dark Mahogany · each',
  'Adhesive', 'sausage', 56 FROM mf

-- ── Montage — pre-formed corners (horizontal) ──
UNION ALL
SELECT mf.id, '4092742', 'Montage Pre-formed Corner — Concrete (Horizontal)',
  '455mm wide × 16mm thick · pre-formed fibre cement corner · horizontal installation · Concrete profile · each',
  'Trims', 'each', 60 FROM mf
UNION ALL
SELECT mf.id, '4092669', 'Montage Pre-formed Corner — Woodgrain Light Teak (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Woodgrain Light Teak · each',
  'Trims', 'each', 61 FROM mf
UNION ALL
SELECT mf.id, '4092670', 'Montage Pre-formed Corner — Woodgrain Dark Mahogany (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Woodgrain Dark Mahogany · each',
  'Trims', 'each', 62 FROM mf
UNION ALL
SELECT mf.id, '4092671', 'Montage Pre-formed Corner — Woodgrain Grey Oak (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Woodgrain Grey Oak · each',
  'Trims', 'each', 63 FROM mf
UNION ALL
SELECT mf.id, '4092672', 'Montage Pre-formed Corner — Woodgrain Black Oak (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Woodgrain Black Oak · each',
  'Trims', 'each', 64 FROM mf
UNION ALL
SELECT mf.id, '4092677', 'Montage Pre-formed Corner — Slimline Tile Limestone (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Slimline Tile Limestone · each',
  'Trims', 'each', 65 FROM mf
UNION ALL
SELECT mf.id, '4092678', 'Montage Pre-formed Corner — Slimline Tile Sandstone (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Slimline Tile Sandstone · each',
  'Trims', 'each', 66 FROM mf
UNION ALL
SELECT mf.id, '4092679', 'Montage Pre-formed Corner — Slimline Tile Basalt (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Slimline Tile Basalt · each',
  'Trims', 'each', 67 FROM mf
UNION ALL
SELECT mf.id, '4092680', 'Montage Pre-formed Corner — Slimline Tile Onyx (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Slimline Tile Onyx · each',
  'Trims', 'each', 68 FROM mf
UNION ALL
SELECT mf.id, '4092688', 'Montage Pre-formed Corner — Stackstone Limestone (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Stackstone Limestone · each',
  'Trims', 'each', 69 FROM mf
UNION ALL
SELECT mf.id, '4092685', 'Montage Pre-formed Corner — Stackstone Sandstone (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Stackstone Sandstone · each',
  'Trims', 'each', 70 FROM mf
UNION ALL
SELECT mf.id, '4092686', 'Montage Pre-formed Corner — Stackstone Basalt (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Stackstone Basalt · each',
  'Trims', 'each', 71 FROM mf
UNION ALL
SELECT mf.id, '4092687', 'Montage Pre-formed Corner — Stackstone Onyx (Horizontal)',
  '455mm wide × 18mm thick · pre-formed fibre cement corner · horizontal installation · Stackstone Onyx · each',
  'Trims', 'each', 72 FROM mf

-- ── Montage — pre-formed corners (vertical, Woodgrain only) ──
UNION ALL
SELECT mf.id, '4092665', 'Montage Pre-formed Corner — Woodgrain Light Teak (Vertical)',
  '3030mm × 18mm · pre-formed fibre cement corner · vertical installation · Woodgrain Light Teak · each',
  'Trims', 'each', 75 FROM mf
UNION ALL
SELECT mf.id, '4092666', 'Montage Pre-formed Corner — Woodgrain Dark Mahogany (Vertical)',
  '3030mm × 18mm · pre-formed fibre cement corner · vertical installation · Woodgrain Dark Mahogany · each',
  'Trims', 'each', 76 FROM mf
UNION ALL
SELECT mf.id, '4092667', 'Montage Pre-formed Corner — Woodgrain Grey Oak (Vertical)',
  '3030mm × 18mm · pre-formed fibre cement corner · vertical installation · Woodgrain Grey Oak · each',
  'Trims', 'each', 77 FROM mf
UNION ALL
SELECT mf.id, '4092668', 'Montage Pre-formed Corner — Woodgrain Black Oak (Vertical)',
  '3030mm × 18mm · pre-formed fibre cement corner · vertical installation · Woodgrain Black Oak · each',
  'Trims', 'each', 78 FROM mf

-- ── Montage — powder-coated aluminium external corners ──
UNION ALL
SELECT mf.id, '4092709', 'Montage Alum External Corner — Concrete / Woodgrain Grey Oak',
  '3600mm × 36mm · powder-coated aluminium · external corner · Concrete profiles and Woodgrain Grey Oak · each',
  'Trims', 'each', 80 FROM mf
UNION ALL
SELECT mf.id, '4092711', 'Montage Alum External Corner — Slimline Tile / Stackstone Limestone',
  '3600mm × 36mm · powder-coated aluminium · external corner · Slimline Tile and Stackstone Limestone · each',
  'Trims', 'each', 81 FROM mf
UNION ALL
SELECT mf.id, '4092714', 'Montage Alum External Corner — Slimline Tile / Stackstone Sandstone',
  '3600mm × 36mm · powder-coated aluminium · external corner · Slimline Tile and Stackstone Sandstone · each',
  'Trims', 'each', 82 FROM mf
UNION ALL
SELECT mf.id, '4092708', 'Montage Alum External Corner — Slimline Tile / Stackstone Basalt',
  '3600mm × 36mm · powder-coated aluminium · external corner · Slimline Tile and Stackstone Basalt · each',
  'Trims', 'each', 83 FROM mf
UNION ALL
SELECT mf.id, '4092713', 'Montage Alum External Corner — Slimline Tile Onyx / Woodgrain Black Oak',
  '3600mm × 36mm · powder-coated aluminium · external corner · Slimline Tile Onyx and Woodgrain Black Oak · each',
  'Trims', 'each', 84 FROM mf
UNION ALL
SELECT mf.id, '4092712', 'Montage Alum External Corner — Woodgrain Light Teak',
  '3600mm × 36mm · powder-coated aluminium · external corner · Woodgrain Light Teak · each',
  'Trims', 'each', 85 FROM mf
UNION ALL
SELECT mf.id, '4092710', 'Montage Alum External Corner — Woodgrain Dark Mahogany',
  '3600mm × 36mm · powder-coated aluminium · external corner · Woodgrain Dark Mahogany · each',
  'Trims', 'each', 86 FROM mf

-- ── Montage — powder-coated aluminium internal corners ──
UNION ALL
SELECT mf.id, '4092736', 'Montage Alum Internal Corner — Concrete / Woodgrain Grey Oak',
  '3600mm × 36mm · powder-coated aluminium · internal corner · Concrete profiles and Woodgrain Grey Oak · each',
  'Trims', 'each', 90 FROM mf
UNION ALL
SELECT mf.id, '4092738', 'Montage Alum Internal Corner — Slimline Tile / Stackstone Limestone',
  '3600mm × 36mm · powder-coated aluminium · internal corner · Slimline Tile and Stackstone Limestone · each',
  'Trims', 'each', 91 FROM mf
UNION ALL
SELECT mf.id, '4092741', 'Montage Alum Internal Corner — Slimline Tile / Stackstone Sandstone',
  '3600mm × 36mm · powder-coated aluminium · internal corner · Slimline Tile and Stackstone Sandstone · each',
  'Trims', 'each', 92 FROM mf
UNION ALL
SELECT mf.id, '4092735', 'Montage Alum Internal Corner — Slimline Tile / Stackstone Basalt',
  '3600mm × 36mm · powder-coated aluminium · internal corner · Slimline Tile and Stackstone Basalt · each',
  'Trims', 'each', 93 FROM mf
UNION ALL
SELECT mf.id, '4092740', 'Montage Alum Internal Corner — Slimline Tile Onyx / Woodgrain Black Oak',
  '3600mm × 36mm · powder-coated aluminium · internal corner · Slimline Tile Onyx and Woodgrain Black Oak · each',
  'Trims', 'each', 94 FROM mf
UNION ALL
SELECT mf.id, '4092739', 'Montage Alum Internal Corner — Woodgrain Light Teak',
  '3600mm × 36mm · powder-coated aluminium · internal corner · Woodgrain Light Teak · each',
  'Trims', 'each', 95 FROM mf
UNION ALL
SELECT mf.id, '4092737', 'Montage Alum Internal Corner — Woodgrain Dark Mahogany',
  '3600mm × 36mm · powder-coated aluminium · internal corner · Woodgrain Dark Mahogany · each',
  'Trims', 'each', 96 FROM mf

-- ── Montage — eaves accessories (from p.46) ──
UNION ALL
SELECT mf.id, '4092724', 'Eaves Trim Channel — Grey',
  '2370mm × 55mm × 35mm · powder-coated aluminium · eaves trim channel · grey · each',
  'Trims', 'each', 100 FROM mf
UNION ALL
SELECT mf.id, '4092726', 'Eaves Trim Channel — Brown',
  '2370mm × 55mm × 35mm · powder-coated aluminium · eaves trim channel · brown · each',
  'Trims', 'each', 101 FROM mf
UNION ALL
SELECT mf.id, '4092725', 'Eaves Trim Channel — Black',
  '2370mm × 55mm × 35mm · powder-coated aluminium · eaves trim channel · black · each',
  'Trims', 'each', 102 FROM mf
UNION ALL
SELECT mf.id, '4092727', 'Eaves External Corner — Grey',
  '86mm × 32.5mm × 51.3mm · powder-coated aluminium · eaves external corner · grey · each',
  'Trims', 'each', 103 FROM mf
UNION ALL
SELECT mf.id, '4092729', 'Eaves External Corner — Brown',
  '86mm × 32.5mm × 51.3mm · powder-coated aluminium · eaves external corner · brown · each',
  'Trims', 'each', 104 FROM mf
UNION ALL
SELECT mf.id, '4092728', 'Eaves External Corner — Black',
  '86mm × 32.5mm × 51.3mm · powder-coated aluminium · eaves external corner · black · each',
  'Trims', 'each', 105 FROM mf
UNION ALL
SELECT mf.id, '4092730', 'Eaves Internal Corner — Grey',
  '86mm × 67.4mm × 32.5mm · powder-coated aluminium · eaves internal corner · grey · each',
  'Trims', 'each', 106 FROM mf
UNION ALL
SELECT mf.id, '4092732', 'Eaves Internal Corner — Brown',
  '86mm × 67.4mm × 32.5mm · powder-coated aluminium · eaves internal corner · brown · each',
  'Trims', 'each', 107 FROM mf
UNION ALL
SELECT mf.id, '4092731', 'Eaves Internal Corner — Black',
  '86mm × 67.4mm × 32.5mm · powder-coated aluminium · eaves internal corner · black · each',
  'Trims', 'each', 108 FROM mf
UNION ALL
SELECT mf.id, '4092721', 'Eaves Trim Joint — Grey',
  '40mm × 32.5mm · powder-coated aluminium · eaves trim joint · grey · each',
  'Trims', 'each', 109 FROM mf
UNION ALL
SELECT mf.id, '4092723', 'Eaves Trim Joint — Brown',
  '40mm × 32.5mm · powder-coated aluminium · eaves trim joint · brown · each',
  'Trims', 'each', 110 FROM mf
UNION ALL
SELECT mf.id, '4092722', 'Eaves Trim Joint — Black',
  '40mm × 32.5mm · powder-coated aluminium · eaves trim joint · black · each',
  'Trims', 'each', 111 FROM mf
UNION ALL
SELECT mf.id, '4092718', 'Eaves End Cap — Grey',
  '32.5mm × 25mm · powder-coated aluminium · eaves end cap · grey · each',
  'Trims', 'each', 112 FROM mf
UNION ALL
SELECT mf.id, '4092720', 'Eaves End Cap — Brown',
  '32.5mm × 25mm · powder-coated aluminium · eaves end cap · brown · each',
  'Trims', 'each', 113 FROM mf
UNION ALL
SELECT mf.id, '4092719', 'Eaves End Cap — Black',
  '32.5mm × 25mm · powder-coated aluminium · eaves end cap · black · each',
  'Trims', 'each', 114 FROM mf

-- ── Durasheet / Duralux — PVC trim accessories ──
-- 4.5mm accessories (Durasheet only)
UNION ALL
SELECT mf.id, '4092809', 'PVC Straight Joint — 4.5mm × 2400mm',
  '4.5mm × 2400mm · PVC · straight joint trim for Durasheet 4.5mm · each',
  'Trims', 'each', 120 FROM mf
UNION ALL
SELECT mf.id, '4092810', 'PVC Straight Joint — 4.5mm × 3000mm',
  '4.5mm × 3000mm · PVC · straight joint trim for Durasheet 4.5mm · each',
  'Trims', 'each', 121 FROM mf
UNION ALL
SELECT mf.id, '4092857', 'PVC External Corner Mould — 4.5mm × 2400mm',
  '4.5mm × 2400mm · PVC · external corner mould for Durasheet 4.5mm · each',
  'Trims', 'each', 122 FROM mf
UNION ALL
SELECT mf.id, '4092858', 'PVC External Corner Mould — 4.5mm × 3000mm',
  '4.5mm × 3000mm · PVC · external corner mould for Durasheet 4.5mm · each',
  'Trims', 'each', 123 FROM mf
UNION ALL
SELECT mf.id, '4092859', 'PVC Internal Corner Mould — 4.5mm × 2400mm',
  '4.5mm × 2400mm · PVC · internal corner mould for Durasheet 4.5mm · each',
  'Trims', 'each', 124 FROM mf
UNION ALL
SELECT mf.id, '4092860', 'PVC Internal Corner Mould — 4.5mm × 3000mm',
  '4.5mm × 3000mm · PVC · internal corner mould for Durasheet 4.5mm · each',
  'Trims', 'each', 125 FROM mf
UNION ALL
SELECT mf.id, '4092856', 'PVC Cap Mould — 4.5mm × 2400mm',
  '4.5mm × 2400mm · PVC · cap mould for Durasheet 4.5mm · each',
  'Trims', 'each', 126 FROM mf
-- 6mm accessories (shared Durasheet + Duralux)
UNION ALL
SELECT mf.id, '4092877', 'PVC Straight Joint — 6mm × 2400mm',
  '6mm × 2400mm · PVC · straight joint trim for Durasheet and Duralux 6mm · each',
  'Trims', 'each', 130 FROM mf
UNION ALL
SELECT mf.id, '4092878', 'PVC Straight Joint — 6mm × 3600mm',
  '6mm × 3600mm · PVC · straight joint trim for Durasheet and Duralux 6mm · each',
  'Trims', 'each', 131 FROM mf
UNION ALL
SELECT mf.id, '4092879', 'PVC Straight Joint — 6mm × 3000mm',
  '6mm × 3000mm · PVC · straight joint trim for Durasheet and Duralux 6mm · each',
  'Trims', 'each', 132 FROM mf
UNION ALL
SELECT mf.id, '4092863', 'PVC External Corner Mould — 6mm × 3000mm',
  '6mm × 3000mm · PVC · external corner mould for Durasheet and Duralux 6mm · each',
  'Trims', 'each', 133 FROM mf
UNION ALL
SELECT mf.id, '4092864', 'PVC Internal Corner Mould — 6mm × 2400mm',
  '6mm × 2400mm · PVC · internal corner mould for Durasheet and Duralux 6mm · each',
  'Trims', 'each', 134 FROM mf
UNION ALL
SELECT mf.id, '4092866', 'PVC Internal Corner Mould — 6mm × 3000mm',
  '6mm × 3000mm · PVC · internal corner mould for Durasheet and Duralux 6mm · each',
  'Trims', 'each', 135 FROM mf
UNION ALL
SELECT mf.id, '4092861', 'PVC Cap Mould — 6mm × 2400mm',
  '6mm × 2400mm · PVC · cap mould for Durasheet and Duralux 6mm · each',
  'Trims', 'each', 136 FROM mf
UNION ALL
SELECT mf.id, '4092865', 'PVC Cap Mould — 6mm × 3000mm',
  '6mm × 3000mm · PVC · cap mould for Durasheet and Duralux 6mm · each',
  'Trims', 'each', 137 FROM mf
-- 10mm accessories (Duralux only)
UNION ALL
SELECT mf.id, '4092880', 'PVC Straight Joint — 10mm × 2400mm',
  '10mm × 2400mm · PVC · straight joint trim for Duralux 9mm · each',
  'Trims', 'each', 140 FROM mf
UNION ALL
SELECT mf.id, '4092881', 'PVC Straight Joint — 10mm × 3000mm',
  '10mm × 3000mm · PVC · straight joint trim for Duralux 9mm · each',
  'Trims', 'each', 141 FROM mf
UNION ALL
SELECT mf.id, '4092867', 'PVC Cap Mould — 10mm × 3000mm',
  '10mm × 3000mm · PVC · cap mould for Duralux 9mm · each',
  'Trims', 'each', 142 FROM mf

-- ── Effects Base Trim — accessories ──
UNION ALL
SELECT mf.id, '4094246', 'Effects Base Trim — Straight Joiner',
  '57mm wide · powder-coated aluminium · straight joiner for Effects Base Trim length transitions · each',
  'Trims', 'each', 150 FROM mf
UNION ALL
SELECT mf.id, '4094247', 'Effects Base Trim — External Corner',
  '50mm × 50mm · powder-coated aluminium · external corner for Effects Base Trim · each',
  'Trims', 'each', 151 FROM mf
UNION ALL
SELECT mf.id, '4094248', 'Effects Base Trim — Internal Corner',
  '50mm × 50mm · powder-coated aluminium · internal corner for Effects Base Trim · each',
  'Trims', 'each', 152 FROM mf;


-- ── SYSTEM → COMPONENTS ──────────────────────────────────────
-- Uses VALUES join on SKU scoped to this manufacturer.
-- Components from Part 1 (already in DB) are referenced by SKU — no re-insert needed.

-- Durascape (shares all accessories with Duragroove)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'DURASCAPE'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id, v.role, v.notes, v.sort_order
FROM (VALUES
  ('4092821', 'required',    'Aluminium internal corner',                          10),
  ('4092817', 'required',    'Aluminium external corner',                          20),
  ('4092820', 'required',    'Horizontal H flashing at panel joins',               30),
  ('4092918', 'required',    'Snap-on external corner Part B',                     40),
  ('4092919', 'required',    'Snap-on external corner Part C',                     50),
  ('4092813', 'required',    'EPDM foam gasket at sheet joins',                    60),
  ('4094941', 'required',    'Sealant at all joins and penetrations',              70),
  ('4092824', 'recommended', 'Required when fixing to steel frame',                80)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';

-- Duragrid
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'DURAGRID'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id, v.role, v.notes, v.sort_order
FROM (VALUES
  ('4092848', 'required',    'Durabatten timber subframe — residential installations',    10),
  ('311584',  'required',    'Steel top hat 70×19 — light commercial steel subframe',     20),
  ('311655',  'recommended', 'Steel top hat 70×35 — deeper cavity applications',          30),
  ('4092846', 'required',    'PVC cavity closer at top and bottom of cavity',             40),
  ('298168',  'required',    'Facade backing strip — use with 1190mm panel length',       50),
  ('298169',  'required',    'Facade backing strip — use with 2390mm panel length',       60),
  ('298170',  'recommended', 'Facade backing strip — use with 2990mm panel length',       70),
  ('4094941', 'required',    'Sealant at all joins and penetrations',                     80)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';

-- Duracom
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'DURACOM'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id, v.role, v.notes, v.sort_order
FROM (VALUES
  ('311515',  'required',    'Primary top hat 0.75BMT — standard wind zones',            10),
  ('298172',  'recommended', 'Primary top hat 1.15BMT — high wind zones up to 7kPa',     20),
  ('298296',  'required',    'Intermediate top hat 0.75BMT — horizontal spanning',        30),
  ('298299',  'recommended', 'Intermediate top hat 1.15BMT — high wind zones',           40),
  ('298168',  'required',    'Facade backing strip 1190mm',                              50),
  ('298169',  'required',    'Facade backing strip 2390mm',                              60),
  ('298170',  'required',    'Facade backing strip 2990mm',                              70),
  ('4092813', 'required',    'EPDM foam gasket at panel joints',                         80),
  ('4092581', 'required',    'Weather seal washer with each fixing screw',               90),
  ('4092658', 'required',    'SS wafer head self-drilling screw for panels to top hat',  100),
  ('4094941', 'required',    'Sealant at perimeter joints and penetrations',             110)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';

-- Duratex — no accessories listed in catalogue; section intentionally empty.

-- Stonesheet — no accessories listed in catalogue; section intentionally empty.

-- Montage — installation hardware
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'MONTAGE'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id, v.role, v.notes, v.sort_order
FROM (VALUES
  -- Vertical installation
  ('4092702', 'required',    'Vertical cavity starter at base course',                    10),
  ('4092700', 'required',    'Cavity clip — vertical installation',                       20),
  ('4092698', 'required',    'Self-adhesive spacer — vertical installation',              30),
  ('4092690', 'required',    'High hat joiner 10mm at panel joints',                      40),
  ('4092691', 'optional',    'High hat joiner 20mm — wider joint option',                 50),
  ('4092692', 'required',    'Single hat joiner 10mm at panel joints',                    60),
  ('4092693', 'required',    'Single hat joiner 16mm at panel joints',                    70),
  ('4092744', 'required',    'Top hat framing — horizontal installation',                 80),
  -- Horizontal installation
  ('4092703', 'required',    'Horizontal cavity starter at base course',                  90),
  ('4092701', 'required',    'Cavity clip — horizontal installation',                    100),
  ('4092699', 'required',    'Self-adhesive spacer — horizontal installation',           110),
  -- Common
  ('4092694', 'required',    'Internal corner flashing at internal corners',             120),
  ('4092695', 'required',    'Ring nail — face fixing on timber frame',                  130),
  ('4092696', 'required',    'SS screw for clips to timber frame',                       140),
  ('4092697', 'required',    'SS screw for clips to steel frame',                        150),
  ('4092743', 'required',    'Apply primer to all cut edges before installation',         160),
  -- Sealants (select colour to match installed profile)
  ('4092825', 'recommended', 'Sealant — Concrete profiles, Stackstone Basalt, WG Grey Oak', 170),
  ('4092831', 'recommended', 'Sealant — Slimline Tile and Stackstone Limestone',         180),
  ('4092829', 'recommended', 'Sealant — Slimline Tile Sandstone',                        190),
  ('4092830', 'recommended', 'Sealant — Slimline Tile Basalt, Stackstone Onyx',          200),
  ('4092826', 'recommended', 'Sealant — Slimline Tile Onyx, Woodgrain Black Oak',        210),
  ('4092827', 'recommended', 'Sealant — Stackstone Sandstone, Woodgrain Light Teak',     220),
  ('4092828', 'recommended', 'Sealant — Woodgrain Dark Mahogany',                        230)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';

-- Duraliner — no specific accessories listed in catalogue.

-- Intergroove — no specific accessories listed in catalogue.

-- Durasheet
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'DURASHEET'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id, v.role, v.notes, v.sort_order
FROM (VALUES
  ('4092809', 'required',    'Straight joint — 4.5mm sheets × 2400mm length',   10),
  ('4092810', 'required',    'Straight joint — 4.5mm sheets × 3000mm length',   20),
  ('4092877', 'required',    'Straight joint — 6mm sheets × 2400mm length',     30),
  ('4092878', 'required',    'Straight joint — 6mm sheets × 3600mm length',     40),
  ('4092879', 'required',    'Straight joint — 6mm sheets × 3000mm length',     50),
  ('4092857', 'required',    'External corner mould — 4.5mm × 2400mm',          60),
  ('4092858', 'required',    'External corner mould — 4.5mm × 3000mm',          70),
  ('4092863', 'required',    'External corner mould — 6mm × 3000mm',            80),
  ('4092859', 'required',    'Internal corner mould — 4.5mm × 2400mm',          90),
  ('4092860', 'required',    'Internal corner mould — 4.5mm × 3000mm',         100),
  ('4092864', 'required',    'Internal corner mould — 6mm × 2400mm',           110),
  ('4092866', 'required',    'Internal corner mould — 6mm × 3000mm',           120),
  ('4092856', 'required',    'Cap mould — 4.5mm × 2400mm',                     130),
  ('4092861', 'required',    'Cap mould — 6mm × 2400mm',                       140),
  ('4092865', 'required',    'Cap mould — 6mm × 3000mm',                       150)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';

-- Duralux
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'DURALUX'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id, v.role, v.notes, v.sort_order
FROM (VALUES
  ('4092877', 'required',    'Straight joint — 6mm sheets × 2400mm',   10),
  ('4092878', 'required',    'Straight joint — 6mm sheets × 3600mm',   20),
  ('4092879', 'required',    'Straight joint — 6mm sheets × 3000mm',   30),
  ('4092863', 'required',    'External corner mould — 6mm × 3000mm',   40),
  ('4092864', 'required',    'Internal corner mould — 6mm × 2400mm',   50),
  ('4092866', 'required',    'Internal corner mould — 6mm × 3000mm',   60),
  ('4092861', 'required',    'Cap mould — 6mm × 2400mm',               70),
  ('4092865', 'required',    'Cap mould — 6mm × 3000mm',               80),
  ('4092880', 'required',    'Straight joint — 9mm sheets × 2400mm',   90),
  ('4092881', 'required',    'Straight joint — 9mm sheets × 3000mm',  100),
  ('4092867', 'required',    'Cap mould — 9mm × 3000mm',              110)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';

-- Durafloor — no accessories listed in catalogue.

-- Compressed Flooring — no accessories listed in catalogue.

-- Ceramic Tile Underlay — no accessories listed in catalogue.

-- Effects Trims — no accessories (the trims themselves are the product).

-- Effects Fascia — no accessories listed in catalogue.

-- Effects Base Trim
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
SELECT
  (SELECT id FROM systems WHERE product_code = 'EFFECTS-BASE'
     AND manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6'),
  c.id, v.role, v.notes, v.sort_order
FROM (VALUES
  ('4094246', 'required',    'Straight joiner between trim lengths',      10),
  ('4094247', 'required',    'External corner at external building corners', 20),
  ('4094248', 'required',    'Internal corner at internal building corners', 30)
) AS v(sku, role, notes, sort_order)
JOIN components c ON c.sku = v.sku
  AND c.manufacturer_id = '65ee9f06-05d2-4d36-9877-223cd1cf96a6';


-- ============================================================
-- COMPLETE CATALOGUE SUMMARY — BOTH FILES COMBINED
-- ============================================================
-- | Section             | System              | Profiles | Colours |
-- |---------------------|---------------------|----------|---------|
-- | Weatherboards       | Nuline®             |    4     |    0    |
-- |                     | Stratum®            |    5     |    0    |
-- |                     | Contour®            |    0     |    0    |
-- |                     | Duraplank®          |    4     |    0    |
-- | Exterior Facades    | Duragroove®         |   13     |    0    |
-- |                     | Durascape®          |    4     |    0    |
-- |                     | Duragrid®           |    4     |    0    |
-- |                     | Duracom®            |    9     |    0    |
-- | Base Sheets         | Duratex®            |    5     |    0    |
-- |                     | Stonesheet®         |    0     |    0    |
-- | Pre-finished        | Montage®            |    4     |   15    |
-- | Internal Lining     | Duraliner®          |   18     |    0    |
-- |                     | Intergroove®        |    0     |    0    |
-- | Soffit & Fascia     | Durasheet®          |   15     |    0    |
-- |                     | Duralux®            |    7     |    0    |
-- | Flooring            | Durafloor®          |    3     |    0    |
-- |                     | Compressed Flooring |   10     |    0    |
-- |                     | Ceramic Tile Underlay|   0     |    0    |
-- | Effects             | Effects® Trims      |    5     |    0    |
-- |                     | Effects® Fascia     |    0     |    0    |
-- |                     | Effects® Base Trim  |    0     |    0    |
-- |---------------------|---------------------|----------|---------|
-- | TOTAL               | 21 systems          |   99     |   15    |
-- ============================================================
-- | Table              | Part 1 | Part 2 | Total |
-- |--------------------|--------|--------|-------|
-- | catalogue_sources  |      1 |      0 |     1 |
-- | systems            |      5 |     16 |    21 |
-- | system_profiles    |     26 |     73 |    99 |
-- | system_colours     |      0 |     15 |    15 |
-- | components         |     31 |     98 |   129 |
-- | system_components  |     49 |    ~75 |  ~124 |
-- ============================================================
