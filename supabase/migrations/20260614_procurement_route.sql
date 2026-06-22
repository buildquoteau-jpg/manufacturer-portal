-- Add procurement_route to production components table
-- Values: specialist_supplier | trade_merchant
-- Drives the split-RFQ feature: components from different channels are separated into
-- distinct RFQ groups so builders know they need to order from 2 supplier types.

ALTER TABLE public.components
  ADD COLUMN IF NOT EXISTS procurement_route TEXT;

COMMENT ON COLUMN public.components.procurement_route IS
  'specialist_supplier | trade_merchant — sourcing channel; set during data-studio verification and published here';
