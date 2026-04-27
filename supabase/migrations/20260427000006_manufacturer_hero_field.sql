-- ============================================================
-- Add hero_image_url to manufacturers for widget brand section
-- ============================================================
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- Update NewTech Wood with accurate brand description and website
-- (set logo_url and hero_image_url via Supabase dashboard after uploading images)
UPDATE manufacturers
SET
  website_url  = 'https://newtechwood.com.au',
  description  = 'NewTech Wood composite timber products are engineered from 95% recycled materials for residential and commercial decking, cladding, and screening. Built for Australian conditions — durable, low-maintenance, and CodeMark® certified.'
WHERE id = 'a1000000-0000-0000-0000-000000000001';
