-- ============================================================
-- Add supplier portal and contact fields
-- ============================================================
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS address       TEXT,
  ADD COLUMN IF NOT EXISTS manager_name  TEXT,
  ADD COLUMN IF NOT EXISTS it_name       TEXT,
  ADD COLUMN IF NOT EXISTS it_email      TEXT,
  ADD COLUMN IF NOT EXISTS portal_password TEXT;

-- Allow suppliers to update their own record (needed for portal)
CREATE POLICY "public_update_suppliers"
  ON suppliers FOR UPDATE USING (true);
