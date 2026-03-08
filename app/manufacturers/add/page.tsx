'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import manufacturersData from '@/data/manufacturers.json'

const manufacturers = manufacturersData as any[]

type ParsedItem = {
  code: string
  name: string
  dimensions?: string
  uom: string
  confident: boolean
}

type ParsedSystem = {
  name: string
  application: string
  thickness?: string
  warranty?: string
  description: string
  sourceUrl: string
  sourceNote: string
  panels: ParsedItem[]
  accessories: ParsedItem[]
}

function AddSystemContent() {
  const searchParams = useSearchParams()
  const mfrSlug = searchParams.get('manufacturer') || ''
  const mfr = manufacturers.find(m => m.slug === mfrSlug)

  const [mode, setMode] = useState<'choose' | 'ai' | 'website'>('choose')
  const [url, setUrl] = useState(mfr?.website || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState<ParsedSystem | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleParse() {
    if (!url.trim()) { setError('Please enter a URL'); return }
    try { new URL(url) } catch { setError('Please enter a valid URL including https://'); return }
    if (mfr?.website) {
      const mfrDomain = new URL(mfr.website).hostname.replace('www.', '')
      const inputDomain = new URL(url).hostname.replace('www.', '')
      if (!inputDomain.includes(mfrDomain) && !mfrDomain.includes(inputDomain)) {
        const proceed = window.confirm(
          `This URL doesn't appear to be from ${mfr.name}'s website (${mfrDomain}).\n\nAlways use the official manufacturer website to ensure accurate product data.\n\nContinue anyway?`
        )
        if (!proceed) return
      }
    }
    setLoading(true)
    setError('')
    setParsed(null)
    try {
      const res = await fetch('/api/parse-manufacturer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, manufacturerName: mfr?.name || '' })
      })
      const result = await res.json()
      if (result.error) {
        setError(result.error + ' — try a more specific product page URL.')
      } else {
        setParsed({ ...result, sourceUrl: url })
      }
    } catch {
      setError('Could not parse this page. Try a more specific product page URL, or use the manufacturer website directly.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!parsed) return
    setLoading(true)
    try {
      const res = await fetch('/api/save-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manufacturerSlug: mfrSlug, system: parsed })
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="add">
        <nav className="add-nav">
          <button className="back-btn" onClick={() => window.history.back()}>
            ← {mfr ? mfr.name : 'Manufacturers'}
          </button>
          <a href="/portfolio" className="logo-sm">BUILD<span>QUOTE</span></a>
        </nav>

        <div className="add-hero">
          <p className="eyebrow">{mfr ? mfr.category : 'Manufacturer Portal'}</p>
          <h1 className="add-title">Add a System</h1>
          {mfr && <p className="add-sub">Adding to <strong>{mfr.name}</strong></p>}
          <p className="add-desc">Help other builders by adding a product system you use. Takes 2 minutes.</p>
          <div className="disclaimer">
            <span className="disc-icon">⚠</span>
            <p>AI-parsed component cards go live immediately and are tagged as community-added.
            Always verify product codes and specifications on the manufacturer's website
            before use. You are responsible for checking accuracy before submitting.</p>
          </div>
        </div>

        {submitted ? (
          <div className="add-body">
            <div className="success-card">
              <div className="success-icon">✓</div>
              <h2 className="success-title">System Added</h2>
              <p className="success-desc">
                Thanks for contributing. The system is now live in the portal.
                {parsed?.sourceUrl && (
                  <> Always verify at <a href={parsed.sourceUrl} target="_blank" rel="noopener noreferrer" className="cs-link">{new URL(parsed.sourceUrl).hostname}</a>.</>
                )}
              </p>
              <div className="success-actions">
                <a href={mfr ? `/manufacturers/${mfr.slug}` : '/manufacturers'} className="add-btn primary">
                  ← Back to {mfr?.name || 'Manufacturers'}
                </a>
                <button className="add-btn secondary" onClick={() => { setSubmitted(false); setParsed(null); setUrl(mfr?.website || ''); setMode('choose') }}>
                  Add Another
                </button>
              </div>
            </div>
          </div>

        ) : mode === 'choose' ? (
          <div className="add-body">
            <p className="choose-label">How would you like to add a system?</p>
            <div className="choose-grid">
              <button className="choose-card" onClick={() => setMode('ai')}>
                <div className="choose-icon">✦</div>
                <h3 className="choose-title">AI Parse</h3>
                <p className="choose-desc">Paste a product page URL and AI extracts the component card for you to review.</p>
                <span className="choose-tag">Recommended · 2 min</span>
              </button>
              <a
                className="choose-card"
                href={mfr?.website || 'https://www.google.com/search?q=' + encodeURIComponent((mfr?.name || '') + ' products')}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="choose-icon">↗</div>
                <h3 className="choose-title">Visit Manufacturer Website</h3>
                <p className="choose-desc">Go directly to {mfr?.name || 'the manufacturer'}&apos;s website to find product pages, brochures and install guides.</p>
                {mfr?.website && <span className="choose-tag website-tag">{mfr.website.replace('https://', '')}</span>}
              </a>
            </div>
          </div>

        ) : !parsed ? (
          <div className="add-body">
            <div className="parse-card">
              <h2 className="parse-title">Paste a Product Page URL</h2>
              <p className="parse-desc">
                Find the specific product system page on {mfr?.name || 'the manufacturer'}&apos;s website and paste the URL below.
                {mfr?.website && (
                  <> Not sure where to look?{' '}
                    <a href={mfr.website} target="_blank" rel="noopener noreferrer" className="cs-link">
                      Open {mfr.website.replace('https://', '')} ↗
                    </a>
                  </>
                )}
              </p>
              <div className="url-row">
                <input
                  className="url-input"
                  type="url"
                  placeholder={mfr?.website ? `e.g. ${mfr.website}/products/...` : 'https://manufacturer.com.au/products/...'}
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleParse()}
                />
                <button className="parse-btn" onClick={handleParse} disabled={loading}>
                  {loading ? 'Parsing…' : 'Parse ✦'}
                </button>
              </div>
              {error && <p className="parse-error">{error}</p>}
              {loading && (
                <div className="loading-state">
                  <div className="loading-dot" />
                  <p>AI is reading the product page and extracting component data…</p>
                </div>
              )}
              <div className="parse-tips">
                <p className="tips-label">Tips for best results</p>
                <p className="tips-item">· Use the specific product system page, not the homepage</p>
                <p className="tips-item">· Pages with a product table or spec sheet work best</p>
                <p className="tips-item">· Always verify the output before submitting</p>
              </div>
              <button className="back-link" onClick={() => setMode('choose')}>← Back</button>
            </div>
          </div>

        ) : (
          <div className="add-body">
            <div className="review-card">
              <div className="review-header">
                <div>
                  <p className="review-label">Review AI Output — verify before submitting</p>
                  <h2 className="review-title">{parsed.name}</h2>
                  <p className="review-source">Parsed from: <a href={parsed.sourceUrl} target="_blank" rel="noopener noreferrer" className="cs-link">{parsed.sourceUrl}</a></p>
                  {parsed.sourceNote && <p className="review-note">{parsed.sourceNote}</p>}
                </div>
                <div className="review-meta">
                  {parsed.application && <span className="meta-pill">{parsed.application}</span>}
                  {parsed.thickness && <span className="meta-pill">{parsed.thickness}</span>}
                  {parsed.warranty && <span className="meta-pill">{parsed.warranty} warranty</span>}
                </div>
              </div>
              <p className="review-desc">{parsed.description}</p>
              <div className="review-disclaimer">
                <span>⚠</span>
                <p>Check every row below against the manufacturer's website before submitting.
                Amber rows <span className="amber-label">?</span> indicate fields the AI was uncertain about.</p>
              </div>
              {parsed.panels.length > 0 && (
                <div className="review-section">
                  <p className="review-section-label">Panels — {parsed.panels.length} SKUs</p>
                  <table className="review-table">
                    <thead><tr><th>Code</th><th>Name</th><th>Dimensions</th><th>UOM</th></tr></thead>
                    <tbody>
                      {parsed.panels.map((p, i) => (
                        <tr key={i} className={!p.confident ? 'uncertain' : ''}>
                          <td>{p.code || <span className="amber-label">?</span>}</td>
                          <td>{p.name}{!p.confident && <span className="amber-label">?</span>}</td>
                          <td>{p.dimensions || '—'}</td>
                          <td>{p.uom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {parsed.accessories.length > 0 && (
                <div className="review-section">
                  <p className="review-section-label">Accessories — {parsed.accessories.length} SKUs</p>
                  <table className="review-table">
                    <thead><tr><th>Code</th><th>Name</th><th>Dimensions</th><th>UOM</th></tr></thead>
                    <tbody>
                      {parsed.accessories.map((a, i) => (
                        <tr key={i} className={!a.confident ? 'uncertain' : ''}>
                          <td>{a.code || <span className="amber-label">?</span>}</td>
                          <td>{a.name}{!a.confident && <span className="amber-label">?</span>}</td>
                          <td>{a.dimensions || '—'}</td>
                          <td>{a.uom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="review-actions">
                <button className="add-btn secondary" onClick={() => { setParsed(null); setError('') }}>← Re-parse</button>
                <a href={parsed.sourceUrl} target="_blank" rel="noopener noreferrer" className="add-btn secondary">
                  Verify on {new URL(parsed.sourceUrl).hostname} ↗
                </a>
                <button className="add-btn primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Saving…' : 'Looks Good — Submit ✓'}
                </button>
              </div>
              {error && <p className="parse-error">{error}</p>}
            </div>
          </div>
        )}

        <footer className="add-footer">© 2025 BuildQuote · Manufacturer Portal</footer>
      </div>
    </>
  )
}

export default function AddSystemPage() {
  return <Suspense><AddSystemContent /></Suspense>
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;700;800&family=Barlow:wght@300;400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--teal-l:#4a8fa0;--accent:#8cb8c4;--white:#f5f2ed;--bg:#0f1e26;--sand:#b8a98a}
  body{background:var(--bg)}
  .add{min-height:100vh;background:var(--bg);font-family:'Barlow',sans-serif;color:var(--white)}
  .add-nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 3rem;border-bottom:1px solid rgba(74,143,160,0.2);position:sticky;top:0;background:rgba(15,30,38,0.96);backdrop-filter:blur(10px);z-index:100}
  .back-btn{font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(245,242,237,0.45);background:none;border:none;cursor:pointer;transition:color 0.2s}
  .back-btn:hover{color:var(--accent)}
  .logo-sm{font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:800;letter-spacing:0.15em;text-decoration:none;color:var(--white)}
  .logo-sm span{color:var(--accent)}
  .add-hero{padding:3rem 3rem 2rem;max-width:800px}
  .eyebrow{font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:0.38em;color:var(--accent);text-transform:uppercase;margin-bottom:0.8rem}
  .add-title{font-family:'Barlow Condensed',sans-serif;font-size:clamp(2rem,5vw,3.5rem);font-weight:800;text-transform:uppercase;line-height:1;margin-bottom:0.75rem}
  .add-sub{font-family:'Barlow Condensed',sans-serif;font-size:1rem;letter-spacing:0.1em;color:var(--accent);text-transform:uppercase;margin-bottom:0.75rem}
  .add-sub strong{color:var(--white)}
  .add-desc{font-size:0.88rem;font-weight:300;color:rgba(245,242,237,0.5);line-height:1.7;max-width:520px;margin-bottom:1.5rem}
  .disclaimer{display:flex;gap:0.75rem;align-items:flex-start;background:rgba(184,169,138,0.08);border:1px solid rgba(184,169,138,0.25);border-left:3px solid var(--sand);padding:1rem 1.25rem;max-width:600px}
  .disc-icon{font-size:0.9rem;color:var(--sand);flex-shrink:0;margin-top:0.05rem}
  .disclaimer p{font-size:0.75rem;color:rgba(245,242,237,0.45);line-height:1.6}
  .add-body{padding:2rem 3rem 4rem;max-width:760px}
  .choose-label{font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:0.35em;text-transform:uppercase;color:rgba(245,242,237,0.3);margin-bottom:1.25rem}
  .choose-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px}
  .choose-card{background:rgba(30,58,74,0.4);border:1px solid rgba(74,143,160,0.15);padding:2rem;display:flex;flex-direction:column;gap:0.75rem;cursor:pointer;text-align:left;color:var(--white);text-decoration:none;transition:background 0.2s,border-color 0.2s;position:relative;overflow:hidden}
  .choose-card::before{content:'';position:absolute;top:0;left:0;width:3px;height:0;background:var(--teal-l);transition:height 0.3s}
  .choose-card:hover{background:rgba(46,107,122,0.2);border-color:rgba(74,143,160,0.3)}
  .choose-card:hover::before{height:100%}
  .choose-icon{font-size:1.5rem;color:var(--accent)}
  .choose-title{font-family:'Barlow Condensed',sans-serif;font-size:1.2rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase}
  .choose-desc{font-size:0.8rem;font-weight:300;color:rgba(245,242,237,0.45);line-height:1.6;flex:1}
  .choose-tag{font-family:'Barlow Condensed',sans-serif;font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent);padding:0.2rem 0.5rem;border:1px solid rgba(74,143,160,0.3);background:rgba(74,143,160,0.08);align-self:flex-start}
  .website-tag{color:rgba(245,242,237,0.35);border-color:rgba(245,242,237,0.12);background:transparent}
  .parse-card{background:rgba(30,58,74,0.4);border:1px solid rgba(74,143,160,0.15);padding:2rem;display:flex;flex-direction:column;gap:1.25rem}
  .parse-title{font-family:'Barlow Condensed',sans-serif;font-size:1.3rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase}
  .parse-desc{font-size:0.82rem;font-weight:300;color:rgba(245,242,237,0.5);line-height:1.6}
  .url-row{display:flex;gap:0.5rem}
  .url-input{flex:1;background:rgba(15,30,38,0.8);border:1px solid rgba(74,143,160,0.25);color:var(--white);font-family:'Barlow',sans-serif;font-size:0.85rem;padding:0.7rem 1rem;outline:none;transition:border-color 0.2s}
  .url-input::placeholder{color:rgba(245,242,237,0.2)}
  .url-input:focus{border-color:var(--accent)}
  .parse-btn{font-family:'Barlow Condensed',sans-serif;font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;padding:0.7rem 1.4rem;border:1px solid rgba(74,143,160,0.4);background:rgba(74,143,160,0.12);color:var(--accent);cursor:pointer;transition:all 0.18s;white-space:nowrap}
  .parse-btn:hover:not(:disabled){background:rgba(74,143,160,0.25);border-color:var(--accent)}
  .parse-btn:disabled{opacity:0.5;cursor:default}
  .parse-error{font-size:0.78rem;color:#f87171;padding:0.6rem 0.8rem;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2)}
  .loading-state{display:flex;align-items:center;gap:0.75rem;font-size:0.8rem;color:rgba(245,242,237,0.4)}
  .loading-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);animation:pulse 1.2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
  .parse-tips{background:rgba(15,30,38,0.5);border:1px solid rgba(74,143,160,0.1);padding:1rem 1.25rem;display:flex;flex-direction:column;gap:0.4rem}
  .tips-label{font-family:'Barlow Condensed',sans-serif;font-size:0.6rem;letter-spacing:0.28em;text-transform:uppercase;color:rgba(245,242,237,0.25);margin-bottom:0.3rem}
  .tips-item{font-size:0.75rem;color:rgba(245,242,237,0.35);line-height:1.5}
  .back-link{background:none;border:none;color:rgba(245,242,237,0.35);font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;text-align:left;padding:0;transition:color 0.2s}
  .back-link:hover{color:var(--accent)}
  .review-card{background:rgba(30,58,74,0.4);border:1px solid rgba(74,143,160,0.15);padding:2rem;display:flex;flex-direction:column;gap:1.5rem}
  .review-label{font-family:'Barlow Condensed',sans-serif;font-size:0.6rem;letter-spacing:0.3em;text-transform:uppercase;color:var(--sand);margin-bottom:0.4rem}
  .review-header{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap}
  .review-title{font-family:'Barlow Condensed',sans-serif;font-size:1.6rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:0.4rem}
  .review-source{font-size:0.72rem;color:rgba(245,242,237,0.35)}
  .review-note{font-size:0.72rem;color:rgba(245,242,237,0.3);margin-top:0.25rem;font-style:italic}
  .review-meta{display:flex;flex-direction:column;gap:0.4rem;align-items:flex-end}
  .meta-pill{font-family:'Barlow Condensed',sans-serif;font-size:0.6rem;letter-spacing:0.16em;text-transform:uppercase;padding:0.2rem 0.6rem;border:1px solid rgba(74,143,160,0.25);color:var(--accent)}
  .review-desc{font-size:0.82rem;font-weight:300;color:rgba(245,242,237,0.5);line-height:1.6}
  .review-disclaimer{display:flex;gap:0.6rem;align-items:flex-start;background:rgba(184,169,138,0.07);border:1px solid rgba(184,169,138,0.2);border-left:3px solid var(--sand);padding:0.75rem 1rem;font-size:0.72rem;color:rgba(245,242,237,0.4)}
  .amber-label{display:inline-block;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);color:#fbbf24;font-size:0.6rem;padding:0.1rem 0.35rem;margin-left:0.3rem;vertical-align:middle}
  .review-section{display:flex;flex-direction:column;gap:0.6rem}
  .review-section-label{font-family:'Barlow Condensed',sans-serif;font-size:0.62rem;letter-spacing:0.28em;text-transform:uppercase;color:rgba(245,242,237,0.3);padding-bottom:0.5rem;border-bottom:1px solid rgba(74,143,160,0.12)}
  .review-table{width:100%;border-collapse:collapse;font-size:0.78rem}
  .review-table th{font-family:'Barlow Condensed',sans-serif;font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(245,242,237,0.25);padding:0.4rem 0.6rem;text-align:left;border-bottom:1px solid rgba(74,143,160,0.1)}
  .review-table td{padding:0.5rem 0.6rem;color:rgba(245,242,237,0.65);border-bottom:1px solid rgba(74,143,160,0.07)}
  .review-table tr.uncertain td{background:rgba(251,191,36,0.04);border-left:2px solid rgba(251,191,36,0.25)}
  .review-actions{display:flex;gap:0.75rem;flex-wrap:wrap;padding-top:0.5rem;border-top:1px solid rgba(74,143,160,0.1)}
  .add-btn{font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;padding:0.6rem 1.2rem;border:1px solid;cursor:pointer;text-decoration:none;transition:all 0.18s;display:inline-block}
  .add-btn.primary{border-color:rgba(74,143,160,0.5);color:var(--accent);background:rgba(74,143,160,0.1)}
  .add-btn.primary:hover{background:rgba(74,143,160,0.22);border-color:var(--accent)}
  .add-btn.secondary{border-color:rgba(245,242,237,0.15);color:rgba(245,242,237,0.45);background:transparent}
  .add-btn.secondary:hover{border-color:rgba(245,242,237,0.3);color:rgba(245,242,237,0.7)}
  .add-btn:disabled{opacity:0.5;cursor:default}
  .success-card{background:rgba(30,58,74,0.4);border:1px solid rgba(74,143,160,0.2);padding:2.5rem;display:flex;flex-direction:column;align-items:center;text-align:center;gap:1rem;max-width:480px}
  .success-icon{width:52px;height:52px;border-radius:50%;background:rgba(74,143,160,0.15);border:1px solid rgba(74,143,160,0.3);display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:var(--accent)}
  .success-title{font-family:'Barlow Condensed',sans-serif;font-size:1.6rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase}
  .success-desc{font-size:0.82rem;font-weight:300;color:rgba(245,242,237,0.5);line-height:1.6}
  .success-actions{display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center;margin-top:0.5rem}
  .cs-link{color:var(--accent);text-decoration:none}
  .cs-link:hover{text-decoration:underline}
  .add-footer{padding:1.2rem 3rem;border-top:1px solid rgba(74,143,160,0.1);font-size:0.6rem;letter-spacing:0.14em;color:rgba(245,242,237,0.2);text-transform:uppercase}
  @media(max-width:680px){
    .add-nav,.add-hero,.add-body,.add-footer{padding-left:1.5rem;padding-right:1.5rem}
    .choose-grid{grid-template-columns:1fr}
    .url-row{flex-direction:column}
    .review-actions,.success-actions{flex-direction:column}
  }
`
