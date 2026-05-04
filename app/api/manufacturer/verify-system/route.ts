import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Verify the session token and return the user id, or null
async function getUserId(req: Request): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user?.id ?? null
}

// Verify the system belongs to a manufacturer owned by this user
async function ownsSystem(userId: string, systemId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('systems')
    .select('id, manufacturers!inner(auth_user_id)')
    .eq('id', systemId)
    .single()
  if (!data) return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any).manufacturers?.auth_user_id === userId
}

// POST — verify a system
export async function POST(req: Request) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { systemId, verifiedBy, changeNotes } = await req.json()
  if (!systemId)   return NextResponse.json({ error: 'systemId required' }, { status: 400 })
  if (!verifiedBy?.trim()) return NextResponse.json({ error: 'verifiedBy required' }, { status: 400 })

  if (!(await ownsSystem(userId, systemId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('systems')
    .update({
      verified_by:          verifiedBy.trim(),
      verified_at:          new Date().toISOString(),
      change_notes:         changeNotes?.trim() || null,
      verification_status:  'Manufacturer verified',
    })
    .eq('id', systemId)
    .select('id, verified_by, verified_at, change_notes, verification_status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ system: data })
}

// DELETE — remove verification from a system
export async function DELETE(req: Request) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { systemId } = await req.json()
  if (!systemId) return NextResponse.json({ error: 'systemId required' }, { status: 400 })

  if (!(await ownsSystem(userId, systemId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('systems')
    .update({
      verified_by:         null,
      verified_at:         null,
      change_notes:        null,
      verification_status: null,
    })
    .eq('id', systemId)
    .select('id, verified_by, verified_at, change_notes, verification_status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ system: data })
}
