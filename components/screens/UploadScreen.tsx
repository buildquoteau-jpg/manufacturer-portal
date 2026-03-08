'use client'
import { useState, useRef } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { LineItem } from '@/lib/types'
import manufacturersData from '@/data/manufacturers.json'

interface UploadScreenProps {
  onNext: (items: LineItem[]) => void
  onSkip: () => void
}

const manufacturers = manufacturersData as any[]

// Flatten all systems for search
const allSystems = manufacturers.flatMap(m =>
  m.systems.map((s: any) => ({ ...s, manufacturer: m.name, manufacturerSlug: m.slug }))
)

type MfrItem = {
  code: string
  name: string
  length?: number | null
  width?: number | null
  thickness?: number | null
  uom: string
  qty: number
  checked: boolean
  isPanel: boolean
}

function buildMfrItems(system: any): MfrItem[] {
  return [
    ...system.panels.map((p: any) => ({ ...p, qty: 0, checked: false, isPanel: true })),
    ...system.accessories.map((a: any) => ({ ...a, qty: 0, checked: false, isPanel: false })),
  ]
}

function formatDims(item: any) {
  if (item.length && item.width && item.thickness) return `${item.length}×${item.width}×${item.thickness}mm`
  if (item.length && item.thickness) return `${item.length}×${item.thickness}mm`
  if (item.length) return `${item.length}mm`
  return null
}

