'use client'

import { useState } from 'react'
import {
  SupplierData, AU_STATES,
  SectionHeader, InfoRow, InputField, SaveCancel,
} from './shared'

export function ProfileTab({
  supplier, accessToken, slug, onReload,
}: {
  supplier: SupplierData
  accessToken: string
  slug: string
  onReload: () => void
}) {
  const [profileEdit, setProfileEdit] = useState(false)
  const [heroEdit, setHeroEdit]       = useState(false)
  const [locationEdit, setLocationEdit] = useState(false)
  const [serviceEdit, setServiceEdit] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)

  const [eName, setEName]           = useState('')
  const [eAddress, setEAddress]     = useState('')
  const [eSuburb, setESuburb]       = useState('')
  const [eState, setEState]         = useState('')
  const [ePhone, setEPhone]         = useState('')
  const [eEmail, setEEmail]         = useState('')
  const [eWebsite, setEWebsite]     = useState('')
  const [eBio, setEBio]             = useState('')
  const [eHero, setEHero]           = useState('')
  const [eHeroY, setEHeroY]         = useState(50)
  const [eHeroZoom, setEHeroZoom]   = useState(100)
  const [eMaps, setEMaps]           = useState('')
  const [ePostcodes, setEPostcodes] = useState('')
  const [eDelivery, setEDelivery]   = useState('')

  async function saveProfile(updates: Record<string, unknown>): Promise<boolean> {
    setSaving(true); setSaveError(null)
    const res = await fetch('/api/supplier/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ supplierSlug: slug, ...updates }),
    })
    const json = await res.json()
    if (!res.ok) { setSaveError(json.error || 'Save failed'); setSaving(false); return false }
    setSaving(false)
    onReload()
    return true
  }

  function startEditProfile() {
    setEName(supplier.name)
    setEAddress(supplier.address || '')
    setESuburb(supplier.suburb || '')
    setEState(supplier.state || '')
    setEPhone(supplier.phone || '')
    setEEmail(supplier.email || '')
    setEWebsite(supplier.website_url || '')
    setEBio(supplier.bio || '')
    setProfileEdit(true)
  }

  async function saveProfileSection() {
    const ok = await saveProfile({ name: eName, address: eAddress, suburb: eSuburb, state: eState, phone: ePhone, email: eEmail, website_url: eWebsite, bio: eBio })
    if (ok) setProfileEdit(false)
  }

  async function saveHero() {
    const ok = await saveProfile({ hero_photo_url: eHero, hero_photo_y: eHeroY, hero_photo_zoom: eHeroZoom })
    if (ok) setHeroEdit(false)
  }

  async function saveLocation() {
    // Accept either the full <iframe src="..."> HTML or a bare URL
    let url = eMaps.trim()
    const srcMatch = url.match(/src="([^"]+)"/)
    if (srcMatch) url = srcMatch[1]
    const ok = await saveProfile({ google_maps_url: url })
    if (ok) { setEMaps(url); setLocationEdit(false) }
  }

  async function saveService() {
    // Store as comma-separated string (DB column is text, not text[])
    const postcodes = ePostcodes.split(/[,\n]+/).map(p => p.trim()).filter(Boolean).join(', ')
    const ok = await saveProfile({ service_postcodes: postcodes, delivery_info: eDelivery })
    if (ok) setServiceEdit(false)
  }

  const location = [supplier.address, supplier.suburb, supplier.state].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">

      {/* ── Directory preview link ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">Supplier directory listing</p>
          <p className="text-xs text-text-faint mt-0.5">See how your profile appears to builders browsing the directory</p>
        </div>
        <a
          href={`/supplierdirectory/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-xs px-3 py-2 border border-brand text-brand hover:bg-brand hover:text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
        >
          Preview listing ↗
        </a>
      </div>

      {/* ── 1. Business profile ───────────────────────────────────────────────── */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <SectionHeader title="Business profile" onEdit={startEditProfile} editing={profileEdit} />

        {profileEdit ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InputField label="Business name" value={eName} onChange={setEName} placeholder="Your business name" />
              </div>
              <div className="sm:col-span-2">
                <InputField label="Street address" value={eAddress} onChange={setEAddress} placeholder="123 Main Street" />
              </div>
              <InputField label="Suburb" value={eSuburb} onChange={setESuburb} placeholder="Suburb" />
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">State</label>
                <select value={eState} onChange={e => setEState(e.target.value)}
                  className="w-full bg-ui border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand">
                  <option value="">Select state</option>
                  {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <InputField label="Phone" value={ePhone} onChange={setEPhone} placeholder="08 9999 0000" type="tel" />
              <InputField label="Email" value={eEmail} onChange={setEEmail} placeholder="contact@business.com.au" type="email" />
              <div className="sm:col-span-2">
                <InputField label="Website" value={eWebsite} onChange={setEWebsite} placeholder="https://yourbusiness.com.au" type="url" />
              </div>
              <div className="sm:col-span-2">
                <InputField label="Business bio" value={eBio} onChange={setEBio}
                  placeholder="Tell customers about your business — what you stock, where you are, how long you've been operating…"
                  textarea />
              </div>
            </div>
            <SaveCancel onSave={saveProfileSection} onCancel={() => setProfileEdit(false)} saving={saving} error={saveError} />
          </div>
        ) : (
          <div>
            <div className="divide-y divide-border-subtle">
              <InfoRow label="Address" value={location || null} />
              <InfoRow label="Phone" value={supplier.phone} />
              <InfoRow label="Email" value={supplier.email} />
              <InfoRow label="Website" value={supplier.website_url} />
              <InfoRow label="Member since" value={new Date(supplier.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} />
            </div>
            {supplier.bio ? (
              <p className="text-text-secondary text-sm leading-relaxed mt-4 pt-4 border-t border-border-subtle">{supplier.bio}</p>
            ) : (
              <p className="text-text-faint text-xs mt-4 italic">No business bio added yet. Click Edit to add one.</p>
            )}
          </div>
        )}
      </section>

      {/* ── 2. Hero photo ─────────────────────────────────────────────────────── */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <SectionHeader title="Hero photo"
          onEdit={() => { setEHero(supplier.hero_photo_url || ''); setEHeroY(supplier.hero_photo_y ?? 50); setEHeroZoom(supplier.hero_photo_zoom ?? 100); setHeroEdit(true) }}
          editing={heroEdit} />

        {heroEdit ? (
          <div className="space-y-4">
            <InputField label="Image URL" value={eHero} onChange={setEHero}
              placeholder="https://example.com/your-image.jpg" type="url" />
            <p className="text-text-faint text-xs">Paste a link to an image hosted online. Use Google Photos, Dropbox, or your own website.</p>
            {eHero && (
              <>
                <div className="rounded-xl overflow-hidden border border-border h-48">
                  <img src={eHero} alt="Hero preview"
                    className="w-full h-full object-cover transition-all duration-150"
                    style={{
                      objectPosition: `center ${eHeroY}%`,
                      transform: `scale(${eHeroZoom / 100})`,
                      transformOrigin: `center ${eHeroY}%`,
                    }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">
                      Vertical position — <span className="text-text-faint">{eHeroY === 0 ? 'Top' : eHeroY === 100 ? 'Bottom' : eHeroY === 50 ? 'Centre' : eHeroY < 50 ? 'Upper' : 'Lower'}</span>
                    </label>
                    <input type="range" min={0} max={100} value={eHeroY}
                      onChange={e => setEHeroY(Number(e.target.value))}
                      className="w-full accent-brand cursor-pointer" />
                    <div className="flex justify-between text-xs text-text-faint">
                      <span>Top</span><span>Centre</span><span>Bottom</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">
                      Zoom — <span className="text-text-faint">{eHeroZoom}%</span>
                    </label>
                    <input type="range" min={100} max={200} value={eHeroZoom}
                      onChange={e => setEHeroZoom(Number(e.target.value))}
                      className="w-full accent-brand cursor-pointer" />
                    <div className="flex justify-between text-xs text-text-faint">
                      <span>Normal</span><span>2× zoom</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            <SaveCancel onSave={saveHero} onCancel={() => setHeroEdit(false)} saving={saving} error={saveError} />
          </div>
        ) : supplier.hero_photo_url ? (
          <div className="rounded-xl overflow-hidden border border-border h-48">
            <img src={supplier.hero_photo_url} alt={supplier.name}
              className="w-full h-full object-cover"
              style={{
                objectPosition: `center ${supplier.hero_photo_y ?? 50}%`,
                transform: `scale(${(supplier.hero_photo_zoom ?? 100) / 100})`,
                transformOrigin: `center ${supplier.hero_photo_y ?? 50}%`,
              }} />
          </div>
        ) : (
          <p className="text-text-faint text-xs italic">No hero photo added yet. Click Edit to add a photo URL.</p>
        )}
      </section>

      {/* ── 3. Google Maps ────────────────────────────────────────────────────── */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <SectionHeader title="Google Maps location"
          onEdit={() => { setEMaps(supplier.google_maps_url || ''); setLocationEdit(true) }}
          editing={locationEdit} />

        {locationEdit ? (
          <div className="space-y-4">
            <InputField label="Google Maps embed URL" value={eMaps} onChange={setEMaps}
              placeholder="Paste the full <iframe> code or just the embed URL" />
            <p className="text-text-faint text-xs">
              Google Maps → find your business → Share → Embed a map → Copy HTML. Paste the whole thing or just the URL — either works.
            </p>
            {eMaps && (
              <div className="rounded-xl overflow-hidden border border-border">
                <iframe src={eMaps} width="100%" height="220" style={{ border: 'none' }} loading="lazy" title="Map preview" />
              </div>
            )}
            <SaveCancel onSave={saveLocation} onCancel={() => setLocationEdit(false)} saving={saving} error={saveError} />
          </div>
        ) : supplier.google_maps_url ? (
          <div className="rounded-xl overflow-hidden border border-border">
            <iframe src={supplier.google_maps_url} width="100%" height="220" style={{ border: 'none' }} loading="lazy" title="Business location" />
          </div>
        ) : (
          <p className="text-text-faint text-xs italic">No map added yet. Click Edit to add your Google Maps location.</p>
        )}
      </section>

      {/* ── 4. Service area & delivery ────────────────────────────────────────── */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <SectionHeader title="Service area & delivery"
          onEdit={() => { setEPostcodes(supplier.service_postcodes || ''); setEDelivery(supplier.delivery_info || ''); setServiceEdit(true) }}
          editing={serviceEdit} />

        {serviceEdit ? (
          <div className="space-y-4">
            <InputField label="Service postcodes" value={ePostcodes} onChange={setEPostcodes}
              placeholder="6230, 6231, 6232, 6233…" textarea />
            <p className="text-text-faint text-xs">Enter postcodes separated by commas or new lines.</p>
            <InputField label="Delivery information" value={eDelivery} onChange={setEDelivery}
              placeholder="e.g. We deliver within 100km of Bunbury. Free delivery on orders over $500. Allow 2–3 business days."
              textarea />
            <SaveCancel onSave={saveService} onCancel={() => setServiceEdit(false)} saving={saving} error={saveError} />
          </div>
        ) : (
          <div className="space-y-4">
            {supplier.service_postcodes ? (
              <div>
                <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-2">Service postcodes</p>
                <div className="flex flex-wrap gap-1.5">
                  {supplier.service_postcodes.split(/[,\s]+/).filter(Boolean).map(pc => (
                    <span key={pc} className="text-xs px-2 py-0.5 bg-brand-subtle text-brand-bright rounded font-mono">{pc}</span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-text-faint text-xs italic">No service postcodes added.</p>
            )}
            {supplier.delivery_info ? (
              <div>
                <p className="text-xs font-semibold text-text-faint uppercase tracking-widest mb-2">Delivery info</p>
                <p className="text-text-secondary text-sm leading-relaxed">{supplier.delivery_info}</p>
              </div>
            ) : (
              <p className="text-text-faint text-xs italic">No delivery information added.</p>
            )}
          </div>
        )}
      </section>

    </div>
  )
}
