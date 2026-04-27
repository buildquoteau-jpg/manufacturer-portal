-- ============================================================
-- New Tech Wood — Seed Data
-- Run this AFTER the schema migration
-- Source: NewTechWood Product Brochure October 2025
-- ============================================================

-- ============================================================
-- MANUFACTURER
-- ============================================================
INSERT INTO manufacturers (id, name, slug, website_url, description)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'New Tech Wood',
  'new-tech-wood',
  'https://newtechwood.com.au',
  'Made from 95% recycled materials, New Tech Wood composite timber products are designed for residential and commercial decking, cladding, and screening applications across Australia.'
);

-- ============================================================
-- SYSTEMS — DECKING
-- ============================================================

-- Avenue Range US92
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Avenue Range',
  'US92',
  'avenue-range-us92',
  'Decking',
  'Avenue Range',
  'Engineered for strength and durability, capable of spanning up to 450mm. Fully capped (360°), perfect for long-lasting residential decking projects. No compromise on quality — premium features at excellent value.',
  '138mm x 29mm',
  4.88,
  false,
  10
);

-- Avenue Range US93
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Avenue Range',
  'US93',
  'avenue-range-us93',
  'Decking',
  'Avenue Range',
  'The most natural looking board on the market. Re-engineered with a commercial-grade, slip-resistant surface backing for enhanced safety and durability. Ideal for residential and high-traffic commercial environments.',
  '138mm x 29mm',
  4.88,
  false,
  11
);

-- Terrace Range US49C
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Terrace Range',
  'US49C',
  'terrace-range-us49c',
  'Decking',
  'Terrace Range',
  'Perfectly emulating a natural timber look. Double-sided board with commercial-grade, slip-resistant surface. Suitable for residential and commercial applications spanning up to 450mm.',
  '138mm x 25mm',
  5.4,
  true,
  20
);

-- Terrace Range US63C
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Terrace Range',
  'US63C',
  'terrace-range-us63c',
  'Decking',
  'Terrace Range',
  'Perfectly emulating a natural timber look. Double-sided composite decking board suitable for residential and commercial applications.',
  '138mm x 25mm',
  5.4,
  true,
  21
);

-- Coastal Range US54C
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Coastal Range',
  'US54C',
  'coastal-range-us54c',
  'Decking',
  'Coastal Range',
  '210mm wide board perfect for Hamptons Style and Coastal homes. Deep weathered look on one side and commercial-grade, slip-resistant surface on the reverse.',
  '210mm x 23mm',
  4.88,
  true,
  30
);

-- Coastal Range US142C
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Coastal Range',
  'US142C',
  'coastal-range-us142c',
  'Decking',
  'Coastal Range',
  'Hamptons style decking with deep weathered look on one side and slip-resistant surface on the reverse. Double-sided board for versatile installation.',
  '138mm x 23mm',
  4.88,
  true,
  31
);

-- Commercial Range US71H
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Commercial Range',
  'US71H',
  'commercial-range-us71h',
  'Decking',
  'Commercial Range',
  'Extra durability for commercial spaces. Single-sided board with hard capping. Boasts the highest P5 slip rating. Perfectly suited for high-traffic areas and public spaces. Spans up to 600mm.',
  '210mm x 36mm',
  2.7,
  false,
  40
);

-- Fascia US06C
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Fascia Board',
  'US06C',
  'fascia-us06c',
  'Decking',
  'Fascia',
  'Double-sided fascia board for finishing deck edges and screening applications. Face fix with CS screws. Suitable for vertical applications up to 800mm span.',
  '138mm x 15mm',
  5.4,
  true,
  50
);

-- ============================================================
-- SYSTEMS — CLADDING
-- ============================================================

-- Shadowline US31
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Shadowline Cladding',
  'US31',
  'shadowline-us31',
  'Cladding',
  'Shadowline Range',
  'Durable boards to transform indoor and outdoor living. Suitable for residential and commercial applications. Fully finished boards with concealed fixings. Finishing trims available in all colours. Now CodeMark® Certified.',
  '142mm x 13mm',
  4.88,
  false,
  60
);

