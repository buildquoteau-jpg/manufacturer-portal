-- Add website_url column to systems table
ALTER TABLE systems ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Decking — point to NTW composite decking page
UPDATE systems SET website_url = 'https://newtechwood.com.au/composite-decking/'
WHERE manufacturer_id = 'a1000000-0000-0000-0000-000000000001'
  AND category = 'Decking';

-- Cladding — point to NTW composite cladding page
UPDATE systems SET website_url = 'https://newtechwood.com.au/composite-cladding/'
WHERE manufacturer_id = 'a1000000-0000-0000-0000-000000000001'
  AND category = 'Cladding';

-- Screening & Fencing — point to NTW composite cladding page (closest match)
UPDATE systems SET website_url = 'https://newtechwood.com.au/composite-cladding/'
WHERE manufacturer_id = 'a1000000-0000-0000-0000-000000000001'
  AND category = 'Screening & Fencing';
