-- ============================================================
-- Portal Contacts & ABN
-- Multiple contacts per supplier or manufacturer
-- ============================================================

-- Add ABN/ACN to suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS abn TEXT;

-- Add ABN/ACN and phone to manufacturers
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS abn   TEXT;
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS phone TEXT;

-- Flexible contacts table (owners, directors, managers, IT etc.)
CREATE TABLE IF NOT EXISTS portal_contacts (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT  NOT NULL CHECK (entity_type IN ('supplier', 'manufacturer')),
  entity_id   UUID  NOT NULL,
  name        TEXT  NOT NULL,
  role        TEXT,   -- e.g. "Owner", "Director", "Manager", "Finance", "IT"
  email       TEXT,
  phone       TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_contacts_entity_idx
  ON portal_contacts(entity_type, entity_id);

-- Public read so portals can display contacts
ALTER TABLE portal_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read portal contacts"
  ON portal_contacts FOR SELECT USING (true);
