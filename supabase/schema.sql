-- ─────────────────────────────────────────────────────────────────────────────
-- BuildQuote / MFP — Shared Supabase Schema
-- Project: oxvhmulxuvlfjyjzleki
-- Last updated: 2026-05-21
--
-- This file is the single source of truth for the production schema.
-- Update it whenever a column is added, renamed, or dropped.
-- Do NOT use migrations — paste the relevant ALTER TABLE into the Supabase
-- SQL editor and then update this file to match.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── BUILDER TABLES (buildquote) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS builders (
  id                       uuid PRIMARY KEY,                          -- = auth.users.id
  builder_name             text,
  company_name             text,
  abn                      text,
  company_address          text,
  company_address_place_id text,
  email                    text,
  office_phone             text,
  mobile_phone             text,
  logo_url                 text,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS builder_jobs (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id               uuid REFERENCES builders(id),
  project_reference        text,
  project_address          text,
  project_address_place_id text,
  project_address_manual   text,
  pm_name                  text,
  pm_mobile                text,
  site_access_notes        text,
  build_type               text,
  image_url                text,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS builder_suppliers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id        uuid REFERENCES builders(id),
  supplier_name     text,
  supplier_address  text,
  supplier_place_id text,
  supplier_email    text,
  supplier_phone    text,
  supplier_website  text,
  account_number    text,
  payment_type      text,   -- 'credit' | 'upfront'
  rep_name          text,
  rep_mobile        text,
  notes             text,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS builder_favourite_products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id   uuid REFERENCES builders(id),
  product_id   text,
  product_name text,
  manufacturer text,
  sku          text,
  description  text,
  uom          text,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS builder_passkeys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id    uuid REFERENCES builders(id),
  credential_id text NOT NULL,
  public_key    text NOT NULL,
  counter       bigint NOT NULL DEFAULT 0,
  device_type   text,
  backed_up     boolean DEFAULT false,
  transports    text[],
  created_at    timestamptz DEFAULT now()
);


-- ── RFQ TABLES (buildquote) ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rfq_drafts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id        uuid REFERENCES builders(id),
  supplier_name     text,
  supplier_email    text,
  project_reference text,
  status            text DEFAULT 'draft',   -- 'draft' | 'sent'
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfq_draft_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id     text NOT NULL,               -- matches rfq_drafts.id (stored as text)
  component_id uuid,
  manufacturer text,
  system       text,
  sku          text,
  name         text,
  description  text,
  uom          text,
  qty          numeric DEFAULT 1,
  length_mm    numeric,
  width_mm     numeric,
  height_mm    numeric,
  thickness_mm numeric,
  depth_mm     numeric,
  gauge_mm     numeric,
  diameter_mm  numeric,
  roll_m       numeric,
  weight_kg    numeric,
  pieces       integer,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfq_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id          uuid REFERENCES builders(id),
  builder_name        text NOT NULL,
  builder_email       text NOT NULL,
  project_name        text,                 -- company name
  project_reference   text,
  delivery_location   text,
  notes               text,                 -- message to supplier
  supplier_name       text,
  supplier_email      text,
  rfq_id_short        text,
  draft_id            text,
  status              text DEFAULT 'draft', -- 'draft' | 'sent' | 'won' | 'declined'
  send_to_supplier    boolean DEFAULT true,
  terms_confirmed     boolean DEFAULT false,
  terms_confirmed_at  timestamptz,
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfq_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id        uuid NOT NULL REFERENCES rfq_requests(id),
  item_name     text NOT NULL,
  quantity      numeric,
  unit          text,                       -- note: rfq_items uses 'unit', not 'uom'
  specification text,
  notes         text,                       -- sku stored here
  sku           text,
  source        text DEFAULT 'manual',
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_signups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text,
  rfq_id     text,
  created_at timestamptz DEFAULT now()
);


-- ── MANUFACTURER / CATALOGUE TABLES (MFP + buildquote) ───────────────────────

