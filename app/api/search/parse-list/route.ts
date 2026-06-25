import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const { text } = await req.json() as { text: string }

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Parse this building materials list into a JSON array.
Each item must have:
- qty: number (the count — e.g. for "6 @ 2.7M", qty is 6; for "x 10 sheets", qty is 10)
- name: string (include all specs, grade, dimensions and length — e.g. "H2 190x35 @ 3.6m", "H4 100x100 F7 Pine Post @ 2.7m")
- uom: string (infer if not stated: EA, LM, BAG, SHEET, M2, TUBE, ROLL — use LM for timber lengths)
Rules:
- For "N @ Xm" entries: qty = N, include "@ Xm" in the name
- If two lengths are offered (e.g. "2.7m or 3.0m"), include both in the name
- Always include dimension specs and grade in the name
Return ONLY a valid JSON array, no markdown, no explanation.

List:
${text}`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 })
    }

    let items: unknown
    try {
      items = JSON.parse(content.text.trim())
    } catch {
      const match = content.text.match(/\[[\s\S]*\]/)
      if (match) {
        items = JSON.parse(match[0])
      } else {
        return NextResponse.json({ error: 'Could not parse list' }, { status: 422 })
      }
    }

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[search/parse-list]', err)
    return NextResponse.json({ error: 'Parse error' }, { status: 500 })
  }
}
