import { supabase } from '@/lib/supabase/client'

export type WidgetManufacturer = {
  name: string
  slug: string
  logo_url: string | null
  hero_image_url: string | null
  hero_image_position_y: number | null
  hero_wide_image_url: string | null
  hero_wide_image_position_y: number | null
  website_url: string | null
  description: string | null
  seo_title: string | null
  seo_description: string | null
}

export type WidgetColour = {
  colour_name: string
  image_url: string | null
  sort_order: number
  is_stocked: boolean
}

export type WidgetComponent = {
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
    procurement_route: 'specialist_supplier' | 'trade_merchant' | null
  } | null
}

export type WidgetProfile = {
  id: string
  profile_name: string | null
  name: string | null
  product_code: string | null
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

export type WidgetSystem = {
  id: string
  name: string
  product_code: string
  slug: string
  category: string
  subcategory: string | null
  description: string | null
  dimensions: string | null
  length_m: number | null
  double_sided: boolean
  hero_image_url: string | null
  hero_image_position_x: number | null
  hero_image_position_y: number | null
  website_url: string | null
  install_guide_urls: { label: string; url: string }[] | null
  notes: string | null
  fire_rating: string | null
  acoustic_rating: string | null
  moisture_resistant: boolean
  structural_grade: string | null
  bal_rating: string | null
  australian_made: boolean | null
  system_colours: WidgetColour[]
  system_components: WidgetComponent[]
  system_profiles: WidgetProfile[]
}

export type WidgetData = {
  id: string
  name: string
  manufacturer: WidgetManufacturer | null
  supplier: {
    name: string
    website_url: string | null
  } | null
  systems: WidgetSystem[]
}

export async function getWidgetData(token: string): Promise<WidgetData | null> {
  const { data, error } = await supabase
    .from('embed_widgets')
    .select(`
      id,
      name,
      suppliers (
        name,
        website_url
      ),
      embed_widget_systems (
        sort_order,
        systems (
          id,
          name,
          product_code,
          slug,
          category,
          subcategory,
          description,
          dimensions,
          length_m,
          double_sided,
          hero_image_url,
          hero_image_position_x,
          hero_image_position_y,
          website_url,
          install_guide_urls,
          notes,
          fire_rating,
          acoustic_rating,
          moisture_resistant,
          structural_grade,
          bal_rating,
          australian_made,
          manufacturers (
            name,
            slug,
            logo_url,
            hero_image_url,
            website_url,
            description
          ),
          system_colours (
            colour_name,
            image_url,
            sort_order,
            is_stocked
          ),
          system_components (
            id,
            role,
            notes,
            sort_order,
            components (
              name,
              sku,
              description,
              category,
              uom,
              procurement_route
            )
          ),
          system_profiles (
            id,
            profile_name,
            name,
            product_code,
            dimensions,
            length_mm,
            width_mm,
            height_mm,
            thickness_mm,
            uom,
            supplier_pack_qty,
            supplier_pack_uom,
            sort_order
          )
        )
      )
    `)
    .eq('public_token', token)
    .eq('status', 'active')
    .single()

  if (error || !data) return null

  const widgetSystems = data.embed_widget_systems as any[]
  const sortedSystems = widgetSystems
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((ws) => {
      const sys = ws.systems as any
      const { manufacturers: _mf, ...sysWithoutMf } = sys
      return {
        ...sysWithoutMf,
        system_colours: (sys.system_colours || []).sort(
          (a: WidgetColour, b: WidgetColour) => a.sort_order - b.sort_order
        ),
        system_components: (sys.system_components || []).sort(
          (a: WidgetComponent, b: WidgetComponent) => a.sort_order - b.sort_order
        ),
        system_profiles: (sys.system_profiles || []).sort(
          (a: WidgetProfile, b: WidgetProfile) => a.sort_order - b.sort_order
        ),
      } as WidgetSystem
    })

  // Derive manufacturer from the first system
  const firstSys = widgetSystems[0]?.systems as any
  const manufacturer: WidgetManufacturer | null = firstSys?.manufacturers ?? null

  return {
    id: (data as any).id,
    name: (data as any).name,
    manufacturer,
    supplier: (data as any).suppliers,
    systems: sortedSystems,
  }
}