CREATE TABLE IF NOT EXISTS manufacturers (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        text NOT NULL,
  slug                        text NOT NULL UNIQUE,
  logo_url                    text,
  website_url                 text,
  hero_image_url              text,
  hero_image_position_y       numeric DEFAULT 50,
  hero_wide_image_url         text,
  hero_wide_image_position_y  numeric DEFAULT 50,
  description                 text,
  seo_title                   text,
  seo_description             text,
  abn                         text,
  phone                       text,
  auth_user_id                uuid,           -- links to auth.users if manufacturer has portal login
  created_at                  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS systems (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id     uuid NOT NULL REFERENCES manufacturers(id),
  name                text NOT NULL,
  product_code        text NOT NULL,
  slug                text NOT NULL,
  category            text NOT NULL,
  subcategory         text,
  description         text,
  dimensions          text,
  length_m            numeric,
  sheet_format        text,
  double_sided        boolean DEFAULT false,
  hero_image_url          text,
  hero_image_position_x   smallint DEFAULT 50,
  hero_image_position_y   smallint DEFAULT 50,
  notes               text,
  website_url         text,
  fire_rating         text,
  acoustic_rating     text,
  moisture_resistant  boolean DEFAULT false,
  structural_grade    text,
  bal_rating          text,
  australian_made     boolean DEFAULT false,
  install_guide_urls  jsonb, -- array of {label, url}; replaced singular install_guide_url 2026-06-16
  tech_data_url       text,
  source_document_id  uuid,
  source_label        text,
  source_url          text,
  verified_by         text,
  verified_at         timestamptz,
  verification_status text,
  change_notes        text,
  sort_order          integer DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS components (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id   uuid REFERENCES manufacturers(id),
  sku               text,
  name              text NOT NULL,
  description       text,
  category          text,
  uom               text,                   -- unit of measure (EA, LM, m², etc.)
  sort_order        integer DEFAULT 0,
  -- dimension fields
  length_mm         numeric,
  width_mm          numeric,
  height_mm         numeric,
  thickness_mm      numeric,
  depth_mm          numeric,
  gauge_mm          numeric,
  diameter_mm       numeric,
  roll_m            numeric,
  weight_kg         numeric,
  weight_g          numeric,
  pieces            numeric,
  volume_ml         numeric,
  -- pack info
  pack_format       text,
  supplier_pack_qty  numeric,
  supplier_pack_uom  text,
  supplier_pack_note text
);

CREATE TABLE IF NOT EXISTS system_components (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id    uuid NOT NULL REFERENCES systems(id),
  component_id uuid NOT NULL REFERENCES components(id),
  role         text DEFAULT 'required',     -- 'required' | 'optional' | 'accessory'
  notes        text,
  sort_order   integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS system_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id         uuid NOT NULL REFERENCES systems(id),
  name              text,
  profile_name      text,
  product_code      text,
  dimensions        text,
  sheet_format      text,
  uom               text,
  length_m          numeric,
  length_mm         numeric,
  width_mm          numeric,
  height_mm         numeric,
  thickness_mm      numeric,
  depth_mm          numeric,
  gauge_mm          numeric,
  diameter_mm       numeric,
  roll_m            numeric,
  weight_kg         numeric,
  weight_g          numeric,
  pieces            numeric,
  volume_ml         numeric,
  pack_format       text,
  bal_rating        text,
  supplier_pack_qty  numeric,
  supplier_pack_uom  text,
  supplier_pack_note text,
  sort_order        integer DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_colours (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id   uuid NOT NULL REFERENCES systems(id),
  colour_name text NOT NULL,
  sku         text,
  image_url   text,
  is_stocked  boolean DEFAULT true,
  sort_order  integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalogue_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid NOT NULL REFERENCES manufacturers(id),
  document_name   text NOT NULL,
  document_url    text,
  document_date   text,
  extracted_by    text,
  notes           text,
  extracted_at    timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);


-- ── SUPPLIER PORTAL TABLES (MFP) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS suppliers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  slug             text NOT NULL UNIQUE,
  auth_user_id     uuid,                    -- links to auth.users
  email            text,
  phone            text,
  address          text,
  suburb           text,
  state            text,
  abn              text,
  website_url      text,
  manager_name     text,
  it_name          text,
  it_email         text,
  portal_password  text,                    -- legacy plain-text (phase out)
  bio              text,
  hero_photo_url   text,
  hero_photo_y     integer DEFAULT 50,    -- vertical crop position 0 (top) – 100 (bottom)
  hero_photo_zoom  integer DEFAULT 100,   -- zoom 100 (none) – 200 (2×)
  google_maps_url  text,
  service_postcodes text,
  delivery_info    text,
  region           text,                  -- sw_wa | perth | nw_wa | goldfields | midwest | national
  first_login      boolean NOT NULL DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_systems (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  system_id   uuid NOT NULL REFERENCES systems(id)
);

CREATE TABLE IF NOT EXISTS supplier_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  token       text NOT NULL,
  type        text NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS embed_widgets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     uuid REFERENCES suppliers(id),
  manufacturer_id uuid REFERENCES manufacturers(id),
  name            text NOT NULL DEFAULT 'My Widget',
  public_token    text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status          text DEFAULT 'active',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS embed_widget_systems (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embed_widget_id uuid NOT NULL REFERENCES embed_widgets(id),
  system_id       uuid NOT NULL REFERENCES systems(id),
  sort_order      integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rfq_enquiries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id     uuid REFERENCES embed_widgets(id),
  system_id     uuid REFERENCES systems(id),
  system_name   text,
  product_code  text,
  supplier_name text,
  name          text NOT NULL,
  email         text NOT NULL,
  phone         text,
  message       text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,               -- 'supplier' | 'manufacturer'
  entity_id   uuid NOT NULL,
  name        text NOT NULL,
  role        text,
  email       text,
  phone       text,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
