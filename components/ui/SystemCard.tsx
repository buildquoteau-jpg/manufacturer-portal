type Item = {
  code: string
  name: string
  length?: number | null
  width?: number | null
  thickness?: number | null
  texture?: string | null
  uom: string
  qty: number
  checked: boolean
}

type VerificationStatus =
  | 'ai_pass'
  | 'buildquote_checked'
  | 'manufacturer_verified'
  | string
  | null
  | undefined

function itemSpecs(item: Item) {
  const size =
    item.length && item.width
      ? `${item.length}×${item.width}`
      : item.length
        ? `${item.length}mm`
        : item.width
          ? `${item.width}mm`
          : ''

  const specs = [
    item.code ? `${item.code}` : '',
    size,
    item.thickness ? `${item.thickness}mm` : '',
    item.texture ? item.texture : '',
  ].filter(Boolean)

  return specs.join(' • ')
}

function getVerificationLevel(status: VerificationStatus) {
  if (status === 'manufacturer_verified') return 3
  if (status === 'buildquote_checked') return 2
  return 1
}

function ItemRow({
  item,
  onQtyChange,
}: {
  item: Item
  onQtyChange: (qty: number) => void
}) {
  const isSelected = item.qty > 0

  return (
    <div
      className={`grid gap-3 rounded-xl p-3 ${
        isSelected ? 'border-2 border-brand bg-brand/30 shadow-sm' : 'border border-white/20 bg-surface'
      }`}
    >
      <div className="min-w-0">
        <h4 className="text-sm font-semibold leading-tight text-text-primary">
          {item.name}
        </h4>
        <p className="mt-1 break-words text-xs leading-relaxed text-text-secondary">
          {itemSpecs(item)}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            className="h-5 w-5 accent-brand cursor-pointer"
            checked={isSelected}
            onChange={(e) => onQtyChange(e.target.checked ? 1 : 0)}
          />
          <span>Add to RFQ</span>
        </label>

        {isSelected ? (
          <input
            autoFocus
            className="h-10 w-24 rounded-lg border-2 border-brand bg-surface px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-brand"
            type="number"
            min="0"
            value={item.qty || ''}
            placeholder="Qty"
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') {
                onQtyChange(1)
                return
              }
              const next = parseInt(raw, 10)
              onQtyChange(Number.isNaN(next) ? 1 : Math.max(0, next))
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

export default function SystemCard({
  title,
  subtitle,
  sourceLabel,
  sourceUrl,
  verificationStatus,
  panels,
  accessories,
  onQtyChange,
}: {
  title: string
  subtitle?: string
  sourceLabel?: string | null
  sourceUrl?: string | null
  verificationStatus?: VerificationStatus
  panels: Item[]
  accessories: Item[]
  onQtyChange: (code: string, qty: number) => void
}) {
  const verificationLevel = getVerificationLevel(verificationStatus)

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="border-b border-border-subtle pb-4">
        <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--brand-bright)' }}>System</p>
        <h2 className="mt-2 text-2xl font-bold uppercase leading-tight text-text-primary">
          {title}
        </h2>

        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{subtitle}</p>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-border-subtle bg-ui/60 p-3 text-sm leading-relaxed text-text-secondary">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-faint">
          💡 BQ Tip
        </p>
        <p className="mt-1">Tick items to include in your RFQ.</p>
        <p>Add quantities here or edit later in BuildQuote.</p>
      </div>

      <div className="mt-4 space-y-5">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-bright)' }}>Panels</h3>
            <span className="text-xs text-text-faint">{panels.length} items</span>
          </div>
          <div className="space-y-2">
            {panels.map((item) => (
              <ItemRow
                key={item.code}
                item={item}
                onQtyChange={(qty) => onQtyChange(item.code, qty)}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-bright)' }}>Accessories</h3>
            <span className="text-xs text-text-faint">{accessories.length} items</span>
          </div>
          <div className="space-y-2">
            {accessories.map((item) => (
              <ItemRow
                key={item.code}
                item={item}
                onQtyChange={(qty) => onQtyChange(item.code, qty)}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 border-t border-border-subtle pt-4 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-faint">Source</p>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block break-words text-sm text-[#5FB6D6]-400 hover:underline"
            >
              {sourceLabel || sourceUrl}
            </a>
          ) : (
            <p className="mt-1 text-sm text-text-faint">Source not linked yet</p>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-faint">Verification status</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {[
              'AI detected',
              'BuildQuote checked',
              'Manufacturer verified',
            ].map((label, index) => {
              const active = index < verificationLevel
              const last = index === 2

              return (
                <div key={label} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        active ? 'bg-brand' : 'border border-border bg-transparent'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        active ? 'text-text-primary' : 'text-text-faint'
                      }`}
                    >
                      {label}{active && index === 0 ? ' ✓' : ''}
                    </span>
                  </div>

                  {!last ? (
                    <span className="mx-3 hidden text-text-faint sm:inline">—</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
