'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Internal portal links (same domain, open in same tab)
const PORTAL_LINKS = [
  { label: 'Browse Manufacturers', href: '/manufacturers' },
  { label: 'Supplier Login',       href: '/supplier/login' },
  { label: 'Manufacturer Login',   href: '/manufacturer/login' },
]

// External buildquote.com.au links
const MAIN_SITE_LINKS = [
  { label: 'Home',                        href: 'https://buildquote.com.au/' },
  { label: 'Send a Request for Quotation', href: 'https://buildquote.com.au/rfq' },
]

// Portal legal & info links
const LEGAL_LINKS = [
  { label: 'Terms of Use',   href: '/legal#terms' },
  { label: 'Privacy Policy', href: '/legal#privacy' },
  { label: 'Disclaimer',     href: '/legal#disclaimer' },
]

function MenuLink({ href, label, external, onClose }: { href: string; label: string; external: boolean; onClose: () => void }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : '_self'}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 20px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#d1d5db',
        textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.background = 'rgba(255,255,255,0.06)'
        el.style.color = '#ffffff'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.background = 'transparent'
        el.style.color = '#d1d5db'
      }}
    >
      {label}
      {external && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
          <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </a>
  )
}

export function GlobalNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Don't render on embedded widget pages
  if (pathname.startsWith('/widget/')) return null

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <nav
      ref={menuRef}
      style={{
        position: 'relative',
        zIndex: 50,
        background: '#0f2318',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '48px',
      }}
    >
      {/* Logo */}
      <a
        href="https://buildquote.com.au"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1px' }}
      >
        <span style={{
          fontSize: '15px',
          fontWeight: 800,
          letterSpacing: '0.01em',
          lineHeight: 1,
        }}>
          <span style={{ color: '#185D7A' }}>Build</span><span style={{ color: '#f97316' }}>Quote</span>
        </span>
        <span style={{
          fontSize: '9px',
          fontWeight: 500,
          letterSpacing: '0.04em',
          color: 'rgba(255,255,255,0.35)',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>
          Request for Quotation, made simple
        </span>
      </a>

      {/* Hamburger button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{
          display: 'block', width: '20px', height: '2px',
          background: '#9ca3af', borderRadius: '2px',
          transition: 'transform 0.2s, opacity 0.2s',
          transform: open ? 'translateY(7px) rotate(45deg)' : 'none',
        }} />
        <span style={{
          display: 'block', width: '20px', height: '2px',
          background: '#9ca3af', borderRadius: '2px',
          transition: 'opacity 0.2s',
          opacity: open ? 0 : 1,
        }} />
        <span style={{
          display: 'block', width: '20px', height: '2px',
          background: '#9ca3af', borderRadius: '2px',
          transition: 'transform 0.2s, opacity 0.2s',
          transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none',
        }} />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '230px',
          background: '#0f2318',
          border: '1px solid rgba(255,255,255,0.10)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>

          {/* Section: this portal */}
          <div style={{ padding: '8px 20px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4b5563' }}>
            mfp.buildquote.com.au
          </div>
          {PORTAL_LINKS.map((link) => (
            <MenuLink key={link.label} href={link.href} label={link.label} external={false} onClose={() => setOpen(false)} />
          ))}

          {/* Divider */}
          <div style={{ margin: '6px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

          {/* Section: main site */}
          <div style={{ padding: '4px 20px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4b5563' }}>
            buildquote.com.au
          </div>
          {MAIN_SITE_LINKS.map((link) => (
            <MenuLink key={link.href} href={link.href} label={link.label} external={true} onClose={() => setOpen(false)} />
          ))}

          {/* Divider */}
          <div style={{ margin: '6px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

          {/* Section: legal */}
          <div style={{ padding: '4px 20px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4b5563' }}>
            Legal
          </div>
          {LEGAL_LINKS.map((link) => (
            <MenuLink key={link.href} href={link.href} label={link.label} external={false} onClose={() => setOpen(false)} />
          ))}

          <div style={{ height: '6px' }} />
        </div>
      )}
    </nav>
  )
}
