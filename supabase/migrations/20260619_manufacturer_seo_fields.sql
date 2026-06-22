-- Add optional SEO override fields to manufacturers table.
-- When populated in the admin, these override the auto-generated values.
-- When null, page metadata is generated from name + description + systems.
alter table manufacturers
  add column if not exists seo_title text,
  add column if not exists seo_description text;
