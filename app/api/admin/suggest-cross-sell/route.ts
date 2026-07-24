import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'

// Authoring aid only — never inserts anything itself. Staff review each
// suggestion and click "+ Add" to accept it through the normal create
// endpoint (category-cross-sell/route.ts). Kept entirely out of the
// customer/staff-facing Trade Desk runtime path.
export async function POST(req: Request) {
  if (req.headers.get('x-admin-password') !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI suggestions are not configured (ANTHROPIC_API_KEY missing)' }, { status: 503 })
  }

  const { category } = await req.json()
  if (!category?.trim()) return NextResponse.json({ error: 'category required' }, { status: 400 })

  const { data: rows } = await supabaseAdmin.from('systems').select('category')
  const allCategories = Array.from(new Set((rows ?? []).map((r: { category: string }) => r.category))).sort()

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You help a building-materials trade desk decide which product categories to suggest together (e.g. a customer buying decking might also want deck oils, subfloor materials, or pergola posts).

Existing catalogue categories: ${JSON.stringify(allCategories)}.

For the category "${category}", propose up to 5 OTHER categories from that exact list (never invent new ones) that a customer buying this would plausibly also need, each with a one-sentence rationale.

Respond with ONLY a JSON array like [{"to_category": "...", "rationale": "..."}], no prose, no markdown fences.`,
    }],
  })

  const textBlock = msg.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  let suggestions: { to_category: string; rationale: string }[] = []
  try {
    suggestions = JSON.parse(textBlock?.text ?? '[]')
  } catch {
    suggestions = []
  }

  suggestions = suggestions.filter(s => allCategories.includes(s.to_category) && s.to_category !== category)

  return NextResponse.json({ suggestions })
}
