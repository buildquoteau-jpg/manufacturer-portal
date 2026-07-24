// Trade Desk multi-channel delivery — direct Twilio REST calls (no SDK dependency
// needed for a single POST endpoint). Every export degrades gracefully when
// Twilio env vars aren't set yet, so the rest of the app never has to guard
// against this module throwing.

export type MessageSendResult =
  | { ok: true; sid: string }
  | { ok: false; reason: 'not_configured' | 'send_failed'; error?: string }

export function isSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_SMS_FROM
  )
}

export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM &&
    // Approved Meta message template SID — required because the customer
    // hasn't messaged us first, so there's no open service window yet.
    process.env.TWILIO_WHATSAPP_CONTENT_SID
  )
}

export function messagingStatus() {
  return { sms: isSmsConfigured(), whatsapp: isWhatsAppConfigured() }
}

// Shared "thanks for visiting" copy — sent verbatim via SMS, and used as the
// WhatsApp template variables. The existing review-link email keeps its own
// HTML template but should read in the same voice as this.
export function buildThanksMessage({
  supplierName,
  customerName,
  reviewUrl,
}: {
  supplierName: string
  customerName: string | null
  reviewUrl: string
}): string {
  const greeting = customerName ? `Hi ${customerName}` : 'Hi'
  return `${greeting}, thanks for visiting ${supplierName} today! Here are the product options we discussed: ${reviewUrl} — have a look, chat it over with your builder, and come back to us whenever you're ready to move forward.`
}

function normalizeAuMobile(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('0')) return '+61' + digits.slice(1)
  if (digits.startsWith('61')) return '+' + digits
  return digits
}

async function twilioRequest(body: URLSearchParams): Promise<MessageSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, reason: 'send_failed', error: json.message || `Twilio error ${res.status}` }
    }
    return { ok: true, sid: json.sid }
  } catch (err) {
    return { ok: false, reason: 'send_failed', error: err instanceof Error ? err.message : 'Network error' }
  }
}

export async function sendSms({
  to,
  supplierName,
  customerName,
  reviewUrl,
}: {
  to: string
  supplierName: string
  customerName: string | null
  reviewUrl: string
}): Promise<MessageSendResult> {
  if (!isSmsConfigured()) return { ok: false, reason: 'not_configured' }
  return twilioRequest(
    new URLSearchParams({
      To: normalizeAuMobile(to),
      From: process.env.TWILIO_SMS_FROM!,
      Body: buildThanksMessage({ supplierName, customerName, reviewUrl }),
    })
  )
}

export async function sendWhatsApp({
  to,
  supplierName,
  customerName,
  reviewUrl,
}: {
  to: string
  supplierName: string
  customerName: string | null
  reviewUrl: string
}): Promise<MessageSendResult> {
  if (!isWhatsAppConfigured()) return { ok: false, reason: 'not_configured' }
  // ContentVariables numbering must match whatever the approved Meta template
  // actually uses — verify against the real template once it's approved.
  return twilioRequest(
    new URLSearchParams({
      To: `whatsapp:${normalizeAuMobile(to)}`,
      From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM!}`,
      ContentSid: process.env.TWILIO_WHATSAPP_CONTENT_SID!,
      ContentVariables: JSON.stringify({
        '1': customerName || 'there',
        '2': supplierName,
        '3': reviewUrl,
      }),
    })
  )
}
