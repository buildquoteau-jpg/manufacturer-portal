import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Look up and validate the token
  const { data: tokenRow } = await supabase
    .from('supplier_tokens')
    .select('id, supplier_id, used, expires_at')
    .eq('token', token)
    .single()

  if (!tokenRow) {
    return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 400 })
  }
  if (tokenRow.used) {
    return NextResponse.json({ error: 'This link has already been used.' }, { status: 400 })
  }
  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired. Please request a new one.' }, { status: 400 })
  }

  // Mark token as used
  await supabase
    .from('supplier_tokens')
    .update({ used: true })
    .eq('id', tokenRow.id)

  // Save new password
  await supabase
    .from('suppliers')
    .update({ portal_password: password })
    .eq('id', tokenRow.supplier_id)

  // Return the supplier slug so we can redirect to their portal
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('slug')
    .eq('id', tokenRow.supplier_id)
    .single()

  return NextResponse.json({ ok: true, slug: supplier?.slug })
}
