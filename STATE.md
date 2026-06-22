# Manufacturer Portal (MFP) — Session State
_Last updated: 2026-05-26 (session 9) — merged to `main`_

## Branch
`main` — all session 9 work committed and merged.
**Next session:** ui/ux tweaks, end-to-end testing of full flow.

---

## Styling rule — light vs dark

| Surface | Theme | Rationale |
|---------|-------|-----------|
| `/supplierdirectory/*` | **Light** (buildquote palette) | Customer-facing, sun-readable |
| `/manufacturers/*` | **Light** (buildquote palette) | Customer-facing, sun-readable |
| `/supplier-review/*` | **Light** (buildquote palette) | Customer-facing |
| `/widget/*` | **Light** (buildquote palette) | Customer-facing embed |
| `/supplier/[slug]/*` | **Dark** (MFP palette) | Supplier admin portal |
| `/admin/*` | **Dark** (MFP palette) | Admin only |
| `/supplier/login` | **Dark** (MFP palette) | Auth screen |

**Light palette** = inline styles: page `#f5f7f9`, surface `#ffffff`, navy `#185D7A`,
text primary `#111827`, border `#e5e7eb`. Use inline styles — MFP CSS vars are dark.

**Dark palette** = MFP CSS vars: `bg-page`, `bg-surface`, `text-primary`, `text-faint`,
`border`, `brand` etc. (defined in `app/globals.css`).

Rule: anything a **builder or end customer** sees → light. Anything a **supplier or admin**
manages → dark.

---

## Schema reference

```
supabase/schema.sql
```

Single source of truth. Update whenever a column is added, renamed, or dropped.

**Schema state as of 2026-05-25 — all migrations applied ✅:**
- `systems.australian_made` — exists and queryable
- `manufacturers.logo_url` — included in supplier portal query
- `suppliers`: `bio`, `hero_photo_url`, `hero_photo_y`, `hero_photo_zoom`,
  `google_maps_url`, `service_postcodes`, `delivery_info`, `first_login` — all applied
- `customer_review_sessions` — ⚠️ run migration below if not yet applied
- `customer_review_session_items` — ⚠️ run migration below if not yet applied

**⚠️ Migrations to run in Supabase if not yet applied:**
```
supabase/migrations/20260524_trade_desk_search.sql
```
Creates `customer_review_sessions` and `customer_review_session_items` tables,
enables RLS, adds public SELECT policies and anon INSERT on `rfq_enquiries`.

```
supabase/migrations/20260526_supplier_region.sql
```
Adds `region text` column to `suppliers` table. After running, set `region` on each
supplier via Supabase table editor (e.g. `sw_wa`, `perth`, `national`).

**SQL files ready to run (demo data, not yet applied):**
- `Demo data for buildquote/update_australian_made.sql`
- `Demo data for buildquote/update_timberlock_attributes.sql`

---

## What's built and working ✅

### Disclaimer banner (`app/layout.tsx`)
- Expanded multi-line banner (dark red-brown) visible site-wide
- States: private testing, no partnership implied, data from public sources,
  demo data wiped pre-launch

### Supplier portal (`/supplier/[slug]`)
- **ProfileTab** — business info, hero photo, Google Maps, service area, delivery info
- **ProductsTab** — 3-col widget card grid, manufacturer logos, product counts,
  copy embed code, preview widget, edit/add/delete widgets
  - Bug fixed: edit modal category list now derives dynamically from selected manufacturer
    (was hardcoded CATEGORIES array that silently dropped products)
- **Trade Desk tab** — see below
- **EnquiriesTab** — lists `rfq_enquiries` per widget with mailto reply
- **AccountTab** — password change, help form
- First-login modal (force password set)
- Session-only sign-out via `sessionStorage`

