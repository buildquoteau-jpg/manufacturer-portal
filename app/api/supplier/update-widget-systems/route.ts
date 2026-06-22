import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { widgetId, systemIds, supplierSlug, password } = await req.json()
  if (!widgetId || !Array.isArray(systemIds) || !supplierSlug) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // ── Auth: accept either JWT (new) or portal_password (legacy) ─────────────
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  let supplierId: string | null = null

  if (token) {
    // JWT path — verify session and check auth_user_id matches supplier
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: supplier } = await supabaseAdmin
      .from('suppliers')
      .select('id, auth_user_id')
      .eq('slug', supplierSlug)
      .single()

    if (!supplier || supplier.auth_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    supplierId = supplier.id
  } else if (password) {
    // Legacy portal_password path
    const { data: supplier, error: supErr } = await supabaseAdmin
      .from('suppliers')
      .select('id, portal_password')
      .eq('slug', supplierSlug)
      .single()

    if (supErr || !supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    if (supplier.portal_password !== password) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    supplierId = supplier.id
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Confirm the widget belongs to this supplier
  const { data: widget, error: widErr } = await supabaseAdmin
    .from('embed_widgets')
    .select('id')
    .eq('id', widgetId)
    .eq('supplier_id', supplierId)
    .single()

  if (widErr || !widget) return NextResponse.json({ error: 'Widget not found' }, { status: 404 })

  // Delete existing selections then re-insert
  const { error: delErr } = await supabaseAdmin
    .from('embed_widget_systems')
    .delete()
    .eq('embed_widget_id', widgetId)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  if (systemIds.length > 0) {
    const { error: insErr } = await supabaseAdmin
      .from('embed_widget_systems')
      .insert(
        systemIds.map((sid: string, i: number) => ({
          embed_widget_id: widgetId,
          system_id: sid,
          sort_order: i,
        }))
      )
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
