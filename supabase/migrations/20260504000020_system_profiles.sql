-- ============================================================
-- System Profiles
-- Individual size/thickness variants within a product system.
-- Each profile has its own SKU, dimensions and standard length.
-- e.g. Duraplank 230mm (SKU: 4090011) and Duraplank 300mm (SKU: 4090012)
-- ============================================================

CREATE TABLE IF NOT EXISTS system_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id    UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name         TEXT,        -- e.g. "230mm Wide", "6mm / 2440×1200"
  product_code TEXT,        -- individual SKU / product code
  dimensions   TEXT,        -- e.g. "7.5mm × 230mm"
  length_m     NUMERIC,     -- standard length in metres e.g. 4.2
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS system_profiles_system_idx
  ON system_profiles(system_id);

ALTER TABLE system_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_system_profiles"
  ON system_profiles FOR SELECT USING (true);
