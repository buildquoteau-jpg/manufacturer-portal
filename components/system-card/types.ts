// Master System Card renderer types.
//
// This is the data contract for the approved BuildQuote v6 System Card
// experience, ported into Data Studio as the single reusable renderer.
// Field names deliberately mirror BuildQuote v6's `LibrarySystem` shape
// (buildquote/lib/data/getSystems.ts) so that:
//   1. the renderer code stays byte-close to the approved v6 card, and
//   2. a future static package generator can emit this exact JSON and
//      render from it with no live Supabase reads.
//
// Everything here is plain JSON — no Supabase types, no client instances.

// One image in the swipeable hero gallery. Index 0 is the cover image —
// used on tiles and as the og:image share preview (og_jpg_url when set,
// since some crawlers won't render webp/avif).
export type SystemCardGalleryImage = {
  asset_id?: string | null
  url: string
  og_jpg_url?: string | null
  alt: string
  caption?: string | null
}

export type SystemCardColour = {
  colour_name: string
  image_url: string | null
  sort_order: number
  is_stocked: boolean
}

export type SystemCardProfile = {
  id: string
  profile_name: string | null
  name: string | null
  product_code: string | null
  description: string | null
  dimensions: string | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  thickness_mm: number | null
  uom: string | null
  supplier_pack_qty: number | null
  supplier_pack_uom: string | null
  sort_order: number
}

// A component entry on the card. Mirrors v6's link-table shape: `role` is the
// system role label, `components` holds the component record itself.
export type SystemCardComponentEntry = {
  id: string
  role: string
  notes: string | null
  sort_order: number
  components: {
    name: string
    sku: string | null
    description: string | null
    category: string | null
    uom: string | null
    procurement_route: string | null
  } | null
}

export type SystemCardSystem = {
  id: string
  name: string
  product_code: string | null
  slug: string
  category: string | null
  subcategory: string | null
  description: string | null
  hero_image_url: string | null
  hero_image_position_x: number | null
  hero_image_position_y: number | null
  // Zoom into the hero around the crop position (1 = fit … 3 = 300%).
  hero_image_zoom?: number | null
  // Optional multi-image hero gallery; cards without one fall back to the
  // single hero_image_url render.
  gallery_images?: SystemCardGalleryImage[] | null
  australian_made: boolean | null
  bal_rating: string | null
  fire_rating: string | null
  moisture_resistant: boolean | null
  acoustic_rating: string | null
  structural_grade: string | null
  notes: string | null
  website_url: string | null
  install_guide_urls: { label: string; url: string }[] | null
  design_guide_url: string | null
  tech_data_url: string | null
  // Arbitrary named document buttons (energy ratings, sustainability reports,
  // warranty PDFs…). `label` is the button text, `url` is a PDF or web page.
  custom_document_links?: { label: string; url: string }[] | null
  // Freeform label/value spec facts with no dedicated column (warranty
  // period, R-value, etc.) — rendered as extra attribute pills.
  custom_technical_attributes?: { label: string; value: string }[] | null
  manufacturer: {
    name: string
    slug: string
    logo_url: string | null
  } | null
  system_colours: SystemCardColour[]
  system_profiles: SystemCardProfile[]
  system_components: SystemCardComponentEntry[]
}

// Manufacturer info for the v6-style manufacturer landing page (breadcrumb,
// hero band, description, website CTA, systems grid).
export type SystemCardManufacturerPage = {
  name: string
  slug: string
  description: string | null
  website_url: string | null
  logo_url: string | null
  hero_image_url: string | null
  // v6 supports a wide hero variant + vertical position; Data Studio's
  // manufacturers table doesn't carry these yet, so they default off/50.
  hero_wide_image_url?: string | null
  hero_image_position_y?: number | null
}

// A supplier who stocks the system. Optional — the card renders a
// "No local stockists listed yet" placeholder when the list is empty.
export type SystemCardStockist = {
  id: string
  name: string
  suburb: string | null
  state: string | null
  region: string | null
  phone: string | null
  website_url: string | null
  google_maps_url: string | null
  opening_hours: string | null
  delivery_info: string | null
  service_postcodes: string[]
  // Workspace-managed stockists (manufacturer_stockists) — both optional so
  // the RFQ supplier shape keeps working unchanged.
  trade_desk_email?: string | null
  // Set when the stockist confirmed via the tokenised link; renders the
  // "Confirmed supplier · <date>" tag.
  confirmed_at?: string | null
}

// Validation line shown in the card footer: "Validated by <manufacturer> ·
// <date> · v<n>". All parts optional — the footer renders whatever is known.
export type SystemCardValidation = {
  validated_by: string | null   // manufacturer name (the validating party)
  validated_at: string | null   // ISO date of manufacturer verification
  version: number | null        // package/card version this render represents
}

// Share/analytics wiring for a card render. When present the card can mint
// tokenised share links (copy/SMS/email), send the view beacon and route doc
// clicks through the tracking redirect. Everything fails soft — cards work
// identically with tracking absent or unreachable.
export type SystemCardTracking = {
  apiBase: string           // studio origin, e.g. https://studio.buildquote.com.au
  manufacturerSlug: string
  cardSlug: string
  version: number | null
}

// One line on the client-side shopping list (same shape as v6).
export type ShoppingListItem = {
  id: string
  name: string
  sku: string
  desc: string
  uom: string
  qty: number
}
