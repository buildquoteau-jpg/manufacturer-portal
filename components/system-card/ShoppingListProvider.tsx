'use client'

// Client-side shopping list state — ported from BuildQuote v6's
// ShoppingListProvider, minus the RFQ-draft context (that stays a
// BuildQuote-app concern). No Supabase reads or writes anywhere in here.
//
// Persistence is opt-in: pass `storageKey` to mirror the list into
// localStorage (what the public v6 app does with `bq_shopping_list`).
// Without it the list is purely in-memory — right for the Studio preview,
// where a manufacturer checking their card shouldn't leave residue behind.

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { ShoppingListItem } from './types'

type ShoppingListContextType = {
  shoppingList: ShoppingListItem[]
  addItems: (items: ShoppingListItem[]) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  updateName: (id: string, name: string) => void
  updateUom: (id: string, uom: string) => void
  clearList: () => void
  // Bumped every time items are added, carrying how many — the cart bar
  // watches this to play its "items landed here" pulse. tick 0 = never added.
  addFlash: { tick: number; count: number }
}

const ShoppingListContext = createContext<ShoppingListContextType | null>(null)

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext)
  if (!ctx) throw new Error('useShoppingList must be used inside ShoppingListProvider')
  return ctx
}

export function ShoppingListProvider({ children, storageKey }: {
  children: ReactNode
  storageKey?: string
}) {
  // MFP divergence from the ported source: hydrate lazily from localStorage
  // in the initializer instead of an effect — same one-time-on-mount result,
  // but avoids a render-then-immediately-setState flash (and this host's
  // stricter lint config flags setState-in-effect as an error, not a warning).
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => {
    if (!storageKey || typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [addFlash, setAddFlash] = useState<{ tick: number; count: number }>({ tick: 0, count: 0 })

  // Persist to localStorage on change
  useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(shoppingList))
    } catch {}
  }, [shoppingList, storageKey])

  function addItems(items: ShoppingListItem[]) {
    setShoppingList(prev => {
      const updated = [...prev]
      for (const item of items) {
        const existing = updated.find(i => i.name === item.name && i.sku === item.sku)
        if (existing) {
          existing.qty += item.qty
        } else {
          updated.push(item)
        }
      }
      return updated
    })
    setAddFlash(f => ({ tick: f.tick + 1, count: items.length }))
  }

  function removeItem(id: string) {
    setShoppingList(prev => prev.filter(i => i.id !== id))
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { removeItem(id); return }
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  function updateName(id: string, name: string) {
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, name } : i))
  }

  function updateUom(id: string, uom: string) {
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, uom } : i))
  }

  function clearList() {
    setShoppingList([])
  }

  return (
    <ShoppingListContext.Provider value={{
      shoppingList, addItems, removeItem, updateQty, updateName, updateUom, clearList, addFlash,
    }}>
      {children}
    </ShoppingListContext.Provider>
  )
}
