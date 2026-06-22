'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SupplierData } from './shared'

export function AccountTab({ supplier, slug }: { supplier: SupplierData; slug: string }) {
  const [pwOpen, setPwOpen]       = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew]         = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving]   = useState(false)
  const [pwError, setPwError]     = useState('')
  const [pwOk, setPwOk]           = useState(false)

  const [helpName, setHelpName]       = useState('')
  const [helpMessage, setHelpMessage] = useState('')
  const [helpSent, setHelpSent]       = useState(false)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (pwNew.length < 8)    return setPwError('Password must be at least 8 characters')
    if (pwNew !== pwConfirm) return setPwError('Passwords do not match')
    setPwSaving(true); setPwError('')
    const { error: reAuthErr } = await supabase.auth.signInWithPassword({ email: supplier.email || '', password: pwCurrent })
    if (reAuthErr) { setPwError('Current password is incorrect'); setPwSaving(false); return }
    const { error: updateErr } = await supabase.auth.updateUser({ password: pwNew })
    if (updateErr) { setPwError(updateErr.message); setPwSaving(false); return }
    setPwOk(true); setPwCurrent(''); setPwNew(''); setPwConfirm('')
    setPwSaving(false)
    setTimeout(() => { setPwOk(false); setPwOpen(false) }, 3000)
  }

  const inputCls = 'w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand'

  return (
    <div className="space-y-6">

      {/* Password */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-base font-bold text-text-primary mb-4">Password</h2>
        <button
          onClick={() => { setPwOpen(!pwOpen); setPwError(''); setPwOk(false) }}
          className="text-sm text-brand hover:underline font-medium"
        >
          {pwOpen ? 'Cancel' : 'Change password'}
        </button>

        {pwOpen && (
          <form onSubmit={handlePasswordChange} className="mt-4 space-y-3 max-w-sm">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Current password</label>
              <input type="password" value={pwCurrent} onChange={e => { setPwCurrent(e.target.value); setPwError('') }}
                required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">New password</label>
              <input type="password" value={pwNew} onChange={e => { setPwNew(e.target.value); setPwError('') }}
                placeholder="At least 8 characters" required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm new password</label>
              <input type="password" value={pwConfirm} onChange={e => { setPwConfirm(e.target.value); setPwError('') }}
                required className={inputCls} />
            </div>
            {pwError && <p className="text-error text-xs">{pwError}</p>}
            {pwOk && <p className="text-success text-xs font-medium">✓ Password updated successfully</p>}
            <button type="submit" disabled={pwSaving}
              className="px-5 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors">
              {pwSaving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </section>

      {/* Help */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-base font-bold text-text-primary mb-1">Get help</h2>
        <p className="text-text-faint text-sm mb-5">Send a message to the BuildQuote team. We'll get back to you by email.</p>

        {helpSent ? (
          <div className="text-center py-4">
            <p className="text-success font-medium text-sm">✓ Message sent — we'll be in touch soon.</p>
            <button
              onClick={() => { setHelpSent(false); setHelpName(''); setHelpMessage('') }}
              className="text-brand text-xs hover:underline mt-2 block mx-auto"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={e => {
            e.preventDefault()
            window.location.href = `mailto:hello@buildquote.com.au?subject=Supplier portal help — ${encodeURIComponent(supplier.name)}&body=${encodeURIComponent(`From: ${helpName || supplier.name}\nPortal: ${slug}\n\n${helpMessage}`)}`
            setHelpSent(true)
          }} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Your name</label>
              <input value={helpName} onChange={e => setHelpName(e.target.value)}
                placeholder={supplier.name}
                className={inputCls + ' placeholder-text-faint'} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">How can we help?</label>
              <textarea value={helpMessage} onChange={e => setHelpMessage(e.target.value)}
                placeholder="Describe what you need help with…" rows={4} required
                className={inputCls + ' placeholder-text-faint resize-none'} />
            </div>
            <button type="submit" disabled={!helpMessage.trim()}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors">
              Send message →
            </button>
            <p className="text-text-faint text-xs">
              Or email us directly at{' '}
              <a href="mailto:hello@buildquote.com.au" className="text-brand hover:underline">hello@buildquote.com.au</a>
            </p>
          </form>
        )}
      </section>

    </div>
  )
}
