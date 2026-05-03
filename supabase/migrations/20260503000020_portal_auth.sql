-- ============================================================
-- Portal Auth Migration
-- Links Supabase Auth users to suppliers and manufacturers
-- Run in Supabase SQL Editor
-- ============================================================

-- Add auth_user_id to suppliers
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS suppliers_auth_user_id_idx ON suppliers(auth_user_id);

-- Add auth_user_id to manufacturers
ALTER TABLE manufacturers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS manufacturers_auth_user_id_idx ON manufacturers(auth_user_id);

-- ============================================================
-- After adding an auth user in Supabase Dashboard or via admin,
-- link them to a supplier like this:
--
--   UPDATE suppliers
--   SET auth_user_id = '<uuid from auth.users>'
--   WHERE slug = 'main-timber';
--
-- And for a manufacturer:
--
--   UPDATE manufacturers
--   SET auth_user_id = '<uuid from auth.users>'
--   WHERE slug = 'new-tech-wood';
-- ============================================================

-- Optional: RLS policies so suppliers can only read their own row
-- (only needed if you want to use RLS for portal data access)
--
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Supplier can read own row"
--   ON suppliers FOR SELECT
--   USING (auth_user_id = auth.uid());
