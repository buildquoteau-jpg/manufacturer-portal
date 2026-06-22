import { supabase } from '@/lib/supabase/client'
import type { WidgetData, WidgetColour, WidgetComponent, WidgetProfile } from './getWidgetData'

export async function getSupplierBrandWidget(
  supplierSlug: string,
  manufacturerSlug: string,
): Promise<WidgetData | null> {
  const [supplierRes, mfRes] = await Promise.all([
    supabase
      .from('suppliers')
      .select('id, name, website_url')
      .eq('slug', supplierSlug)
      .maybeSingle(),
    supabase
      .from('manufacturers')
      .select('id, name, slug, logo_url, hero_image_url, hero_image_position_y, hero_wide_image_url, hero_wide_image_position_y, website_url, description')
      .eq('slug', manufacturerSlug)
      .maybeSingle(),
  ])

  if (!supplierRes.data || !mfRes.data) return null
  const supplier = supplierRes.data as any
  const mf = mfRes.data as any

  const { data: widgets } = await supabase
    .from('embed_widgets')
    .select(`
      id, name,
      embed_widget_systems (
        sort_order,
        systems (
          id, name, product_code, slug, category, subcategory,
          description, dimensions, length_m, double_sided,
          hero_image_url, website_url, notes,
          fire_rating, acoustic_rating, moisture_resistant,
          structural_grade, bal_rating,
          manufacturer_id,
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
      )
    `)
    .eq('supplier_id', supplier.id)
    .eq('status', 'active')

  if (!widgets || widgets.length === 0) return null

  const allSystems: any[] = []
  let widgetId = ''
  let widgetName = ''

  for (const w of widgets as any[]) {
    for (const ews of w.embed_widget_systems || []) {
      if (ews.systems?.manufacturer_id === mf.id) {
        allSystems.push(ews)
        widgetId = w.id
        widgetName = w.name
      }
    }
  }

  if (allSystems.length === 0) return null

  const sortedSystems = allSystems
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(ews => {
      const sys = ews.systems
      return {
        ...sys,
        system_colours: ((sys.system_colours || []) as WidgetColour[]).sort(
          (a, b) => a.sort_order - b.sort_order
        ),
        system_components: ((sys.system_components || []) as WidgetComponent[]).sort(
          (a, b) => a.sort_order - b.sort_order
        ),
        system_profiles: ((sys.system_profiles || []) as WidgetProfile[]).sort(
          (a, b) => a.sort_order - b.sort_order
        ),
      }
    })

  return {
    id: widgetId,
    name: widgetName,
    manufacturer: {
      name: mf.name,
      slug: mf.slug,
      logo_url: mf.logo_url,
      hero_image_url: mf.hero_image_url,
      hero_image_position_y: mf.hero_image_position_y ?? null,
      hero_wide_image_url: mf.hero_wide_image_url ?? null,
      hero_wide_image_position_y: mf.hero_wide_image_position_y ?? null,
      website_url: mf.website_url,
      description: mf.description,
    },
    supplier: { name: supplier.name, website_url: supplier.website_url },
    systems: sortedSystems,
  }
}
