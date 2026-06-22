import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

function makeToken() {
  return randomBytes(32).toString('hex')
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Look up supplier by email
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, name, email')
    .eq('email', email.toLowerCase().trim())
    .single()

  // Always return success so we don't reveal whether an email exists
  if (!supplier) return NextResponse.json({ ok: true })

  const token = makeToken()

  await supabase.from('supplier_tokens').insert({
    supplier_id: supplier.id,
    token,
    type: 'reset',
  })

  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mfp.buildquote.com.au'}/supplier/reset/${token}`

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'BuildQuote <enquiries@buildquote.com.au>',
    to: [supplier.email],
    subject: 'Reset your supplier portal password',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">
        <tr><td style="padding:0 0 20px;">
          <span style="font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">
            BUILD<span style="color:#16a34a;">QUOTE</span>
          </span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">Reset your password</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hi ${supplier.name}, click the button below to set a new password for your supplier portal.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#1b3a2d;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
            Set new password
          </a>
          <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
          <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;word-break:break-all;">${resetUrl}</p>
        </td></tr>
        <tr><td style="padding:16px 0 0;text-align:center;font-size:11px;color:#9ca3af;">
          BuildQuote · <a href="https://buildquote.com.au" style="color:#9ca3af;">buildquote.com.au</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Reset your BuildQuote supplier portal password\n\nHi ${supplier.name},\n\nClick this link to set a new password (expires in 24 hours):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  })

  return NextResponse.json({ ok: true })
}
