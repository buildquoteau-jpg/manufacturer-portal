import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

export async function POST(req: Request) {
  try {
    const { imageBase64, mediaType } = await req.json() as {
      imageBase64: string
      mediaType: ImageMediaType
    }

    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `Extract all items from this building materials list or handwritten note.
Return a JSON array where each item has: qty (number), name (string), uom (string — infer if not stated: EA, LM, BAG, SHEET, M2).
Return ONLY a valid JSON array, no markdown, no explanation.`,
          },
        ],
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
        return NextResponse.json({ error: 'Could not read items from image' }, { status: 422 })
      }
    }

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[search/extract-from-image]', err)
    return NextResponse.json({ error: 'Extraction error' }, { status: 500 })
  }
}