### Trade Desk tab (`/supplier/[slug]` → Trade Desk)
Staff-facing search tool for suppliers:
- Fuzzy search across the supplier's stocked systems only (via embed_widget_systems)
- Result cards: product info, "Stocked" badge, checkbox for multi-select (top-right)
- "Add to quote prep" per card — builds a sticky quote prep panel on the right
- Quote prep panel: editable qty/unit/notes per item, "Copy lines for POS"
  (tab-separated: SKU · Description · Qty · Unit · Notes)
- **Single review link:** "Send review link" on any result card
- **Multi-select review link:** checkboxes + "Send review link — N selected" button above grid
- SendReviewLinkModal: optional customer name / mobile / email / staff note
  - Calls `POST /api/supplier/create-review-session`
  - Shows copyable link after creation
  - Shows "✓ Email sent to [email]" if Resend delivered
- Example chips: '820 flush internal door', 'vertical fibre cement cladding',
  'blackbutt composite decking', 'external corner trim'

### Customer review page (`/supplier-review/[token]`)
Public, no auth required — accessed via token-based URL sent to customer:
- Loads session by token → supplier name → items (sorted) → systems + manufacturers
- Product cards with toggleable checkboxes
- "View manufacturer website ↗" link on each card
- Quote request form: name*, phone, email, suburb, requiredBy, delivery, measurements*, notes
- Submit inserts into `rfq_enquiries` (anon Supabase client)
- Submit disabled until: name + (email OR phone) + at least one product selected
- Success state and not-found state

### Review session email (Resend)
- `POST /api/supplier/create-review-session`
- Auth: Bearer token → `supabaseAdmin.auth.getUser()` + admin email bypass
- Creates `customer_review_sessions` record (DB-generated UUID token)
- Inserts `customer_review_session_items` array
- If `customerEmail`: fetches system+mfr names, sends branded HTML email via Resend
- FROM: `${supplier.name} via BuildQuote <rfq@buildquote.com.au>`
- Returns: `{ ok: true, token, emailSent: boolean }`
- ⚠️ `RESEND_API_KEY` must be added to Vercel env vars for production

### Customer-facing product search (`/manufacturers`)
Integrated into the existing manufacturer browse page:
- Prominent search bar with magnifying glass icon + clear button
- Example chips (lazy-load systems on click)
- Systems loaded lazily: full Supabase fetch on first 2-char keystroke (includes system_components), then local fuzzy filter
- Fuzzy search: all terms must appear in concatenated name/code/category/mfr/description/dimensions/notes
- **Full WidgetClient-style interactive cards** (session 8 upgrade):
  - Hero image, category badge, manufacturer logo/name
  - Attribute pills: FRL, acoustic, BAL, moisture resistant, Australian Made, double-sided
  - Colour chips — selectable in draft mode (optional colour annotation on items)
  - Profile rows — selectable checkboxes with dimension grouping (same groupProfiles algo as WidgetClient)
  - Accessories & Components accordion — selectable checkboxes
  - Zero-profile systems show base system as selectable row in draft mode
  - "Add X selected to quote →" button → calls `/api/add-to-draft` → auto-opens supplier section
  - "✓ X items added" confirmation replaces add button after adding
  - Global sticky footer: "{N} items added to your quote | Return to quote →"
- **Responsive grid:** 1-col mobile → 2-col ≥680px → 3-col ≥1060px for search result cards
- Per-card supplier lookup (3-step: `embed_widget_systems → embed_widgets → suppliers`)
- **Draft mode UX gate:** "Find a supplier →" only appears after user clicks "Add X selected
  to quote →" and items are saved (`hasAdded === true`). Prevents skipping the save step.
- **Supplier geo-filtering** (session 9):
  - Optional postcode input below search bar — persists in `sessionStorage`, readable via `?postcode=` URL param
  - Supplier coverage badge: "✓ Services your area" (green) / "Check service area" (amber) / "Stocks or can supply" (neutral)
  - Suppliers sorted by postcode match when postcode is entered
  - `region` column on `suppliers` table — run migration `20260526_supplier_region.sql`
  - Region badge shown on supplier card (SW WA, Perth Metro, NW WA, etc.)
  - Supplier `email` now fetched and passed back via `?supplierEmail=` URL param (auto-fills SendScreen)
