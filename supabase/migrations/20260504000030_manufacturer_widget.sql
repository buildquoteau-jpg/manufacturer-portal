-- ============================================================
-- Manufacturer-level demo widgets (no supplier required)
-- Allows admin to create product widgets for a manufacturer
-- to demonstrate to suppliers.
-- ============================================================

-- Make supplier_id nullable so manufacturer-only widgets work
ALTER TABLE embed_widgets ALTER COLUMN supplier_id DROP NOT NULL;

-- Add optional manufacturer link for admin-created widgets
ALTER TABLE embed_widgets
  ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE CASCADE;
