import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'

export async function POST(req: Request) {
  const auth = req.headers.get('x-admin-password')
  if (auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { widgetId, systemIds } = await req.json()
  if (!widgetId || !Array.isArray(systemIds)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Service role bypasses RLS — safe to delete then re-insert
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
