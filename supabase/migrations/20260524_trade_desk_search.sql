-- ── Trade Desk Search: customer review sessions ──────────────────────────────
-- Run this in Supabase SQL editor before deploying the Trade Desk Search feature.

-- Session created by supplier staff when they click "Send review link".
-- Token is a random UUID used in the public URL: /supplier-review/[token]
CREATE TABLE IF NOT EXISTS customer_review_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token            text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  supplier_id      uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  customer_name    text,
  customer_mobile  text,
  customer_email   text,
  staff_note       text,
  created_at       timestamptz DEFAULT now()
);

-- Which systems (product lines) were selected for this review session.
CREATE TABLE IF NOT EXISTS customer_review_session_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES customer_review_sessions(id) ON DELETE CASCADE,
  system_id   uuid NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  sort_order  int NOT NULL DEFAULT 0
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE customer_review_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_review_session_items ENABLE ROW LEVEL SECURITY;

-- Customer review pages are public — token is a random UUID (unpredictable).
-- The page only shows products the supplier explicitly selected for this session.
CREATE POLICY "public_read_review_sessions"
  ON customer_review_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_review_session_items"
  ON customer_review_session_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── rfq_enquiries: allow anon INSERT for customer review submissions ───────────
-- Only needed if anon INSERT is not already permitted on rfq_enquiries.
-- Skip this block if you already have an insert policy on that table.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rfq_enquiries'
      AND policyname = 'anon_insert_rfq_enquiries'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "anon_insert_rfq_enquiries"
        ON rfq_enquiries FOR INSERT
        TO anon, authenticated
        WITH CHECK (true)
    $policy$;
  END IF;
END
$$;
