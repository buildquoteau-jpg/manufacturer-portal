import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  // Verify the shared secret so only Supabase can call this endpoint
  const secret = req.headers.get('x-webhook-secret')
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: { record?: Record<string, unknown> }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const record = payload.record
  if (!record?.widget_id) {
    return NextResponse.json({ error: 'No record' }, { status: 400 })
  }

  // Use service role key to read the supplier's email (not exposed to the browser)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: widget } = await supabase
    .from('embed_widgets')
    .select('suppliers ( name, email )')
    .eq('id', record.widget_id)
    .single()

  const supplier = (widget as { suppliers: { name: string; email: string | null } | null } | null)?.suppliers

  if (!supplier?.email) {
    // No email on file — skip silently so the webhook doesn't retry forever
    return NextResponse.json({ ok: true, skipped: 'no supplier email' })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const productLine = [record.product_code, record.system_name].filter(Boolean).join(' — ')
  const subject = `New enquiry: ${productLine}`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px;">
              <span style="font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">
                BUILD<span style="color:#16a34a;">QUOTE</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">

              <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">
                You have a new product enquiry
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;">
                A visitor submitted a request via your BuildQuote widget.
              </p>

              <!-- Product pill -->
              <div style="display:inline-block;background:#f0fdf4;color:#15803d;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:24px;">
                ${productLine}
              </div>

              <!-- Details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f3f4f6;">
                ${[
                  ['Name',    record.name],
                  ['Email',   record.email],
                  ['Phone',   record.phone || '—'],
                ].map(([label, value]) => `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#6b7280;width:80px;">${label}</td>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;">${value}</td>
                </tr>`).join('')}
              </table>

              ${record.message ? `
              <!-- Message -->
              <div style="margin-top:20px;background:#f9fafb;border-radius:8px;padding:16px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9ca3af;">Message</p>
                <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${String(record.message).replace(/\n/g, '<br/>')}</p>
              </div>` : ''}

              <!-- Reply button -->
              <div style="margin-top:28px;">
                <a href="mailto:${record.email}?subject=Re: ${encodeURIComponent(subject)}"
                   style="display:inline-block;background:#1b3a2d;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
                  Reply to ${record.name}
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;font-size:11px;color:#9ca3af;">
              Sent via BuildQuote · <a href="https://mfp.buildquote.com.au/supplier/${supplier.name?.toLowerCase().replace(/\s+/g, '-')}" style="color:#9ca3af;">View your portal</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = [
    `New product enquiry — ${productLine}`,
    '',
    `Name:    ${record.name}`,
    `Email:   ${record.email}`,
    `Phone:   ${record.phone || '—'}`,
    '',
    record.message ? `Message:\n${record.message}` : '',
    '',
    `Reply directly to: ${record.email}`,
  ].filter(l => l !== undefined).join('\n')

  const { error } = await resend.emails.send({
    from: 'BuildQuote <enquiries@buildquote.com.au>',
    to:   [supplier.email],
    replyTo: String(record.email),
    subject,
    html,
    text,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
