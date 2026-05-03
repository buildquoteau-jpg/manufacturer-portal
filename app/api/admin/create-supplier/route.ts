import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

type ContactInput = { name: string; role?: string; email?: string; phone?: string }

export async function POST(req: Request) {
  if (req.headers.get('x-admin-password') !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    name, address, suburb, state, website_url, email, phone, abn,
    login_password,
    system_ids,
    contacts = [],   // array of { name, role, email, phone }
  } = await req.json()

  if (!name?.trim())           return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
  if (!email?.trim())          return NextResponse.json({ error: 'Login email is required' }, { status: 400 })
  if (!login_password?.trim()) return NextResponse.json({ error: 'Login password is required' }, { status: 400 })
  if (!system_ids?.length)     return NextResponse.json({ error: 'Select at least one product' }, { status: 400 })

  const slug = slugify(name.trim())

  // ── 1. Create Supabase Auth user ──────────────────────────────────────────
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password: login_password.trim(),
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      return NextResponse.json({ error: `A login account for ${email} already exists. Use a different email.` }, { status: 409 })
    }
    return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 })
  }

  const authUserId = authData.user?.id
  if (!authUserId) return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })

  // ── 2. Create supplier record ─────────────────────────────────────────────
  const { data: supplier, error: supErr } = await supabaseAdmin
    .from('suppliers')
    .insert({
      name:         name.trim(),
      slug,
      auth_user_id: authUserId,
      address:      address?.trim()     || null,
      suburb:       suburb?.trim()      || null,
      state:        state               || null,
      website_url:  website_url?.trim() || null,
      email:        email.trim(),
      phone:        phone?.trim()       || null,
      abn:          abn?.trim()         || null,
    })
    .select()
    .single()

  if (supErr) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: supErr.message }, { status: 500 })
  }

  // ── 3. Save contacts ──────────────────────────────────────────────────────
  const validContacts = (contacts as ContactInput[]).filter(c => c.name?.trim())
  if (validContacts.length) {
    await supabaseAdmin.from('portal_contacts').insert(
      validContacts.map((c, i) => ({
        entity_type: 'supplier',
        entity_id:   supplier.id,
        name:        c.name.trim(),
        role:        c.role?.trim()  || null,
        email:       c.email?.trim() || null,
        phone:       c.phone?.trim() || null,
        sort_order:  i,
      }))
    )
  }

  // ── 4. Create embed widget ────────────────────────────────────────────────
  const { data: widget, error: widErr } = await supabaseAdmin
    .from('embed_widgets')
    .insert({ supplier_id: supplier.id, status: 'active' })
    .select()
    .single()

  if (widErr) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId)
    await supabaseAdmin.from('suppliers').delete().eq('id', supplier.id)
    return NextResponse.json({ error: widErr.message }, { status: 500 })
  }

  // ── 5. Attach systems to widget ───────────────────────────────────────────
  const { error: sysErr } = await supabaseAdmin
    .from('embed_widget_systems')
    .insert(system_ids.map((sid: string, i: number) => ({
      embed_widget_id: widget.id,
      system_id: sid,
      sort_order: i,
    })))

  if (sysErr) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId)
    await supabaseAdmin.from('embed_widgets').delete().eq('id', widget.id)
    await supabaseAdmin.from('suppliers').delete().eq('id', supplier.id)
    return NextResponse.json({ error: sysErr.message }, { status: 500 })
  }

  return NextResponse.json({
    supplier,
    widget: { id: widget.id, public_token: widget.public_token },
    slug,
  })
}
