-- ============================================================
-- Catalogue Sources
-- Tracks which documents product data was extracted from
-- ============================================================

CREATE TABLE IF NOT EXISTS catalogue_sources (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID        NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  document_name   TEXT        NOT NULL,
  document_url    TEXT,                      -- link to PDF on manufacturer's site
  document_date   TEXT,                      -- e.g. "December 2025" or "2025-12"
  extracted_at    TIMESTAMPTZ DEFAULT now(), -- when we ran the extraction
  extracted_by    TEXT,                      -- e.g. "Claude extract-catalogue skill"
  notes           TEXT,                      -- e.g. "pages 12–34 used for decking systems"
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalogue_sources_manufacturer_idx
  ON catalogue_sources(manufacturer_id);

-- Allow anonymous reads so supplier/manufacturer portals can display sources
ALTER TABLE catalogue_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read catalogue sources"
  ON catalogue_sources FOR SELECT
  USING (true);

-- ── Link systems to their source document ───────────────────
ALTER TABLE systems
  ADD COLUMN IF NOT EXISTS source_document_id UUID
  REFERENCES catalogue_sources(id) ON DELETE SET NULL;

-- ============================================================
-- After running this migration, when you extract a catalogue:
-- 1. INSERT a row into catalogue_sources for that document
-- 2. Note the returned id
-- 3. UPDATE systems SET source_document_id = '<that id>'
--    WHERE manufacturer_id = '<manufacturer id>'
--    AND created_at >= '<extraction timestamp>'
--
-- The extract-catalogue skill will handle this automatically.
-- ============================================================
