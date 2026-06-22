import { supabase } from '@/lib/supabase/client'

export type SupplierBrand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export type PublicSupplierCard = {
  id: string
  name: string
  slug: string
  suburb: string | null
  state: string | null
  bio: string | null
  hero_photo_url: string | null
  hero_photo_y: number | null
  service_postcodes: string | null
  brands: SupplierBrand[]
}

export type PublicSupplierDetail = {
  id: string
  name: string
  slug: string
  address: string | null
  suburb: string | null
  state: string | null
  bio: string | null
  hero_photo_url: string | null
  hero_photo_y: number | null
  hero_photo_zoom: number | null
  google_maps_url: string | null
  website_url: string | null
  phone: string | null
  service_postcodes: string | null
  delivery_info: string | null
  opening_hours: string | null
  brands: SupplierDetailBrand[]
}

export type SupplierDetailBrand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  hero_image_url: string | null
  description: string | null
  system_count: number
  widget_id: string
}

export async function getPublicSuppliers(): Promise<PublicSupplierCard[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select(`
      id, name, slug, suburb, state, bio, hero_photo_url, hero_photo_y, service_postcodes,
      embed_widgets (
        status,
        embed_widget_systems (
          systems (
            manufacturers ( id, name, slug, logo_url )
          )
        )
      )
    `)
    .order('name')

  if (error || !data) return []

  return (data as any[]).map(s => {
    const brandMap = new Map<string, SupplierBrand>()
    for (const w of s.embed_widgets || []) {
      if (w.status !== 'active') continue
      for (const ews of w.embed_widget_systems || []) {
        const mf = ews.systems?.manufacturers
        if (mf?.id && !brandMap.has(mf.id)) {
          brandMap.set(mf.id, { id: mf.id, name: mf.name, slug: mf.slug, logo_url: mf.logo_url })
        }
      }
    }
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      suburb: s.suburb,
      state: s.state,
      bio: s.bio,
      hero_photo_url: s.hero_photo_url,
      hero_photo_y: s.hero_photo_y,
      service_postcodes: s.service_postcodes,
      brands: Array.from(brandMap.values()),
    }
  }).filter(s => s.brands.length > 0)
}

export async function getPublicSupplierDetail(slug: string): Promise<PublicSupplierDetail | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select(`
      id, name, slug, address, suburb, state, bio,
      hero_photo_url, hero_photo_y, hero_photo_zoom,
      google_maps_url, website_url, phone,
      service_postcodes, delivery_info, opening_hours,
      embed_widgets (
        id, status,
        embed_widget_systems (
          systems (
            manufacturer_id,
            manufacturers ( id, name, slug, logo_url, hero_image_url, description )
          )
        )
      )
    `)
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null

  const s = data as any
  const brandMap = new Map<string, SupplierDetailBrand>()

  for (const w of s.embed_widgets || []) {
    if (w.status !== 'active') continue
    for (const ews of w.embed_widget_systems || []) {
      const mf = ews.systems?.manufacturers
      if (!mf?.id) continue
      if (!brandMap.has(mf.id)) {
        brandMap.set(mf.id, {
          id: mf.id,
          name: mf.name,
          slug: mf.slug,
          logo_url: mf.logo_url,
          hero_image_url: mf.hero_image_url,
          description: mf.description,
          system_count: 0,
          widget_id: w.id,
        })
      }
      brandMap.get(mf.id)!.system_count++
    }
  }

  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    address: s.address,
    suburb: s.suburb,
    state: s.state,
    bio: s.bio,
    hero_photo_url: s.hero_photo_url,
    hero_photo_y: s.hero_photo_y,
    hero_photo_zoom: s.hero_photo_zoom,
    google_maps_url: s.google_maps_url,
    website_url: s.website_url,
    phone: s.phone,
    service_postcodes: s.service_postcodes,
    delivery_info: s.delivery_info,
    opening_hours: s.opening_hours ?? null,
    brands: Array.from(brandMap.values()),
  }
}