export default function UploadScreen({ onNext, onSkip }: UploadScreenProps) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Manufacturer search state
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSystem, setSelectedSystem] = useState<any>(null)
  const [mfrItems, setMfrItems] = useState<MfrItem[]>([])

  const MAX_FILES = 5

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const newFiles = Array.from(incoming)
    setFiles(prev => {
      const combined = [...prev, ...newFiles]
      if (combined.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files at once.`)
        return prev
      }
      return combined
    })
  }

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const handleParse = async () => {
    setLoading(true)
    setError('')
    try {
      const allItems: LineItem[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/parse', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.items) allItems.push(...data.items)
      }
      onNext(allItems)
    } catch {
      setError('Something went wrong parsing your file. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredSystems = searchQuery.trim().length > 0
    ? allSystems.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.application?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.panels?.some((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allSystems

  const selectSystem = (sys: any) => {
    setSelectedSystem(sys)
    setMfrItems(buildMfrItems(sys))
  }

  const toggleMfrItem = (code: string) =>
    setMfrItems(prev => prev.map(i => i.code === code ? { ...i, checked: !i.checked } : i))

  const setMfrQty = (code: string, qty: number) =>
    setMfrItems(prev => prev.map(i =>
      i.code === code ? { ...i, qty: Math.max(0, qty), checked: qty > 0 ? true : i.checked } : i
    ))

  const addMfrItemsToRFQ = () => {
    const selected = mfrItems.filter(i => i.checked && i.qty > 0)
    if (selected.length === 0) return
    const lineItems: LineItem[] = selected.map(i => ({
      id: crypto.randomUUID(),
      name: i.name,
      sku: i.code,
      productId: '',
      desc: formatDims(i) || '',
      uom: i.uom,
      qty: String(i.qty),
    }))
    onNext(lineItems)
  }

  const selectedCount = mfrItems.filter(i => i.checked && i.qty > 0).length

  return (
    <div className="flex flex-col gap-4">

      {/* UPLOAD ZONE */}
      <Card
        className="border-2 border-dashed border-gray-600 hover:border-orange-500 transition-colors cursor-pointer text-center"
        // @ts-ignore
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
      >
        <div className="py-8">
          <p className="text-4xl mb-2">📄</p>
          <p className="text-gray-300 font-medium">Drop your BOM or materials list here</p>
          <p className="text-gray-500 text-sm mt-1">PDF, image, CSV, Excel, Word — anything works</p>
        </div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
      </Card>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((f, i) => (
            <Card key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-white text-sm font-medium">{f.name}</p>
                <p className="text-gray-500 text-xs">{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 text-lg px-2">✕</button>
            </Card>
          ))}
          <button onClick={() => inputRef.current?.click()} className="text-orange-500 text-sm underline text-left">+ Add another file</button>
        </div>
      )}

      {/* TIP */}
      <div className="flex gap-3 bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <p className="text-gray-400 text-sm leading-relaxed">
          <span className="text-gray-200 font-medium">No fancy format needed.</span> We accept PDF, Excel, Word, CSV — or even a photo of a handwritten note. Just lay your list on a flat surface, snap a photo, and upload it. We'll read it and sort everything out for you.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-white">Reading your file...</p>
          </div>
        </div>
      )}

      <Button onClick={handleParse} disabled={files.length === 0} className="w-full py-3">
        Continue →
      </Button>

      {/* DIVIDER */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-gray-500 text-xs uppercase tracking-widest font-mono">or</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      {/* MANUFACTURER SEARCH */}
      <button
        onClick={() => setShowSearch(!showSearch)}
        className="w-full py-3 rounded-lg border border-gray-700 text-gray-400 text-sm font-semibold hover:border-blue-500 hover:text-blue-400 transition-colors"
      >
        🏗️ Search Manufacturer Portal — find a product system
      </button>

      {showSearch && (
        <div className="flex flex-col gap-3 bg-gray-800/60 border border-gray-700 rounded-lg p-4">

          {!selectedSystem ? (
            <>
              <p className="text-gray-300 text-sm font-medium">Search product systems</p>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="e.g. EasyLap, Stria, James Hardie..."
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm w-full"
              />
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-xs">{filteredSystems.length} system{filteredSystems.length !== 1 ? 's' : ''} available</p>
                <a
                  href="/manufacturers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Browse full Manufacturer Portal ↗
                </a>
              </div>
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {filteredSystems.length === 0 && (
                  <p className="text-gray-500 text-sm py-2">No systems found.</p>
                )}
                {filteredSystems.map(sys => (
                  <button
                    key={sys.slug}
                    onClick={() => selectSystem(sys)}
                    className="flex items-start justify-between text-left px-3 py-2.5 rounded-lg bg-gray-700/60 hover:bg-gray-700 border border-gray-600 hover:border-orange-500 transition-colors gap-2"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{sys.name}</p>
                      <p className="text-gray-500 text-xs">{sys.manufacturer} · {sys.application} · {sys.thickness}</p>
                    </div>
                    <span className="text-gray-500 text-xs mt-0.5 flex-shrink-0">{sys.panels.length + sys.accessories.length} SKUs →</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* SYSTEM COMPONENT CARD */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-semibold">{selectedSystem.name}</p>
                  <p className="text-gray-500 text-xs">{selectedSystem.manufacturer} · {selectedSystem.thickness}</p>
                </div>
                <button
                  onClick={() => { setSelectedSystem(null); setMfrItems([]) }}
                  className="text-gray-500 hover:text-gray-300 text-xs underline"
                >
                  ← Back
                </button>
              </div>

              {/* DISCLAIMER */}
              <div className="flex gap-2 bg-yellow-900/20 border border-yellow-800/40 rounded px-3 py-2">
                <span className="text-yellow-600 text-xs flex-shrink-0">⚠</span>
                <p className="text-yellow-700/80 text-xs leading-relaxed">Always verify product codes and specifications on the manufacturer&apos;s website before finalising your order.</p>
              </div>

              {/* PANELS */}
              <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">Panels</p>
              <div className="flex flex-col gap-1">
                {mfrItems.filter(i => i.isPanel).map(item => (
                  <div key={item.code} className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${item.checked ? 'bg-gray-700/80 border-gray-500' : 'bg-gray-800/40 border-gray-700'}`}>
                    <button
                      onClick={() => toggleMfrItem(item.code)}
                      className={`w-5 h-5 flex-shrink-0 border flex items-center justify-center text-xs transition-colors ${item.checked ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-gray-600 text-gray-600'}`}
                    >
                      {item.checked ? '✓' : ''}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{item.name}</p>
                      <p className="text-gray-500 text-xs">{item.code} · {formatDims(item)} · {item.uom}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setMfrQty(item.code, item.qty - 1)} className="w-6 h-6 bg-gray-700 border border-gray-600 text-gray-300 text-sm hover:bg-gray-600 flex items-center justify-center">−</button>
                      <input
                        type="number"
                        min="0"
                        value={item.qty || ''}
                        placeholder="0"
                        onChange={e => setMfrQty(item.code, parseInt(e.target.value) || 0)}
                        className="w-10 bg-gray-700 border border-gray-600 text-white text-xs text-center py-1 outline-none focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button onClick={() => setMfrQty(item.code, item.qty + 1)} className="w-6 h-6 bg-gray-700 border border-gray-600 text-gray-300 text-sm hover:bg-gray-600 flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACCESSORIES */}
              <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">Accessories</p>
              <div className="flex flex-col gap-1">
                {mfrItems.filter(i => !i.isPanel).map(item => (
                  <div key={item.code} className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${item.checked ? 'bg-gray-700/80 border-gray-500' : 'bg-gray-800/40 border-gray-700'}`}>
                    <button
                      onClick={() => toggleMfrItem(item.code)}
                      className={`w-5 h-5 flex-shrink-0 border flex items-center justify-center text-xs transition-colors ${item.checked ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-gray-600 text-gray-600'}`}
                    >
                      {item.checked ? '✓' : ''}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{item.name}</p>
                      <p className="text-gray-500 text-xs">{item.code}{item.length ? ` · ${item.length}mm` : ''} · {item.uom}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setMfrQty(item.code, item.qty - 1)} className="w-6 h-6 bg-gray-700 border border-gray-600 text-gray-300 text-sm hover:bg-gray-600 flex items-center justify-center">−</button>
                      <input
                        type="number"
                        min="0"
                        value={item.qty || ''}
                        placeholder="0"
                        onChange={e => setMfrQty(item.code, parseInt(e.target.value) || 0)}
                        className="w-10 bg-gray-700 border border-gray-600 text-white text-xs text-center py-1 outline-none focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button onClick={() => setMfrQty(item.code, item.qty + 1)} className="w-6 h-6 bg-gray-700 border border-gray-600 text-gray-300 text-sm hover:bg-gray-600 flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addMfrItemsToRFQ}
                disabled={selectedCount === 0}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${selectedCount > 0 ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-700 text-gray-500 cursor-default'}`}
              >
                {selectedCount > 0 ? `Add ${selectedCount} item${selectedCount !== 1 ? 's' : ''} to RFQ →` : 'Select items and enter quantities'}
              </button>
            </>
          )}
        </div>
      )}

      {/* DIVIDER */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-gray-500 text-xs uppercase tracking-widest font-mono">or</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      {/* MANUAL ENTRY */}
      <button
        onClick={onSkip}
        className="w-full py-3 rounded-lg border border-gray-700 text-gray-400 text-sm font-semibold hover:border-gray-500 hover:text-gray-300 transition-colors"
      >
        ✏️ I don&apos;t have a list yet — add items manually
      </button>
    </div>
  )
}
