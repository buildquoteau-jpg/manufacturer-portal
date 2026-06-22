-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add region column to suppliers table
-- Run in: Supabase SQL editor (project oxvhmulxuvlfjyjzleki)
-- Date: 2026-05-26
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Adds a `region` text column to suppliers.
-- Used to group suppliers by geographic coverage area for filtering/display.
--
-- Valid region values (enforced by convention, not constraint):
--   sw_wa       — SW WA (Bunbury, Busselton, Margaret River, Albany corridor)
--   perth       — Perth Metro
--   nw_wa       — NW WA (Karratha, Pilbara, Port Hedland)
--   goldfields  — WA Goldfields (Kalgoorlie area)
--   midwest     — WA Midwest (Geraldton area)
--   national    — Ships / services nationally
--
-- After running, update each supplier's region via the Supabase table editor
-- or with UPDATE statements below.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS region text DEFAULT NULL;

-- ── Set region for known demo suppliers (update names to match your data) ─────
-- UPDATE suppliers SET region = 'sw_wa' WHERE suburb IN ('Busselton','Bunbury','Margaret River','Albany','Australind','Dunsborough');
-- UPDATE suppliers SET region = 'national' WHERE name ILIKE '%national%';
