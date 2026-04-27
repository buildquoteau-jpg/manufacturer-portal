import { supabase } from '@/lib/supabase/client'

export type WidgetManufacturer = {
  name: string
  slug: string
  logo_url: string | null
  hero_image_url: string | null
  website_url: string | null
  description: string | null
}

export type WidgetColour = {
  colour_name: string
  sort_order: number
  is_stocked: boolean
}

export type WidgetComponent = {
  role: string
  notes: string | null
  sort_order: number
  components: {
    name: string
    sku: string | null
    description: string | null
    category: string | null
    unit: string | null
  } | null
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
  website_url: string | null
  notes: string | null
  system_colours: WidgetColour[]
  system_components: WidgetComponent[]
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
      manufacturers (
        name,
        slug,
        logo_url,
        hero_image_url,
        website_url,
        description
      ),
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
          website_url,
          notes,
          system_colours (
            colour_name,
            sort_order,
            is_stocked
          ),
          system_components (
            role,
            notes,
            sort_order,
            components (
              name,
              sku,
              description,
              category,
              unit
            )
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
      const sys = ws.systems as WidgetSystem
      return {
        ...sys,
        system_colours: (sys.system_colours || []).sort(
          (a: WidgetColour, b: WidgetColour) => a.sort_order - b.sort_order
        ),
        system_components: (sys.system_components || []).sort(
          (a: WidgetComponent, b: WidgetComponent) => a.sort_order - b.sort_order
        ),
      }
    })

  return {
    id: (data as any).id,
    name: (data as any).name,
    manufacturer: (data as any).manufacturers,
    supplier: (data as any).suppliers,
    systems: sortedSystems,
  }
}