- **Draft mode supplier cards:** "Use [Supplier] — continue quote →" navigates to
  `buildquote.com.au/rfq?draft=xxx&supplierName=SupplierName&supplierEmail=email@supplier.com`
- **No-draft mode:** inline expandable form → submits to `rfq_enquiries` → success state
- "or browse by manufacturer" divider — full manufacturer card grid preserved below

### Widget system cards (`app/widget/[token]/WidgetClient.tsx`)
- Colour chips selectable in RFQ mode
- `handleAddToRFQ` — items include manufacturer, system, profile/component, dimensions, colour
- Zero-profile systems show base system as selectable row in RFQ mode
- `australian_made` attribute pill working (was missing from SELECT — fixed)

### Manufacturer product page (`/manufacturers/[slug]`)
- Uses `WidgetClient` with `mode='rfq'` and `draftId`
- `manufacturerName` prop passed through for proper RFQ item naming
- Back nav: "All Manufacturers" + "Return to quote →" when draft present
- Mode banner when `?draft=` param set

### Supplier directory (public, light theme)
- `/supplierdirectory` — grid of all suppliers with active widgets
- `/supplierdirectory/[slug]` — hero, bio, brands grid, contact info
- `/supplierdirectory/[slug]/[manufacturer-slug]` — manufacturer products for that supplier

---

## What still needs doing ❌

### Must do before go-live
- ⚠️ Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to Vercel env vars (manufacturer-portal)
- ⚠️ Run `supabase/migrations/20260524_trade_desk_search.sql` if not yet applied
- Run demo data SQL scripts (`update_australian_made.sql`, `update_timberlock_attributes.sql`)

### Known gaps
- SMS review link delivery — deferred (noted for later, Twilio or similar)
- No manufacturer logos in DB for demo manufacturers (all show navy initial badge)
- RLS on `suppliers` not fully reviewed — anon reads may be broader than needed
- `supplier-assets` Supabase storage bucket: no RLS policy yet
- Map view for supplier locations — deferred
- `NEXT_PUBLIC_BUILDQUOTE_URL` must be set to `https://buildquote.com.au` on Vercel
  (local `.env.local` uses `http://localhost:3000` — verify Vercel env var before testing in prod)
- `mfp_supplier_id` soft-link on `builder_suppliers` not yet implemented (deferred)
  — would let buildquote resolve supplier details automatically from MFP when added via URL flow

---

## Next session: Session 8 — UI/UX tweaks

### Branch setup
```
git checkout main
git checkout -b ui-ux-tweaks
git commit --allow-empty -m "chore: anchor — session 8 start, ui-ux-tweaks"
```

### Goals (to be scoped at session start)
- Polish pass: spacing, typography, colour consistency across both apps
- Mobile responsiveness review (Trade Desk tab, customer search, review page)
- Builder login/register flow end-to-end UX review
- Review loading and error states across all new flows
- Any quick wins identified during testing

---

## Supabase Project
**Project ref:** `oxvhmulxuvlfjyjzleki`
**URL:** `https://oxvhmulxuvlfjyjzleki.supabase.co`
Shared with buildquote (same project).

### Key tables (MFP side)
```
manufacturers      — id, name, slug, description, logo_url, hero_image_url, website_url
systems            — id, manufacturer_id, name, product_code, slug, category,
                     subcategory, description, hero_image_url, sort_order,
                     australian_made, moisture_resistant, bal_rating, fire_rating,
                     acoustic_rating, structural_grade, double_sided, notes,
                     dimensions, length_m, website_url
system_profiles    — id, system_id, profile_name, name, product_code, uom,
                     length_mm, width_mm, height_mm, thickness_mm
system_colours     — id, system_id, colour_name, image_url, is_stocked
system_components  — id, system_id, component_id, notes, sort_order
components         — id, sku, name, description, uom, category
embed_widgets      — id, supplier_id, name, public_token, status, created_at
embed_widget_systems — id, widget_id, system_id
rfq_enquiries      — id, widget_id, system_id, system_name, product_code,
                     supplier_name, name, email, phone, message, created_at
suppliers          — id, name, slug, + profile fields (bio, hero, maps, etc.)
customer_review_sessions     — id, supplier_id, customer_name, customer_mobile,
                               customer_email, staff_note, token (UUID), created_at
customer_review_session_items — id, session_id, system_id, sort_order
```

