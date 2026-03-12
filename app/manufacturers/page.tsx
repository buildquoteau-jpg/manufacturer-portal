'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import manufacturersData from '@/data/manufacturers.json'

type JsonManufacturer = {
  slug: string
  name: string
  description?: string | null
  country?: string | null
  systems?: Array<{ name?: string; application?: string }>
}

type ManufacturerCard = JsonManufacturer & {
  systemCount: number
}

const manufacturers = manufacturersData as JsonManufacturer[]

function ManufacturersPageInner() {
  const [query, setQuery] = useState('')
  const [countsBySlug, setCountsBySlug] = useState<Record<string, number>>({})

  const searchParams = useSearchParams()
  const draft = searchParams.get('draft')

  useEffect(() => {
    async function loadCounts() {
      const { data: manufacturerRows } = await supabase
        .from('manufacturers')
        .select('id, slug')

      if (!manufacturerRows?.length) return

      const ids = manufacturerRows.map((m) => m.id)

      const { data: systemRows } = await supabase
        .from('systems')
        .select('manufacturer_id')

      if (!systemRows) return

      const idToSlug = new Map<string, string>()
      for (const m of manufacturerRows) idToSlug.set(m.id, m.slug)

      const next: Record<string, number> = {}
      for (const row of systemRows) {
        const slug = idToSlug.get(row.manufacturer_id)
        if (!slug) continue
        next[slug] = (next[slug] || 0) + 1
      }

      setCountsBySlug(next)
    }

    loadCounts()
  }, [])

  const enriched: ManufacturerCard[] = useMemo(
    () =>
      manufacturers.map((m) => ({
        ...m,
        systemCount: countsBySlug[m.slug] ?? m.systems?.length ?? 0,
      })),
    [countsBySlug]
  )

  const filtered = useMemo(
    () =>
      query.trim()
        ? enriched.filter(
            (m) =>
              m.name.toLowerCase().includes(query.toLowerCase()) ||
              (m.systems || []).some(
                (s) =>
                  s.name?.toLowerCase().includes(query.toLowerCase()) ||
                  s.application?.toLowerCase().includes(query.toLowerCase())
              )
          )
        : enriched,
    [query, enriched]
  )

  function withDraft(path: string) {
    return draft ? `${path}?draft=${encodeURIComponent(draft)}` : path
  }

  return (
    <div className="min-h-screen bg-page text-text-primary">
      <nav className="flex justify-between items-center px-4 md:px-8 py-4 border-b border-border">
        <a href={withDraft('/')} className="font-bold tracking-widest text-sm md:text-base">
          BUILD<span className="text-brand">QUOTE</span>
        </a>
        <span className="text-xs tracking-widest text-text-faint uppercase hidden sm:block">
          Manufacturer Portal
        </span>
      </nav>

      <section className="px-4 md:px-8 pt-10 pb-6 max-w-4xl">
        <p className="text-brand text-xs tracking-[0.35em] uppercase mb-3">
          Product Intelligence
        </p>

        <h1 className="text-4xl md:text-6xl font-bold leading-[0.9] uppercase mb-4">
          Manufacturer
          <br />
          Portal
        </h1>

        <p className="text-text-secondary text-sm md:text-base max-w-xl leading-relaxed">
          Browse systems and component cards from leading Australian building product manufacturers.
          Select components and send directly to BuildQuote.
        </p>

        <div className="flex gap-3 mt-6 border border-sand/40 bg-sand/5 px-4 py-3 text-xs text-text-secondary max-w-xl">
          <span className="text-sand">⚠</span>
          <p>
            Component cards are compiled using AI and publicly available manufacturer data.
            Always verify specifications and compatibility on the manufacturer&apos;s website.
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8 pb-4">
        <input
          type="text"
          placeholder="Search manufacturers or systems..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md bg-ui border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-brand"
        />
      </div>

      <section className="px-4 md:px-8 pb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <a
            key={m.slug}
            href={withDraft(`/manufacturers/${m.slug}`)}
            className="bg-surface border border-border hover:border-brand hover:bg-surface-hover rounded-lg p-5 flex flex-col gap-3 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 flex items-center justify-center border border-border text-brand text-sm font-bold">
                {m.name
                  .split(' ')
                  .map((w: string) => w[0])
                  .join('')}
              </div>

              <div className="text-right text-xs text-text-faint uppercase tracking-widest">
                <div className="text-brand">{m.country || 'Manufacturer'}</div>
                <div>{m.systemCount} systems</div>
              </div>
            </div>

            <h2 className="text-lg font-bold uppercase tracking-wide">{m.name}</h2>

            <p className="text-sm text-text-secondary leading-relaxed flex-1">{m.description}</p>

            <div className="text-right text-text-faint text-lg">↗</div>
          </a>
        ))}

        <div className="bg-surface border border-border rounded-lg p-5 opacity-50 flex flex-col gap-3">
          <div className="w-12 h-12 flex items-center justify-center border border-border text-text-faint">
            +
          </div>
          <h2 className="font-bold uppercase">More Coming Soon</h2>
          <p className="text-sm text-text-secondary">Additional manufacturers being added.</p>
        </div>
      </section>

      <footer className="border-t border-border px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between text-xs text-text-faint gap-2">
        <span>© 2025 BuildQuote</span>
        <span>Southwest WA · Australia</span>
        <span>Manufacturer data updated Feb 2026</span>
      </footer>
    </div>
  )
}


export default function ManufacturersPage() {
  return (
    <Suspense fallback={<div className=\"min-h-screen bg-page text-text-primary p-6\">Loading manufacturer portal…</div>}>
      <ManufacturersPageInner />
    </Suspense>
  )
}
