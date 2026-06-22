import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

const ALLOWED_FIELDS = [
  'name', 'address', 'suburb', 'state', 'website_url', 'email', 'phone',
  'bio', 'hero_photo_url', 'hero_photo_y', 'hero_photo_zoom', 'google_maps_url',
  'service_postcodes', 'delivery_info', 'first_login',
]

export async function PATCH(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { supplierSlug, ...updates } = body

  if (!supplierSlug) return NextResponse.json({ error: 'supplierSlug required' }, { status: 400 })

  const { data: supplier } = await supabaseAdmin
    .from('suppliers')
    .select('id, auth_user_id')
    .eq('slug', supplierSlug)
    .single()

  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const isAdmin = ADMIN_EMAIL && user.email === ADMIN_EMAIL
  if (!isAdmin && supplier.auth_user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Only allow known fields to be updated
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED_FIELDS.includes(k))
  )

  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .update(safeUpdates)
    .eq('id', supplier.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, supplier: data })
}
