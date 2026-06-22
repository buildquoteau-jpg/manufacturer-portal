'use client'

import { useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const router = useRouter()

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)
  const [slug, setSlug]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setSubmitting(true)
    const res = await fetch('/api/supplier/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      setError(data.error || 'Something went wrong.')
      setSubmitting(false)
      return
    }
    setSlug(data.slug)
    setDone(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--page-bg, #f0f4f0)' }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6">
          BUILD<span className="text-green-700">QUOTE</span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <p className="font-bold text-gray-900 text-lg mb-2">Password set!</p>
            <p className="text-sm text-gray-500 mb-6">You can now log in to your supplier portal.</p>
            {slug && (
              <button
                onClick={() => router.push(`/supplier/${slug}`)}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                style={{ background: '#1b3a2d' }}
              >
                Go to my portal
              </button>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Set a new password</h1>
            <p className="text-sm text-gray-500 mb-6">Choose a password for your supplier portal login.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  New password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Confirm password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Same as above"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800"
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm mt-1"
                style={{ background: submitting ? '#6b7280' : '#1b3a2d', cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Saving…' : 'Set password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
