'use client'
import { useState } from 'react'
import manufacturersData from '@/data/manufacturers.json'

const manufacturers = manufacturersData as any[]

export default function ManufacturersPage() {
  const [query, setQuery] = useState('')
  const filtered = query.trim()
    ? manufacturers.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.systems.some((s: any) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.application?.toLowerCase().includes(query.toLowerCase())
        )
      )
    : manufacturers

  return (
    <>
      <style>{css}</style>
      <div className="mfr">
        <nav className="mfr-nav">
          <a href="/portfolio" className="logo">BUILD<span>QUOTE</span></a>
          <span className="nav-tag">Manufacturer Portal</span>
        </nav>

        <div className="mfr-hero">
          <p className="eyebrow">Product Intelligence</p>
          <h1 className="mfr-title">Manufacturer<br />Portal</h1>
          <p className="mfr-sub">
            Browse systems and component cards from leading Australian building
            product manufacturers. Select components and send directly to BuildQuote.
          </p>
          <div className="disclaimer">
            <span className="disclaimer-icon">⚠</span>
            <p>Component cards are compiled using AI and publicly available manufacturer data.
            Always verify product codes, specifications and compatibility on the
            manufacturer&apos;s website before placing your order. Install guides and
            technical data sheets are available directly from the manufacturer.</p>
          </div>
        </div>

        <div className="mfr-search">
          <input
            className="mfr-search-input"
            type="text"
            placeholder="Search manufacturers or systems..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="mfr-grid">
          {filtered.map(m => (
            <a key={m.slug} href={`/manufacturers/${m.slug}`} className="mfr-card">
              <div className="mfr-card-top">
                <div className="mfr-logo-placeholder">
                  {m.name.split(' ').map((w: string) => w[0]).join('')}
                </div>
                <div className="mfr-meta">
                  <span className="mfr-country">{m.country}</span>
                  <span className="mfr-systems">{m.systems.length} systems</span>
                </div>
              </div>
              <h2 className="mfr-name">{m.name}</h2>
              <p className="mfr-desc">{m.description}</p>
              <div className="mfr-card-foot">
                <span className="mfr-arrow">↗</span>
              </div>
            </a>
          ))}

          <div className="mfr-card coming-soon">
            <div className="mfr-card-top">
              <div className="mfr-logo-placeholder dim">+</div>
            </div>
            <h2 className="mfr-name dim">More Coming Soon</h2>
            <p className="mfr-desc dim">Additional manufacturers being added. BGC, CSR, Knauf and more.</p>
          </div>
        </div>

        <footer className="mfr-footer">
          <span>© 2025 BuildQuote</span>
          <span>Southwest WA · Australia</span>
          <span>Manufacturer data updated Feb 2026</span>
        </footer>
      </div>
    </>
  )
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;700;800&family=Barlow:wght@300;400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--teal-l:#4a8fa0;--accent:#8cb8c4;--white:#f5f2ed;--bg:#0f1e26;--sand:#b8a98a}
  body{background:var(--bg)}
  .mfr{min-height:100vh;background:var(--bg);font-family:'Barlow',sans-serif;color:var(--white)}
  .mfr-nav{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 3rem;border-bottom:1px solid rgba(74,143,160,0.2);position:sticky;top:0;background:rgba(15,30,38,0.96);backdrop-filter:blur(10px);z-index:100}
  .logo{font-family:'Barlow Condensed',sans-serif;font-size:1.3rem;font-weight:800;letter-spacing:0.15em;text-decoration:none;color:var(--white)}
  .logo span{color:var(--accent)}
  .nav-tag{font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:0.3em;color:rgba(245,242,237,0.3);text-transform:uppercase}
  .mfr-hero{padding:4rem 3rem 2rem;max-width:860px}
  .eyebrow{font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:0.4em;color:var(--accent);text-transform:uppercase;margin-bottom:1rem}
  .mfr-title{font-family:'Barlow Condensed',sans-serif;font-size:clamp(2.5rem,6vw,4.5rem);font-weight:800;line-height:0.95;text-transform:uppercase;margin-bottom:1rem}
  .mfr-sub{font-size:0.9rem;font-weight:300;color:rgba(245,242,237,0.5);line-height:1.7;max-width:520px;margin-bottom:1.5rem}
  .disclaimer{display:flex;gap:0.75rem;align-items:flex-start;background:rgba(184,169,138,0.08);border:1px solid rgba(184,169,138,0.25);border-left:3px solid var(--sand);padding:1rem 1.25rem;max-width:600px}
  .disclaimer-icon{font-size:0.9rem;color:var(--sand);flex-shrink:0;margin-top:0.05rem}
  .disclaimer p{font-size:0.75rem;color:rgba(245,242,237,0.45);line-height:1.6}
  .mfr-grid{padding:2rem 3rem 3rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1px}
  .mfr-card{background:rgba(30,58,74,0.4);border:1px solid rgba(74,143,160,0.12);padding:2rem;display:flex;flex-direction:column;gap:0.8rem;position:relative;overflow:hidden;transition:background 0.22s,border-color 0.22s,transform 0.2s;text-decoration:none;color:inherit}
  .mfr-card::before{content:'';position:absolute;top:0;left:0;width:3px;height:0;background:var(--teal-l);transition:height 0.3s}
  .mfr-card:hover{background:rgba(46,107,122,0.2);border-color:rgba(74,143,160,0.3);transform:translateY(-2px)}
  .mfr-card:hover::before{height:100%}
  .mfr-card.coming-soon{opacity:0.4;cursor:default}
  .mfr-card.coming-soon:hover{background:rgba(30,58,74,0.4);border-color:rgba(74,143,160,0.12);transform:none}
  .mfr-card.coming-soon::before{display:none}
  .mfr-card-top{display:flex;justify-content:space-between;align-items:flex-start}
  .mfr-logo-placeholder{width:48px;height:48px;background:rgba(74,143,160,0.15);border:1px solid rgba(74,143,160,0.25);display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:0.9rem;font-weight:700;letter-spacing:0.05em;color:var(--accent)}
  .mfr-logo-placeholder.dim{color:rgba(245,242,237,0.2);border-color:rgba(245,242,237,0.1);background:transparent}
  .mfr-meta{display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem}
  .mfr-country{font-family:'Barlow Condensed',sans-serif;font-size:0.58rem;letter-spacing:0.2em;color:var(--accent);text-transform:uppercase}
  .mfr-systems{font-family:'Barlow Condensed',sans-serif;font-size:0.58rem;letter-spacing:0.16em;color:rgba(245,242,237,0.3);text-transform:uppercase}
  .mfr-name{font-family:'Barlow Condensed',sans-serif;font-size:1.5rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;line-height:1}
  .mfr-name.dim{color:rgba(245,242,237,0.25)}
  .mfr-desc{font-size:0.78rem;font-weight:300;color:rgba(245,242,237,0.45);line-height:1.6;flex:1}
  .mfr-desc.dim{color:rgba(245,242,237,0.2)}
  .mfr-card-foot{display:flex;justify-content:flex-end}
  .mfr-arrow{font-size:1.2rem;color:rgba(245,242,237,0.15);transition:color 0.2s,transform 0.2s}
  .mfr-card:hover .mfr-arrow{color:var(--accent);transform:translate(3px,-3px)}
  .mfr-footer{display:flex;justify-content:space-between;padding:1.2rem 3rem;border-top:1px solid rgba(74,143,160,0.12);font-size:0.6rem;letter-spacing:0.18em;color:rgba(245,242,237,0.22);text-transform:uppercase}

  .mfr-search{padding:0 3rem 1rem}
  .mfr-search-input{width:100%;max-width:480px;background:rgba(30,58,74,0.5);border:1px solid rgba(74,143,160,0.2);color:var(--white);font-family:'Barlow',sans-serif;font-size:0.88rem;padding:0.65rem 1rem;outline:none;transition:border-color 0.2s}
  .mfr-search-input::placeholder{color:rgba(245,242,237,0.25)}
  .mfr-search-input:focus{border-color:var(--accent)}
  @media(max-width:680px){.mfr-search{padding-left:1.5rem;padding-right:1.5rem}}
  @media(max-width:680px){
    .mfr-nav,.mfr-hero,.mfr-grid,.mfr-footer{padding-left:1.5rem;padding-right:1.5rem}
    .nav-tag{display:none}
    .mfr-grid{grid-template-columns:1fr}
  }
`
