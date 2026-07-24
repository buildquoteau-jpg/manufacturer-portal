'use client'

// Floating bottom shopping-list drawer — ported from BuildQuote v6's
// ShoppingListDrawerUI. Keeps the full approved behaviour: expandable table,
// editable line names, editable UOM, qty steppers, manual add row, clear all,
// PNG share/export, and the "+N added" pulse animation.
//
// Removed from the v6 source (BuildQuote-app concerns, all Supabase/API-backed):
//   - "Request a Quote →" conversion to an RFQ draft
//   - "Add N items to quote request" active-draft append
//   - login round-trip auto-convert
// Hosts that need a primary action (e.g. the future public card package
// linking back to buildquote.com.au) pass `primaryAction` instead.

import { useState, useEffect } from 'react'
import { useShoppingList } from './ShoppingListProvider'
import { shareShoppingListPng } from './sharePng'
import type { ShoppingListItem } from './types'

const thStyle: React.CSSProperties = {
  padding: '7px 8px',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#64748b',
  textAlign: 'center',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 8px',
  verticalAlign: 'middle',
}

const qtyBtnStyle: React.CSSProperties = {
  width: '22px', height: '22px',
  borderRadius: '5px',
  border: '1.5px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

export function ShoppingListDrawer({ primaryAction }: {
  primaryAction?: {
    label: string
    onClick: (items: ShoppingListItem[]) => void
  }
}) {
  const { shoppingList, addItems, removeItem, updateQty, updateName, updateUom, clearList, addFlash } = useShoppingList()
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [sharing,     setSharing]     = useState(false)

  // "Items landed here" pulse — the cart bar pops/glows and floats a "+N" up
  // whenever items are added, so the eye is drawn to where they went.
  const [pulsing,   setPulsing]   = useState(false)
  const [floatAdd,  setFloatAdd]  = useState(0)
  useEffect(() => {
    if (addFlash.tick === 0) return
    setPulsing(true)
    setFloatAdd(addFlash.count)
    const t1 = setTimeout(() => setPulsing(false), 900)
    const t2 = setTimeout(() => setFloatAdd(0), 1500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [addFlash.tick, addFlash.count])

  if (shoppingList.length === 0) return null

  // ── Add manual item ────────────────────────────────────────────────────────

  function addManualItem() {
    const name = newItemName.trim()
    if (!name) return
    addItems([{
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name, sku: '', desc: '', uom: 'EA', qty: 1,
    }])
    setNewItemName('')
  }

  // ── Share as PNG image ─────────────────────────────────────────────────────

  async function shareList() {
    if (sharing || shoppingList.length === 0) return
    setSharing(true)
    try {
      await shareShoppingListPng(shoppingList)
    } finally { setSharing(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200 }}>

      {/* Expandable drawer */}
      {drawerOpen && (
        <div style={{
          background: '#ffffff', borderTop: '1px solid #e5e7eb',
          maxHeight: '420px', overflowY: 'auto',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
        }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px 20px 20px' }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '10px' }}>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Your materials list · {shoppingList.length} item{shoppingList.length !== 1 ? 's' : ''}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
                  Edit your items, adjust quantities, keep browsing — when you&rsquo;re ready, share your list.
                </p>
              </div>
              <button
                onClick={clearList}
                style={{ flexShrink: 0, fontSize: '12px', fontWeight: 600, color: '#991b1b', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer' }}
              >
                Clear all
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={thStyle}>#</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Profile &amp; Specs</th>
                    <th style={{ ...thStyle, textAlign: 'left', width: '20%' }}>SKU / Part No</th>
                    <th style={{ ...thStyle, width: '72px' }}>UOM</th>
                    <th style={{ ...thStyle, width: '100px' }}>QTY</th>
                    <th style={{ ...thStyle, width: '28px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {shoppingList.map((item, rowIdx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: rowIdx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                      <td style={{ ...tdStyle, color: '#9ca3af', textAlign: 'center', verticalAlign: 'top', paddingTop: '12px' }}>{rowIdx + 1}</td>

                      {/* Profile name + specs stacked */}
                      <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                        <textarea
                          value={item.name}
                          onChange={e => updateName(item.id, e.target.value)}
                          rows={Math.max(1, Math.ceil(item.name.length / 32))}
                          style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, color: '#0f172a', outline: 'none', padding: '2px 0 1px', borderBottom: '1.5px solid transparent', resize: 'none', lineHeight: 1.4, overflow: 'hidden', display: 'block' }}
                          onFocus={e => { e.currentTarget.style.borderBottomColor = '#185D7A' }}
                          onBlur={e => { e.currentTarget.style.borderBottomColor = 'transparent' }}
                        />
                        {item.desc && (
                          <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginTop: '2px', lineHeight: 1.35 }}>{item.desc}</span>
                        )}
                      </td>

                      <td style={{ ...tdStyle, verticalAlign: 'top', paddingTop: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#475569', background: '#f1f5f9', padding: '2px 5px', borderRadius: '3px', wordBreak: 'break-all' }}>
                          {item.sku || '—'}
                        </span>
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'top', paddingTop: '10px' }}>
                        <input
                          value={item.uom}
                          onChange={e => updateUom(item.id, e.target.value.toUpperCase().slice(0, 6))}
                          style={{ width: '52px', border: '1.5px solid #e5e7eb', borderRadius: '4px', background: '#fff', fontSize: '11px', fontWeight: 700, color: '#6b7280', textAlign: 'center', padding: '3px 4px', outline: 'none' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#185D7A' }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }}
                        />
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'top', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center' }}>
                          <button onClick={() => updateQty(item.id, item.qty - 1)} style={qtyBtnStyle}>−</button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, item.qty + 1)} style={qtyBtnStyle}>+</button>
                        </div>
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'top', paddingTop: '10px' }}>
                        <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9ca3af', lineHeight: 1, padding: '2px' }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Manual add row */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
              <input
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addManualItem() }}
                placeholder="Add an item manually…"
                style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: '#0f172a', outline: 'none', background: '#f8fafc' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#185D7A' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }}
              />
              <button
                onClick={addManualItem}
                disabled={!newItemName.trim()}
                style={{
                  flexShrink: 0, fontSize: '13px', fontWeight: 700,
                  color: newItemName.trim() ? '#185D7A' : '#9ca3af',
                  background: newItemName.trim() ? '#f0f9ff' : '#f8fafc',
                  border: `1.5px solid ${newItemName.trim() ? '#bae6fd' : '#e5e7eb'}`,
                  borderRadius: '8px', padding: '8px 14px',
                  cursor: newItemName.trim() ? 'pointer' : 'default',
                }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <style>{`
        @keyframes bq-cartpop { 0%{transform:scale(1)} 30%{transform:scale(1.035)} 60%{transform:scale(0.995)} 100%{transform:scale(1)} }
        @keyframes bq-countpop { 0%{transform:scale(1)} 40%{transform:scale(1.5)} 100%{transform:scale(1)} }
        @keyframes bq-floatup { 0%{opacity:0;transform:translate(-50%,4px) scale(0.8)} 20%{opacity:1} 100%{opacity:0;transform:translate(-50%,-34px) scale(1)} }
        @media (prefers-reduced-motion: reduce) {
          .bq-cart-bar, .bq-count-pop, .bq-float-badge { animation: none !important; }
        }
      `}</style>
      <div className="bq-cart-bar" style={{
        position: 'relative',
        background: '#185D7A', color: '#ffffff',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between',
        boxShadow: pulsing
          ? '0 -2px 12px rgba(0,0,0,0.2), 0 0 0 3px rgba(249,115,22,0.9), 0 -6px 30px rgba(249,115,22,0.5)'
          : '0 -2px 12px rgba(0,0,0,0.2)',
        animation: pulsing ? 'bq-cartpop 0.6s ease-out' : 'none',
        transformOrigin: 'center bottom',
        transition: 'box-shadow 0.4s ease',
      }}>
        {/* Item count toggle */}
        <button
          onClick={() => setDrawerOpen(o => !o)}
          aria-label={drawerOpen ? 'Hide your materials list' : 'View and edit your materials list'}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: '10px', color: '#ffffff', cursor: 'pointer', fontWeight: 700, fontSize: '14px', padding: '7px 11px', flexShrink: 1, minWidth: 0 }}
        >
          {/* Floating "+N" that rises out of the cart when items are added */}
          {floatAdd > 0 && (
            <span className="bq-float-badge" style={{ position: 'absolute', left: '50%', top: '-30px', transform: 'translate(-50%,0)', background: '#f97316', color: '#fff', fontWeight: 800, fontSize: '13px', padding: '3px 9px', borderRadius: '99px', whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'bq-floatup 1.5s ease-out forwards' }}>
              +{floatAdd} added
            </span>
          )}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Your materials list</span>
          <span style={{ fontWeight: 600, opacity: 0.75, whiteSpace: 'nowrap' }}>·&nbsp;
            <span className="bq-count-pop" style={{ display: 'inline-block', animation: pulsing ? 'bq-countpop 0.6s ease-out' : 'none' }}>{shoppingList.length}</span>
            &nbsp;item{shoppingList.length !== 1 ? 's' : ''}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '2px', flexShrink: 0, background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {drawerOpen ? 'Hide' : 'View & edit'}
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d={drawerOpen ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Share as image */}
          <button
            onClick={shareList}
            disabled={sharing}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 14px', cursor: sharing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, opacity: sharing ? 0.7 : 1 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            {sharing ? 'Sharing…' : 'Share'}
          </button>

          {/* Optional host-supplied primary action (v6 puts "Request a Quote →" here) */}
          {primaryAction && (
            <button
              onClick={() => primaryAction.onClick(shoppingList)}
              style={{ background: '#ffffff', color: '#185D7A', border: 'none', borderRadius: '8px', padding: '9px 18px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
