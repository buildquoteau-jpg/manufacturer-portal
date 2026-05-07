-- ============================================================
-- BuildQuote — Complete Live Supabase Schema
-- Project: oxvhmulxuvlfjyjzleki.supabase.co
-- Shared by: manufacturer-portal (mfp.buildquote.com.au)
--            build-quote-v6     (buildquote.com.au)
--
-- Last verified: 2026-05-07 from Supabase SQL Editor exports
-- Source CSVs:   supabase/snapshots/2026-05-07/
--
-- Tables in this file but NOT yet in /migrations:
--   community_signups, rfq_items, rfq_requests
--   + extra columns on systems, system_colours, system_profiles
-- ============================================================


-- ============================================================
-- MANUFACTURERS
-- ============================================================
CREATE TABLE IF NOT EXISTS manufacturers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  slug           TEXT        UNIQUE NOT NULL,
  logo_url       TEXT,
  hero_image_url TEXT,
  website_url    TEXT,
  description    TEXT,
  abn            TEXT,
  phone          TEXT,
  auth_user_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_manufacturers" ON manufacturers FOR SELECT USING (true);


-- ============================================================
-- SYSTEMS
-- Extra live columns not yet in migrations:
--   sheet_format, fire_rating, acoustic_rating,
--   moisture_resistant, structural_grade,
--   install_guide_url, tech_data_url
-- ============================================================
CREATE TABLE IF NOT EXISTS systems (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id     UUID        NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  product_code        TEXT        NOT NULL,
  slug                TEXT        NOT NULL,
  category            TEXT        NOT NULL,
  subcategory         TEXT,
  description         TEXT,
  dimensions          TEXT,
  length_m            NUMERIC,
  double_sided        BOOLEAN     DEFAULT false,
  hero_image_url      TEXT,
  website_url         TEXT,
  source_label        TEXT,
  source_url          TEXT,
  source_document_id  UUID        REFERENCES catalogue_sources(id) ON DELETE SET NULL,
  verification_status TEXT,
  verified_by         TEXT,
  verified_at         TIMESTAMPTZ,
  change_notes        TEXT,
  notes               TEXT,
  -- Sheet / board product fields (Etex BGC etc.)
  sheet_format        TEXT,       -- e.g. "2440×1200", "3000×1200"
  fire_rating         TEXT,       -- e.g. "BAL-40", "FRL -/60/60"
  acoustic_rating     TEXT,
  moisture_resistant  BOOLEAN     DEFAULT false,
  structural_grade    TEXT,
  install_guide_url   TEXT,
  tech_data_url       TEXT,
  sort_order          INTEGER     DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(manufacturer_id, product_code)
);

ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_systems" ON systems FOR SELECT USING (true);
-- Note: duplicate "public read" policy also exists in live DB (created earlier)


-- ============================================================
-- SYSTEM COLOURS
-- Extra live column: sku (colour-specific SKU)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_colours (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id   UUID    NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  colour_name TEXT    NOT NULL,
  image_url   TEXT,
  sku         TEXT,
  is_stocked  BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  UNIQUE(system_id, colour_name)
);

ALTER TABLE system_colours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_system_colours" ON system_colours FOR SELECT USING (true);


-- ============================================================
-- COMPONENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS components (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID    REFERENCES manufacturers(id),
  sku             TEXT,
  name            TEXT    NOT NULL,
  description     TEXT,
  category        TEXT,
  unit            TEXT,
  sort_order      INTEGER DEFAULT 0
);

ALTER TABLE components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_components" ON components FOR SELECT USING (true);
CREATE POLICY "service_role full access" ON components FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- SYSTEM COMPONENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS system_components (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id    UUID    NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  component_id UUID    NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  role         TEXT    DEFAULT 'required',
  notes        TEXT,
  sort_order   INTEGER DEFAULT 0,
  UNIQUE(system_id, component_id)
);

ALTER TABLE system_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_system_components" ON system_components FOR SELECT USING (true);
CREATE POLICY "service_role full access" ON system_components FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- SYSTEM PROFILES
-- Individual size/SKU variants within a product system
-- Extra live column: sheet_format
-- ============================================================
CREATE TABLE IF NOT EXISTS system_profiles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id    UUID        NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name         TEXT,
  product_code TEXT,
  dimensions   TEXT,
  length_m     NUMERIC,
  sheet_format TEXT,       -- e.g. "2440×1200" for sheet products
  sort_order   INTEGER     DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS system_profiles_system_idx ON system_profiles(system_id);

