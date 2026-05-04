import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'

function checkAuth(req: Request) {
  return req.headers.get('x-admin-password') === ADMIN_PASSWORD
}

// GET /api/admin/manufacturer-widget?manufacturer_id=xxx
// Returns the active widget for a manufacturer (if any) + its selected system IDs
export async function GET(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const manufacturerId = searchParams.get('manufacturer_id')
  if (!manufacturerId) return NextResponse.json({ error: 'manufacturer_id required' }, { status: 400 })

  const { data } = await supabaseAdmin
    .from('embed_widgets')
    .select('id, public_token, embed_widget_systems(system_id)')
    .eq('manufacturer_id', manufacturerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return NextResponse.json({ widget: null, systemIds: [] })

  return NextResponse.json({
    widget: { id: data.id, token: (data as any).public_token },
    systemIds: ((data as any).embed_widget_systems || []).map((ws: any) => ws.system_id),
  })
}

// POST /api/admin/manufacturer-widget
// Creates or updates the widget for a manufacturer with the given system IDs
export async function POST(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { manufacturer_id, system_ids } = await req.json()
  if (!manufacturer_id) return NextResponse.json({ error: 'manufacturer_id required' }, { status: 400 })

  // Find or create widget
  const { data: existing } = await supabaseAdmin
    .from('embed_widgets')
    .select('id, public_token')
    .eq('manufacturer_id', manufacturer_id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  let widgetId: string
  let token: string

  if (existing) {
    widgetId = existing.id
    token = (existing as any).public_token
  } else {
    const { data: created, error } = await supabaseAdmin
      .from('embed_widgets')
      .insert({ manufacturer_id, name: 'Product Widget', status: 'active' })
      .select('id, public_token')
      .single()
    if (error || !created) {
      return NextResponse.json({ error: error?.message || 'Failed to create widget' }, { status: 500 })
    }
    widgetId = created.id
    token = (created as any).public_token
  }

  // Replace systems
  await supabaseAdmin.from('embed_widget_systems').delete().eq('embed_widget_id', widgetId)

  if (system_ids?.length > 0) {
    const { error: insErr } = await supabaseAdmin
      .from('embed_widget_systems')
      .insert(
        system_ids.map((sid: string, i: number) => ({
          embed_widget_id: widgetId,
          system_id: sid,
          sort_order: i,
        }))
      )
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ widget: { id: widgetId, token } })
}
