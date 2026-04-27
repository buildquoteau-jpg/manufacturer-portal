-- ============================================================
-- Move US06C Fascia Board from systems → components
-- It is a finishing/edge component used with decking systems,
-- not a standalone system a supplier would feature on its own.
-- ============================================================

-- 1. Remove US06C from system_components (it had a CS screw linked to it as a system)
DELETE FROM system_components
WHERE system_id = 'b1000000-0000-0000-0000-000000000008';

-- 2. Remove its colour variants
DELETE FROM system_colours
WHERE system_id = 'b1000000-0000-0000-0000-000000000008';

-- 3. Remove it from the systems table
DELETE FROM systems
WHERE id = 'b1000000-0000-0000-0000-000000000008';

-- 4. Add US06C as a proper component
INSERT INTO components (id, manufacturer_id, sku, name, description, category, unit, sort_order)
VALUES (
  'c5000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'US06C',
  'Fascia / Edge Board — 138mm x 15mm',
  'Double-sided fascia board for finishing deck edges and picture framing. Face fix with CS screws. Available in Antique, Blackbutt, Ipe, Teak, Silver Grey. 5.4m lengths, pack of 30.',
  'Fascia',
  'lm',
  30
);

-- 5. Link it as a recommended component to all decking systems
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  -- Avenue Range US92
  ('b1000000-0000-0000-0000-000000000001', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'For finishing deck edges and picture frame borders', 30),
  -- Avenue Range US93
  ('b1000000-0000-0000-0000-000000000002', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'For finishing deck edges and picture frame borders', 30),
  -- Terrace Range US49C
  ('b1000000-0000-0000-0000-000000000003', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'For finishing deck edges and picture frame borders', 30),
  -- Terrace Range US63C
  ('b1000000-0000-0000-0000-000000000004', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'For finishing deck edges and picture frame borders', 30),
  -- Coastal Range US54C
  ('b1000000-0000-0000-0000-000000000005', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'For finishing deck edges and picture frame borders', 30),
  -- Coastal Range US142C
  ('b1000000-0000-0000-0000-000000000006', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'For finishing deck edges and picture frame borders', 30),
  -- Commercial Range US71H
  ('b1000000-0000-0000-0000-000000000007', 'c5000000-0000-0000-0000-000000000001', 'recommended', 'For finishing deck edges and picture frame borders', 30);
