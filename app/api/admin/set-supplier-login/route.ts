import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'

export async function POST(req: Request) {
  if (req.headers.get('x-admin-password') !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { supplier_id, email, password } = await req.json()
  if (!supplier_id)     return NextResponse.json({ error: 'supplier_id required' }, { status: 400 })
  if (!email?.trim())   return NextResponse.json({ error: 'email required' }, { status: 400 })
  if (!password?.trim()) return NextResponse.json({ error: 'password required' }, { status: 400 })

  // Confirm supplier exists and has no login yet
  const { data: supplier, error: supErr } = await supabaseAdmin
    .from('suppliers')
    .select('id, name, auth_user_id')
    .eq('id', supplier_id)
    .single()

  if (supErr || !supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  if (supplier.auth_user_id) return NextResponse.json({ error: 'This supplier already has a login. Use the Supabase dashboard to update the password.' }, { status: 409 })

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password: password.trim(),
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      return NextResponse.json({ error: `An auth account for ${email} already exists. Use a different email.` }, { status: 409 })
    }
    return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 })
  }

  const authUserId = authData.user?.id
  if (!authUserId) return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })

  // Link auth user to supplier
  const { error: updateError } = await supabaseAdmin
    .from('suppliers')
    .update({ auth_user_id: authUserId })
    .eq('id', supplier_id)

  if (updateError) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, auth_user_id: authUserId })
}
