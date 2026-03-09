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

function formatDimensions(item: Item) {
  if (item.length && item.width && item.thickness) return `${item.length} × ${item.width} × ${item.thickness} mm`
  if (item.length && item.width) return `${item.length} × ${item.width} mm`
  if (item.length && item.thickness) return `${item.length} × ${item.thickness} mm`
  if (item.length) return `${item.length} mm`
  return '—'
}

export default function ComponentCard({
  item,
  kind,
  onToggle,
  onQtyChange,
}: {
  item: Item
  kind: 'panel' | 'accessory'
  onToggle: () => void
  onQtyChange: (qty: number) => void
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        item.checked ? 'border-brand bg-brand-subtle' : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand">
              {kind === 'panel' ? 'Panel' : 'Accessory'}
            </p>
            <span className="text-text-faint">•</span>
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-faint">
              {item.uom || '—'}
            </p>
          </div>

          <h3 className="mt-2 text-base font-semibold leading-tight text-text-primary">
            {item.name}
          </h3>

          <p className="mt-1 text-sm text-text-secondary break-all">
            {item.code}
          </p>

          <p className="mt-2 text-sm text-text-secondary">
            {formatDimensions(item)}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
            item.checked
              ? 'border-brand bg-brand text-page'
              : 'border-border text-text-secondary hover:border-brand hover:text-text-primary'
          }`}
        >
          {item.checked ? 'Selected' : 'Select'}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className="h-10 w-10 rounded-xl border border-border bg-ui text-lg text-text-primary transition-colors hover:border-brand"
          onClick={() => onQtyChange(item.qty - 1)}
        >
          −
        </button>
        <input
          className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-ui px-3 text-center text-base text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-brand"
          type="number"
          min="0"
          value={item.qty || ''}
          placeholder="Qty"
          onChange={e => onQtyChange(parseInt(e.target.value) || 0)}
        />
        <button
          type="button"
          className="h-10 w-10 rounded-xl border border-border bg-ui text-lg text-text-primary transition-colors hover:border-brand"
          onClick={() => onQtyChange(item.qty + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}