-- Shou Sugi Ban US31EB
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Shou Sugi Ban Cladding',
  'US31EB',
  'shou-sugi-ban-us31eb',
  'Cladding',
  'Shadowline Range',
  'Japanese-inspired charred finish for luxury projects. Finish emulates the old Japanese technique Shou Sugi Ban. First composite Shou Sugi Ban board in Australia. Charred, high-end look for cladding projects. CodeMark® Certified.',
  '142mm x 13mm',
  4.88,
  false,
  61
);

-- Castellation 5-Rib UH61
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Castellation Cladding 5-Rib',
  'UH61',
  'castellation-uh61',
  'Cladding',
  'Castellation Range',
  'Five-rib (25mm rib) castellation cladding panel. Perfect for interior and exterior spaces, ceiling linings and more. Easy installation with concealed fixings. Colour matched end and corner trims available. CodeMark® Certified.',
  '196mm x 25mm',
  5.4,
  false,
  70
);

-- Castellation 3-Rib UH58
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Castellation Cladding 3-Rib',
  'UH58',
  'castellation-uh58',
  'Cladding',
  'Castellation Range',
  'Three-rib (50mm rib) castellation cladding panel. Seamlessly blends aesthetics with exceptional performance. Perfect for interior and exterior spaces, ceiling linings and more. Concealed fixings. CodeMark® Certified.',
  '196mm x 25mm',
  5.4,
  false,
  71
);

-- Castellation 3-Rib Charred UH58C
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Castellation Cladding 3-Rib Charred',
  'UH58C',
  'castellation-uh58c',
  'Cladding',
  'Castellation Range',
  'Three-rib castellation cladding panel in Ebony charred finish. Visually appealing addition to any project with a dramatic charred aesthetic. Concealed fixings. CodeMark® Certified.',
  '196mm x 25mm',
  5.4,
  false,
  72
);

-- Castellation 4-Rib UH93
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Castellation Cladding 4-Rib',
  'UH93',
  'castellation-uh93',
  'Cladding',
  'Castellation Range',
  'Four-rib (25mm–43mm rib) castellation cladding panel. Unique design combines popular rib widths into one versatile panel. Dynamic, two distinct rib sizes for truly bespoke designs. CodeMark® Certified.',
  '196mm x 25mm',
  5.4,
  false,
  73
);

-- ============================================================
-- SYSTEMS — SCREENING & FENCING
-- ============================================================

-- Screening UH55
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b3000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Screening & Fencing',
  'UH55',
  'screening-uh55',
  'Screening & Fencing',
  'Screening Range',
  'Fully finished hollow decorative screening boards. Versatile and modern solution for privacy screening, pool fencing, infill fencing, shades and sunscreens. No longer sacrificing style for privacy.',
  '56mm x 30mm',
  5.4,
  true,
  80
);

-- DIY Quick Panel UH122R
INSERT INTO systems (id, manufacturer_id, name, product_code, slug, category, subcategory, description, dimensions, length_m, double_sided, sort_order)
VALUES (
  'b3000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'DIY Quick Panel',
  'UH122R',
  'diy-quick-panel-uh122r',
  'Screening & Fencing',
  'DIY Quick Panel',
  'Specially designed with DIY users in mind, cost-effective and easy to install. Versatile application ideal for cladding, fencing and screening inside or outside. Light, easy to handle boards to cover any unsightly space up to 2.7m height.',
  '175mm x 22mm',
  2.7,
  false,
  81
);

-- ============================================================
-- SYSTEM COLOURS
-- ============================================================

-- Avenue Range US92: Antique, Teak, Walnut
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Antique', 1),
  ('b1000000-0000-0000-0000-000000000001', 'Teak', 2),
  ('b1000000-0000-0000-0000-000000000001', 'Walnut', 3);

