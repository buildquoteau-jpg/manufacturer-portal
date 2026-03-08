'use client'
import { useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import SectionLabel from '../ui/SectionLabel'
import { LineItem } from '@/lib/types'

interface RFQScreenProps {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  onBack: () => void
  onNext: () => void
}

function blankItem(): LineItem {
  return { id: crypto.randomUUID(), name: '', sku: '', productId: '', desc: '', uom: '', qty: '' }
}

export default function RFQScreen({ items, onChange, onBack, onNext }: RFQScreenProps) {
  const update = (id: string, field: keyof LineItem, value: string) => {
    onChange(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const remove = (id: string) => onChange(items.filter(item => item.id !== id))

  const add = () => onChange([...items, blankItem()])

  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>Review Line Items</SectionLabel>

      {items.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-gray-400">No items found. Add them manually below.</p>
        </Card>
      )}

      {items.map((item, i) => (
        <Card key={item.id} className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <span className="text-gray-500 text-xs font-medium">ITEM {i + 1}</span>
            <button onClick={() => remove(item.id)} className="text-gray-500 hover:text-red-400 text-lg leading-none">✕</button>
          </div>

          <input
            value={item.name}
            onChange={e => update(item.id, 'name', e.target.value)}
            placeholder="Product Name"
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-base font-medium w-full"
          />

          <input
            value={item.desc}
            onChange={e => update(item.id, 'desc', e.target.value)}
            placeholder="Description / Specs"
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm w-full"
          />

          <div className="grid grid-cols-3 gap-2">
            {(['sku', 'uom', 'qty'] as const).map(field => (
              <input
                key={field}
                value={item[field]}
                onChange={e => update(item.id, field, e.target.value)}
                placeholder={field.toUpperCase()}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm w-full"
              />
            ))}
          </div>
        </Card>
      ))}

      <button
        onClick={add}
        className="border-2 border-dashed border-gray-600 hover:border-orange-500 text-gray-400 hover:text-orange-500 rounded-xl py-3 text-sm font-medium transition-colors"
      >
        + Add Line Item
      </button>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1 py-3">← Back</Button>
        <Button onClick={onNext} disabled={items.length === 0} className="flex-1 py-3">Continue →</Button>
      </div>
    </div>
  )
}