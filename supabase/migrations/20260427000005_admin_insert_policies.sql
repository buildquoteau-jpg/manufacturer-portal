-- ============================================================
-- Allow the admin page to create suppliers and embed widgets
-- (No authentication yet — policies open up INSERT for now)
-- ============================================================

CREATE POLICY "public_insert_suppliers"
  ON suppliers FOR INSERT WITH CHECK (true);

CREATE POLICY "public_insert_embed_widgets"
  ON embed_widgets FOR INSERT WITH CHECK (true);

CREATE POLICY "public_insert_embed_widget_systems"
  ON embed_widget_systems FOR INSERT WITH CHECK (true);
