import { supabase } from '@/lib/supabase/client'
import type { WidgetManufacturer, WidgetSystem, WidgetColour, WidgetComponent, WidgetProfile } from './getWidgetData'

export type ManufacturerPageData = {
  manufacturer: WidgetManufacturer
  systems: WidgetSystem[]
}

export async function getManufacturerData(slug: string): Promise<ManufacturerPageData | null> {
  const { data, error } = await supabase
    .from('manufacturers')
    .select(`
      name, slug, description, logo_url,
      hero_image_url, hero_image_position_y,
      hero_wide_image_url, hero_wide_image_position_y,
      website_url, seo_title, seo_description,
      systems (
        id, name, product_code, slug, category, subcategory,
        description, dimensions, length_m, double_sided,
        hero_image_url, hero_image_position_x, hero_image_position_y,
        australian_made, website_url, install_guide_urls, design_guide_url, tech_data_url, notes,
        fire_rating, acoustic_rating, moisture_resistant,
        structural_grade, bal_rating,
        sort_order,
        system_colours ( colour_name, sort_order, is_stocked ),
        system_components (
          id, role, notes, sort_order,
          components ( name, sku, description, category, uom )
        ),
        system_profiles (
          id, profile_name, name, product_code, dimensions,
          length_mm, width_mm, height_mm, thickness_mm,
          uom, supplier_pack_qty, supplier_pack_uom, sort_order
        )
      )
    `)
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    console.error('[getManufacturerData] slug:', slug, 'error:', JSON.stringify(error))
    return null
  }

  const m = data as any

  const systems: WidgetSystem[] = ((m.systems || []) as any[])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(sys => ({
      ...sys,
      system_colours: ((sys.system_colours || []) as WidgetColour[])
        .sort((a, b) => a.sort_order - b.sort_order),
      system_components: ((sys.system_components || []) as WidgetComponent[])
        .sort((a, b) => a.sort_order - b.sort_order),
      system_profiles: ((sys.system_profiles || []) as WidgetProfile[])
        .sort((a, b) => a.sort_order - b.sort_order),
    }))

  return {
    manufacturer: {
      name: m.name,
      slug: m.slug,
      description: m.description,
      logo_url: m.logo_url,
      hero_image_url: m.hero_image_url,
      hero_image_position_y: m.hero_image_position_y ?? null,
      hero_wide_image_url: m.hero_wide_image_url ?? null,
      hero_wide_image_position_y: m.hero_wide_image_position_y ?? null,
      website_url: m.website_url,
      seo_title: m.seo_title ?? null,
      seo_description: m.seo_description ?? null,
    },
    systems,
  }
}