-- Avenue Range US93: Blackbutt, Antique, Teak, Ipe, Silver Grey
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000002', 'Blackbutt', 1),
  ('b1000000-0000-0000-0000-000000000002', 'Antique', 2),
  ('b1000000-0000-0000-0000-000000000002', 'Teak', 3),
  ('b1000000-0000-0000-0000-000000000002', 'Ipe', 4),
  ('b1000000-0000-0000-0000-000000000002', 'Silver Grey', 5);

-- Terrace Range US49C: Blackbutt, Antique, Teak, Ipe, Silver Grey
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000003', 'Blackbutt', 1),
  ('b1000000-0000-0000-0000-000000000003', 'Antique', 2),
  ('b1000000-0000-0000-0000-000000000003', 'Teak', 3),
  ('b1000000-0000-0000-0000-000000000003', 'Ipe', 4),
  ('b1000000-0000-0000-0000-000000000003', 'Silver Grey', 5);

-- Terrace Range US63C: Blackbutt, Antique, Teak, Ipe, Silver Grey
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000004', 'Blackbutt', 1),
  ('b1000000-0000-0000-0000-000000000004', 'Antique', 2),
  ('b1000000-0000-0000-0000-000000000004', 'Teak', 3),
  ('b1000000-0000-0000-0000-000000000004', 'Ipe', 4),
  ('b1000000-0000-0000-0000-000000000004', 'Silver Grey', 5);

-- Coastal Range US54C: Beech, Antique, Teak, Aged Wood
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000005', 'Beech', 1),
  ('b1000000-0000-0000-0000-000000000005', 'Antique', 2),
  ('b1000000-0000-0000-0000-000000000005', 'Teak', 3),
  ('b1000000-0000-0000-0000-000000000005', 'Aged Wood', 4);

-- Coastal Range US142C: Beech, Antique, Teak, Aged Wood
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000006', 'Beech', 1),
  ('b1000000-0000-0000-0000-000000000006', 'Antique', 2),
  ('b1000000-0000-0000-0000-000000000006', 'Teak', 3),
  ('b1000000-0000-0000-0000-000000000006', 'Aged Wood', 4);

-- Commercial Range US71H: Blackbutt, Antique, Ipe
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000007', 'Blackbutt', 1),
  ('b1000000-0000-0000-0000-000000000007', 'Antique', 2),
  ('b1000000-0000-0000-0000-000000000007', 'Ipe', 3);

-- Fascia US06C: Antique, Blackbutt, Ipe, Teak, Silver Grey
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000008', 'Antique', 1),
  ('b1000000-0000-0000-0000-000000000008', 'Blackbutt', 2),
  ('b1000000-0000-0000-0000-000000000008', 'Ipe', 3),
  ('b1000000-0000-0000-0000-000000000008', 'Teak', 4),
  ('b1000000-0000-0000-0000-000000000008', 'Silver Grey', 5);

-- Shadowline US31: Sea Salt, Blackbutt, Teak, Ipe
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'Sea Salt', 1),
  ('b2000000-0000-0000-0000-000000000001', 'Blackbutt', 2),
  ('b2000000-0000-0000-0000-000000000001', 'Teak', 3),
  ('b2000000-0000-0000-0000-000000000001', 'Ipe', 4);

-- Shou Sugi Ban US31EB: Ebony
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000002', 'Ebony', 1);

-- Castellation 5-Rib UH61: Canadian Cedar, Ipe, Ebony
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000003', 'Canadian Cedar', 1),
  ('b2000000-0000-0000-0000-000000000003', 'Ipe', 2),
  ('b2000000-0000-0000-0000-000000000003', 'Ebony', 3);

-- Castellation 3-Rib UH58: Aged Wood, Blackbutt, Teak
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000004', 'Aged Wood', 1),
  ('b2000000-0000-0000-0000-000000000004', 'Blackbutt', 2),
  ('b2000000-0000-0000-0000-000000000004', 'Teak', 3);

-- Castellation 3-Rib Charred UH58C: Ebony (Charred)
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000005', 'Ebony (Charred)', 1);

-- Castellation 4-Rib UH93: Sea Salt, Blackbutt, Teak
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000006', 'Sea Salt', 1),
  ('b2000000-0000-0000-0000-000000000006', 'Blackbutt', 2),
  ('b2000000-0000-0000-0000-000000000006', 'Teak', 3);

