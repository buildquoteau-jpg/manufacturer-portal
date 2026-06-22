'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

type View = 'loading' | 'form' | 'done' | 'error'

export default function ResetPasswordPage() {
  const [view, setView]             = useState<View>('loading')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    // Supabase puts access_token in the URL hash for implicit flow.
    // onAuthStateChange fires PASSWORD_RECOVERY when it detects the hash.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('form')
      }
    })

    // Fallback: check if there's already an active session (user refreshed the page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setView('form')
      else {
        // Give the hash parser a moment to fire onAuthStateChange
        setTimeout(() => setView(v => v === 'loading' ? 'error' : v), 1500)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (updateError) {
      setError(updateError.message)
    } else {
      await supabase.auth.signOut()
      setView('done')
    }
  }

  return (
    <div className="min-h-[calc(100vh-48px)] bg-page flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-widest text-text-faint uppercase">
            BUILD<span className="text-brand">QUOTE</span>
          </span>
        </div>

        {/* Loading */}
        {view === 'loading' && (
          <div className="text-center text-text-faint text-sm">Verifying reset link…</div>
        )}

        {/* Invalid link */}
        {view === 'error' && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
            <p className="text-text-primary font-semibold">Link expired or invalid</p>
            <p className="text-text-faint text-sm">
              Password reset links expire after 1 hour. Request a new one from the login page.
            </p>
            <a href="/supplier/login" className="inline-block text-brand text-sm hover:underline">
              Back to login →
            </a>
          </div>
        )}

        {/* Reset form */}
        {view === 'form' && (
          <>
            <div className="text-center mb-8">
              <p className="text-text-primary font-semibold">Set a new password</p>
              <p className="text-text-faint text-sm mt-1">Choose something secure — at least 8 characters.</p>
            </div>
            <form onSubmit={handleReset} className="bg-surface border border-border rounded-2xl p-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  autoFocus
                  required
                  className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError('') }}
                  placeholder="••••••••"
                  required
                  className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              {error && <p className="text-error text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
              >
                {loading ? 'Saving…' : 'Set new password →'}
              </button>
            </form>
          </>
        )}

        {/* Success */}
        {view === 'done' && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-brand">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-text-primary font-semibold">Password updated</p>
              <p className="text-text-faint text-sm mt-1">You can now log in with your new password.</p>
            </div>
            <a href="/" className="inline-block text-brand text-sm hover:underline">
              Back to portal home →
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
