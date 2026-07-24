'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'

type Rule = {
  id: string
  from_category: string
  to_category: string
  note: string | null
}

type Suggestion = { to_category: string; rationale: string }

export default function CrossSellTab() {
  const [rules, setRules]             = useState<Rule[]>([])
  const [categories, setCategories]   = useState<string[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)

  const [fromCategory, setFromCategory] = useState('')
  const [toCategory, setToCategory]     = useState('')
  const [note, setNote]                 = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const [suggesting, setSuggesting]       = useState(false)
  const [suggestions, setSuggestions]     = useState<Suggestion[]>([])
  const [suggestError, setSuggestError]   = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoadingData(true)
    const [{ data: ruleRows, error: rulesErr }, { data: sysRows }] = await Promise.all([
      supabase.from('category_cross_sell_rules').select('id, from_category, to_category, note').order('from_category'),
      supabase.from('systems').select('category'),
    ])
    // PGRST205 = PostgREST "table not found in schema cache" (its error for
    // a table that doesn't exist yet); 42P01 = raw Postgres "undefined table"
    // as a fallback. Either means the migration hasn't been run yet.
    setTableMissing(!!rulesErr && (rulesErr.code === 'PGRST205' || rulesErr.code === '42P01'))
    if (ruleRows) setRules(ruleRows as Rule[])
    if (sysRows) setCategories(Array.from(new Set(sysRows.map((r: { category: string }) => r.category))).sort())
    setLoadingData(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!fromCategory || !toCategory) return setError('Choose both categories')
    if (fromCategory === toCategory) return setError('Categories must be different')
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/admin/category-cross-sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
        body: JSON.stringify({ from_category: fromCategory, to_category: toCategory, note }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to add rule'); setSubmitting(false); return }
      setToCategory(''); setNote(''); setSuggestions([])
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    await fetch('/api/admin/category-cross-sell', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
      body: JSON.stringify({ id }),
    })
    loadData()
  }

  async function handleSuggest() {
    if (!fromCategory) return
    setSuggesting(true); setSuggestError(null); setSuggestions([])
    try {
      const res = await fetch('/api/admin/suggest-cross-sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
        body: JSON.stringify({ category: fromCategory }),
      })
      const json = await res.json()
      if (!res.ok) { setSuggestError(json.error || 'Suggestions unavailable'); setSuggesting(false); return }
      setSuggestions(json.suggestions || [])
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'Network error')
    }
    setSuggesting(false)
  }

  async function addSuggestion(s: Suggestion) {
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/admin/category-cross-sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
        body: JSON.stringify({ from_category: fromCategory, to_category: s.to_category, note: s.rationale }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to add rule'); setSubmitting(false); return }
      setSuggestions(prev => prev.filter(x => x.to_category !== s.to_category))
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    }
    setSubmitting(false)
  }

  const grouped = rules.reduce<Record<string, Rule[]>>((acc, r) => {
    (acc[r.from_category] ??= []).push(r)
    return acc
  }, {})

  return (
    <div className="space-y-10">

      {/* ── Add rule ── */}
      <section className="bg-surface border border-border rounded-2xl p-8">
        <h2 className="text-xl font-bold text-text-primary mb-2">Cross-sell rules</h2>
        <p className="text-text-faint text-sm mb-7">
          When Trade Desk staff search a category, customers also see suggestions
          for related categories here — e.g. Decking → Deck Oils &amp; Stains.
          Staff-curated, not AI-generated at runtime.
        </p>

        {tableMissing && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-400">
            <code className="font-mono text-xs">category_cross_sell_rules</code> table doesn&apos;t exist yet —
            run <code className="font-mono text-xs">supabase/migrations/20260723_cross_sell_and_channel.sql</code> in the Supabase SQL editor first.
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                When staff search <span className="text-error ml-0.5">*</span>
              </label>
              <select value={fromCategory} onChange={e => { setFromCategory(e.target.value); setSuggestions([]) }}
                className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand">
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Suggest <span className="text-error ml-0.5">*</span>
              </label>
              <select value={toCategory} onChange={e => setToCategory(e.target.value)}
                className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand">
                <option value="">Select category</option>
                {categories.filter(c => c !== fromCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Timber decks often need oiling/staining"
              className="w-full bg-ui border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors">
              {submitting ? 'Adding…' : 'Add rule →'}
            </button>
            <button type="button" onClick={handleSuggest} disabled={!fromCategory || suggesting}
              className="px-5 py-2.5 bg-ui hover:bg-surface-hover disabled:opacity-50 border border-border text-text-secondary rounded-lg font-medium text-sm transition-colors">
              {suggesting ? 'Thinking…' : '✨ Suggest with AI'}
            </button>
          </div>

          {suggestError && <p className="text-text-faint text-xs">{suggestError}</p>}

          {suggestions.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-xs font-semibold text-text-faint uppercase tracking-widest">
                Suggestions for {fromCategory} — review and add
              </p>
              {suggestions.map(s => (
                <div key={s.to_category} className="flex items-center justify-between gap-3 bg-ui rounded-lg px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary font-medium">{s.to_category}</p>
                    <p className="text-xs text-text-faint truncate">{s.rationale}</p>
                  </div>
                  <button onClick={() => addSuggestion(s)} disabled={submitting}
                    className="flex-shrink-0 text-xs px-3 py-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>
      </section>

      {/* ── Existing rules ── */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-5">
          Existing rules
          {!loadingData && <span className="ml-2 text-sm font-normal text-text-faint">({rules.length})</span>}
        </h2>

        {loadingData ? (
          <p className="text-text-faint text-sm">Loading…</p>
        ) : rules.length === 0 ? (
          <p className="text-text-faint text-sm">No cross-sell rules yet.</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([from, rs]) => (
              <div key={from} className="bg-surface border border-border rounded-xl p-5">
                <p className="font-semibold text-text-primary text-sm mb-3">{from}</p>
                <div className="space-y-2">
                  {rs.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 bg-ui rounded-lg px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm text-text-secondary">→ {r.to_category}</p>
                        {r.note && <p className="text-xs text-text-faint truncate mt-0.5">{r.note}</p>}
                      </div>
                      <button onClick={() => handleDelete(r.id)}
                        className="flex-shrink-0 text-xs text-text-faint hover:text-error transition-colors">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