-- Screening UH55: Canadian Cedar, Ebony, Ipe
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b3000000-0000-0000-0000-000000000001', 'Canadian Cedar', 1),
  ('b3000000-0000-0000-0000-000000000001', 'Ebony', 2),
  ('b3000000-0000-0000-0000-000000000001', 'Ipe', 3);

-- DIY Quick Panel UH122R: Silver Grey, Sea Salt, Blackbutt, Ipe
INSERT INTO system_colours (system_id, colour_name, sort_order) VALUES
  ('b3000000-0000-0000-0000-000000000002', 'Silver Grey', 1),
  ('b3000000-0000-0000-0000-000000000002', 'Sea Salt', 2),
  ('b3000000-0000-0000-0000-000000000002', 'Blackbutt', 3),
  ('b3000000-0000-0000-0000-000000000002', 'Ipe', 4);

-- ============================================================
-- COMPONENTS — DECKING FIXINGS
-- Source: NTW Brochure Decking Fixings table
-- ============================================================
INSERT INTO components (id, manufacturer_id, sku, name, description, category, unit, sort_order) VALUES

  -- Clips
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'TC28T', 'TC28 Timber Fix Decking Clip',
   'Timber frame fixing clip for Avenue, Terrace and Coastal decking. 5.5mm gap. Packs of 75, 225 or 1000.',
   'Clips', 'pack', 10),

  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   'COBRA-M', 'Cobra M-Clip (Metal Fix)',
   'Metal frame fixing clip for Avenue, Terrace and Coastal decking. 5.5mm gap. Packs of 75 or 250.',
   'Clips', 'pack', 11),

  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
   'MG3', 'MG3 Starter Clip',
   'Starter clip for first board on timber or metal frame. Packs of 25 or 250.',
   'Clips', 'pack', 12),

  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001',
   'K37', 'K37 Start / End Clip',
   'Start and end clip for first and last board. Packs of 25 or 250.',
   'Clips', 'pack', 13),

  ('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001',
   'MG10-MBK-FS-75', 'NTW 3mm Clip & Screw — Timber Fix',
   '3mm fixing clip and timber fix screw (8G x 30mm). Timber frame. Pack of 75.',
   'Clips', 'pack', 14),

  ('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001',
   'MG10-LBK-FS-75', 'NTW 3mm Locking Clip & Screw — Timber Fix',
   '3mm locking clip and timber fix screw (8G x 30mm). Refer to install guide for correct positioning. Pack of 75.',
   'Clips', 'pack', 15),

  ('c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001',
   'MG10-MBK-KJ-75', 'NTW 3mm Clip & Screw — Metal Fix',
   '3mm fixing clip and metal fix screw (10G x 25mm). Steel frame. Pack of 75.',
   'Clips', 'pack', 16),

  ('c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001',
   'MG10-LBK-KJ-75', 'NTW 3mm Locking Clip & Screw — Metal Fix',
   '3mm locking clip and metal fix screw (10G x 25mm). Refer to install guide for correct positioning. Pack of 75.',
   'Clips', 'pack', 17),

  -- Screws
  ('c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001',
   'CS', 'CS Fascia / Screening Screw — 8G x 50mm',
   'Face fixing screw for fascia boards, screening and 15–17mm boards. Timber frame. Pack of 100.',
   'Screws', 'pack', 20),

  ('c1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001',
   'CDS', 'CDS Decking / Fascia Screw — 10G x 65mm',
   'Face fixing screw for 23mm, 25mm and 29mm picture frame and breaker boards. Timber or metal frame. Packs of 100 or 400.',
   'Screws', 'pack', 21),

  ('c1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000001',
   'CSM', 'CSM Decking / Fascia Screw — 12G x 45mm',
   'Face fixing screw for 23mm, 25mm and 29mm boards. Metal frame only. Pack of 100.',
   'Screws', 'pack', 22);

