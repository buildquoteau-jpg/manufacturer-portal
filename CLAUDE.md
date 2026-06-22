# manufacturer-portal (mfp.buildquote.com.au)

**Supplier portal** — suppliers log in to view their details, manage embed widgets, and see product enquiries.

Manufacturer catalogue data (manufacturers, systems, components) is read from the shared Supabase DB but is created and managed in a separate repo. This repo is not for manufacturer login or catalogue management.

## Purpose

- Suppliers log in at `/supplier/login` using Supabase Auth
- Each supplier has a dashboard at `/supplier/[slug]` showing:
  - Business details (name, address, contact info)
  - Embed widgets they can install on their own website
  - Product enquiries received via those widgets
- Widgets render at `/widget/[token]` — public, no auth required
- Admin panel at `/admin` — BuildQuote staff only (create suppliers, assign widgets)

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Supabase Auth + Supabase DB (production: ovndokzwkxpfjfobewaq.supabase.co)

## Key routes

| Route | Purpose |
|---|---|
| `/` | Redirects to `/supplier/login` |
| `/supplier/login` | Supplier login, password reset, access request |
| `/supplier/[slug]` | Supplier dashboard (auth required) |
| `/widget/[token]` | Public widget embed |
| `/auth/reset-password` | Password reset handler |
| `/admin` | BuildQuote admin panel |
| `/legal` | Legal/terms page |

## Key tables (production DB)

- **Suppliers:** `suppliers`, `supplier_systems`, `supplier_tokens`
- **Widgets:** `embed_widgets`, `embed_widget_systems`
- **Catalogue (read-only here):** `manufacturers`, `systems`, `system_colours`, `system_profiles`, `components`, `system_components`
- **Contacts/auth:** `portal_contacts`
- **RFQ:** `rfq_enquiries`, `rfq_drafts`, `rfq_draft_items`

## Auth pattern

Suppliers authenticate via Supabase Auth (`supabase.auth.signInWithPassword`). After login, `suppliers.auth_user_id` is matched against `session.user.id` to load and authorise their record.

## Schema reference

Canonical schema lives in the `manufacturers_portal` assets directory (`supabase/schema_complete.sql`). Read before any DB work.

## What this repo does NOT do

- Manufacturer login (separate repo)
- Manufacturer catalogue creation or editing (separate repo)
- Builder/RFQ workflows (separate `buildquote-rfq` repo)
