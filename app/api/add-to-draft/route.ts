import { NextResponse } from 'next/server'

// Server-side proxy — browser never crosses origins, no CORS needed.
// Forwards items from MFP to buildquote's save-draft-items API.

export async function POST(req: Request) {
  try {
    const { draftId, items } = await req.json()

    if (!draftId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing draftId or items' }, { status: 400 })
    }

    const buildquoteUrl = process.env.NEXT_PUBLIC_BUILDQUOTE_URL
    if (!buildquoteUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BUILDQUOTE_URL not set' }, { status: 500 })
    }

    const res = await fetch(`${buildquoteUrl}/api/save-draft-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId, items }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[add-to-draft]', err)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