---

## Env vars
```
NEXT_PUBLIC_SUPABASE_URL          = https://oxvhmulxuvlfjyjzleki.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJ...
SUPABASE_SERVICE_ROLE_KEY         = eyJ...
NEXT_PUBLIC_BUILDQUOTE_URL        = https://buildquote.com.au (prod)
RESEND_API_KEY                    = re_... ⚠️ add to Vercel env vars
RESEND_FROM_EMAIL                 = rfq@buildquote.com.au ⚠️ add to Vercel env vars
ADMIN_EMAIL                       = (optional — bypasses supplier auth check for admin)
```

---

## Key files
```
app/layout.tsx                              — Disclaimer banner (site-wide)
app/manufacturers/page.tsx                  — Server component, passes data to client
app/manufacturers/ManufacturersClient.tsx   — Customer-facing search + mfr grid (NEW)
app/manufacturers/layout.tsx                — Light grey background wrapper
app/manufacturers/[slug]/page.tsx           — Per-manufacturer product page (RFQ mode)
app/supplier-review/[token]/page.tsx        — Customer review page (NEW)
app/api/supplier/create-review-session/route.ts — Review session API + Resend (NEW)
app/widget/[token]/page.tsx                 — Public embed page
app/widget/[token]/WidgetClient.tsx         — System cards (enquire + rfq modes)
app/widget/[token]/ManufacturerHero.tsx     — Hero component
app/supplierdirectory/page.tsx              — Public supplier directory
app/supplierdirectory/[slug]/page.tsx       — Supplier detail
app/supplier/login/page.tsx                 — Supplier auth
app/supplier/[slug]/page.tsx                — Portal shell (auth, tabs, manufacturers query)
app/supplier/[slug]/shared.tsx              — Types (Manufacturer, System, etc.)
app/supplier/[slug]/TradeDeskTab.tsx        — Trade Desk search tab (NEW)
app/supplier/[slug]/ProductsTab.tsx         — Widget create/manage (category bug fixed)
app/supplier/[slug]/ProfileTab.tsx          — Profile editor + preview link
app/supplier/[slug]/EnquiriesTab.tsx        — Enquiry list
app/supplier/[slug]/AccountTab.tsx          — Password change
lib/data/getWidgetData.ts                   — Widget Supabase query
lib/data/getManufacturerData.ts             — Manufacturer page Supabase query
lib/data/getManufacturers.ts                — Manufacturer list query (for /manufacturers)
lib/data/getPublicSuppliers.ts              — Public supplier directory queries
supabase/migrations/20260524_trade_desk_search.sql — ⚠️ MUST RUN
```

---

## Session 7 commits (trade-desk-search → main)
- `c23d5c2` — fix: widget edit modal derives categories dynamically (not hardcoded)
- (multiple) — feat: Trade Desk tab with fuzzy search, quote prep, multi-select review links
- (multiple) — feat: customer review page (/supplier-review/[token])
- (multiple) — feat: create-review-session API route with Resend email
- `d31c1dd` — feat: customer-facing product search on /manufacturers page
- (merge) — merge: trade-desk-search → main (full session summary in merge commit)

## Session 8–9 commits (main)
- `28aabb9` — feat: upgrade product search to full interactive system cards (WidgetClient-style)
- `cb4f89e` — feat: responsive grid layout for search result system cards (1→2→3 col)
- `be36150` — fix: gate supplier section behind 'Add to quote' in draft mode