-- ============================================================
-- COMPONENTS — CLADDING FIXINGS
-- Source: NTW Brochure Cladding Fixings table
-- ============================================================
INSERT INTO components (id, manufacturer_id, sku, name, description, category, unit, sort_order) VALUES

  ('c2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'AW08', 'AW08 Wall Cladding Clip',
   '1 clip per batten. Fixing screws not supplied. Suits US31, US31EB, UH61, UH58, UH93. Packs of 50 or 250.',
   'Clips', 'pack', 10),

  ('c2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   'AW02', 'AW02 Aluminium Starter Profile — 3m',
   'Used to align and install the first cladding board. 3m length.',
   'Starter Profile', 'each', 11),

  ('c2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
   'WJ63', 'WJ63 Stainless Steel Locking Screw — 4G x 12mm',
   '1 screw per board length for locking down cladding board to control expansion and contraction. Refer to install guide for correct placement. Pack of 100.',
   'Screws', 'pack', 12),

  ('c2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001',
   'T7', 'T7 Rubber Stand-Off Spacer',
   'Installed on each batten behind the last cladding board as a stand-off. Packs of 50 or 250.',
   'Spacers', 'pack', 13);

-- ============================================================
-- COMPONENTS — CASTELLATION TRIMS
-- Suits UH61, UH58, UH58C, UH93
-- ============================================================
INSERT INTO components (id, manufacturer_id, sku, name, description, category, unit, sort_order) VALUES

  ('c3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'CA63AA44ZX', 'End Trim Kit — Castellation (Base & Cover)',
   'Mill finish base and cover kit for UH61, UH58 and UH93. CA63: 51mm w x 58mm h / AA44: 47.5mm w x 21mm h. 3m length, pack of 5.',
   'Trims', 'pack', 10),

  ('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   'CA50AA6IZX', 'Inside Corner Trim Kit — Castellation (Base & Cover)',
   'Mill finish inside corner kit for UH61, UH58 and UH93. CA50: 68mm w x 45mm h / AA61: 57.5mm w x 57.5mm h. 3m length, pack of 5.',
   'Trims', 'pack', 11),

  ('c3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
   'CA51AA62ZX', 'Outside Corner Trim Kit — Castellation (Base & Cover)',
   'Mill finish outside corner kit for UH61, UH58 and UH93. CA51: 65mm w x 65mm h / AA62: 51mm w x 55mm h. 3m length, pack of 5.',
   'Trims', 'pack', 12),

  ('c3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001',
   'CA49AA6OZX', 'Butt Joint Trim Kit — Castellation (Base & Cover)',
   'Mill finish butt joint kit for UH61, UH58 and UH93. CA49: 56mm w x 16mm h / AA60: 34mm w x 33mm h. 3m length, pack of 5.',
   'Trims', 'pack', 13),

  ('c3000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001',
   'CA43', 'J Trim Perforated — Castellation',
   'Perforated J trim for UH61, UH58 and UH93. 37.5mm w x 40.5mm h. 3m length, pack of 10.',
   'Trims', 'pack', 14),

  ('c3000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001',
   'CA43B', 'J Trim Non-Perforated — Castellation',
   'Non-perforated J trim for UH61, UH58 and UH93. 37.5mm w x 40.5mm h. 3m length, pack of 10.',
   'Trims', 'pack', 15),

  ('c3000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001',
   'CA41', 'Window Flashing — Cladding',
   'Window flashing for US31, UH61, UH58 and UH93. 81.5mm w x 81.5mm h. 3m length, pack of 10.',
   'Trims', 'pack', 16);

