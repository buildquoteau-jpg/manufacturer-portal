import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'
function auth(req: Request) {
  return req.headers.get('x-admin-password') === ADMIN_PASSWORD
}

// GET — fetch all contacts for an entity
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const entity_type = searchParams.get('entity_type')
  const entity_id   = searchParams.get('entity_id')
  if (!entity_type || !entity_id) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin
    .from('portal_contacts')
    .select('*')
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id)
    .order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contacts: data })
}

// POST — replace all contacts for an entity (pass full array)
export async function POST(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { entity_type, entity_id, contacts } = await req.json()
  if (!entity_type || !entity_id) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 })
  }

  // Delete existing and re-insert (simplest replace strategy)
  await supabaseAdmin.from('portal_contacts')
    .delete()
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id)

  if (contacts?.length) {
    const rows = contacts
      .filter((c: { name?: string }) => c.name?.trim())
      .map((c: { name: string; role?: string; email?: string; phone?: string }, i: number) => ({
        entity_type,
        entity_id,
        name:       c.name.trim(),
        role:       c.role?.trim()  || null,
        email:      c.email?.trim() || null,
        phone:      c.phone?.trim() || null,
        sort_order: i,
      }))
    if (rows.length) {
      const { error } = await supabaseAdmin.from('portal_contacts').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

// DELETE — remove a single contact by id
export async function DELETE(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('portal_contacts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
