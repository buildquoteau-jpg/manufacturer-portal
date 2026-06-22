'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PublicSupplierCard } from '@/lib/data/getPublicSuppliers'

function matchesSearch(supplier: PublicSupplierCard, query: string): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  const isPostcode = /^\d{4}$/.test(q)

  if (isPostcode) {
    // Match service_postcodes list or suburb starts with the number
    const postcodes = (supplier.service_postcodes || '')
      .split(/[\s,]+/)
      .map(p => p.trim())
    if (postcodes.includes(q)) return true
    if (supplier.suburb?.toLowerCase().includes(q)) return true
    return false
  }

  // Text match: name, suburb, state, bio, brand names
  const haystack = [
    supplier.name,
    supplier.suburb,
    supplier.state,
    supplier.bio,
    ...supplier.brands.map(b => b.name),
  ].filter(Boolean).join(' ').toLowerCase()

  return haystack.includes(q)
}

function SupplierCard({ supplier }: { supplier: PublicSupplierCard }) {
  const heroY = supplier.hero_photo_y ?? 50
  return (
    <Link href={`/supplierdirectory/${supplier.slug}`} className="dir-card">
      <div style={{
        height: '160px',
        background: supplier.hero_photo_url
          ? `url(${supplier.hero_photo_url}) center ${heroY}% / cover`
          : 'linear-gradient(135deg, #185D7A 0%, #2a7a9a 100%)',
        position: 'relative',
        flexShrink: 0,
      }}>
        {!supplier.hero_photo_url && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
              {supplier.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div style={{ padding: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
          {supplier.name}
        </h2>
        {(supplier.suburb || supplier.state) && (
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
            {[supplier.suburb, supplier.state].filter(Boolean).join(', ')}
          </p>
        )}
        {supplier.bio && (
          <p className="dir-clamp" style={{ margin: '8px 0 0', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
            {supplier.bio}
          </p>
        )}
        {supplier.brands.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {supplier.brands.map(b => (
              b.logo_url ? (
                <img key={b.id} src={b.logo_url} alt={b.name}
                  style={{ height: '18px', objectFit: 'contain', maxWidth: '80px' }} />
              ) : (
                <span key={b.id} style={{
                  fontSize: '11px', fontWeight: 600, color: '#185D7A',
                  background: 'rgba(24,93,122,0.08)', padding: '3px 8px', borderRadius: '12px',
                }}>
                  {b.name}
                </span>
              )
            ))}
          </div>
        )}
        <p style={{ margin: '14px 0 0', fontSize: '13px', fontWeight: 600, color: '#185D7A' }}>
          View profile →
        </p>
      </div>
    </Link>
  )
}

export function SupplierDirectoryClient({ suppliers }: { suppliers: PublicSupplierCard[] }) {
  const [query, setQuery] = useState('')

  const filtered = suppliers.filter(s => matchesSearch(s, query))
  const isPostcodeQuery = /^\d{4}$/.test(query.trim())

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 80px' }}>
      <style>{`
        .dir-card {
          display: block;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          text-decoration: none;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .dir-card:hover {
          box-shadow: 0 4px 16px rgba(24,93,122,0.12);
          transform: translateY(-2px);
        }
        .dir-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#185D7A' }}>
          BuildQuote
        </p>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#111827', lineHeight: 1.15 }}>
          Supplier Directory
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#6b7280', maxWidth: '520px' }}>
          Find suppliers stocking quality building products across Southwest WA.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', maxWidth: '520px', marginBottom: '28px' }}>
        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#9ca3af" strokeWidth="2"/>
            <path d="M13 13l3 3" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by suburb, postcode or brand…"
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1.5px solid #d1d9e0', borderRadius: '12px',
            padding: '13px 40px 13px 40px',
            fontSize: '15px', color: '#0f172a', background: '#ffffff',
            outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#185D7A'
            e.target.style.boxShadow = '0 0 0 3px rgba(24,93,122,0.12)'
          }}
          onBlur={e => {
            e.target.style.borderColor = '#d1d9e0'
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', lineHeight: 1, padding: '4px' }}
          >
            ×
          </button>
        )}
      </div>

      {/* Result count when searching */}
      {query.trim() && (
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280' }}>
          {filtered.length === 0
            ? isPostcodeQuery
              ? `No suppliers found serving postcode ${query.trim()}. Try a nearby suburb name.`
              : `No suppliers matching "${query}".`
            : isPostcodeQuery
              ? `${filtered.length} supplier${filtered.length !== 1 ? 's' : ''} serving ${query.trim()}`
              : `${filtered.length} supplier${filtered.length !== 1 ? 's' : ''} found`
          }
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {filtered.map(s => <SupplierCard key={s.id} supplier={s} />)}
        </div>
      ) : !query.trim() ? (
        <div style={{
          background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '14px',
          padding: '64px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No suppliers listed yet</p>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Check back soon as more suppliers join the platform.</p>
        </div>
      ) : null}

      <p style={{ marginTop: '48px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
        Powered by BuildQuote
      </p>
    </div>
  )
}
