'use client'

import { useEffect, useState } from 'react'
import ManufacturersTab from './ManufacturersTab'
import SuppliersTab from './SuppliersTab'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'buildquote2026'
const SESSION_KEY = 'bq_admin_auth'

type Tab = 'manufacturers' | 'suppliers'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('manufacturers')

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === ADMIN_PASSWORD) setAuthed(true)
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, ADMIN_PASSWORD)
      setAuthed(true)
    } else {
      setPasswordError(true)
      setTimeout(() => setPasswordError(false), 2000)
    }
  }

  // ── Password gate ────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="text-2xl font-semibold tracking-widest text-text-faint uppercase">
              BUILD<span className="text-brand">QUOTE</span>
            </span>
            <p className="text-text-faint text-sm mt-2">Admin</p>
          </div>
          <form onSubmit={handleLogin} className="bg-surface border border-border rounded-2xl p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} autoFocus
                className={`w-full bg-ui border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand transition-colors ${passwordError ? 'border-error' : 'border-border'}`}
                placeholder="Enter admin password" />
              {passwordError && <p className="text-error text-xs mt-1">Incorrect password</p>}
            </div>
            <button type="submit" className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold text-sm transition-colors">
              Enter
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Admin dashboard ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-page">

      {/* Top nav */}
      <div className="sticky top-0 z-30 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-widest text-text-faint uppercase">
              BUILD<span className="text-brand">QUOTE</span>
            </span>
            <span className="text-text-faint text-sm">/</span>
            <span className="text-text-primary font-semibold text-sm">Admin</span>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false) }}
            className="text-xs text-text-faint hover:text-text-primary transition-colors">
            Sign out
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-0">
            {([
              { key: 'manufacturers', label: 'Manufacturers' },
              { key: 'suppliers',     label: 'Suppliers' },
            ] as { key: Tab; label: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-faint hover:text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {activeTab === 'manufacturers' && <ManufacturersTab />}
        {activeTab === 'suppliers'     && <SuppliersTab />}
      </div>

    </div>
  )
}
