import { NextResponse } from 'next/server'

// Server-side proxy — creates a new RFQ draft on buildquote.com.au and returns its id.
export async function POST() {
  try {
    const buildquoteUrl = process.env.NEXT_PUBLIC_BUILDQUOTE_URL
    if (!buildquoteUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BUILDQUOTE_URL not set' }, { status: 500 })
    }

    const res = await fetch(`${buildquoteUrl}/api/create-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[create-draft]', err)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
