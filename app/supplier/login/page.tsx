'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type View = 'login' | 'forgot' | 'sent'

export default function SupplierLoginPage() {
  const [view, setView]         = useState<View>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('slug')
        .eq('auth_user_id', session.user.id)
        .single()
      if (supplier?.slug) window.location.href = `/supplier/${supplier.slug}`
    })
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Incorrect email or password.')
      setLoading(false)
      return
    }

    // Look up their supplier record
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('slug')
      .eq('auth_user_id', data.user.id)
      .single()

    if (supplier?.slug) {
      window.location.href = `/supplier/${supplier.slug}`
    } else {
      await supabase.auth.signOut()
      setError('Your account isn\'t linked to a supplier portal yet. Contact BuildQuote for help.')
      setLoading(false)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)
    if (resetError) {
      setError('Could not send reset email. Please try again.')
    } else {
      setView('sent')
    }
  }

  return (
    <div className="min-h-[calc(100vh-48px)] bg-page flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-text-faint text-xs hover:text-text-secondary transition-colors mb-8">
          <span>←</span> Back to portal home
        </Link>

        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-widest text-text-faint uppercase">
            BUILD<span className="text-brand">QUOTE</span>
          </span>
          <p className="text-text-primary font-semibold mt-3">Supplier Portal</p>
          {view === 'login'  && <p className="text-text-faint text-sm mt-1">Log in to your supplier account</p>}
          {view === 'forgot' && <p className="text-text-faint text-sm mt-1">Enter your email to reset your password</p>}
          {view === 'sent'   && <p className="text-text-faint text-sm mt-1">Check your inbox</p>}
        </div>

        {/* ── Login form ── */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="bg-surface border border-border rounded-2xl p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@company.com.au"
                autoFocus
                required
                className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-text-secondary">Password</label>
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setError('') }}
                  className="text-xs text-brand hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                required
                className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            {error && <p className="text-error text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
            >
              {loading ? 'Logging in…' : 'Log in →'}
            </button>
          </form>
        )}

        {/* ── Forgot password form ── */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="bg-surface border border-border rounded-2xl p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@company.com.au"
                autoFocus
                required
                className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            {error && <p className="text-error text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
            >
              {loading ? 'Sending…' : 'Send reset link →'}
            </button>
            <button
              type="button"
              onClick={() => { setView('login'); setError('') }}
              className="w-full text-center text-xs text-text-faint hover:text-text-secondary transition-colors"
            >
              ← Back to login
            </button>
          </form>
        )}

        {/* ── Email sent confirmation ── */}
        {view === 'sent' && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-brand">
                <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-text-primary font-semibold">Reset link sent</p>
              <p className="text-text-faint text-sm mt-1">
                We sent a password reset link to <strong className="text-text-secondary">{email}</strong>.
                Check your inbox and spam folder.
              </p>
            </div>
            <button
              onClick={() => { setView('login'); setError('') }}
              className="text-xs text-brand hover:underline"
            >
              ← Back to login
            </button>
          </div>
        )}

        <p className="text-center text-text-faint text-xs mt-5">
          Don't have an account?{' '}
          <a href="mailto:hello@buildquote.com.au" className="text-brand hover:underline">
            Contact BuildQuote
          </a>
        </p>

        <p className="text-center text-text-faint text-xs mt-3">
          Are you a manufacturer?{' '}
          <Link href="/manufacturer/login" className="text-brand hover:underline">
            Manufacturer login →
          </Link>
        </p>

      </div>
    </div>
  )
}
