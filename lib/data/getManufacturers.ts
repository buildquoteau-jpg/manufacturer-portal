import { supabase } from '@/lib/supabase/client'

export type ManufacturerListItem = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  hero_image_url: string | null
  hero_image_position_y: number | null
  system_count: number
}

export async function getManufacturers(): Promise<ManufacturerListItem[]> {
  const { data, error } = await supabase
    .from('manufacturers')
    .select(`id, name, slug, description, logo_url, hero_image_url, hero_image_position_y, systems ( id )`)
    .order('name')

  if (error || !data) return []

  return (data as any[])
    .map(m => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      description: m.description,
      logo_url: m.logo_url,
      hero_image_url: m.hero_image_url,
      hero_image_position_y: m.hero_image_position_y ?? null,
      system_count: (m.systems || []).length,
    }))
    .filter(m => m.system_count > 0)
}
