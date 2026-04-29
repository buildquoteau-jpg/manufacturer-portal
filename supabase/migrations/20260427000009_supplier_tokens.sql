-- Tokens for supplier password setup and reset emails
CREATE TABLE supplier_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  type       TEXT NOT NULL CHECK (type IN ('setup', 'reset')),
  used       BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE supplier_tokens ENABLE ROW LEVEL SECURITY;

-- Only server-side (service role) can read/write tokens
-- No public policies — all access goes through API routes
