import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { sendSms, sendWhatsApp, type MessageSendResult } from '@/lib/messaging/twilio'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL || 'rfq@buildquote.com.au'

// ── Email template ────────────────────────────────────────────────────────────

function buildReviewEmail({
  supplierName,
  customerName,
  reviewUrl,
  productLines,
}: {
  supplierName: string
  customerName: string | null
  reviewUrl: string
  productLines: { name: string; manufacturer: string; productCode: string }[]
}) {
  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,'
  const productListHtml = productLines.map(p => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
        <strong style="color:#111827;font-size:14px;">${p.name}</strong><br>
        <span style="color:#6b7280;font-size:12px;">${p.manufacturer}${p.productCode ? ` &mdash; ${p.productCode}` : ''}</span>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Product review from ${supplierName}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0F1E26;padding:24px 32px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#6b8ea0;text-transform:uppercase;">
              BUILD<span style="color:#4A8FA0;">QUOTE</span>
            </p>
            <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#f5f2ed;">${supplierName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">${greeting}</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              <strong>${supplierName}</strong> has suggested the following product options for your project.
              Click the button below to review them, check your measurements, and send a quote request.
            </p>

            <!-- Product list -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;margin-bottom:28px;">
              ${productListHtml}
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#185D7A;border-radius:10px;">
                  <a href="${reviewUrl}" target="_blank"
                    style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.01em;">
                    Review products &amp; send quote request →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;word-break:break-all;">
              Or copy this link: <a href="${reviewUrl}" style="color:#185D7A;">${reviewUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              Sent via <a href="https://buildquote.com.au" style="color:#185D7A;text-decoration:none;">BuildQuote</a>
              &mdash; your details are shared only with ${supplierName}.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    supplierSlug, systemIds,
    customerName, customerMobile, customerEmail, staffNote,
    origin, channel: rawChannel,
  } = await req.json()

  const channel: 'email' | 'sms' | 'whatsapp' =
    rawChannel === 'sms' || rawChannel === 'whatsapp' ? rawChannel : 'email'

  if (!supplierSlug)
    return NextResponse.json({ error: 'supplierSlug required' }, { status: 400 })
  if (!Array.isArray(systemIds) || systemIds.length === 0)
    return NextResponse.json({ error: 'Select at least one product' }, { status: 400 })

  const { data: supplier } = await supabaseAdmin
    .from('suppliers')
    .select('id, name, auth_user_id')
    .eq('slug', supplierSlug)
    .single()

  if (!supplier)
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const isAdmin = ADMIN_EMAIL && user.email === ADMIN_EMAIL
  if (!isAdmin && supplier.auth_user_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Create session
  const { data: session, error: sessionErr } = await supabaseAdmin
    .from('customer_review_sessions')
    .insert({
      supplier_id:     supplier.id,
      customer_name:   customerName   || null,
      customer_mobile: customerMobile || null,
      customer_email:  customerEmail  || null,
      staff_note:      staffNote      || null,
    })
    .select('id, token')
    .single()

  if (sessionErr)
    return NextResponse.json({ error: sessionErr.message }, { status: 500 })

  // Attach systems
  const { error: itemsErr } = await supabaseAdmin
    .from('customer_review_session_items')
    .insert(
      systemIds.map((sid: string, i: number) => ({
        session_id: session.id,
        system_id:  sid,
        sort_order: i,
      }))
    )

  if (itemsErr) {
    await supabaseAdmin.from('customer_review_sessions').delete().eq('id', session.id)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 })
  }

  const reviewUrl = `${origin || 'https://mfp.buildquote.com.au'}/supplier-review/${session.token}`

  let delivery: MessageSendResult = { ok: false, reason: 'not_configured' }

  if (channel === 'email' && customerEmail) {
    const { data: systems } = await supabaseAdmin
      .from('systems')
      .select('name, product_code, manufacturers ( name )')
      .in('id', systemIds)

    const productLines = (systems ?? []).map((s: any) => ({
      name:        s.name,
      manufacturer: s.manufacturers?.name ?? '',
      productCode: s.product_code ?? '',
    }))

    const html = buildReviewEmail({
      supplierName: supplier.name,
      customerName: customerName || null,
      reviewUrl,
      productLines,
    })

    const subject = customerName
      ? `${customerName}, ${supplier.name} has suggested products for your project`
      : `${supplier.name} has suggested products for your project`

    const { data: sendData, error: emailErr } = await resend.emails.send({
      from:    `${supplier.name} via BuildQuote <${FROM_EMAIL}>`,
      to:      [customerEmail],
      subject,
      html,
    })

    delivery = emailErr
      ? { ok: false, reason: 'send_failed', error: emailErr.message }
      : { ok: true, sid: sendData?.id || '' }
  } else if (channel === 'sms' && customerMobile) {
    delivery = await sendSms({
      to: customerMobile,
      supplierName: supplier.name,
      customerName: customerName || null,
      reviewUrl,
    })
  } else if (channel === 'whatsapp' && customerMobile) {
    delivery = await sendWhatsApp({
      to: customerMobile,
      supplierName: supplier.name,
      customerName: customerName || null,
      reviewUrl,
    })
  }

  // Best-effort delivery tracking. PGRST204 = PostgREST "column not found in
  // schema cache" (its error when a column doesn't exist yet), 42703 = raw
  // Postgres "undefined column" as a fallback — either means the
  // 20260723_cross_sell_and_channel.sql migration hasn't been run yet.
  // Swallow it: the session/link already exist and still work either way.
  const { error: trackingErr } = await supabaseAdmin
    .from('customer_review_sessions')
    .update({
      preferred_channel: channel,
      email_sent:    channel === 'email'    ? delivery.ok : false,
      sms_sent:      channel === 'sms'      ? delivery.ok : false,
      whatsapp_sent: channel === 'whatsapp' ? delivery.ok : false,
      delivery_error: delivery.ok ? null : (delivery.error ?? delivery.reason ?? null),
    })
    .eq('id', session.id)

  if (trackingErr && trackingErr.code !== '42703' && trackingErr.code !== 'PGRST204') {
    console.error('customer_review_sessions delivery tracking update failed:', trackingErr.message)
  }

  return NextResponse.json({
    ok: true,
    token: session.token,
    channel,
    delivery: delivery.ok
      ? { sent: true }
      : { sent: false, reason: delivery.reason, error: delivery.error },
  })
}
