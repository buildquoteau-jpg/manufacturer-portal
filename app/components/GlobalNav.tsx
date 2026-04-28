'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Home',              href: 'https://buildquote.com.au/' },
  { label: 'Send a Quote',      href: 'https://buildquote.com.au/rfq' },
  { label: 'Privacy Policy',    href: 'https://buildquote.com.au/privacy' },
  { label: 'Terms of Use',      href: 'https://buildquote.com.au/terms' },
]

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
        style={{ textDecoration: 'none' }}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#9ca3af',
        }}>
          BUILD<span style={{ color: '#4ade80' }}>QUOTE</span>
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
          width: '220px',
          background: '#0f2318',
          border: '1px solid rgba(255,255,255,0.10)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '13px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#d1d5db',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                (e.target as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'
                ;(e.target as HTMLAnchorElement).style.color = '#ffffff'
              }}
              onMouseLeave={e => {
                (e.target as HTMLAnchorElement).style.background = 'transparent'
                ;(e.target as HTMLAnchorElement).style.color = '#d1d5db'
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ padding: '10px 20px' }}>
            <span style={{ fontSize: '11px', color: '#4b5563' }}>
              mfp.buildquote.com.au
            </span>
          </div>
        </div>
      )}
    </nav>
  )
}
