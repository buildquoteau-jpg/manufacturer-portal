'use client'

import { useState, useEffect } from 'react'
import { WidgetClient, type ShoppingListItem } from '@/app/widget/[token]/WidgetClient'
import type { WidgetSystem } from '@/lib/data/getWidgetData'

const LIST_STORAGE_KEY = 'bq_shopping_list'
const BUILDQUOTE_URL = process.env.NEXT_PUBLIC_BUILDQUOTE_URL || 'https://buildquote.com.au'

export function ManufacturerPageClient({
  systems,
  manufacturerName,
  draftId,
  returnHref,
}: {
  systems: WidgetSystem[]
  manufacturerName: string
  draftId?: string
  returnHref?: string
}) {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([])
  const [listDrawerOpen, setListDrawerOpen] = useState(false)
  const [convertingRFQ, setConvertingRFQ] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  useEffect(() => {
    try { const s = localStorage.getItem(LIST_STORAGE_KEY); if (s) setShoppingList(JSON.parse(s)) } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(shoppingList)) } catch {}
  }, [shoppingList])

  function addToShoppingList(items: ShoppingListItem[]) {
    setShoppingList(prev => {
      const updated = [...prev]
      for (const item of items) {
        const existing = updated.find(i => i.name === item.name && i.sku === item.sku)
        if (existing) { existing.qty += item.qty } else { updated.push(item) }
      }
      return updated
    })
    setListDrawerOpen(true)
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { setShoppingList(prev => prev.filter(i => i.id !== id)); return }
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  function updateName(id: string, name: string) {
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, name } : i))
  }

  function updateUom(id: string, uom: string) {
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, uom } : i))
  }

  function addManualItem() {
    const name = newItemName.trim()
    if (!name) return
    setShoppingList(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, sku: '', desc: '', uom: 'EA', qty: 1 }])
    setNewItemName('')
  }

  async function convertToRFQ() {
    setConvertingRFQ(true)
    try {
      const { draftId: newDraftId } = await fetch('/api/create-draft', { method: 'POST' }).then(r => r.json())
      await fetch('/api/add-to-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: newDraftId, items: shoppingList.map(i => ({ name: i.name, sku: i.sku, desc: i.desc, uom: i.uom, qty: String(i.qty) })) }),
      })
      window.location.href = `${BUILDQUOTE_URL}/rfq?draft=${newDraftId}`
    } catch { setConvertingRFQ(false) }
  }

  // When a draftId is passed (user came from BuildQuote RFQ), use the existing RFQ flow.
  // Otherwise, wire up the shopping list.
  const widgetProps = draftId
    ? { mode: 'rfq' as const, draftId, returnHref }
    : { mode: 'rfq' as const, onAddToShoppingList: addToShoppingList }

  return (
    <>
      <WidgetClient
        systems={systems}
        widgetId=""
        manufacturerName={manufacturerName}
        {...widgetProps}
      />

      {/* Shopping list bar — only shown when not in RFQ draft mode */}
      {!draftId && shoppingList.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>

          {/* Expandable drawer */}
          {listDrawerOpen && (
            <div style={{ background: '#ffffff', borderTop: '1px solid #e5e7eb', maxHeight: '420px', overflowY: 'auto', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' }}>
              <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px 20px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '10px' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {shoppingList.length} item{shoppingList.length !== 1 ? 's' : ''}
                  </p>
                  <button onClick={() => setShoppingList([])}
                    style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer' }}>
                    Clear all
                  </button>
                </div>

                {shoppingList.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <input value={item.name} onChange={e => updateName(item.id, e.target.value)}
                      style={{ flex: 1, border: 'none', borderBottom: '1.5px solid transparent', background: 'transparent', fontSize: '14px', fontWeight: 600, color: '#0f172a', outline: 'none', padding: '2px 0', minWidth: 0 }}
                      onFocus={e => { e.currentTarget.style.borderBottomColor = '#185D7A' }}
                      onBlur={e => { e.currentTarget.style.borderBottomColor = 'transparent' }} />
                    <input value={item.uom} onChange={e => updateUom(item.id, e.target.value.toUpperCase().slice(0, 6))}
                      style={{ width: '44px', border: '1.5px solid #e5e7eb', borderRadius: '5px', background: '#f8fafc', fontSize: '11px', fontWeight: 700, color: '#6b7280', textAlign: 'center', padding: '3px 4px', outline: 'none' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#185D7A' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ minWidth: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <button onClick={() => setShoppingList(prev => prev.filter(i => i.id !== item.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', lineHeight: 1, padding: '4px', flexShrink: 0 }}>×</button>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                  <input value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addManualItem() }}
                    placeholder="Add an item…"
                    style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: '#0f172a', outline: 'none', background: '#f8fafc' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#185D7A' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }} />
                  <button onClick={addManualItem} disabled={!newItemName.trim()}
                    style={{ flexShrink: 0, fontSize: '13px', fontWeight: 700, color: newItemName.trim() ? '#185D7A' : '#9ca3af', background: newItemName.trim() ? '#f0f9ff' : '#f8fafc', border: `1.5px solid ${newItemName.trim() ? '#bae6fd' : '#e5e7eb'}`, borderRadius: '8px', padding: '8px 14px', cursor: newItemName.trim() ? 'pointer' : 'default' }}>
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bar */}
          <div style={{ background: '#185D7A', color: '#ffffff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between', boxShadow: '0 -2px 12px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setListDrawerOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 700, fontSize: '14px', padding: 0, flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              {shoppingList.length} item{shoppingList.length !== 1 ? 's' : ''}
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d={listDrawerOpen ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            <button onClick={convertToRFQ} disabled={convertingRFQ}
              style={{ background: '#ffffff', color: '#185D7A', border: 'none', borderRadius: '8px', padding: '9px 18px', fontWeight: 800, fontSize: '14px', cursor: convertingRFQ ? 'wait' : 'pointer', letterSpacing: '-0.01em', opacity: convertingRFQ ? 0.7 : 1, transition: 'opacity 0.15s', whiteSpace: 'nowrap' }}>
              {convertingRFQ ? 'Creating…' : 'Request a Quote →'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
