-- ============================================================
-- New Tech Wood — Patch v1
-- Corrections identified by triple-verification against
-- the October 2025 Product Brochure and live-DB CSV export.
--
-- Safe to run against an already-seeded database.
-- Uses ON CONFLICT DO NOTHING throughout so it is re-runnable.
-- Run the full file in a single Supabase SQL Editor execution.
-- ============================================================


-- ============================================================
-- 1. FIX US93 COLOURS
--    Seed incorrectly had: Blackbutt, Antique, Teak, Ipe, Silver Grey
--    Brochure p.3: Avenue Range US92 + US93 share Antique, Teak, Walnut
-- ============================================================

DELETE FROM system_colours
WHERE system_id = 'b1000000-0000-0000-0000-000000000002';

INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000002', 'Antique',  1),
  ('b1000000-0000-0000-0000-000000000002', 'Teak',     2),
  ('b1000000-0000-0000-0000-000000000002', 'Walnut',   3);


-- ============================================================
-- 2. ADD TC30 250 COMPONENT
--    Brochure p.9: Marina T-clip, 8.5mm gap, suits timber + metal.
--    Commercial/Marina range = US71H.
-- ============================================================

INSERT INTO components (id, manufacturer_id, sku, name, description, category, unit, sort_order)
VALUES (
  'c1000000-0000-0000-0000-000000000012',
  'a1000000-0000-0000-0000-000000000001',
  'TC30 250',
  'TC30 Marina T-Clip — Pack of 250',
  'T-clip for Commercial (Marina) range decking (US71H). 8.5mm gap. Suits timber and metal frame. Pack of 250.',
  'Clips',
  'pack',
  18
)
ON CONFLICT (id) DO NOTHING;

-- Link TC30 to US71H (before COBRA-M which sits at sort 10)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000007',
  'c1000000-0000-0000-0000-000000000012',
  'required',
  'TC30 T-Clip — 8.5mm gap, timber or metal frame',
  9
)
ON CONFLICT (system_id, component_id) DO NOTHING;


-- ============================================================
-- 3. ADD US154R SYSTEM (Screening & Fencing — Square Profile)
--    Brochure p.14–15: 55mm × 55mm, 2.7m, double-sided N,
--    colours: Silver Grey, Sea Salt, Blackbutt, Ipe
-- ============================================================

INSERT INTO systems (
  id, manufacturer_id, name, product_code, slug,
  category, subcategory, description, dimensions, length_m,
  double_sided, sort_order
)
VALUES (
  'b3000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Screening & Fencing Square',
  'US154R',
  'screening-us154r',
  'Screening & Fencing',
  'Screening Range',
  'Square hollow decorative screening board. 10 boards per pack. Versatile solution for privacy screening, pool fencing, and feature walls. Sold in packs of 10.',
  '55mm x 55mm',
  2.7,
  false,
  82
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b3000000-0000-0000-0000-000000000003', 'Silver Grey', 1),
  ('b3000000-0000-0000-0000-000000000003', 'Sea Salt',    2),
  ('b3000000-0000-0000-0000-000000000003', 'Blackbutt',   3),
  ('b3000000-0000-0000-0000-000000000003', 'Ipe',         4)
ON CONFLICT (system_id, colour_name) DO NOTHING;

-- US154R uses CS face-fix screws (same as UH55)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b3000000-0000-0000-0000-000000000003',
  'c1000000-0000-0000-0000-000000000009',
  'required',
  'CS Screw 8G x 50mm — face fix',
  10
)
ON CONFLICT (system_id, component_id) DO NOTHING;


-- ============================================================
-- 4. ADD MISSING CA42B (J Trim Non-Perforated) TO US31
--    Brochure p.13: CA42B listed for Shadowline (US31)
-- ============================================================

INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000001',  -- US31
  'c4000000-0000-0000-0000-000000000006',  -- CA42B
  'recommended',
  'J Trim Non-Perforated — Shadowline',
  26
)
ON CONFLICT (system_id, component_id) DO NOTHING;


-- ============================================================
-- 5. ADD MISSING CA43 + CA43B TO UH58 AND UH93
--    Brochure p.11: "J Trim Perforated/Non-Perforated for UH61, UH58 and UH93"
--    UH61 already has CA43. All three are missing CA43B.
-- ============================================================

-- CA43 → UH58 (sort 24, matching UH61 pattern)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000004',  -- UH58
  'c3000000-0000-0000-0000-000000000005',  -- CA43
  'recommended',
  'J Trim Perforated — Castellation',
  24
)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- CA43 → UH93
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000006',  -- UH93
  'c3000000-0000-0000-0000-000000000005',  -- CA43
  'recommended',
  'J Trim Perforated — Castellation',
  24
)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- CA43B → UH61 (UH61 already has CA43 at 24, Window Flashing at 25)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000003',  -- UH61
  'c3000000-0000-0000-0000-000000000006',  -- CA43B
  'recommended',
  'J Trim Non-Perforated — Castellation',
  26
)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- CA43B → UH58
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000004',  -- UH58
  'c3000000-0000-0000-0000-000000000006',  -- CA43B
  'recommended',
  'J Trim Non-Perforated — Castellation',
  26
)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- CA43B → UH93
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000006',  -- UH93
  'c3000000-0000-0000-0000-000000000006',  -- CA43B
  'recommended',
  'J Trim Non-Perforated — Castellation',
  26
)
ON CONFLICT (system_id, component_id) DO NOTHING;


