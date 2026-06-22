import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { supplierSlug, systemIds } = await req.json()

  if (!supplierSlug)               return NextResponse.json({ error: 'supplierSlug required' }, { status: 400 })
  if (!Array.isArray(systemIds) || systemIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one product' }, { status: 400 })
  }

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

  // Create the widget
  const { data: widget, error: widErr } = await supabaseAdmin
    .from('embed_widgets')
    .insert({ supplier_id: supplier.id, status: 'active' })
    .select()
    .single()

  if (widErr) return NextResponse.json({ error: widErr.message }, { status: 500 })

  // Attach systems
  const { error: sysErr } = await supabaseAdmin
    .from('embed_widget_systems')
    .insert(
      systemIds.map((sid: string, i: number) => ({
        embed_widget_id: widget.id,
        system_id: sid,
        sort_order: i,
      }))
    )

  if (sysErr) {
    await supabaseAdmin.from('embed_widgets').delete().eq('id', widget.id)
    return NextResponse.json({ error: sysErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, widget })
}
