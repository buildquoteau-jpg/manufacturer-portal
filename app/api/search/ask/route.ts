import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

type SystemSummary = {
  name: string
  product_code: string | null
  description: string | null
  category: string
  manufacturers?: { name: string } | null
}

export async function POST(req: Request) {
  try {
    const { question, systemContext } = await req.json() as {
      question: string
      systemContext: SystemSummary[]
    }

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 })
    }

    const contextText = systemContext?.length
      ? systemContext
          .map(s =>
            `- ${s.name}${s.product_code ? ` (${s.product_code})` : ''} — ${s.category}` +
            (s.manufacturers?.name ? ` by ${s.manufacturers.name}` : '') +
            (s.description ? `: ${s.description}` : '')
          )
          .join('\n')
      : 'No specific catalogue context available.'

    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: `You are BuildQuote's product assistant for South West WA builders.
Answer using ONLY the provided catalogue systems. Never invent technical specs.
Be concise and technical. Cite product names when relevant.
If the question cannot be answered from the provided catalogue systems — whether because it is off-topic, outside the building industry, or simply not covered by the listed systems — respond with ONLY the exact text "SCOPE_LIMIT" and nothing else. Do not explain. Do not apologise. Just "SCOPE_LIMIT".`,
      messages: [{
        role: 'user',
        content: `Relevant catalogue systems:\n${contextText}\n\nQuestion: ${question}`,
      }],
    })

    const readable = new ReadableStream({
      start(controller) {
        stream.on('text', (text) => {
          controller.enqueue(new TextEncoder().encode(text))
        })
        stream.on('finalMessage', () => controller.close())
        stream.on('error', (err) => controller.error(err))
      },
      cancel() {
        stream.abort()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[search/ask]', err)
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
}
