// Adapter: MFP production Supabase rows → master System Card renderer props.
//
// Mirrors `apps/web/components/system-card-renderer/adaptStagedSystem.ts` in
// buildquote-data-studio, but for the *published* schema (systems,
// system_profiles, system_components, system_colours, manufacturers) that
// this repo actually reads — see lib/data/getWidgetData.ts, which queries
// the exact same shape for the public widget. Pure function, no Supabase
// calls in here.

import type { SystemCardSystem, SystemCardComponentEntry } from './types'

export type ProductionColour = {
  colour_name: string
  image_url: string | null
  sort_order: number
  is_stocked: boolean
}

export type ProductionComponentEntry = {
  id: string
  role: string
  notes: string | null
  sort_order: number
  components: {
    name: string
    sku: string | null
    description: string | null
    category: string | null
    uom: string | null
    procurement_route: string | null
  } | null
}

export type ProductionProfile = {
  id: string
  profile_name: string | null
  name: string | null
  product_code: string | null
  description?: string | null
  dimensions: string | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  thickness_mm: number | null
  uom: string | null
  supplier_pack_qty: number | null
  supplier_pack_uom: string | null
  sort_order: number
}

export type ProductionSystem = {
  id: string
  name: string
  product_code: string
  slug: string
  category: string
  subcategory: string | null
  description: string | null
  hero_image_url: string | null
  hero_image_position_x: number | null
  hero_image_position_y: number | null
  australian_made: boolean | null
  bal_rating: string | null
  fire_rating: string | null
  moisture_resistant: boolean | null
  acoustic_rating: string | null
  structural_grade: string | null
  notes: string | null
  website_url: string | null
  install_guide_urls: { label: string; url: string }[] | null
  design_guide_url: string | null
  tech_data_url: string | null
  system_colours: ProductionColour[]
  system_profiles: ProductionProfile[]
  system_components: ProductionComponentEntry[]
}

export type ProductionManufacturer = {
  name: string
  slug: string
  logo_url: string | null
}

function adaptComponent(c: ProductionComponentEntry): SystemCardComponentEntry {
  return {
    id: c.id,
    role: c.role,
    notes: c.notes,
    sort_order: c.sort_order,
    components: c.components,
  }
}

export function adaptProductionSystem(
  system: ProductionSystem,
  manufacturer: ProductionManufacturer | null,
): SystemCardSystem {
  const bySort = <T extends { sort_order?: number | null }>(a: T, b: T) =>
    (a.sort_order ?? 0) - (b.sort_order ?? 0)

  return {
    id: system.id,
    name: system.name,
    product_code: system.product_code,
    slug: system.slug,
    category: system.category,
    subcategory: system.subcategory,
    description: system.description,
    hero_image_url: system.hero_image_url,
    hero_image_position_x: system.hero_image_position_x,
    hero_image_position_y: system.hero_image_position_y,
    hero_image_zoom: null,
    gallery_images: null,
    australian_made: system.australian_made,
    bal_rating: system.bal_rating,
    fire_rating: system.fire_rating,
    moisture_resistant: system.moisture_resistant,
    acoustic_rating: system.acoustic_rating,
    structural_grade: system.structural_grade,
    notes: system.notes,
    website_url: system.website_url,
    install_guide_urls: system.install_guide_urls,
    design_guide_url: system.design_guide_url,
    tech_data_url: system.tech_data_url,
    custom_document_links: null,
    custom_technical_attributes: null,
    manufacturer: manufacturer
      ? { name: manufacturer.name, slug: manufacturer.slug, logo_url: manufacturer.logo_url }
      : null,
    system_colours: [...system.system_colours].sort(bySort),
    system_profiles: [...system.system_profiles]
      .sort(bySort)
      .map(p => ({ ...p, description: p.description ?? null })),
    system_components: [...system.system_components]
      .sort(bySort)
      .map(adaptComponent),
  }
}
