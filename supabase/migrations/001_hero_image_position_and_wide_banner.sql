-- Applied directly to the RFQ production Supabase project (oxvhmulxuvlfjyjzleki)
-- via the SQL editor on 2026-06-17.
--
-- Adds vertical crop position for the manufacturer grid card hero image,
-- and the dedicated wide banner image + its vertical crop position.
-- Mirrors data-studio migrations 031, 038 which ran against data_studio_manufacturers.
--
-- Also adds X/Y crop position for system card hero images,
-- mirroring data-studio migration 040 which ran against staged_systems.

-- Manufacturer brand image positioning
ALTER TABLE public.manufacturers
  ADD COLUMN IF NOT EXISTS hero_image_position_y SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE public.manufacturers
  ADD CONSTRAINT manufacturers_hero_image_position_y_range
  CHECK (hero_image_position_y BETWEEN 0 AND 100);

ALTER TABLE public.manufacturers
  ADD COLUMN IF NOT EXISTS hero_wide_image_url TEXT;

ALTER TABLE public.manufacturers
  ADD COLUMN IF NOT EXISTS hero_wide_image_position_y SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE public.manufacturers
  ADD CONSTRAINT manufacturers_hero_wide_image_position_y_range
  CHECK (hero_wide_image_position_y BETWEEN 0 AND 100);

-- System card crop positions
ALTER TABLE public.systems
  ADD COLUMN IF NOT EXISTS hero_image_position_x SMALLINT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS hero_image_position_y SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE public.systems
  ADD CONSTRAINT systems_hero_image_position_x_range CHECK (hero_image_position_x BETWEEN 0 AND 100),
  ADD CONSTRAINT systems_hero_image_position_y_range CHECK (hero_image_position_y BETWEEN 0 AND 100);
