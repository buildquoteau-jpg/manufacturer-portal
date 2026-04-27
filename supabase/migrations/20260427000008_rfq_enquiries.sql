-- RFQ enquiry submissions from the embeddable widget
CREATE TABLE rfq_enquiries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id    UUID REFERENCES embed_widgets(id) ON DELETE SET NULL,
  system_id    UUID REFERENCES systems(id) ON DELETE SET NULL,
  system_name  TEXT,
  product_code TEXT,
  supplier_name TEXT,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  message      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rfq_enquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an enquiry (public widget)
CREATE POLICY "public_insert_rfq_enquiries"
  ON rfq_enquiries FOR INSERT WITH CHECK (true);

-- Read is open so supplier portal can display them
CREATE POLICY "public_select_rfq_enquiries"
  ON rfq_enquiries FOR SELECT USING (true);