-- ============================================================
-- 6. ADD MISSING MG10 CLIPS TO ALL AVENUE / TERRACE / COASTAL SYSTEMS
--    Brochure p.9 fixings table: Avenue Y, Terrace Y, Coastal Y, Marina N
--    MG10 FS (timber fix): MG10-MBK-FS-75 (c1...005), MG10-LBK-FS-75 (c1...006)
--    MG10 KJ (metal fix):  MG10-MBK-KJ-75 (c1...007), MG10-LBK-KJ-75 (c1...008)
--
--    US92 already has FS clips (sort 15,16) — add KJ only.
--    US93, US49C, US63C, US54C, US142C — add all 4 MG10 clips.
-- ============================================================

-- US92: add KJ metal-fix clips (FS already linked at sort 15,16)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000007', 'recommended', 'MG10 3mm clip & screw — metal fix, steel frame', 17),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000008', 'recommended', 'MG10 3mm locking clip & screw — metal fix, see install guide', 18)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- US93: add all 4 MG10 clips (sort 10–14 already used by TC28/COBRA/MG3/K37/CDS)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000005', 'recommended', 'MG10 3mm clip & screw — timber fix', 15),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000006', 'recommended', 'MG10 3mm locking clip & screw — timber fix, see install guide', 16),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000007', 'recommended', 'MG10 3mm clip & screw — metal fix, steel frame', 17),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000008', 'recommended', 'MG10 3mm locking clip & screw — metal fix, see install guide', 18)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- US49C: sort 10–15 used (TC28/COBRA/MG3/K37/CDS/CSM)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 'recommended', 'MG10 3mm clip & screw — timber fix', 16),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000006', 'recommended', 'MG10 3mm locking clip & screw — timber fix, see install guide', 17),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000007', 'recommended', 'MG10 3mm clip & screw — metal fix, steel frame', 18),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000008', 'recommended', 'MG10 3mm locking clip & screw — metal fix, see install guide', 19)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- US63C: sort 10–14 used (TC28/COBRA/MG3/K37/CDS)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000005', 'recommended', 'MG10 3mm clip & screw — timber fix', 15),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000006', 'recommended', 'MG10 3mm locking clip & screw — timber fix, see install guide', 16),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000007', 'recommended', 'MG10 3mm clip & screw — metal fix, steel frame', 17),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000008', 'recommended', 'MG10 3mm locking clip & screw — metal fix, see install guide', 18)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- US54C: sort 10–14 used (TC28/COBRA/MG3/–/CDS, sort 13 gap is fine)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 'recommended', 'MG10 3mm clip & screw — timber fix', 15),
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000006', 'recommended', 'MG10 3mm locking clip & screw — timber fix, see install guide', 16),
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000007', 'recommended', 'MG10 3mm clip & screw — metal fix, steel frame', 17),
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000008', 'recommended', 'MG10 3mm locking clip & screw — metal fix, see install guide', 18)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- US142C: sort 10–14 used (TC28/COBRA/MG3/–/CDS)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES
  ('b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000005', 'recommended', 'MG10 3mm clip & screw — timber fix', 15),
  ('b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 'recommended', 'MG10 3mm locking clip & screw — timber fix, see install guide', 16),
  ('b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000007', 'recommended', 'MG10 3mm clip & screw — metal fix, steel frame', 17),
  ('b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000008', 'recommended', 'MG10 3mm locking clip & screw — metal fix, see install guide', 18)
ON CONFLICT (system_id, component_id) DO NOTHING;


-- ============================================================
-- VERIFY — quick row counts to confirm patch applied
-- ============================================================

SELECT 'US93 colours'      AS check_name, count(*) AS row_count FROM system_colours  WHERE system_id = 'b1000000-0000-0000-0000-000000000002'
UNION ALL
SELECT 'US154R colours',                  count(*)              FROM system_colours  WHERE system_id = 'b3000000-0000-0000-0000-000000000003'
UNION ALL
SELECT 'TC30 component',                  count(*)              FROM components      WHERE sku = 'TC30 250'
UNION ALL
SELECT 'US71H components',                count(*)              FROM system_components WHERE system_id = 'b1000000-0000-0000-0000-000000000007'
UNION ALL
SELECT 'US31 components',                 count(*)              FROM system_components WHERE system_id = 'b2000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'UH61 components',                 count(*)              FROM system_components WHERE system_id = 'b2000000-0000-0000-0000-000000000003'
UNION ALL
SELECT 'UH58 components',                 count(*)              FROM system_components WHERE system_id = 'b2000000-0000-0000-0000-000000000004'
UNION ALL
SELECT 'UH93 components',                 count(*)              FROM system_components WHERE system_id = 'b2000000-0000-0000-0000-000000000006'
UNION ALL
SELECT 'US92 components',                 count(*)              FROM system_components WHERE system_id = 'b1000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'US93 components',                 count(*)              FROM system_components WHERE system_id = 'b1000000-0000-0000-0000-000000000002'
ORDER BY check_name;
