-- ============================================================
-- RFQ Drafts table + rfq_draft_items fixes
--
-- Fixes the cross-repo 403/empty-items bug where:
-- 1. rfq_drafts table didn't exist in the shared Supabase,
--    so manufacturer portal "Add to RFQ" silently failed.
-- 2. rfq_draft_items.draft_id was defined as TEXT in the
--    manufacturer portal schema but as UUID FK in buildquote,
--    causing a schema mismatch.
-- ============================================================

-- 1. Create rfq_drafts if it doesn't already exist
CREATE TABLE IF NOT EXISTS rfq_drafts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  status     TEXT        DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rfq_drafts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rfq_drafts' AND policyname = 'public_insert_rfq_drafts'
  ) THEN
    CREATE POLICY "public_insert_rfq_drafts" ON rfq_drafts FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rfq_drafts' AND policyname = 'public_read_rfq_drafts'
  ) THEN
    CREATE POLICY "public_read_rfq_drafts" ON rfq_drafts FOR SELECT USING (true);
  END IF;
END $$;

-- 2. Add manufacturer/system columns to rfq_draft_items if missing
--    (buildquote's schema included these; manufacturer portal's didn't)
ALTER TABLE rfq_draft_items
  ADD COLUMN IF NOT EXISTS manufacturer TEXT,
  ADD COLUMN IF NOT EXISTS system       TEXT;

-- 3. Ensure qty is NUMERIC (buildquote uses fractional quantities)
--    Only runs if the column is still INTEGER
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rfq_draft_items'
      AND column_name = 'qty'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE rfq_draft_items ALTER COLUMN qty TYPE NUMERIC;
  END IF;
END $$;

-- 4. Add index on draft_id for fast lookups (safe to run twice)
CREATE INDEX IF NOT EXISTS rfq_draft_items_draft_idx ON rfq_draft_items(draft_id);
