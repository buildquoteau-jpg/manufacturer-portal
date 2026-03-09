import { supabase } from '@/lib/supabase/client'

export async function getSystems() {
  const { data, error } = await supabase
    .from('systems')
    .select(`
      id,
      name,
      description,
      category,
      sort_order,
      components (
        id,
        category,
        sku,
        name,
        uom,
        length_mm,
        width_mm,
        thickness_mm,
        texture,
        sort_order
      )
    `)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error(error)
    return []
  }

  return data
}
