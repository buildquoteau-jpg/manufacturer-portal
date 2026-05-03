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

// GET — fetch all sources for a manufacturer
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const manufacturerId = searchParams.get('manufacturer_id')
  if (!manufacturerId) return NextResponse.json({ error: 'manufacturer_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('catalogue_sources')
    .select('*')
    .eq('manufacturer_id', manufacturerId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sources: data })
}

// POST — add a source document
export async function POST(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { manufacturer_id, document_name, document_url, document_date, extracted_by, notes } = await req.json()
  if (!manufacturer_id) return NextResponse.json({ error: 'manufacturer_id required' }, { status: 400 })
  if (!document_name?.trim()) return NextResponse.json({ error: 'document_name required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('catalogue_sources')
    .insert({
      manufacturer_id,
      document_name:  document_name.trim(),
      document_url:   document_url?.trim()   || null,
      document_date:  document_date?.trim()  || null,
      extracted_by:   extracted_by?.trim()   || 'BuildQuote admin',
      notes:          notes?.trim()          || null,
      extracted_at:   new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ source: data })
}

// DELETE — remove a source document
export async function DELETE(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('catalogue_sources')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