-- ============================================================
-- COMPONENTS — SHADOWLINE TRIMS
-- Suits US31 and US31EB
-- ============================================================
INSERT INTO components (id, manufacturer_id, sku, name, description, category, unit, sort_order) VALUES

  ('c4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'CA48AA44ZX', 'End Trim Kit — Shadowline (Base & Cover)',
   'Mill finish end trim kit for US31. CA48: 51mm w x 46mm h / AA44: 47.5mm w x 21mm h. 3m length, pack of 5.',
   'Trims', 'pack', 10),

  ('c4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   'CA50AA46ZX', 'Inside Corner Trim Kit — Shadowline (Base & Cover)',
   'Mill finish inside corner kit for US31. CA50: 68mm w x 45mm h / AA46: 48mm w x 48mm h. 3m length, pack of 5.',
   'Trims', 'pack', 11),

  ('c4000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
   'CA51AA47ZX', 'Outside Corner Trim Kit — Shadowline (Base & Cover)',
   'Mill finish outside corner kit for US31. CA51: 65mm w x 65mm h / AA47: 52.5mm w x 38mm h. 3m length, pack of 5.',
   'Trims', 'pack', 12),

  ('c4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001',
   'CA49AA45ZX', 'Butt Joint Trim Kit — Shadowline (Base & Cover)',
   'Mill finish butt joint kit for US31. CA49: 56mm w x 16mm h / AA45: 34mm w x 21mm h. 3m length, pack of 5.',
   'Trims', 'pack', 13),

  ('c4000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001',
   'CA42', 'J Trim Perforated — Shadowline',
   'Perforated J trim for US31. 25.5mm w x 40.5mm h. 3m length, pack of 10.',
   'Trims', 'pack', 14),

  ('c4000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001',
   'CA42B', 'J Trim Non-Perforated — Shadowline',
   'Non-perforated J trim for US31. 25.5mm w x 40.5mm h. 3m length, pack of 10.',
   'Trims', 'pack', 15);

-- ============================================================
-- SYSTEM COMPONENTS — DECKING
-- Link each decking system to its required fixings
-- ============================================================

-- Avenue Range US92 fixings
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'required', 'TC28 clip — 1 per joist, timber frame', 10),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'required', 'Cobra M-Clip — 1 per joist, metal frame', 11),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'required', 'MG3 Starter Clip — 1 per joist on first board', 12),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'required', 'K37 End Clip — 1 per joist on first and last board', 13),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000010', 'recommended', 'CDS screw — for picture frame and breaker boards', 14),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'recommended', 'MG10 3mm timber fix clip — alternative fixing option', 15),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'recommended', 'MG10 3mm locking clip timber fix — see install guide for placement', 16);

-- Avenue Range US93 fixings
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'required', 'TC28 clip — 1 per joist, timber frame', 10),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'required', 'Cobra M-Clip — 1 per joist, metal frame', 11),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'required', 'MG3 Starter Clip — 1 per joist on first board', 12),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000004', 'required', 'K37 End Clip — 1 per joist on first and last board', 13),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000010', 'recommended', 'CDS screw — for picture frame and breaker boards', 14);

-- Terrace Range US49C fixings
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'required', 'TC28 clip — 1 per joist, timber frame', 10),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'required', 'Cobra M-Clip — 1 per joist, metal frame', 11),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'required', 'MG3 Starter Clip — 1 per joist on first board', 12),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 'required', 'K37 End Clip — 1 per joist on first and last board', 13),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000010', 'recommended', 'CDS screw — for picture frame and breaker boards', 14),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000011', 'recommended', 'CSM screw — for picture frame and breaker boards (metal frame)', 15);

-- Terrace Range US63C fixings (same as US49C)
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'required', 'TC28 clip — 1 per joist, timber frame', 10),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'required', 'Cobra M-Clip — 1 per joist, metal frame', 11),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 'required', 'MG3 Starter Clip — 1 per joist on first board', 12),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'required', 'K37 End Clip — 1 per joist on first and last board', 13),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000010', 'recommended', 'CDS screw — for picture frame and breaker boards', 14);

-- Coastal Range US54C fixings
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'required', 'TC28 clip — 1 per joist, timber frame', 10),
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'required', 'Cobra M-Clip — 1 per joist, metal frame', 11),
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000003', 'required', 'MG3 Starter Clip — 1 per joist on first board', 12),
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000010', 'recommended', 'CDS screw — for picture frame and breaker boards', 14);

