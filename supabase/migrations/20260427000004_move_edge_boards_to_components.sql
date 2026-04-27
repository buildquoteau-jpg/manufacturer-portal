-- ============================================================
-- Move all edge/fascia boards from systems → components
-- These are finishing/picture-frame boards that accompany
-- the main decking board in each range, not standalone systems.
--
-- Affected profiles:
--   US93  — Avenue Range edge board (face-fix capable)
--   US63C — Terrace Range edge board (face-fix capable)
--   US142C — Coastal Range edge board (138mm companion to 210mm US54C)
--   US06C — Fascia board (thin 15mm, used across all decking ranges)
--
-- Deleting from systems cascades to system_colours and system_components.
-- ============================================================

-- ============================================================
-- STEP 1: Remove edge boards from systems table
-- (CASCADE automatically cleans up system_colours + system_components)
-- ============================================================
DELETE FROM systems WHERE id IN (
  'b1000000-0000-0000-0000-000000000002', -- US93  Avenue edge
  'b1000000-0000-0000-0000-000000000004', -- US63C Terrace edge
  'b1000000-0000-0000-0000-000000000006', -- US142C Coastal edge
  'b1000000-0000-0000-0000-000000000008'  -- US06C Fascia
);

-- ============================================================
-- STEP 2: Add edge boards as components
-- ============================================================
INSERT INTO components (id, manufacturer_id, sku, name, description, category, unit, sort_order)
VALUES
  -- US93 Avenue Edge Board
  (
    'c6000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'US93',
    'Avenue Range Edge Board — 138mm x 29mm',
    'Picture frame and edge board for Avenue Range decking. Face-fix or secret-fix capable. Slip-resistant surface backing. Available in Blackbutt, Antique, Teak, Ipe, Silver Grey. 4.88m lengths, pack of 40.',
    'Edge Board',
    'lm',
    30
  ),
  -- US63C Terrace Edge Board
  (
    'c6000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'US63C',
    'Terrace Range Edge Board — 138mm x 25mm',
    'Picture frame and edge board for Terrace Range decking. Double-sided, face-fix or secret-fix. Available in Blackbutt, Antique, Teak, Ipe, Silver Grey. 5.4m lengths, pack of 30.',
    'Edge Board',
    'lm',
    31
  ),
  -- US142C Coastal Edge Board
  (
    'c6000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'US142C',
    'Coastal Range Edge Board — 138mm x 23mm',
    '138mm companion board for use with the 210mm Coastal Range (US54C). Double-sided. Available in Beech, Antique, Teak, Aged Wood. 4.88m lengths, pack of 30.',
    'Edge Board',
    'lm',
    32
  ),
  -- US06C Fascia Board
  (
    'c5000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'US06C',
    'Fascia Board — 138mm x 15mm',
    'Double-sided fascia board for finishing deck edges. Face fix with CS screws. Available in Antique, Blackbutt, Ipe, Teak, Silver Grey. 5.4m lengths, pack of 30.',
    'Fascia',
    'lm',
    33
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 3: Link edge boards to their parent decking systems
-- ============================================================

-- US93 → Avenue Range US92 only
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  'c6000000-0000-0000-0000-000000000001',
  'recommended',
  'Edge and picture frame board for Avenue Range. Match colour to main deck board.',
  28
)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- US63C → Terrace Range US49C only
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000003',
  'c6000000-0000-0000-0000-000000000002',
  'recommended',
  'Edge and picture frame board for Terrace Range. Match colour to main deck board.',
  28
)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- US142C → Coastal Range US54C only
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000005',
  'c6000000-0000-0000-0000-000000000003',
  'recommended',
  '138mm companion board used alongside the 210mm Coastal board for edges and borders.',
  28
)
ON CONFLICT (system_id, component_id) DO NOTHING;

-- US06C Fascia → all main decking systems
INSERT INTO system_components (system_id, component_id, role, notes, sort_order)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'Fascia board for finishing deck edges', 29),
  ('b1000000-0000-0000-0000-000000000003', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'Fascia board for finishing deck edges', 29),
  ('b1000000-0000-0000-0000-000000000005', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'Fascia board for finishing deck edges', 29),
  ('b1000000-0000-0000-0000-000000000007', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'Fascia board for finishing deck edges', 29)
ON CONFLICT (system_id, component_id) DO NOTHING;
