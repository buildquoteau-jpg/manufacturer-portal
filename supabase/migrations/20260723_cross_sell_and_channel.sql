-- ── Trade Desk v2: cross-sell rules + multi-channel delivery ──────────────────
-- Run this in the Supabase SQL editor before relying on the Cross-sell admin
-- tab or SMS/WhatsApp delivery tracking. Everything here is additive and safe
-- to re-run (IF NOT EXISTS guards throughout).

-- Staff/admin-curated "what pairs with this category" mapping, used by the
-- Trade Desk's "You may also be interested in" strip. Deliberately NOT
-- AI-generated at runtime — see /api/admin/suggest-cross-sell for the
-- staff-approval-only authoring aid. Rows here are the only thing the live
-- Trade Desk reads.
CREATE TABLE IF NOT EXISTS category_cross_sell_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_category text NOT NULL,
  to_category   text NOT NULL,
  note          text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (from_category, to_category)
);

ALTER TABLE category_cross_sell_rules ENABLE ROW LEVEL SECURITY;

-- Trade Desk Search runs client-side in the supplier portal and reads this
-- table directly with the anon key (same pattern as customer_review_sessions
-- below). No public write policy — only the service-role admin API
-- (/api/admin/category-cross-sell) inserts/deletes.
CREATE POLICY "public_read_cross_sell_rules"
  ON category_cross_sell_rules FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── Customer channel preference + per-channel delivery tracking ───────────────
-- Adds SMS/WhatsApp alongside the existing email-only flow. customer_mobile
-- was already being captured on this table but never used for delivery.

ALTER TABLE customer_review_sessions
  ADD COLUMN IF NOT EXISTS preferred_channel text DEFAULT 'email'
    CHECK (preferred_channel IN ('email', 'sms', 'whatsapp')),
  ADD COLUMN IF NOT EXISTS email_sent      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_sent        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_sent   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_error  text;
