'use client'
import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import manufacturersData from '@/data/manufacturers.json'


type Item = {
  code: string
  name: string
  length?: number | null
  width?: number | null
  thickness?: number | null
  texture?: string
  uom: string
  qty: number
  checked: boolean
}

function buildItems(system: any): Item[] {
  const panels = system.panels.map((p: any) => ({ ...p, qty: 0, checked: false }))
  const accessories = system.accessories.map((a: any) => ({ ...a, qty: 0, checked: false }))
  return [...panels, ...accessories]
}

function formatDimensions(item: any) {
  if (item.length && item.width && item.thickness) return `${item.length}×${item.width}×${item.thickness}mm`
  if (item.length && item.thickness) return `${item.length}×${item.thickness}mm`
  if (item.length) return `${item.length}mm`
  return null
}

export default function SystemPage({ params }: { params: Promise<{ manufacturer: string; system: string }> }) {
  const { manufacturer: mfrSlug, system: systemSlug } = use(params)
  const router = useRouter()
  const mfr = (manufacturersData as any[]).find(m => m.slug === mfrSlug)
  const system = mfr?.systems.find((s: any) => s.slug === systemSlug)

  const [items, setItems] = useState<Item[]>(() => system ? buildItems(system) : [])
  const [added, setAdded] = useState(false)

  if (!system) {
    return (
      <div style={{ color: '#f5f2ed', padding: '3rem', background: '#0f1e26', minHeight: '100vh' }}>
        <p>System not found.</p>
        <a href={`/manufacturers/${mfrSlug}`} style={{ color: '#8cb8c4', marginTop: '1rem', display: 'block' }}>← Back to Manufacturer</a>
      </div>
    )
  }

  const panels = items.filter(i => system.panels.some((p: any) => p.code === i.code))
  const accessories = items.filter(i => system.accessories.some((a: any) => a.code === i.code))
  const selectedCount = items.filter(i => i.checked && i.qty > 0).length

  function toggleItem(code: string) {
    setItems(prev => prev.map(i => i.code === code ? { ...i, checked: !i.checked } : i))
  }

  function setQty(code: string, qty: number) {
    setItems(prev => prev.map(i =>
      i.code === code ? { ...i, qty: Math.max(0, qty), checked: qty > 0 ? true : i.checked } : i
    ))
  }

  function addToRFQ() {
    const selected = items.filter(i => i.checked && i.qty > 0)
    if (selected.length === 0) return
    const lineItems = selected.map(i => ({
      id: crypto.randomUUID(),
      name: i.name,
      sku: i.code,
      productId: '',
      desc: formatDimensions(i) || '',
      uom: i.uom,
      qty: String(i.qty),
    }))
    const encoded = encodeURIComponent(JSON.stringify(lineItems))
    setAdded(true)
    setTimeout(() => {
      router.push(`/rfq?items=${encoded}`)
    }, 600)
  }

  return (
    <>
      <style>{css}</style>
      <div className="sys">
        <nav className="sys-nav">
          <button className="back-btn" onClick={() => window.history.back()}>← {mfr?.name}</button>
          <a href="/portfolio" className="logo-sm">BUILD<span>QUOTE</span></a>
        </nav>

        <div className="sys-hero">
          <p className="eyebrow">{mfr?.name} · {system.application}</p>
          <h1 className="sys-title">{system.name}</h1>
          <p className="sys-desc">{system.description}</p>
          <div className="sys-meta">
            <span className="meta-pill">Thickness: {system.thickness}</span>
            <span className="meta-pill">Warranty: {system.warranty}</span>
          </div>
          <a href={mfr?.website} target="_blank" rel="noopener noreferrer" className="mfr-link">
            View on {mfr?.name} website ↗
          </a>
        </div>

        <div className="disclaimer">
          <span className="disc-icon">⚠</span>
          <p>Component cards are compiled using AI and publicly available manufacturer data.
          Always verify product codes, specifications and compatibility on the
          manufacturer&apos;s website before placing your order. Install guides and
          technical data sheets are available directly from the manufacturer.</p>
        </div>

        <div className="components">

          <div className="component-section">
            <p className="comp-label">Panels — select size and enter quantity</p>
            <div className="comp-table">
              <div className="table-head">
                <span>Code</span>
                <span>Description</span>
                <span>Dimensions</span>
                <span>UOM</span>
                <span>Qty</span>
                <span></span>
              </div>
              {panels.map(item => (
                <div key={item.code} className={`table-row${item.checked ? ' selected' : ''}`}>
                  <span className="td-code">{item.code}</span>
                  <span className="td-name">{item.name}</span>
                  <span className="td-dims">{formatDimensions(item) || '—'}</span>
                  <span className="td-uom">{item.uom}</span>
                  <span className="td-qty">
                    <button className="qty-btn" onClick={() => setQty(item.code, item.qty - 1)}>−</button>
                    <input
                      className="qty-input"
                      type="number"
                      min="0"
                      value={item.qty || ''}
                      placeholder="0"
                      onChange={e => setQty(item.code, parseInt(e.target.value) || 0)}
                    />
                    <button className="qty-btn" onClick={() => setQty(item.code, item.qty + 1)}>+</button>
                  </span>
                  <span className="td-check">
                    <button
                      className={`check-btn${item.checked ? ' on' : ''}`}
                      onClick={() => toggleItem(item.code)}
                    >{item.checked ? '✓' : '+'}</button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="component-section">
            <p className="comp-label">Accessories — pre-selected, enter quantities</p>
            <div className="comp-table">
              <div className="table-head">
                <span>Code</span>
                <span>Description</span>
                <span>Size</span>
                <span>UOM</span>
                <span>Qty</span>
                <span></span>
              </div>
              {accessories.map(item => (
                <div key={item.code} className={`table-row${item.checked ? ' selected' : ''}`}>
                  <span className="td-code">{item.code}</span>
                  <span className="td-name">{item.name}</span>
                  <span className="td-dims">{item.length ? `${item.length}mm` : '—'}</span>
                  <span className="td-uom">{item.uom}</span>
                  <span className="td-qty">
                    <button className="qty-btn" onClick={() => setQty(item.code, item.qty - 1)}>−</button>
                    <input
                      className="qty-input"
                      type="number"
                      min="0"
                      value={item.qty || ''}
                      placeholder="0"
                      onChange={e => setQty(item.code, parseInt(e.target.value) || 0)}
                    />
                    <button className="qty-btn" onClick={() => setQty(item.code, item.qty + 1)}>+</button>
                  </span>
                  <span className="td-check">
                    <button
                      className={`check-btn${item.checked ? ' on' : ''}`}
                      onClick={() => toggleItem(item.code)}
                    >{item.checked ? '✓' : '+'}</button>
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="rfq-bar">
          <div className="rfq-bar-inner">
            <span className="rfq-count">
              {selectedCount > 0
                ? `${selectedCount} item${selectedCount !== 1 ? 's' : ''} selected`
                : 'Select items and enter quantities'}
            </span>
            <button
              className={`rfq-btn${selectedCount === 0 ? ' disabled' : ''}${added ? ' done' : ''}`}
              onClick={addToRFQ}
              disabled={selectedCount === 0}
            >
              {added ? '✓ Added!' : '+ Add to BuildQuote'}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;700;800&family=Barlow:wght@300;400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--teal-l:#4a8fa0;--accent:#8cb8c4;--white:#f5f2ed;--bg:#0f1e26;--sand:#b8a98a}
  body{background:var(--bg)}
  .sys{min-height:100vh;background:var(--bg);font-family:'Barlow',sans-serif;color:var(--white);padding-bottom:100px}
  .sys-nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 3rem;border-bottom:1px solid rgba(74,143,160,0.2);position:sticky;top:0;background:rgba(15,30,38,0.96);backdrop-filter:blur(10px);z-index:100}
  .back-btn{font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(245,242,237,0.45);background:none;border:none;cursor:pointer;transition:color 0.2s}
  .back-btn:hover{color:var(--accent)}
  .logo-sm{font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:800;letter-spacing:0.15em;text-decoration:none;color:var(--white)}
  .logo-sm span{color:var(--accent)}
  .sys-hero{padding:3rem 3rem 1.5rem;max-width:800px}
  .eyebrow{font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:0.38em;color:var(--accent);text-transform:uppercase;margin-bottom:0.8rem}
  .sys-title{font-family:'Barlow Condensed',sans-serif;font-size:clamp(2rem,5vw,3.5rem);font-weight:800;text-transform:uppercase;line-height:1;margin-bottom:0.8rem}
  .sys-desc{font-size:0.85rem;font-weight:300;color:rgba(245,242,237,0.5);line-height:1.7;max-width:540px;margin-bottom:1rem}
  .sys-meta{display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem}
  .meta-pill{font-family:'Barlow Condensed',sans-serif;font-size:0.62rem;letter-spacing:0.16em;text-transform:uppercase;padding:0.25rem 0.65rem;border:1px solid rgba(74,143,160,0.3);color:var(--accent)}
  .mfr-link{font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(245,242,237,0.35);text-decoration:none;border-bottom:1px solid rgba(245,242,237,0.15);transition:color 0.2s,border-color 0.2s}
  .mfr-link:hover{color:var(--accent);border-color:var(--accent)}
  .disclaimer{display:flex;gap:0.75rem;align-items:flex-start;background:rgba(184,169,138,0.08);border:1px solid rgba(184,169,138,0.25);border-left:3px solid var(--sand);padding:1rem 1.5rem;margin:0 3rem 2rem;max-width:700px}
  .disc-icon{font-size:0.9rem;color:var(--sand);flex-shrink:0;margin-top:0.05rem}
  .disclaimer p{font-size:0.72rem;color:rgba(245,242,237,0.4);line-height:1.6}
  .components{padding:0 3rem}
  .component-section{margin-bottom:2.5rem}
  .comp-label{font-family:'Barlow Condensed',sans-serif;font-size:0.62rem;letter-spacing:0.32em;color:rgba(245,242,237,0.28);text-transform:uppercase;margin-bottom:0.75rem;padding-bottom:0.5rem;border-bottom:1px solid rgba(74,143,160,0.12)}
  .comp-table{display:flex;flex-direction:column;gap:1px}
  .table-head{display:grid;grid-template-columns:90px 1fr 130px 55px 110px 44px;gap:0.5rem;padding:0.5rem 1rem;font-family:'Barlow Condensed',sans-serif;font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(245,242,237,0.22)}
  .table-row{display:grid;grid-template-columns:90px 1fr 130px 55px 110px 44px;gap:0.5rem;padding:0.75rem 1rem;background:rgba(30,58,74,0.35);border:1px solid rgba(74,143,160,0.1);align-items:center;transition:background 0.18s,border-color 0.18s}
  .table-row.selected{background:rgba(46,107,122,0.18);border-color:rgba(74,143,160,0.25)}
  .td-code{font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;font-weight:600;letter-spacing:0.06em;color:var(--accent)}
  .td-name{font-size:0.78rem;color:rgba(245,242,237,0.75);line-height:1.3}
  .td-dims{font-size:0.72rem;color:rgba(245,242,237,0.4);font-family:'Barlow Condensed',sans-serif;letter-spacing:0.04em}
  .td-uom{font-family:'Barlow Condensed',sans-serif;font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(245,242,237,0.3)}
  .td-qty{display:flex;align-items:center;gap:0.25rem}
  .qty-btn{width:26px;height:26px;background:rgba(74,143,160,0.15);border:1px solid rgba(74,143,160,0.25);color:var(--accent);font-size:0.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;flex-shrink:0;line-height:1}
  .qty-btn:hover{background:rgba(74,143,160,0.3)}
  .qty-input{width:38px;background:rgba(30,58,74,0.6);border:1px solid rgba(74,143,160,0.2);color:var(--white);font-family:'Barlow Condensed',sans-serif;font-size:0.9rem;font-weight:600;text-align:center;padding:0.2rem 0;outline:none;-moz-appearance:textfield}
  .qty-input::-webkit-inner-spin-button,.qty-input::-webkit-outer-spin-button{-webkit-appearance:none}
  .qty-input:focus{border-color:var(--accent)}
  .td-check{display:flex;justify-content:center}
  .check-btn{width:28px;height:28px;background:none;border:1px solid rgba(74,143,160,0.22);color:rgba(245,242,237,0.3);font-size:0.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
  .check-btn.on{background:rgba(74,143,160,0.2);border-color:var(--accent);color:var(--accent)}
  .check-btn:hover{border-color:var(--accent);color:var(--accent)}
  .rfq-bar{position:fixed;bottom:0;left:0;right:0;background:rgba(15,30,38,0.97);border-top:1px solid rgba(74,143,160,0.25);backdrop-filter:blur(12px);z-index:200;padding:1rem 3rem}
  .rfq-bar-inner{max-width:900px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:1rem}
  .rfq-count{font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(245,242,237,0.35)}
  .rfq-btn{font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;letter-spacing:0.18em;text-transform:uppercase;padding:0.65rem 1.5rem;border:1px solid rgba(140,184,196,0.5);color:var(--accent);background:rgba(140,184,196,0.1);cursor:pointer;transition:all 0.2s;white-space:nowrap}
  .rfq-btn:hover:not(.disabled){background:rgba(140,184,196,0.22);border-color:var(--accent)}
  .rfq-btn.disabled{opacity:0.3;cursor:default}
  .rfq-btn.done{background:rgba(126,200,160,0.15);border-color:#7ec8a0;color:#7ec8a0}
  @media(max-width:768px){
    .sys-nav,.sys-hero,.components,.rfq-bar{padding-left:1.25rem;padding-right:1.25rem}
    .disclaimer{margin-left:1.25rem;margin-right:1.25rem}
    .table-head{display:none}
    .table-row{grid-template-columns:1fr auto;grid-template-rows:auto auto auto;gap:0.4rem;padding:0.9rem 1rem}
    .td-code{grid-column:1;font-size:0.82rem}
    .td-name{grid-column:1;grid-row:2;font-size:0.8rem}
    .td-dims{grid-column:1;grid-row:3;font-size:0.68rem}
    .td-uom{display:none}
    .td-qty{grid-column:2;grid-row:1/3;flex-direction:column;align-items:center;gap:0.2rem}
    .qty-btn{width:30px;height:30px;font-size:1rem}
    .qty-input{width:42px;font-size:1rem;padding:0.3rem 0}
    .td-check{grid-column:2;grid-row:3;justify-content:center}
    .rfq-bar-inner{flex-direction:column;gap:0.75rem;align-items:stretch}
    .rfq-count{text-align:center}
    .rfq-btn{text-align:center;padding:0.8rem}
  }
`
