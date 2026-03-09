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

function itemSpecs(item: Item) {
  const specs = [
    item.code ? `SKU ${item.code}` : '',
    item.uom ? `UOM ${item.uom}` : '',
    item.length ? `L ${item.length}mm` : '',
    item.width ? `W ${item.width}mm` : '',
    item.thickness ? `D ${item.thickness}mm` : '',
    item.texture ? item.texture : '',
  ].filter(Boolean)

  return specs.join(' · ')
}

function ItemRow({
  item,
  onQtyChange,
}: {
  item: Item
  onQtyChange: (qty: number) => void
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-ui/60 p-3 md:grid-cols-[1fr_150px] md:items-center">
      <div className="min-w-0">
        <h4 className="text-sm font-semibold leading-tight text-text-primary">
          {item.name}
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary break-words">
          {itemSpecs(item)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-10 w-10 rounded-lg border border-border bg-surface text-lg text-text-primary transition-colors hover:border-brand"
          onClick={() => onQtyChange(item.qty - 1)}
        >
          −
        </button>

        <input
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-center text-sm text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-brand"
          type="number"
          min="0"
          value={item.qty || ''}
          placeholder="Qty"
          onChange={e => onQtyChange(parseInt(e.target.value) || 0)}
        />

        <button
          type="button"
          className="h-10 w-10 rounded-lg border border-border bg-surface text-lg text-text-primary transition-colors hover:border-brand"
          onClick={() => onQtyChange(item.qty + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function SystemCard({
  title,
  subtitle,
  panels,
  accessories,
  onQtyChange,
}: {
  title: string
  subtitle?: string
  panels: Item[]
  accessories: Item[]
  onQtyChange: (code: string, qty: number) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="border-b border-border-subtle pb-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-brand">System</p>
        <h2 className="mt-2 text-2xl font-bold uppercase leading-tight text-text-primary">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{subtitle}</p>
        ) : null}
      </div>

      <div className="mt-4 space-y-5">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Panels</h3>
            <span className="text-xs text-text-faint">{panels.length} items</span>
          </div>
          <div className="space-y-2">
            {panels.map(item => (
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
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Accessories</h3>
            <span className="text-xs text-text-faint">{accessories.length} items</span>
          </div>
          <div className="space-y-2">
            {accessories.map(item => (
              <ItemRow
                key={item.code}
                item={item}
                onQtyChange={(qty) => onQtyChange(item.code, qty)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
