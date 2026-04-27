-- ============================================================
-- BuildQuote Manufacturer Portal — Fresh Schema
-- Run this in Supabase SQL Editor to reset and rebuild tables
-- WARNING: This drops all existing tables and data
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DROP EXISTING TABLES (fresh start)
-- ============================================================
DROP TABLE IF EXISTS embed_widget_systems CASCADE;
DROP TABLE IF EXISTS embed_widgets CASCADE;
DROP TABLE IF EXISTS supplier_systems CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS rfq_draft_items CASCADE;
DROP TABLE IF EXISTS system_components CASCADE;
DROP TABLE IF EXISTS system_colours CASCADE;
DROP TABLE IF EXISTS components CASCADE;
DROP TABLE IF EXISTS systems CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;

-- ============================================================
-- MANUFACTURERS
-- One row per brand (e.g. New Tech Wood, James Hardie)
-- ============================================================
CREATE TABLE manufacturers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  logo_url     TEXT,
  website_url  TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SYSTEMS
-- One row per product profile (e.g. Avenue Range US92, Terrace Range US49C)
-- ============================================================
CREATE TABLE systems (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,         -- e.g. "Avenue Range"
  product_code    TEXT NOT NULL,         -- e.g. "US92"
  slug            TEXT NOT NULL,         -- e.g. "avenue-range-us92"
  category        TEXT NOT NULL,         -- "Decking", "Cladding", "Screening & Fencing"
  subcategory     TEXT,                  -- e.g. "Avenue Range", "Castellation Cladding"
  description     TEXT,
  dimensions      TEXT,                  -- e.g. "138mm x 29mm"
  length_m        NUMERIC,               -- e.g. 4.88
  double_sided    BOOLEAN DEFAULT false,
  hero_image_url  TEXT,                  -- main product photo
  notes           TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(manufacturer_id, product_code)
);

-- ============================================================
-- SYSTEM COLOURS
-- Each profile is available in multiple colours
-- ============================================================
CREATE TABLE system_colours (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id   UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  colour_name TEXT NOT NULL,   -- e.g. "Antique", "Teak", "Blackbutt"
  image_url   TEXT,            -- optional colour swatch or lifestyle photo
  is_stocked  BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  UNIQUE(system_id, colour_name)
);

-- ============================================================
-- COMPONENTS
-- Fixings, clips, trims, screws — the accessories for each system
-- ============================================================
CREATE TABLE components (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID REFERENCES manufacturers(id),
  sku             TEXT,
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT,     -- "Clips", "Screws", "Trims", "Starter Profile", "Spacers"
  unit            TEXT,     -- "pack", "each", "box", "lm"
  sort_order      INTEGER DEFAULT 0
);

-- ============================================================
-- SYSTEM COMPONENTS
-- Which components are required/recommended for each system
-- ============================================================
CREATE TABLE system_components (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id    UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  role         TEXT DEFAULT 'required',   -- "required", "recommended", "optional"
  notes        TEXT,
  sort_order   INTEGER DEFAULT 0,
  UNIQUE(system_id, component_id)
);

-- ============================================================
-- SUPPLIERS
-- The businesses that stock and sell products
-- ============================================================
CREATE TABLE suppliers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  website_url TEXT,
  email       TEXT,
  phone       TEXT,
  suburb      TEXT,
  state       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SUPPLIER SYSTEMS
-- Which systems a supplier has available to feature in widgets
-- ============================================================
CREATE TABLE supplier_systems (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  system_id   UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  UNIQUE(supplier_id, system_id)
);

-- ============================================================
-- EMBED WIDGETS
-- One widget config per supplier (can have multiple later)
-- public_token is what goes in the <script> embed code
-- ============================================================
CREATE TABLE embed_widgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'My Widget',
  public_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status       TEXT DEFAULT 'active',   -- "active", "disabled"
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- EMBED WIDGET SYSTEMS
-- The up-to-3 profiles shown in a specific widget
-- ============================================================
CREATE TABLE embed_widget_systems (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embed_widget_id UUID NOT NULL REFERENCES embed_widgets(id) ON DELETE CASCADE,
  system_id       UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  sort_order      INTEGER DEFAULT 0,
  UNIQUE(embed_widget_id, system_id)
);

-- ============================================================
-- RFQ DRAFT ITEMS
-- Kept for existing portal RFQ functionality
-- ============================================================
CREATE TABLE rfq_draft_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id     TEXT NOT NULL,
  component_id UUID REFERENCES components(id),
  sku          TEXT,
  name         TEXT,
  description  TEXT,
  uom          TEXT,
  qty          INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Public read on published content, full access for authenticated users
-- ============================================================
ALTER TABLE manufacturers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems              ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_colours       ENABLE ROW LEVEL SECURITY;
ALTER TABLE components           ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_components    ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_systems     ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_widgets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_widget_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_draft_items      ENABLE ROW LEVEL SECURITY;

-- Allow public read on core product tables (needed for the widget)
CREATE POLICY "public_read_manufacturers"     ON manufacturers        FOR SELECT USING (true);
CREATE POLICY "public_read_systems"           ON systems              FOR SELECT USING (true);
CREATE POLICY "public_read_system_colours"    ON system_colours       FOR SELECT USING (true);
CREATE POLICY "public_read_components"        ON components           FOR SELECT USING (true);
CREATE POLICY "public_read_system_components" ON system_components    FOR SELECT USING (true);
CREATE POLICY "public_read_suppliers"         ON suppliers            FOR SELECT USING (true);
CREATE POLICY "public_read_supplier_systems"  ON supplier_systems     FOR SELECT USING (true);
CREATE POLICY "public_read_embed_widgets"     ON embed_widgets        FOR SELECT USING (true);
CREATE POLICY "public_read_widget_systems"    ON embed_widget_systems FOR SELECT USING (true);

-- Allow inserts for RFQ drafts (unauthenticated builders)
CREATE POLICY "public_insert_rfq" ON rfq_draft_items FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_rfq"   ON rfq_draft_items FOR SELECT USING (true);
