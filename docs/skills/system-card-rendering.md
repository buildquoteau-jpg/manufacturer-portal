# System Card Rendering — File Map

Use this as a reference whenever making visual changes to system cards, modals, or hero banners. Any change to an MFP component needs a matching change in the studio counterpart. See also the mapping doc in the data-studio repo: `docs/studio-mfp-file-mapping.md`.

---

## Grid cards (what you see before clicking)

| Surface | File |
|---|---|
| **MFP widget** (supplier embed) | `components/ui/SystemCardTile.tsx` |
| **MFP manufacturer page** grid | `components/ui/SystemCardTile.tsx` (same component) |
| **MFP search results** | `components/ui/SystemCardTile.tsx` (same component) |

> **Note:** All three MFP grid card surfaces share one component. A change to `SystemCardTile.tsx` affects all of them.

---

## Detail modal (what opens when you click a card)

| Surface | File |
|---|---|
| **MFP widget + manufacturer page** modal | `app/widget/[token]/WidgetClient.tsx` — `SystemDetailPanel` component |

---

## Hero banners (manufacturer brand banner above card grid)

| Surface | File |
|---|---|
| **MFP widget + manufacturer page** hero | `app/widget/[token]/ManufacturerHero.tsx` |

---

## Data fetchers (what fields reach the cards)

| Source | File | Reads from |
|---|---|---|
| MFP widget data | `lib/data/getWidgetData.ts` | production `systems` table (RFQ DB) |
| MFP manufacturer page | `lib/data/getManufacturerData.ts` | production `systems` table (RFQ DB) |
| MFP manufacturer grid | `lib/data/getManufacturers.ts` | production `manufacturers` table (RFQ DB) |
| MFP supplier brand widget | `lib/data/getSupplierBrandWidget.ts` | production tables (RFQ DB) |

---

## Widget button options — business rules

The system detail modal has three action buttons. Who sees what:

| Widget type | Buttons shown |
|---|---|
| **Manufacturer widget** (`studio.buildquote.com.au/widget/[token]`) | Manufacturer chooses which of the three to enable per widget |
| **Supplier embed** (`mfp.buildquote.com.au/widget/[token]`) | **General Enquiry only** on free tier. All three on paid tier. |

### The three buttons
1. **General Enquiry** — always available to all
2. **Request a Quote** — manufacturer widget (configurable) / supplier paid tier only
3. **Find a Stockist** — manufacturer widget (configurable) / supplier paid tier only

### Where the buttons render (MFP side)
`app/widget/[token]/WidgetClient.tsx` → `SystemDetailPanel` component → action buttons section
