'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { ManufacturerListItem } from '@/lib/data/getManufacturers'
import { SystemCardTile } from '@/components/ui/SystemCardTile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BUILDQUOTE_URL = process.env.NEXT_PUBLIC_BUILDQUOTE_URL || 'https://buildquote.com.au'
const LIST_STORAGE_KEY = 'bq_shopping_list'

// ── Types ─────────────────────────────────────────────────────────────────────

type SystemResult = {
  id: string
  name: string
  product_code: string
  slug: string | null
  category: string
  subcategory: string | null
  description: string | null
  dimensions: string | null
  hero_image_url: string | null
  australian_made: boolean | null
  notes: string | null
  manufacturers: { id: string; name: string; slug: string; logo_url: string | null }
  system_profiles: { id: string }[]
  system_components: { components: unknown | null }[]
}

interface ShoppingListItem {
  id: string; name: string; sku: string; desc: string; uom: string; qty: number
}

// ── Intent detection ──────────────────────────────────────────────────────────

function detectIntent(query: string): 'search' | 'question' | 'list' {
  const q = query.trim()
  if (q.includes('\n') || /^\d/.test(q) || (q.split(',').length >= 3 && /\d/.test(q))) return 'list'
  if (/^(what|which|how|when|why|can|do|does|is|are|will)\b/i.test(q) || q.endsWith('?')) return 'question'
  return 'search'
}

// Common words that add no search value — stripped before matching
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','have','has','do','does','did',
  'will','would','could','should','may','might','can','its','it','this','that',
  'options','option','types','type','kind','kinds','best','good','great',
  'available','products','product','systems','system','materials','material',
  'what','which','how','when','where','who','why','some','any','all','other',
  'show','me','find','get','looking','need','want','please','like','near',
  'here','there','my','our','your','we','i','us','about','suitable',
  'use','using','different','various','range','ranges',
])

function fuzzySearch(items: SystemResult[], query: string): SystemResult[] {
  const q = query.trim()
  if (q.length < 2) return []

  const allTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 1)
  // Strip stop words; fall back to all terms if nothing meaningful remains
  const meaningful = allTerms.filter(t => !STOP_WORDS.has(t))
  const terms = meaningful.length > 0 ? meaningful : allTerms

  const score = (item: SystemResult) => {
    const mfr = item.manufacturers as any
    const hay = [item.name, item.product_code, item.category, item.subcategory ?? '', mfr?.name ?? '', item.description ?? '', item.dimensions ?? '', item.notes ?? ''].join(' ').toLowerCase()
    return terms.filter(t => hay.includes(t)).length
  }

  // Prefer full matches; fall back to ≥50% if nothing found
  const full = items.filter(item => score(item) === terms.length)
  if (full.length > 0) return full

  const threshold = Math.max(1, Math.ceil(terms.length * 0.5))
  return items
    .map(item => ({ item, s: score(item) }))
    .filter(({ s }) => s >= threshold)
    .sort((a, b) => b.s - a.s)
    .map(({ item }) => item)
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EXAMPLES = ['820 internal door', 'fibre cement cladding', 'composite decking', 'external corner trim']

const READING_MESSAGES = [
  "Measuring twice, reading once…",
  "It's always three trips to Bunnings. Always.",
  "Counting fixings. There are never enough fixings.",
  "Consulting the ghost of a retired builder…",
  "Cross-referencing with the ancient wisdom of the spec sheet…",
  "Making sure no one forgot the noggins…",
  "Asking the foreman, who's asking the apprentice, who's Googling it…",
  "Double-checking the decimal points — someone always gets them wrong…",
  "Calculating how many trips to the hardware store this will actually take…",
  "Checking the engineer's report. No, the other engineer's report.",
  "Why did the builder become a musician? He already knew how to lay down tracks.",
  "Estimating with 20% contingency for the stuff you'll definitely forget…",
  "Locating the spec sheet that was definitely left on the ute…",
  "Squaring it up. Levelling it out. Making good.",
]

// ── Main component ────────────────────────────────────────────────────────────