-- Coastal Range US142C fixings
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001', 'required', 'TC28 clip — 1 per joist, timber frame', 10),
  ('b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'required', 'Cobra M-Clip — 1 per joist, metal frame', 11),
  ('b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003', 'required', 'MG3 Starter Clip — 1 per joist on first board', 12),
  ('b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000010', 'recommended', 'CDS screw — for picture frame and breaker boards', 14);

-- Commercial Range US71H fixings
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002', 'required', 'Cobra M-Clip — 1 per joist, metal frame', 10),
  ('b1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000003', 'required', 'MG3 Starter Clip', 11),
  ('b1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000010', 'recommended', 'CDS screw — for picture frame boards', 12);

-- Fascia US06C fixings
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000009', 'required', 'CS Fascia Screw 8G x 50mm — face fix only, timber frame', 10);

-- ============================================================
-- SYSTEM COMPONENTS — CLADDING
-- ============================================================

-- Shadowline US31 — cladding fixings + trims
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 'required', 'AW08 Wall Cladding Clip — 1 per batten. Fixing screws not supplied.', 10),
  ('b2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000002', 'required', 'Aluminium Starter Profile — aligns first board', 11),
  ('b2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000003', 'required', 'WJ63 Locking Screw — 1 per board length to control expansion', 12),
  ('b2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000004', 'required', 'T7 Rubber Stand-Off Spacer — 1 per batten behind last board', 13),
  ('b2000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-000000000001', 'recommended', 'End Trim Kit — available in all colours', 20),
  ('b2000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-000000000002', 'recommended', 'Inside Corner Trim Kit — available in all colours', 21),
  ('b2000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-000000000003', 'recommended', 'Outside Corner Trim Kit — available in all colours', 22),
  ('b2000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-000000000004', 'recommended', 'Butt Joint Trim Kit — available in all colours', 23),
  ('b2000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-000000000005', 'recommended', 'J Trim Perforated', 24),
  ('b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000007', 'recommended', 'Window Flashing', 25);

