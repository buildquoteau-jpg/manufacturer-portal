-- ============================================================
-- System Verification
-- Allows manufacturers to verify their system card data
-- ============================================================

ALTER TABLE systems
  ADD COLUMN IF NOT EXISTS verified_by   TEXT,
  ADD COLUMN IF NOT EXISTS verified_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS change_notes  TEXT;

-- Also ensure source_label / source_url exist (used by public-facing manufacturers page)
ALTER TABLE systems
  ADD COLUMN IF NOT EXISTS source_label TEXT,
  ADD COLUMN IF NOT EXISTS source_url   TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT;

-- ============================================================
-- After running:
-- Manufacturers can now mark systems as verified via their portal.
-- verified_by   = name of person who verified (free text)
-- verified_at   = timestamp of verification
-- change_notes  = optional notes about what data needs updating
-- ============================================================
