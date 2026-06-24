'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const BQ = 'https://buildquote.com.au'

// Customer-facing links — mirrors buildquote.com.au nav
const NAV_LINKS = [
  { label: 'Home',                  href: `${BQ}/`,             external: true  },
  { label: '1  Builder Portal',     href: `${BQ}/dashboard`,    external: true  },
  { label: '2  Start a Quote',      href: `${BQ}/rfq`,          external: true  },
  { label: '3  Search Products',    href: '/manufacturers',     external: false },
  { label: '4  Supplier Directory', href: '/supplierdirectory', external: false },
  { label: '5  Supplier Login',     href: '/supplier/login',    external: false },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/legal#privacy',    external: false },
  { label: 'Terms of Use',   href: '/legal#terms',      external: false },
]

function MenuLink({ href, label, external, active, onClose }: {
  href: string; label: string; external: boolean; active: boolean; onClose: () => void
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : '_self'}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={onClose}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 20px',
        fontSize: '14px',
        fontWeight: active ? 700 : 500,
        color: active ? '#185D7A' : '#374151',
        background: active ? '#f0f9ff' : 'transparent',
        textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        if (!active) { el.style.background = '#f5f7f9'; el.style.color = '#0f172a' }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        if (!active) { el.style.background = 'transparent'; el.style.color = '#374151' }
      }}
    >
      {label}
      {external && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.35, flexShrink: 0 }}>
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

  // Don't render on embedded widget, embed, or showroom pages
  if (pathname.startsWith('/widget/') || pathname.startsWith('/embed/') || pathname.startsWith('/showroom')) return null

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
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
        position: 'relative', zIndex: 50,
        background: '#ffffff', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: '52px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Logo */}
      <a
        href={BQ}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1px' }}
      >
        <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1 }}>
          <span style={{ color: '#185D7A' }}>Build</span><span style={{ color: '#f97316' }}>Quote</span>
        </span>
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em', color: '#64748b', lineHeight: 1, whiteSpace: 'nowrap' }}>
          Request for Quotation, Made Simple
        </span>
      </a>

      {/* Hamburger */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
          display: 'flex', flexDirection: 'column', gap: '5px',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ display: 'block', width: '20px', height: '2px', background: '#374151', borderRadius: '2px', transition: 'transform 0.2s, opacity 0.2s', transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }} />
        <span style={{ display: 'block', width: '20px', height: '2px', background: '#374151', borderRadius: '2px', transition: 'opacity 0.2s', opacity: open ? 0 : 1 }} />
        <span style={{ display: 'block', width: '20px', height: '2px', background: '#374151', borderRadius: '2px', transition: 'transform 0.2s, opacity 0.2s', transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          width: '240px', background: '#ffffff',
          border: '1px solid #e5e7eb', borderTop: 'none',
          borderRadius: '0 0 14px 14px', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>
          <div style={{ height: '6px' }} />

          {NAV_LINKS.map(link => (
            <MenuLink
              key={link.href}
              href={link.href}
              label={link.label}
              external={link.external}
              active={!link.external && pathname === link.href}
              onClose={() => setOpen(false)}
            />
          ))}

          <div style={{ margin: '5px 0', borderTop: '1px solid #e5e7eb' }} />

          {LEGAL_LINKS.map(link => (
            <MenuLink
              key={link.href}
              href={link.href}
              label={link.label}
              external={false}
              active={false}
              onClose={() => setOpen(false)}
            />
          ))}

          <div style={{ height: '6px' }} />
        </div>
      )}
    </nav>
  )
}
