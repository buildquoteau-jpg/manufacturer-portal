-- ============================================================
-- View: products_by_manufacturer
-- A read-friendly summary of all products grouped by brand.
-- Use this in the Supabase Table Editor to review catalogue data.
-- ============================================================

CREATE OR REPLACE VIEW products_by_manufacturer AS
SELECT
  m.name                                        AS manufacturer,
  s.category,
  s.subcategory,
  s.product_code,
  s.name                                        AS product_name,
  s.dimensions,
  s.length_m,
  s.double_sided,
  COUNT(DISTINCT sc.id)                         AS colour_count,
  STRING_AGG(DISTINCT sc.colour_name, ', ' ORDER BY sc.colour_name) AS colours,
  COUNT(DISTINCT scomp.component_id)            AS component_count,
  s.description,
  s.notes,
  s.sort_order,
  s.id                                          AS system_id,
  m.id                                          AS manufacturer_id
FROM systems s
JOIN manufacturers m       ON m.id = s.manufacturer_id
LEFT JOIN system_colours sc    ON sc.system_id = s.id
LEFT JOIN system_components scomp ON scomp.system_id = s.id
GROUP BY
  m.id, m.name,
  s.id, s.category, s.subcategory, s.product_code, s.name,
  s.dimensions, s.length_m, s.double_sided,
  s.description, s.notes, s.sort_order
ORDER BY
  m.name,
  CASE s.category
    WHEN 'Decking'             THEN 1
    WHEN 'Cladding'            THEN 2
    WHEN 'Screening & Fencing' THEN 3
    ELSE 4
  END,
  s.sort_order;
