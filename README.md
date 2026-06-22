# BuildQuote Architecture

BuildQuote consists of three independent web applications that share a single central database.

Each platform has its own repository, UI, deployment, and development environment to keep the codebases simple and mentally manageable. All platforms communicate through a shared Supabase database.

---

# Platforms

## 1. BuildQuote RFQ Platform

Purpose:
Allows builders to upload or type a building materials list and send a Request For Quote (RFQ) to suppliers.

Typical workflow:

Builder → Upload materials list
AI parsing → Structured materials
Builder selects supplier
RFQ sent to supplier

Core data stored:

* RFQ requests
* RFQ items
* builder details
* delivery/project info

The RFQ platform references manufacturer components when available.

---

## 2. BuildQuote Manufacturer Portal

Purpose:
Allows builders to browse manufacturer systems and select components to include in RFQs.

Example:

James Hardie → Axon Cladding System

System contains selectable components such as:

* panels
* trims
* flashings
* fixings
* sealants
* accessories

Builders select quantities and export the selected components into the RFQ platform.

The UI displays systems as **System Cards** containing rows of components.

Component specifications are stored in structured fields so they can be exported directly into RFQs.

---

## 3. South West Supplier Directory

Purpose:
A regional directory of building material suppliers.

Example entries:

* M&B Building Supplies
* Bunnings Busselton
* local timber yards
* roofing suppliers

Builders can browse suppliers and jump directly into the RFQ tool.

Stored data includes:

* supplier name
* location
* contact info
* website
* supplier category

---

# Repository Structure

Each platform is built as a separate project.

buildquote-rfq
buildquote-manufacturer-portal
buildquote-supplier-directory

Each repository has:

* its own GitHub repo
* its own Codespaces environment
* its own deployment
* its own UI and routing

This separation keeps each system small and easier to reason about.

---

# Database Architecture (Supabase)

All platforms share a single Supabase project.

This avoids data duplication and allows RFQs to reference real manufacturer components.

Example high-level table groups:

Manufacturer catalogue

* manufacturers
* systems
* components

RFQ platform

* rfqs
* rfq_items
* builders
* projects

Supplier directory

* suppliers
* supplier_locations
* supplier_categories

---

# Component Data Model

Components represent individual selectable items in a manufacturer system.

Examples:

* fibre cement panels
* aluminium trims
* flashing sections
* batten systems
* fixings
* sealants
* brackets

The schema is designed to support many types of building products without assuming a specific shape (for example panels vs rolls vs fixings).

Structured fields include:

* SKU
* name
* unit of measure
* length
* width
* thickness
* diameter
* coverage
* weight
* material
* finish
* colour
* profile

Additional manufacturer-specific specifications can be stored in a flexible JSON field.

This keeps common data structured while allowing unusual attributes.

---

# Data Flow Between Platforms

Manufacturer Portal → RFQ Platform

Builder selects components from a system.

Selected components are exported as structured data and inserted into an RFQ request.

RFQ Platform → Supplier

The RFQ platform formats the selected materials into a quote request and sends it to a supplier.

Supplier Directory → RFQ Platform

Builders can open the RFQ platform directly from a supplier page.

---

# Design Principles

BuildQuote follows a few key principles:

Keep platforms independent
Keep database shared
Keep product data structured
Avoid duplicate data
Keep UI simple for builders

---

# Future Extensions

Possible future additions include:

* manufacturer document ingestion (PDF spec sheets)
* automated component extraction using AI
* product availability by region
* supplier price catalogues
* builder project libraries




This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
