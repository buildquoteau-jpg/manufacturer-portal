'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SupplierLoginPage() {
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function handleFind(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) return
    setLoading(true)
    setNotFound(false)

    // Try matching by name (case-insensitive) or slug
    const { data } = await supabase
      .from('suppliers')
      .select('slug')
      .or(`name.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`)
      .limit(1)
      .single()

    setLoading(false)

    if (data?.slug) {
      window.location.href = `/supplier/${data.slug}`
    } else {
      setNotFound(true)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <span className="text-2xl font-semibold tracking-widest text-text-faint uppercase">
            BUILD<span className="text-brand">QUOTE</span>
          </span>
          <p className="text-text-primary font-semibold mt-3">Supplier Portal</p>
          <p className="text-text-faint text-sm mt-1">Find your portal to log in</p>
        </div>

        <form onSubmit={handleFind} className="bg-surface border border-border rounded-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Your business name
            </label>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setNotFound(false) }}
              placeholder="e.g. Main Timber"
              autoFocus
              className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand transition-colors"
            />
            {notFound && (
              <p className="text-error text-xs mt-1.5">
                No portal found for that name. Check your spelling or contact{' '}
                <a href="mailto:hello@buildquote.com.au" className="underline">BuildQuote</a>.
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !search.trim()}
            className="w-full py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
          >
            {loading ? 'Finding your portal...' : 'Go to my portal →'}
          </button>
        </form>

        <p className="text-center text-text-faint text-xs mt-4">
          Don't have a portal?{' '}
          <a href="mailto:hello@buildquote.com.au" className="text-brand hover:underline">
            Contact BuildQuote
          </a>
        </p>

      </div>
    </div>
  )
}
