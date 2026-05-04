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

// GET /api/admin/system-profiles?system_id=xxx
export async function GET(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const systemId = searchParams.get('system_id')
  if (!systemId) return NextResponse.json({ error: 'system_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('system_profiles')
    .select('*')
    .eq('system_id', systemId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profiles: data })
}

// POST /api/admin/system-profiles
export async function POST(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { system_id, name, product_code, dimensions, length_m, sort_order } = await req.json()
  if (!system_id) return NextResponse.json({ error: 'system_id required' }, { status: 400 })
  if (!product_code?.trim() && !name?.trim())
    return NextResponse.json({ error: 'Name or product code required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('system_profiles')
    .insert({
      system_id,
      name: name?.trim() || null,
      product_code: product_code?.trim() || null,
      dimensions: dimensions?.trim() || null,
      length_m: length_m ? parseFloat(length_m) : null,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

// DELETE /api/admin/system-profiles  { id }
export async function DELETE(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('system_profiles')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
