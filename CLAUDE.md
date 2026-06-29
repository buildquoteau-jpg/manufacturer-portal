# manufacturer-portal (search.buildquote.com.au) — "MFP"

**Supplier & admin portal.** Suppliers log in to manage their profile, embed
widgets, and product enquiries; BuildQuote staff use the admin panel to create
suppliers and assign widgets. Public surfaces are the embeddable widgets and the
supplier directory.

This is **not** a manufacturer login or catalogue-management app. Catalogue data
(manufacturers, systems, components) is read from the shared Supabase DB but is
created/managed elsewhere.

> **History:** This repo previously also hosted a customer-facing product-search
> experience (`/manufacturers`, `/browse`, AI search APIs). That "Half 2" was
> **fully ported to buildquote.com.au/library and deleted on 2026-06-29.** See
> [STATE.md](STATE.md) for session history. If you find references to
> `/manufacturers`, `/browse`, `/showroom`, `/api/search/*`, `/api/create-draft`,
> or `/api/add-to-draft`, they are stale — those routes no longer exist here.

## Stack

- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS
- Supabase Auth + Supabase DB
- Resend for transactional email (RFQ / review notifications)

## Routes

### Customer / public facing (light theme)
| Route | Purpose |
|---|---|
| `/` | Redirects to `https://buildquote.com.au/library` |
| `/widget/[token]` | Public embeddable widget (single brand, by token) |
| `/embed/[slug]` | Public multi-brand embed — renders **all** brand widgets for a supplier. Distinct from `/widget/[token]`; may be embedded on live supplier sites. **Do not delete without confirming it's unused.** |
| `/supplierdirectory` | Public supplier directory |
| `/supplierdirectory/[slug]` | Supplier detail page |
| `/supplierdirectory/[slug]/[manufacturer-slug]` | Manufacturer products for that supplier |
| `/supplier-review/[token]` | Customer review page (token URL sent by Trade Desk) |
| `/legal` | Legal / terms |

### Supplier portal (dark theme, auth required)
| Route | Purpose |
|---|---|
| `/supplier/login` | Supplier login, password reset, access request |
| `/supplier/[slug]` | Supplier dashboard — Profile, Products (widgets), Trade Desk, Enquiries, Account |
| `/supplier/reset/[token]` | Password reset via emailed token |
| `/auth/reset-password` | Supabase password-reset handler |

### Admin (dark theme, BuildQuote staff only)
| Route | Purpose |
|---|---|
| `/admin` | Admin panel — create suppliers, assign widgets |
| `/admin/suppliers` | Supplier management |

### API
| Route | Purpose |
|---|---|
| `/api/manufacturers` | GET manufacturer list. **CORS-open to buildquote.com.au** — buildquote may consume this cross-origin, so the route and its data layer (`lib/data/getManufacturers.ts`) are kept. |
| `/api/request-system` | Request a missing system/product |
| `/api/add-components` | Add components to a system |
| `/api/rfq-notify` | RFQ notification email (Resend) |
| `/api/supplier/*` | create-review-session, create-widget, request-reset, set-password, update-profile, update-widget-systems |
| `/api/admin/*` | catalogue-sources, create-supplier, manufacturer-widget, portal-contacts, set-supplier-login, system-profiles, update-widget-systems |

## Theming

Customer/public-facing surfaces use the **light** buildquote palette; supplier and
admin surfaces use the **dark** MFP palette (CSS vars in `app/globals.css`). Full
rule table in [STATE.md](STATE.md). `GlobalNav` hides itself on `/widget/*` and
`/embed/*`.

## Data layer (`lib/data/`)
| File | Used by | Keep? |
|---|---|---|
| `getManufacturers.ts` | `/api/manufacturers` (cross-origin to buildquote) | **Keep** |
| `getWidgetData.ts` | `/widget/[token]` | **Keep** |
| `getPublicSuppliers.ts` | `/supplierdirectory`, `/embed/[slug]` | **Keep** |
| `getSupplierBrandWidget.ts` | `/embed/[slug]` | **Keep** |
| `getSystems.ts` | catalogue reads | **Keep** |

## Auth pattern

Suppliers authenticate via Supabase Auth (`supabase.auth.signInWithPassword`).
After login, `suppliers.auth_user_id` is matched against `session.user.id` to load
and authorise their record. `ADMIN_EMAIL` (if set) bypasses supplier auth for admin.

## Supabase

- **Project ref:** `oxvhmulxuvlfjyjzleki` (`https://oxvhmulxuvlfjyjzleki.supabase.co`)
- Shared with buildquote.com.au (same Supabase project).
- **Schema:** canonical SQL in `supabase/schema.sql` — read before any DB work, do not modify casually.

### Key tables
- **Suppliers:** `suppliers`, `supplier_systems`, `supplier_tokens`
- **Widgets:** `embed_widgets`, `embed_widget_systems`
- **Catalogue (read-only here):** `manufacturers`, `systems`, `system_colours`, `system_profiles`, `components`, `system_components`
- **Contacts/auth:** `portal_contacts`
- **RFQ:** `rfq_enquiries`, `rfq_drafts`, `rfq_draft_items`

## Environment variables
| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://oxvhmulxuvlfjyjzleki.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only service role key |
| `NEXT_PUBLIC_BUILDQUOTE_URL` | `https://buildquote.com.au` (prod) / `http://localhost:3000` (dev) |
| `RESEND_API_KEY` | ⚠️ **Required for build** — the Resend client is instantiated at module load in `/api/supplier/create-review-session` and other routes. Build fails at page-data collection if unset. Must be set in Vercel env. |
| `RESEND_FROM_EMAIL` | `rfq@buildquote.com.au` |
| `ADMIN_EMAIL` | optional — bypasses supplier auth for admin |

## Workflow

- **Branch:** commit and push directly to `main`.
- **Dev server:** `npm run dev` (`next dev`). buildquote usually holds port 3000, so
  run MFP on 3001: `npm run dev -- -p 3001` → http://localhost:3001.
- **Verify before pushing:** `npx tsc --noEmit` then `npm run build`. If a stale
  `next dev` left `.next/dev/types` referencing deleted routes, `rm -rf .next`
  before rebuilding. The build needs `RESEND_API_KEY` set to complete page-data
  collection.
- **Commit convention:** `feat:` / `fix:` / `chore:` / `refactor:`.

## What this repo does NOT do

- Manufacturer login or catalogue creation/editing (separate repo)
- Builder / RFQ workflows or the product library (lives at buildquote.com.au)
