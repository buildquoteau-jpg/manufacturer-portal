import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { widgetId, systemIds, supplierSlug, password } = await req.json()
  if (!widgetId || !Array.isArray(systemIds) || !supplierSlug || !password) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Verify the supplier password matches (read with service role to bypass RLS)
  const { data: supplier, error: supErr } = await supabaseAdmin
    .from('suppliers')
    .select('id, portal_password')
    .eq('slug', supplierSlug)
    .single()

  if (supErr || !supplier) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  }
  if (supplier.portal_password !== password) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Confirm the widget belongs to this supplier
  const { data: widget, error: widErr } = await supabaseAdmin
    .from('embed_widgets')
    .select('id')
    .eq('id', widgetId)
    .eq('supplier_id', supplier.id)
    .single()

  if (widErr || !widget) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
  }

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