-- Shou Sugi Ban US31EB — same fixings as US31
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000001', 'required', 'AW08 Wall Cladding Clip — 1 per batten', 10),
  ('b2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'required', 'Aluminium Starter Profile — aligns first board', 11),
  ('b2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000003', 'required', 'WJ63 Locking Screw — 1 per board length', 12),
  ('b2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000004', 'required', 'T7 Rubber Stand-Off Spacer', 13),
  ('b2000000-0000-0000-0000-000000000002', 'c4000000-0000-0000-0000-000000000001', 'recommended', 'End Trim Kit — available in all colours', 20),
  ('b2000000-0000-0000-0000-000000000002', 'c4000000-0000-0000-0000-000000000002', 'recommended', 'Inside Corner Trim Kit', 21),
  ('b2000000-0000-0000-0000-000000000002', 'c4000000-0000-0000-0000-000000000003', 'recommended', 'Outside Corner Trim Kit', 22);

-- Castellation UH61 — cladding fixings + castellation trims
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000001', 'required', 'AW08 Wall Cladding Clip — 1 per batten', 10),
  ('b2000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000002', 'required', 'Aluminium Starter Profile', 11),
  ('b2000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000003', 'required', 'WJ63 Locking Screw — 1 per board length', 12),
  ('b2000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000004', 'required', 'T7 Rubber Stand-Off Spacer', 13),
  ('b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000001', 'recommended', 'End Trim Kit — mill finish, available by colour', 20),
  ('b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000002', 'recommended', 'Inside Corner Trim Kit', 21),
  ('b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000003', 'recommended', 'Outside Corner Trim Kit', 22),
  ('b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000004', 'recommended', 'Butt Joint Trim Kit', 23),
  ('b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000005', 'recommended', 'J Trim Perforated', 24),
  ('b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000007', 'recommended', 'Window Flashing', 25);

-- Castellation UH58 — same fixings as UH61
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000001', 'required', 'AW08 Wall Cladding Clip — 1 per batten', 10),
  ('b2000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000002', 'required', 'Aluminium Starter Profile', 11),
  ('b2000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000003', 'required', 'WJ63 Locking Screw', 12),
  ('b2000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000004', 'required', 'T7 Rubber Stand-Off Spacer', 13),
  ('b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000001', 'recommended', 'End Trim Kit', 20),
  ('b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000002', 'recommended', 'Inside Corner Trim Kit', 21),
  ('b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003', 'recommended', 'Outside Corner Trim Kit', 22),
  ('b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000004', 'recommended', 'Butt Joint Trim Kit', 23),
  ('b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000007', 'recommended', 'Window Flashing', 25);

-- Castellation UH58C — same fixings as UH58
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000001', 'required', 'AW08 Wall Cladding Clip — 1 per batten', 10),
  ('b2000000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000002', 'required', 'Aluminium Starter Profile', 11),
  ('b2000000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000003', 'required', 'WJ63 Locking Screw', 12),
  ('b2000000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000004', 'required', 'T7 Rubber Stand-Off Spacer', 13),
  ('b2000000-0000-0000-0000-000000000005', 'c3000000-0000-0000-0000-000000000001', 'recommended', 'End Trim Kit', 20),
  ('b2000000-0000-0000-0000-000000000005', 'c3000000-0000-0000-0000-000000000002', 'recommended', 'Inside Corner Trim Kit', 21),
  ('b2000000-0000-0000-0000-000000000005', 'c3000000-0000-0000-0000-000000000003', 'recommended', 'Outside Corner Trim Kit', 22);

-- Castellation UH93 — same fixings as UH61
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b2000000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000001', 'required', 'AW08 Wall Cladding Clip — 1 per batten', 10),
  ('b2000000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000002', 'required', 'Aluminium Starter Profile', 11),
  ('b2000000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000003', 'required', 'WJ63 Locking Screw', 12),
  ('b2000000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000004', 'required', 'T7 Rubber Stand-Off Spacer', 13),
  ('b2000000-0000-0000-0000-000000000006', 'c3000000-0000-0000-0000-000000000001', 'recommended', 'End Trim Kit', 20),
  ('b2000000-0000-0000-0000-000000000006', 'c3000000-0000-0000-0000-000000000002', 'recommended', 'Inside Corner Trim Kit', 21),
  ('b2000000-0000-0000-0000-000000000006', 'c3000000-0000-0000-0000-000000000003', 'recommended', 'Outside Corner Trim Kit', 22),
  ('b2000000-0000-0000-0000-000000000006', 'c3000000-0000-0000-0000-000000000004', 'recommended', 'Butt Joint Trim Kit', 23),
  ('b2000000-0000-0000-0000-000000000006', 'c3000000-0000-0000-0000-000000000007', 'recommended', 'Window Flashing', 25);

-- Screening UH55 — screw fix only
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b3000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000009', 'required', 'CS Screw 8G x 50mm — face fix', 10);

-- DIY Quick Panel UH122R — screw fix only
INSERT INTO system_components (system_id, component_id, role, notes, sort_order) VALUES
  ('b3000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000009', 'required', 'CS Screw 8G x 50mm — face fix', 10);

-- ============================================================
-- SAMPLE SUPPLIER (for testing the widget)
-- ============================================================
INSERT INTO suppliers (id, name, slug, website_url, suburb, state)
VALUES (
  'd1000000-0000-0000-0000-000000000001',
  'Sample Timber & Hardware',
  'sample-timber-hardware',
  'https://example.com',
  'Brisbane',
  'QLD'
);

-- Sample supplier stocks Terrace US49C, Shadowline US31, and Castellation UH61
INSERT INTO supplier_systems (supplier_id, system_id) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003'),
  ('d1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000003');

-- Sample widget for that supplier
INSERT INTO embed_widgets (id, supplier_id, name, public_token, status)
VALUES (
  'e1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'New Tech Wood Widget',
  'demo-token-sample-timber-hardware',
  'active'
);

-- The 3 profiles shown in that widget
INSERT INTO embed_widget_systems (embed_widget_id, system_id, sort_order) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 1),
  ('e1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 2),
  ('e1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000003', 3);