export function ManufacturersClient({ manufacturers, draft }: { manufacturers: ManufacturerListItem[]; draft: string | undefined }) {

  // ── State ────────────────────────────────────────────────────────────────
  const [query, setQuery]                   = useState('')
  const [mfrFilter, setMfrFilter]           = useState('')
  const [allSystems, setAllSystems]         = useState<SystemResult[]>([])
  const [systemsLoading, setSystemsLoading] = useState(false)
  const [systemsLoaded, setSystemsLoaded]   = useState(false)

  const [aiAnswer, setAiAnswer]             = useState('')
  const [aiAnswering, setAiAnswering]       = useState(false)
  const [aiCitedSystems, setAiCitedSystems] = useState<SystemResult[]>([])
  const [aiError, setAiError]               = useState('')
  const [aiOutOfScope, setAiOutOfScope]     = useState(false)

  const [listInput, setListInput]           = useState('')
  const [listParsing, setListParsing]       = useState(false)
  const [listError, setListError]           = useState('')
  const [listErrorSuggestions, setListErrorSuggestions] = useState<string[]>([])
  const [extracting, setExtracting]         = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx]   = useState(0)

  const [shoppingList, setShoppingList]     = useState<ShoppingListItem[]>([])
  const [listDrawerOpen, setListDrawerOpen] = useState(false)
  const [convertingRFQ, setConvertingRFQ]   = useState(false)
  const [newItemName, setNewItemName]       = useState('')
  const [sharing, setSharing]               = useState(false)

  const [listening, setListening]           = useState(false)
  const [listListening, setListListening]   = useState(false)
  const [speechAvailable, setSpeechAvailable] = useState(false)
  const [voiceError, setVoiceError]         = useState('')

  const inputRef      = useRef<HTMLInputElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const allSystemsRef = useRef<SystemResult[]>([])
  const draftParam    = draft ? `?draft=${draft}` : ''
  const returnHref    = draft ? `${BUILDQUOTE_URL}/rfq?draft=${draft}` : null
  const listBusy      = listParsing || extracting

  // ── Persist shopping list ────────────────────────────────────────────────
  useEffect(() => {
    try { const s = localStorage.getItem(LIST_STORAGE_KEY); if (s) setShoppingList(JSON.parse(s)) } catch { /* ignore */ }
  }, [])
  useEffect(() => {
    try { localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(shoppingList)) } catch { /* ignore */ }
  }, [shoppingList])

  // ── Speech API detection ─────────────────────────────────────────────────
  useEffect(() => {
    setSpeechAvailable(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition))
  }, [])

  // ── Cycle loading jokes ──────────────────────────────────────────────────
  useEffect(() => {
    if (!listBusy) { setLoadingMsgIdx(0); return }
    const id = setInterval(() => setLoadingMsgIdx(i => (i + 1) % READING_MESSAGES.length), 2600)
    return () => clearInterval(id)
  }, [listBusy])

  // ── Load systems ─────────────────────────────────────────────────────────
  const loadSystems = useCallback(async () => {
    if (systemsLoaded || systemsLoading) return
    setSystemsLoading(true)
    const { data } = await supabase.from('systems').select(`
      id, name, product_code, slug, category, subcategory, description,
      dimensions, hero_image_url, australian_made, notes,
      manufacturers ( id, name, slug, logo_url ),
      system_profiles ( id ),
      system_components ( id, components ( id ) )
    `).order('name')
    const systems = (data as unknown as SystemResult[]) ?? []
    allSystemsRef.current = systems
    setAllSystems(systems)
    setSystemsLoaded(true)
    setSystemsLoading(false)
  }, [systemsLoaded, systemsLoading])

  useEffect(() => { if (query.length >= 2) loadSystems() }, [query, loadSystems])
  const results = useMemo(() => fuzzySearch(allSystems, query), [allSystems, query])

  // ── AI search ────────────────────────────────────────────────────────────
  const handleSearchSubmit = async () => {
    const intent = detectIntent(query)
    if (intent === 'question') {
      setAiAnswer(''); setAiError(''); setAiOutOfScope(false); setAiAnswering(true)
      if (!systemsLoaded) await loadSystems()
      const topMatches = fuzzySearch(allSystemsRef.current, query).slice(0, 5)
      setAiCitedSystems(topMatches)
      try {
        const res = await fetch('/api/search/ask', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: query, systemContext: topMatches.map(s => ({ name: s.name, product_code: s.product_code, description: s.description, category: s.category, manufacturers: s.manufacturers })) }),
        })
        if (!res.ok || !res.body) { setAiError('Something went wrong. Please try again.'); setAiAnswering(false); return }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let full = ''
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          if (value) { full += decoder.decode(value); setAiAnswer(full) }
        }
        if (full.trim() === 'SCOPE_LIMIT') { setAiAnswer(''); setAiOutOfScope(true) }
      } catch { setAiError('Something went wrong. Please try again.') }
      finally { setAiAnswering(false) }
    }
    if (intent === 'list') { setListInput(query); setQuery(''); await handleReadListText(query) }
  }

  // ── Read list (text) ─────────────────────────────────────────────────────
  const addParsedItems = (rawItems: { qty: number; name: string; uom: string }[]) => {
    const newItems: ShoppingListItem[] = rawItems.map((item, i) => ({
      id: `parsed-${Date.now()}-${i}`, name: item.name, sku: '', desc: '', uom: item.uom ?? 'EA', qty: Number(item.qty) || 1,
    }))
    setShoppingList(prev => [...prev, ...newItems])
    setListInput(''); setListDrawerOpen(true)
  }

  const handleReadListText = async (text: string) => {
    if (!text.trim()) return
    setListParsing(true); setListError(''); setListErrorSuggestions([])
    try {
      const res = await fetch('/api/search/parse-list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const data = await res.json()
      if (res.ok && Array.isArray(data.items)) { addParsedItems(data.items) }
      else {
        setListError("We couldn't read your list.")
        setListErrorSuggestions(['Try one item per line, or separate with commas', 'Include quantities, e.g. "25 bags post set"', 'Type it out if it\'s hard to copy'])
      }
    } catch {
      setListError("Something went wrong reading the list.")
      setListErrorSuggestions(['Check your internet connection and try again', 'Try typing or pasting the list as plain text'])
    } finally { setListParsing(false) }
  }

  // ── Read list (image) ────────────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      setListError('Photo is too large — please use one under 8 MB.')
      setListErrorSuggestions(['Reduce the image size before uploading', 'Take a new, smaller photo'])
      return
    }
    setExtracting(true); setListError(''); setListErrorSuggestions([])
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch('/api/search/extract-from-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.items)) { addParsedItems(data.items) }
      else {
        setListError("We couldn't read items from that photo.")
        setListErrorSuggestions(['Make sure the text is clearly visible and well-lit', 'Try a straight-on shot with no shadows', 'Write clearly and avoid joins between words', 'Type or paste the list as text instead'])
      }
    } catch {
      setListError("Upload failed.")
      setListErrorSuggestions(['Check your internet connection', 'Try a different photo or type the list instead'])
    } finally { setExtracting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  // ── Shopping list helpers ────────────────────────────────────────────────
  const addToShoppingList = (system: SystemResult) => {
    const mfr = system.manufacturers as any
    const displayName = mfr?.name ? `${mfr.name} ${system.name}` : system.name
    setShoppingList(prev => {
      const ex = prev.find(i => i.id === system.id)
      if (ex) return prev.map(i => i.id === system.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: system.id, name: displayName, sku: system.product_code ?? '', desc: system.description ?? '', uom: 'EA', qty: 1 }]
    })
  }
  const updateQty  = (id: string, n: number) => { if (n <= 0) setShoppingList(prev => prev.filter(i => i.id !== id)); else setShoppingList(prev => prev.map(i => i.id === id ? { ...i, qty: n } : i)) }
  const updateName = (id: string, name: string) => setShoppingList(prev => prev.map(i => i.id === id ? { ...i, name } : i))
  const updateUom  = (id: string, uom: string)  => setShoppingList(prev => prev.map(i => i.id === id ? { ...i, uom } : i))
  const removeFromList = (id: string) => setShoppingList(prev => prev.filter(i => i.id !== id))
  const addManualItem = () => {
    if (!newItemName.trim()) return
    setShoppingList(prev => [...prev, { id: `manual-${Date.now()}`, name: newItemName.trim(), sku: '', desc: '', uom: 'EA', qty: 1 }])
    setNewItemName('')
  }

  // ── Share list as image ──────────────────────────────────────────────────
  const shareList = async () => {
    if (sharing || shoppingList.length === 0) return
    setSharing(true)
    try {
      const PAD = 28, IH = 56, HH = 88, FH = 52, W = 560
      const H = HH + shoppingList.length * IH + FH

      const canvas = document.createElement('canvas')
      canvas.width = W * 2; canvas.height = H * 2
      const ctx = canvas.getContext('2d')!
      ctx.scale(2, 2)

      // White bg
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)

      // Header gradient
      const g = ctx.createLinearGradient(0, 0, W, 0)
      g.addColorStop(0, '#185D7A'); g.addColorStop(1, '#0f4461')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH)

      // "Build" + "Quote" wordmark
      ctx.font = 'bold 22px Arial, Helvetica, sans-serif'
      ctx.fillStyle = '#ffffff'; ctx.fillText('Build', PAD, HH / 2 + 8)
      const bw = ctx.measureText('Build').width
      ctx.fillStyle = '#f97316'; ctx.fillText('Quote', PAD + bw, HH / 2 + 8)

      // Subtitle
      ctx.font = '12px Arial, Helvetica, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fillText('Materials List', PAD, HH / 2 + 28)

      // Date
      ctx.font = '11px Arial, Helvetica, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'right'
      ctx.fillText(new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }), W - PAD, HH / 2 + 8)
      ctx.textAlign = 'left'

      // Items
      shoppingList.forEach((item, i) => {
        const y = HH + i * IH
        ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#ffffff'; ctx.fillRect(0, y, W, IH)

        // Name (truncate)
        ctx.font = '600 15px Arial, Helvetica, sans-serif'; ctx.fillStyle = '#0f172a'
        const maxW = W - PAD * 2 - 90
        let name = item.name
        while (name.length > 8 && ctx.measureText(name).width > maxW) name = name.slice(0, -4) + '…'
        ctx.fillText(name, PAD, y + IH / 2 + 6)

        // Qty + UOM
        ctx.font = 'bold 15px Arial, Helvetica, sans-serif'; ctx.fillStyle = '#185D7A'; ctx.textAlign = 'right'
        ctx.fillText(`${item.qty} ${item.uom}`, W - PAD, y + IH / 2 + 6); ctx.textAlign = 'left'

        // Divider
        ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(PAD, y + IH); ctx.lineTo(W - PAD, y + IH); ctx.stroke()
      })

      // Footer
      const fY = HH + shoppingList.length * IH
      ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, fY, W, FH)
      ctx.font = '11px Arial, Helvetica, sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center'
      ctx.fillText(`buildquote.com.au  ·  ${shoppingList.length} item${shoppingList.length !== 1 ? 's' : ''}`, W / 2, fY + FH / 2 + 4)
      ctx.textAlign = 'left'

      await new Promise<void>(resolve => {
        canvas.toBlob(async blob => {
          if (!blob) { resolve(); return }
          const file = new File([blob], 'materials-list.png', { type: 'image/png' })
          try {
            if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({ title: 'BuildQuote Materials List', text: `My materials list — ${shoppingList.length} item${shoppingList.length !== 1 ? 's' : ''}`, files: [file] })
            } else {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url
              a.download = `materials-list-${new Date().toISOString().slice(0, 10)}.png`; a.click()
              URL.revokeObjectURL(url)
            }
          } catch { /* user cancelled */ }
          resolve()
        }, 'image/png')
      })
    } finally { setSharing(false) }
  }

  // ── Voice input ──────────────────────────────────────────────────────────
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    setVoiceError('')
    const r = new SR(); r.lang = 'en-AU'
    r.onresult = (e: any) => { setQuery(e.results[0][0].transcript); loadSystems() }
    r.onerror = () => {
      setVoiceError("We couldn't make out what you said.")
      setListening(false)
    }
    r.onnomatch = () => {
      setVoiceError("No match found — try speaking more slowly.")
      setListening(false)
    }
    r.onend = () => setListening(false)
    r.start(); setListening(true)
  }

  // ── Voice input into list textarea (appends) ─────────────────────────────
  const startListVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    setListError(''); setListErrorSuggestions([])
    const r = new SR(); r.lang = 'en-AU'
    r.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setListInput(prev => prev.trim() ? `${prev.trim()}, ${transcript}` : transcript)
    }
    r.onerror = () => {
      setListError("Couldn't hear that clearly.")
      setListErrorSuggestions(['Speak more slowly and clearly', 'Reduce background noise', 'Type or paste the list instead'])

      setListListening(false)
    }
    r.onend = () => setListListening(false)
    r.start(); setListListening(true)
  }

  // ── Convert to RFQ ───────────────────────────────────────────────────────
  const convertToRFQ = async () => {
    setConvertingRFQ(true)
    try {
      const { draftId } = await fetch('/api/create-draft', { method: 'POST' }).then(r => r.json())
      await fetch('/api/add-to-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, items: shoppingList.map(i => ({ name: i.name, sku: i.sku, desc: i.desc, uom: i.uom, qty: String(i.qty) })) }),
      })
      window.location.href = `${BUILDQUOTE_URL}/rfq?draft=${draftId}`
    } catch { setConvertingRFQ(false) }
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const intent = query.trim().length >= 2 ? detectIntent(query) : 'search'
  const intentLabel = intent === 'question' ? 'Press Enter to ask AI ↵' : intent === 'list' ? 'Press Enter to read list ↵' : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Hero / Search ──────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(140deg, #185D7A 0%, #0f4461 100%)', padding: '52px 20px 44px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>

          {draft ? (
            <div style={{ marginBottom: '28px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Quote Mode Active</p>
              <h1 style={{ margin: '0 0 10px', fontSize: '28px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>Add products to your RFQ</h1>
              <p style={{ margin: '0 0 16px', fontSize: '15px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>Search for a product or browse by manufacturer below.</p>
              <a href={returnHref!} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Exit product browse — return to RFQ</a>
            </div>
          ) : (
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Find Building Products &amp; Suppliers</h1>
              <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>Browse manufacturer product systems and find local WA suppliers — in seconds.</p>
            </div>
          )}

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: intentLabel ? '6px' : '16px' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="6" stroke="#94a3b8" strokeWidth="2"/><path d="M13 13l3 3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <input
              ref={inputRef} type="text" value={query}
              onChange={e => { setQuery(e.target.value); setVoiceError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit() }}
              placeholder="Search or ask a question…"
              style={{ width: '100%', boxSizing: 'border-box', border: '0', borderRadius: '16px', padding: '16px 52px 16px 46px', fontSize: '16px', color: '#0f172a', background: '#ffffff', outline: 'none', boxShadow: '0 6px 32px rgba(0,0,0,0.22)', fontWeight: 500 }}
            />
            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              {query && (
                <button onClick={() => { setQuery(''); setAiAnswer(''); setAiError(''); setAiOutOfScope(false); setAiCitedSystems([]); inputRef.current?.focus() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#9ca3af', lineHeight: 1, padding: '4px 6px' }}>×</button>
              )}
              {speechAvailable && (
                <button onClick={startVoice} aria-label={listening ? 'Listening…' : 'Voice input'}
                  style={{ background: listening ? 'rgba(24,93,122,0.12)' : 'none', border: 'none', cursor: 'pointer', padding: '7px', borderRadius: '8px', display: 'flex', alignItems: 'center', color: listening ? '#185D7A' : '#9ca3af' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {intentLabel && <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>{intentLabel}</p>}

          {/* Voice error */}
          {voiceError && (
            <div style={{ background: 'rgba(253,186,116,0.15)', border: '1px solid rgba(253,186,116,0.4)', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', textAlign: 'left' }}>
              <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#fed7aa' }}>{voiceError}</p>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Try instead:</p>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {['Speak more slowly and clearly', 'Reduce background noise', 'Type your search in the box above', 'Paste a written list in the area below'].map(s => (
                  <li key={s} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>{s}</li>
                ))}
              </ul>
              <button onClick={() => setVoiceError('')} style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Dismiss</button>
            </div>
          )}

          {/* Example chips */}
          {!query && !voiceError && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}>Try:</span>
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => { setQuery(ex); loadSystems() }}
                  style={{ fontSize: '13px', padding: '6px 14px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: '99px', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.24)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)' }}>
                  {ex}
                </button>
              ))}
            </div>
          )}

          {/* Quick List panel */}
          <div style={{ marginTop: '4px', background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '16px 18px', textAlign: 'left' }}>
            <p style={{ margin: '0 0 3px', fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
              Already know what you need?
            </p>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
              Type, upload or speak your building materials list. BuildQuote will convert it into a clear shopping list or RFQ.
            </p>

            {listBusy ? (
              /* Loading panel with jokes */
              <div style={{ padding: '28px 8px 20px', textAlign: 'center' }}>
                <style>{`@keyframes bq-spin{to{transform:rotate(360deg)}}@keyframes bq-fade{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ animation: 'bq-spin 1.1s linear infinite' }}>
                    <circle cx="18" cy="18" r="15" stroke="rgba(255,255,255,0.15)" strokeWidth="3"/>
                    <path d="M18 3 A15 15 0 0 1 33 18" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>BuildQuote is reading your list…</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.5, minHeight: '40px', animation: 'bq-fade 2.6s ease-in-out infinite' }}>
                  {READING_MESSAGES[loadingMsgIdx]}
                </p>
              </div>
            ) : (
              <>
                <textarea
                  value={listInput}
                  onChange={e => { setListInput(e.target.value); setListError(''); setListErrorSuggestions([]) }}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReadListText(listInput) }}
                  placeholder="Paste or type a list — e.g. 25 bags post set, 13 stirrups, 15 lengths 70×35 …"
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px 13px', fontSize: '14px', color: '#ffffff', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
                />

                {/* Error with suggestions */}
                {listError && (
                  <div style={{ marginTop: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 12px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#fca5a5' }}>{listError}</p>
                    {listErrorSuggestions.length > 0 && (
                      <>
                        <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>Try:</p>
                        <ul style={{ margin: 0, paddingLeft: '14px' }}>
                          {listErrorSuggestions.map(s => <li key={s} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>{s}</li>)}
                        </ul>
                      </>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Upload + Mic buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <label title="Upload a photo of a handwritten list"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '8px', padding: '7px 12px', userSelect: 'none' as const }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      Upload photo
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }}
                        onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]) }} />
                    </label>
                    {speechAvailable && (
                      <button onClick={startListVoice} title="Speak your list"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: listListening ? '#ffffff' : 'rgba(255,255,255,0.8)', background: listListening ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)', border: `1px solid ${listListening ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.22)'}`, borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
                        </svg>
                        {listListening ? 'Listening…' : 'Speak list'}
                      </button>
                    )}
                  </div>
                  <button onClick={() => handleReadListText(listInput)} disabled={!listInput.trim()}
                    style={{ flexShrink: 0, fontSize: '13px', fontWeight: 700, background: listInput.trim() ? '#ffffff' : 'rgba(255,255,255,0.22)', color: listInput.trim() ? '#185D7A' : 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '8px', padding: '8px 18px', cursor: listInput.trim() ? 'pointer' : 'default', transition: 'background 0.15s' }}>
                    Read list →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── AI Answer Panel ────────────────────────────────────────────── */}
      {(aiAnswering || aiAnswer || aiError || aiOutOfScope) && (
        <div style={{ background: aiOutOfScope ? '#fffbeb' : '#f0f9ff', borderBottom: `2px solid ${aiOutOfScope ? '#fde68a' : '#bae6fd'}`, padding: '24px 20px' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              {aiOutOfScope
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              }
              <span style={{ fontWeight: 700, fontSize: '14px', color: aiOutOfScope ? '#92400e' : '#0369a1' }}>
                {aiOutOfScope ? 'Outside our product library' : 'AI Answer'}
              </span>
              {aiAnswering && <span style={{ fontSize: '12px', color: '#6b7280' }}>Thinking…</span>}
              <button onClick={() => { setAiAnswer(''); setAiError(''); setAiAnswering(false); setAiCitedSystems([]); setAiOutOfScope(false) }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', lineHeight: 1, padding: '2px' }}>×</button>
            </div>

            {aiOutOfScope ? (
              <div>
                <p style={{ margin: '0 0 12px', fontSize: '15px', color: '#78350f', lineHeight: 1.65 }}>
                  Sorry — our BuildQuote agent is trained on manufacturer-verified product systems only. It can&apos;t answer questions outside our product library.
                </p>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#92400e' }}>You might try:</p>
                <ul style={{ margin: '0 0 0 4px', paddingLeft: '16px' }}>
                  {['Searching for a specific product or category above', 'Browsing by manufacturer below', 'Contacting the manufacturer directly', 'Asking your local supplier or the BuildQuote team'].map(s => (
                    <li key={s} style={{ fontSize: '13px', color: '#78350f', marginBottom: '4px' }}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : aiError ? (
              <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>{aiError}</p>
            ) : (
              <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.75, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{aiAnswer}{aiAnswering && <span style={{ opacity: 0.4 }}>▋</span>}</p>
            )}

            {aiCitedSystems.length > 0 && !aiAnswering && !aiError && !aiOutOfScope && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #bae6fd' }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Related products</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {aiCitedSystems.map(s => {
                    const mfr = s.manufacturers as any
                    return (
                      <a key={s.id} href={mfr?.slug ? `/manufacturers/${mfr.slug}${draftParam}` : '#'}
                        style={{ fontSize: '13px', fontWeight: 600, color: '#0369a1', background: '#e0f2fe', padding: '4px 12px', borderRadius: '20px', textDecoration: 'none', border: '1px solid #bae6fd' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#bae6fd' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#e0f2fe' }}>
                        {s.name}
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Content area ──────────────────────────────────────────────── */}
      <div style={{ background: '#f8fafc', minHeight: '60vh' }}>
        <div className="mfp-catalogue-wrap px-4 sm:px-5" style={{ paddingBottom: shoppingList.length > 0 ? '120px' : '112px' }}>

          {systemsLoading && <p style={{ fontSize: '14px', color: '#9ca3af', paddingTop: '32px' }}>Loading products…</p>}

          {/* Search results */}
          {query.length >= 2 && !systemsLoading && systemsLoaded && (
            <div style={{ marginBottom: '56px', paddingTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Product matches</h2>
                {results.length > 0 && (
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                    {results.length} result{results.length !== 1 ? 's' : ''} across {new Set(results.map(r => (r.manufacturers as any)?.id)).size} manufacturer{new Set(results.map(r => (r.manufacturers as any)?.id)).size !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {results.length > 0 ? (
                <>
                  <style>{`.search-results-grid{display:grid;grid-template-columns:1fr;gap:20px}@media(min-width:680px){.search-results-grid{grid-template-columns:repeat(2,1fr)}}@media(min-width:1060px){.search-results-grid{grid-template-columns:repeat(3,1fr)}}`}</style>
                  <div className="search-results-grid">
                    {results.map(system => {
                      const mfr = system.manufacturers as any
                      const href = mfr?.slug ? `/manufacturers/${mfr.slug}${draftParam}` : null
                      return <SystemCardTile key={system.id} system={system} manufacturer={mfr} onClick={() => { if (href) window.location.href = href }} onAddToList={() => addToShoppingList(system)} />
                    })}
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px 24px', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#ffffff' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#374151' }}>No matches for &ldquo;{query}&rdquo;</p>
                  <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>Try different keywords, or ask a question — e.g. &ldquo;What fixings do I need for fibre cement cladding?&rdquo;</p>
                  <button onClick={() => { setQuery(''); inputRef.current?.focus() }}
                    style={{ fontSize: '13px', fontWeight: 600, color: '#185D7A', background: 'none', border: '1.5px solid #185D7A', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer' }}>
                    Clear search and browse by manufacturer ↓
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingTop: query.length >= 2 ? '0' : '36px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              {query.length >= 2 ? 'or browse by manufacturer' : 'Browse by manufacturer'}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Manufacturer filter */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative', maxWidth: '320px' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="6" stroke="#94a3b8" strokeWidth="2"/><path d="M13 13l3 3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <input type="text" value={mfrFilter} onChange={e => setMfrFilter(e.target.value)} placeholder="Filter manufacturers by name…"
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '10px 36px 10px 34px', fontSize: '14px', color: '#0f172a', background: '#ffffff', outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#185D7A' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }} />
              {mfrFilter && <button onClick={() => setMfrFilter('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', lineHeight: 1, padding: '2px' }}>×</button>}
            </div>
          </div>

          {/* Manufacturer grid */}
          {manufacturers.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '15px' }}>No manufacturers listed yet.</p>
          ) : (
            <>
              <style>{`.mfr-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}@media(min-width:640px){.mfr-grid{grid-template-columns:repeat(3,1fr)}}@media(min-width:900px){.mfr-grid{grid-template-columns:repeat(4,1fr)}}.mfr-card{background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:box-shadow .15s,border-color .15s}.mfr-card:hover{box-shadow:0 6px 24px rgba(24,93,122,.13);border-color:#185D7A}`}</style>
              {(() => {
                const filtered = manufacturers.filter(m => !mfrFilter.trim() || m.name.toLowerCase().includes(mfrFilter.trim().toLowerCase()))
                if (filtered.length === 0 && mfrFilter.trim()) return (
                  <div style={{ padding: '32px 24px', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#ffffff' }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#374151' }}>No manufacturers match &ldquo;{mfrFilter}&rdquo;</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Try a shorter or different name.</p>
                  </div>
                )
                return (
                  <div className="mfr-grid">
                    {filtered.map(m => (
                      <a key={m.id} href={`/manufacturers/${m.slug}${draftParam}`} className="mfr-card">
                        <div style={{ height: '160px', flexShrink: 0, ...(m.hero_image_url ? { backgroundImage: `url(${m.hero_image_url})`, backgroundSize: 'cover', backgroundPosition: `center ${m.hero_image_position_y ?? 50}%` } : { background: '#f0f4f8' }), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {!m.hero_image_url && (m.logo_url ? <img src={m.logo_url} alt={m.name} style={{ maxWidth: '75%', maxHeight: '65%', objectFit: 'contain' }} /> : <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textAlign: 'center', padding: '0 12px' }}>{m.name}</span>)}
                        </div>
                        <div style={{ padding: '12px 14px 14px', flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginBottom: '4px' }}>{m.name}</div>
                          {m.description && <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{m.description}</div>}
                          <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: '#185D7A' }}>{m.system_count} product{m.system_count !== 1 ? 's' : ''}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )
              })()}
            </>
          )}
        </div>
      </div>

      {/* ── Shopping list bottom bar ───────────────────────────────────── */}
      {shoppingList.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>

          {/* Expandable drawer */}
          {listDrawerOpen && (
            <div style={{ background: '#ffffff', borderTop: '1px solid #e5e7eb', maxHeight: '420px', overflowY: 'auto', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' }}>
              <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px 20px 20px' }}>

                {/* Drawer header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '10px' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {shoppingList.length} item{shoppingList.length !== 1 ? 's' : ''}
                  </p>
                  <button onClick={() => setShoppingList([])}
                    style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer' }}>
                    Clear all
                  </button>
                </div>

                {/* Items */}
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
                    <button onClick={() => removeFromList(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', lineHeight: 1, padding: '4px', flexShrink: 0 }}>×</button>
                  </div>
                ))}

                {/* Add item row */}
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

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={shareList} disabled={sharing}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 14px', cursor: sharing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, opacity: sharing ? 0.7 : 1 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                {sharing ? 'Sharing…' : 'Share list'}
              </button>
              <button onClick={convertToRFQ} disabled={convertingRFQ}
                style={{ background: '#ffffff', color: '#185D7A', border: 'none', borderRadius: '8px', padding: '9px 18px', fontWeight: 800, fontSize: '14px', cursor: convertingRFQ ? 'wait' : 'pointer', letterSpacing: '-0.01em', opacity: convertingRFQ ? 0.7 : 1, transition: 'opacity 0.15s', whiteSpace: 'nowrap' }}>
                {convertingRFQ ? 'Creating…' : 'Request a Quote →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
