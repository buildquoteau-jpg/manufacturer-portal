import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Gallery images (multiple hero photos per system) only exist for systems
// published through the newer "hybrid instant-publish" pipeline
// (buildquote-data-studio's publishCardLive) — they live in published_cards
// .card_json, a separate table from the plain systems row every system has.
// V6 itself reads this table with a service-role client, not anon, so this
// route does the same server-side rather than querying it from the browser.
// No auth required — published_cards is exactly the data the public
// library already serves to anyone.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mfrSlug = searchParams.get('mfrSlug')
  const systemSlug = searchParams.get('systemSlug')

  if (!mfrSlug || !systemSlug) {
    return NextResponse.json({ error: 'mfrSlug and systemSlug are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('published_cards')
    .select('card_json')
    .eq('mfr_slug', mfrSlug)
    .eq('slug', systemSlug)
    .eq('is_latest', true)
    .eq('status', 'published')
    .maybeSingle()

  // No published card for this system yet (most systems, today) — that's
  // normal, not an error. The card just renders its single hero_image_url.
  if (error || !data) {
    return NextResponse.json({ gallery_images: null })
  }

  const cardJson = data.card_json as { gallery_images?: unknown } | null
  return NextResponse.json({ gallery_images: cardJson?.gallery_images ?? null })
}
