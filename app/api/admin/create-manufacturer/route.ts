import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'

export async function POST(req: Request) {
  if (req.headers.get('x-admin-password') !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, slug, logo_url, website_url, description, login_email, login_password, abn, phone, contacts = [] } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!slug?.trim()) return NextResponse.json({ error: 'Slug is required' }, { status: 400 })

  let authUserId: string | null = null

  // Create auth user if email + password provided
  if (login_email?.trim() && login_password?.trim()) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: login_email.trim(),
      password: login_password.trim(),
      email_confirm: true,
    })
    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json({ error: `A login account for ${login_email} already exists.` }, { status: 409 })
      }
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 })
    }
    authUserId = authData.user?.id ?? null
  }

  const { data, error } = await supabaseAdmin
    .from('manufacturers')
    .insert({
      name:         name.trim(),
      slug:         slug.trim(),
      logo_url:     logo_url    || null,
      website_url:  website_url || null,
      description:  description || null,
      abn:          abn?.trim() || null,
      phone:        phone?.trim() || null,
      auth_user_id: authUserId,
    })
    .select()
    .single()

  if (error) {
    if (authUserId) await supabaseAdmin.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Save contacts
  type ContactInput = { name: string; role?: string; email?: string; phone?: string }
  const validContacts = (contacts as ContactInput[]).filter((c) => c.name?.trim())
  if (validContacts.length) {
    await supabaseAdmin.from('portal_contacts').insert(
      validContacts.map((c, i) => ({
        entity_type: 'manufacturer',
        entity_id:   data.id,
        name:        c.name.trim(),
        role:        c.role?.trim()  || null,
        email:       c.email?.trim() || null,
        phone:       c.phone?.trim() || null,
        sort_order:  i,
      }))
    )
  }

  return NextResponse.json({ manufacturer: data })
}

export async function PATCH(req: Request) {
  if (req.headers.get('x-admin-password') !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, name, slug, logo_url, website_url, description } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('manufacturers')
    .update({
      name:        name?.trim(),
      slug:        slug?.trim(),
      logo_url:    logo_url    || null,
      website_url: website_url || null,
      description: description || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ manufacturer: data })
}