ALTER TABLE system_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_system_profiles" ON system_profiles FOR SELECT USING (true);


-- ============================================================
-- CATALOGUE SOURCES
-- Tracks which PDFs product data was extracted from
-- ============================================================
CREATE TABLE IF NOT EXISTS catalogue_sources (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID        NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  document_name   TEXT        NOT NULL,
  document_url    TEXT,
  document_date   TEXT,
  extracted_at    TIMESTAMPTZ DEFAULT now(),
  extracted_by    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalogue_sources_manufacturer_idx ON catalogue_sources(manufacturer_id);

ALTER TABLE catalogue_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read catalogue sources" ON catalogue_sources FOR SELECT USING (true);


-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  slug            TEXT        UNIQUE NOT NULL,
  website_url     TEXT,
  email           TEXT,
  phone           TEXT,
  suburb          TEXT,
  state           TEXT,
  address         TEXT,
  abn             TEXT,
  manager_name    TEXT,
  it_name         TEXT,
  it_email        TEXT,
  portal_password TEXT,
  auth_user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_suppliers"   ON suppliers FOR SELECT USING (true);
CREATE POLICY "public_insert_suppliers" ON suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_suppliers" ON suppliers FOR UPDATE USING (true);


-- ============================================================
-- SUPPLIER SYSTEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_systems (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  system_id   UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  UNIQUE(supplier_id, system_id)
);

ALTER TABLE supplier_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_supplier_systems" ON supplier_systems FOR SELECT USING (true);


-- ============================================================
-- EMBED WIDGETS
-- supplier_id nullable — manufacturer demo widgets have no supplier
-- ============================================================
CREATE TABLE IF NOT EXISTS embed_widgets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     UUID        REFERENCES suppliers(id) ON DELETE CASCADE,
  manufacturer_id UUID        REFERENCES manufacturers(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL DEFAULT 'My Widget',
  public_token    TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status          TEXT        DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE embed_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_embed_widgets"          ON embed_widgets FOR SELECT USING (true);
CREATE POLICY "public_insert_embed_widgets"        ON embed_widgets FOR INSERT WITH CHECK (true);


-- ============================================================
-- EMBED WIDGET SYSTEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS embed_widget_systems (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  embed_widget_id UUID    NOT NULL REFERENCES embed_widgets(id) ON DELETE CASCADE,
  system_id       UUID    NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  sort_order      INTEGER DEFAULT 0,
  UNIQUE(embed_widget_id, system_id)
);

ALTER TABLE embed_widget_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_widget_systems"          ON embed_widget_systems FOR SELECT USING (true);
CREATE POLICY "public_insert_embed_widget_systems"  ON embed_widget_systems FOR INSERT WITH CHECK (true);


-- ============================================================
-- PORTAL CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS portal_contacts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT        NOT NULL CHECK (entity_type IN ('supplier', 'manufacturer')),
  entity_id   UUID        NOT NULL,
  name        TEXT        NOT NULL,
  role        TEXT,
  email       TEXT,
  phone       TEXT,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_contacts_entity_idx ON portal_contacts(entity_type, entity_id);

ALTER TABLE portal_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read portal contacts" ON portal_contacts FOR SELECT USING (true);


-- ============================================================
-- SUPPLIER TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  type        TEXT        NOT NULL CHECK (type IN ('setup', 'reset')),
  used        BOOLEAN     NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE supplier_tokens ENABLE ROW LEVEL SECURITY;
-- No public policies — service role only


-- ============================================================
-- RFQ ENQUIRIES
-- Widget enquiry form submissions (not the same as RFQ drafts)
-- ============================================================
CREATE TABLE IF NOT EXISTS rfq_enquiries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id     UUID        REFERENCES embed_widgets(id) ON DELETE SET NULL,
  system_id     UUID        REFERENCES systems(id) ON DELETE SET NULL,
  system_name   TEXT,
  product_code  TEXT,
  supplier_name TEXT,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  phone         TEXT,
  message       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rfq_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_rfq_enquiries" ON rfq_enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "public_select_rfq_enquiries" ON rfq_enquiries FOR SELECT USING (true);


-- ============================================================
-- RFQ DRAFTS
-- In-progress RFQs shared between manufacturer portal and
-- buildquote.com.au. Created on "Add to RFQ", continued on
-- buildquote.com.au/rfq?draft=<id>
-- ============================================================
CREATE TABLE IF NOT EXISTS rfq_drafts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  status     TEXT        DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rfq_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_rfq_drafts" ON rfq_drafts FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_rfq_drafts"   ON rfq_drafts FOR SELECT USING (true);


-- ============================================================
-- RFQ DRAFT ITEMS
-- Line items for an rfq_draft. draft_id is TEXT (not FK) so
-- both apps can write without requiring rfq_drafts to exist first.
-- ============================================================
CREATE TABLE IF NOT EXISTS rfq_draft_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id     TEXT        NOT NULL,
  component_id UUID        REFERENCES components(id),
  manufacturer TEXT,
  system       TEXT,
  sku          TEXT,
  name         TEXT,
  description  TEXT,
  uom          TEXT,
  qty          NUMERIC     DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfq_draft_items_draft_idx ON rfq_draft_items(draft_id);

ALTER TABLE rfq_draft_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_rfq" ON rfq_draft_items FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_rfq"   ON rfq_draft_items FOR SELECT USING (true);


-- ============================================================
-- RFQ REQUESTS  (legacy — from buildquote-v3 era)
-- Full RFQ submissions. Not actively written by buildquote-v6
-- but kept for historical data. buildquote-v6 uses rfq_drafts.
-- ============================================================
CREATE TABLE IF NOT EXISTS rfq_requests (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_name         TEXT        NOT NULL,
  builder_email        TEXT        NOT NULL,
  project_name         TEXT,
  project_reference    TEXT,
  delivery_location    TEXT,
  notes                TEXT,
  status               TEXT        DEFAULT 'draft',
  send_to_supplier     BOOLEAN     DEFAULT true,
  terms_confirmed      BOOLEAN     DEFAULT false,
  terms_confirmed_at   TIMESTAMPTZ,
  supplier_name        TEXT,
  supplier_email       TEXT,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfq_requests_created_at_idx ON rfq_requests(created_at DESC);

ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert rfq_requests" ON rfq_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select rfq_requests" ON rfq_requests FOR SELECT USING (true);


-- ============================================================
-- RFQ ITEMS  (legacy — line items for rfq_requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS rfq_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id        UUID        NOT NULL REFERENCES rfq_requests(id) ON DELETE CASCADE,
  item_name     TEXT        NOT NULL,
  quantity      NUMERIC,
  unit          TEXT,
  specification TEXT,
  notes         TEXT,
  source        TEXT        DEFAULT 'manual',
  sort_order    INTEGER     DEFAULT 0,
  sku           TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfq_items_rfq_id_idx ON rfq_items(rfq_id);

ALTER TABLE rfq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert rfq_items" ON rfq_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select rfq_items" ON rfq_items FOR SELECT USING (true);


-- ============================================================
-- COMMUNITY SIGNUPS  (from buildquote.com.au landing page)
-- ============================================================
CREATE TABLE IF NOT EXISTS community_signups (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT,
  rfq_id     TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE community_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert community_signups" ON community_signups FOR INSERT WITH CHECK (true);


-- ============================================================
-- VIEW: products_by_manufacturer
-- ============================================================
CREATE OR REPLACE VIEW products_by_manufacturer AS
SELECT
  m.name                                                              AS manufacturer,
  m.id                                                                AS manufacturer_id,
  s.id                                                                AS system_id,
  s.category,
  s.subcategory,
  s.product_code,
  s.name                                                              AS product_name,
  s.description,
  s.notes,
  s.dimensions,
  s.length_m,
  s.double_sided,
  s.sort_order,
  COUNT(DISTINCT sc.id)                                               AS colour_count,
  STRING_AGG(DISTINCT sc.colour_name, ', ' ORDER BY sc.colour_name)  AS colours,
  COUNT(DISTINCT scomp.component_id)                                  AS component_count,
  s.verification_status,
  s.verified_at
FROM systems s
JOIN manufacturers m          ON m.id = s.manufacturer_id
LEFT JOIN system_colours sc   ON sc.system_id = s.id
LEFT JOIN system_components scomp ON scomp.system_id = s.id
GROUP BY m.name, m.id, s.id, s.category, s.subcategory, s.product_code,
         s.name, s.description, s.notes, s.dimensions, s.length_m,
         s.double_sided, s.sort_order, s.verification_status, s.verified_at
ORDER BY m.name, s.category, s.sort_order;
