'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type View = 'login' | 'forgot' | 'sent' | 'enquiry' | 'enquiry-sent'

export default function ManufacturerLoginPage() {
  const [view, setView]         = useState<View>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [enqName, setEnqName]         = useState('')
  const [enqBusiness, setEnqBusiness] = useState('')
  const [enqEmail, setEnqEmail]       = useState('')
  const [enqMessage, setEnqMessage]   = useState('')
  const [enqLoading, setEnqLoading]   = useState(false)

  async function handleEnquiry(e: React.FormEvent) {
    e.preventDefault()
    setEnqLoading(true)
    window.location.href = `mailto:hello@buildquote.com.au?subject=Manufacturer Portal Enquiry — ${encodeURIComponent(enqBusiness)}&body=${encodeURIComponent(`Name: ${enqName}\nBusiness: ${enqBusiness}\nEmail: ${enqEmail}\n\n${enqMessage}`)}`
    setEnqLoading(false)
    setView('enquiry-sent')
  }

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: manufacturer } = await supabase
        .from('manufacturers')
        .select('slug')
        .eq('auth_user_id', session.user.id)
        .single()
      if (manufacturer?.slug) window.location.href = `/manufacturer/${manufacturer.slug}`
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

    // Look up their manufacturer record
    const { data: manufacturer } = await supabase
      .from('manufacturers')
      .select('slug')
      .eq('auth_user_id', data.user.id)
      .single()

    if (manufacturer?.slug) {
      window.location.href = `/manufacturer/${manufacturer.slug}`
    } else {
      await supabase.auth.signOut()
      setError('Your account isn\'t linked to a manufacturer portal yet. Contact BuildQuote for help.')
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
          <p className="text-text-primary font-semibold mt-3">Manufacturer Portal</p>
          {view === 'login'  && <p className="text-text-faint text-sm mt-1">Log in to your manufacturer account</p>}
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
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
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
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setView('forgot'); setError('') }}
                className="text-xs text-text-faint hover:text-brand transition-colors"
              >
                Forgot password?
              </button>
            </div>
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

        {view !== 'enquiry' && view !== 'enquiry-sent' && (
          <p className="text-center text-text-faint text-xs mt-5">
            Don't have an account?{' '}
            <button onClick={() => setView('enquiry')} className="text-brand hover:underline">
              Request access
            </button>
          </p>
        )}

        {view === 'enquiry' && (
          <form onSubmit={handleEnquiry} className="bg-surface border border-border rounded-2xl p-8 mt-2 space-y-4">
            <div>
              <p className="text-text-primary font-semibold text-sm mb-1">Request manufacturer portal access</p>
              <p className="text-text-faint text-xs">We'll set up your account and be in touch shortly.</p>
            </div>
            <input value={enqName} onChange={e => setEnqName(e.target.value)} placeholder="Your name" required
              className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
            <input value={enqBusiness} onChange={e => setEnqBusiness(e.target.value)} placeholder="Brand / company name" required
              className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
            <input value={enqEmail} onChange={e => setEnqEmail(e.target.value)} placeholder="Your email" type="email" required
              className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand" />
            <textarea value={enqMessage} onChange={e => setEnqMessage(e.target.value)} placeholder="What products do you manufacture? (optional)" rows={3}
              className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand resize-none" />
            <button type="submit" disabled={enqLoading}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors">
              Send enquiry →
            </button>
            <button type="button" onClick={() => setView('login')}
              className="w-full text-center text-xs text-text-faint hover:text-text-secondary transition-colors">
              ← Back to login
            </button>
          </form>
        )}

        {view === 'enquiry-sent' && (
          <div className="text-center mt-2 text-text-faint text-xs space-y-2">
            <p className="text-success font-medium text-sm">Enquiry sent — we'll be in touch soon.</p>
            <button onClick={() => setView('login')} className="text-brand hover:underline text-xs">← Back to login</button>
          </div>
        )}

        <p className="text-center text-text-faint text-xs mt-3">
          Are you a supplier?{' '}
          <Link href="/supplier/login" className="text-brand hover:underline">
            Supplier login →
          </Link>
        </p>

      </div>
    </div>
  )
}
