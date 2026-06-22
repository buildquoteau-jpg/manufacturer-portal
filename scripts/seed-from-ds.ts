/**
 * seed-from-ds.ts
 * Seeds the MFP production DB from the data studio staged tables.
 *
 * Usage:
 *   npx tsx scripts/seed-from-ds.ts james-hardie
 *
 * Env vars required (add to .env.local):
 *   DS_SUPABASE_URL              — data studio project URL
 *   DS_SUPABASE_SERVICE_ROLE_KEY — data studio service role key
 *   NEXT_PUBLIC_SUPABASE_URL     — MFP project URL (already set)
 *   SUPABASE_SERVICE_ROLE_KEY    — MFP service role key (already set)
 *
 * What it does:
 *   1. Reads manufacturer + all staged data from the DS project
 *   2. Inserts into MFP manufacturers / systems / components /
 *      system_colours / system_components
 *   3. Writes back production_*_id to DS staged rows so the link is permanent
 *   4. Safe to rerun — skips rows that already have a production_*_id set
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) dotenv.config({ path: envPath })

const DS_URL  = process.env.DS_SUPABASE_URL
const DS_KEY  = process.env.DS_SUPABASE_SERVICE_ROLE_KEY
const MFP_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const MFP_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!DS_URL || !DS_KEY || !MFP_URL || !MFP_KEY) {
  console.error('Missing env vars. Need DS_SUPABASE_URL, DS_SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const ds  = createClient(DS_URL, DS_KEY)
const mfp = createClient(MFP_URL, MFP_KEY)

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function toProductCode(name: string) {
  return name.toUpperCase().trim().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// DS uses role values like 'component', 'base_trim', 'thermal_break'.
// MFP expects 'required' | 'optional' | 'accessory'.
function mapRole(role: string): string {
  const map: Record<string, string> = {
    required:      'required',
    optional:      'optional',
    accessory:     'accessory',
    component:     'required',
    base_trim:     'required',
    thermal_break: 'optional',
    recommended:   'optional',
  }
  return map[role] ?? 'optional'
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed(manufacturerSlug: string) {
  console.log(`\n🌱 Seeding manufacturer: ${manufacturerSlug}\n`)

  // ── 1. Manufacturer ────────────────────────────────────────────────────────

  const { data: dsMf, error: mfErr } = await ds
    .from('data_studio_manufacturers')
    .select('*')
    .eq('slug', manufacturerSlug)
    .single()

  if (mfErr || !dsMf) {
    console.error('Manufacturer not found in DS:', mfErr?.message)
    process.exit(1)
  }

  // If already published, reuse the existing MFP id and rebuild ID maps
  if (dsMf.production_manufacturer_id) {
    console.log(`ℹ️  Manufacturer already published → MFP id: ${dsMf.production_manufacturer_id}`)
    console.log('   Rebuilding ID maps from existing production_*_id values...\n')

    const { data: dsSystems } = await ds
      .from('staged_systems')
      .select('id, name, production_system_id')
      .eq('manufacturer_id', dsMf.id)

    const systemIdMap: Record<string, string> = {}
    for (const s of dsSystems ?? []) {
      if (s.production_system_id) systemIdMap[s.id] = s.production_system_id
    }

    const { data: dsComps } = await ds
      .from('staged_components')
      .select('id, name, production_component_id')
      .eq('manufacturer_id', dsMf.id)

    const componentIdMap: Record<string, string> = {}
    for (const c of dsComps ?? []) {
      if (c.production_component_id) componentIdMap[c.id] = c.production_component_id
    }

    const dsSystemIds = Object.keys(systemIdMap)
    const mfpSystemIds = Object.values(systemIdMap)

    // Seed profiles (always replace)
    const { data: dsProfiles } = await ds
      .from('staged_system_profiles')
      .select('*')
      .in('staged_system_id', dsSystemIds)

    await mfp.from('system_profiles').delete().in('system_id', mfpSystemIds)

    let profileCount = 0
    for (const p of dsProfiles ?? []) {
      const mfpSystemId = systemIdMap[p.staged_system_id]
      if (!mfpSystemId) continue
      const { error } = await mfp.from('system_profiles').insert({
        system_id: mfpSystemId, name: p.name, profile_name: p.profile_name,
        product_code: p.product_code, dimensions: p.dimensions, sheet_format: p.sheet_format,
        uom: p.uom, length_m: p.length_m, length_mm: p.length_mm, width_mm: p.width_mm,
        height_mm: p.height_mm, thickness_mm: p.thickness_mm, depth_mm: p.depth_mm,
        gauge_mm: p.gauge_mm, diameter_mm: p.diameter_mm, roll_m: p.roll_m,
        weight_kg: p.weight_kg, weight_g: p.weight_g, pieces: p.pieces, volume_ml: p.volume_ml,
        pack_format: p.pack_format, bal_rating: p.bal_rating, supplier_pack_qty: p.supplier_pack_qty,
        supplier_pack_uom: p.supplier_pack_uom, supplier_pack_note: p.supplier_pack_note,
        sort_order: p.sort_order ?? 0,
      })
      if (!error) profileCount++
      else console.error(`  ❌ Profile failed: ${p.profile_name} —`, error.message)
    }
    console.log(`✅ ${profileCount} profiles seeded`)
    console.log('\n🎉 Update complete!\n')
    process.exit(0)
  }

  const { data: mfpMf, error: mfInsErr } = await mfp
    .from('manufacturers')
    .insert({
      name:           dsMf.name,
      slug:           dsMf.slug,
      website_url:    dsMf.website_url,
      logo_url:       dsMf.logo_url || null,
      hero_image_url: dsMf.hero_image_url || null,
      description:    dsMf.description,
      abn:            dsMf.abn,
      phone:          dsMf.phone,
    })
    .select()
    .single()

  if (mfInsErr || !mfpMf) {
    console.error('Failed to insert manufacturer:', mfInsErr?.message)
    process.exit(1)
  }

  console.log(`✅ Manufacturer: ${mfpMf.name}`)
  console.log(`   MFP id: ${mfpMf.id}\n`)

  await ds.from('data_studio_manufacturers')
    .update({ production_manufacturer_id: mfpMf.id })
    .eq('id', dsMf.id)

  // ── 2. Systems ────────────────────────────────────────────────────────────

  const { data: dsSystems } = await ds
    .from('staged_systems')
    .select('*')
    .eq('manufacturer_id', dsMf.id)

  if (!dsSystems?.length) {
    console.log('⚠️  No staged systems found for this manufacturer.')
  }

  const systemIdMap: Record<string, string> = {} // DS id → MFP id

  for (const sys of dsSystems ?? []) {
    if (sys.production_system_id) {
      console.log(`  ⏭  System already published: ${sys.name}`)
      systemIdMap[sys.id] = sys.production_system_id
      continue
    }

    const slug         = sys.slug         ?? slugify(`${manufacturerSlug}-${sys.name}`)
    const product_code = sys.product_code ?? toProductCode(sys.name)

    const { data: mfpSys, error: sysErr } = await mfp
      .from('systems')
      .insert({
        manufacturer_id:    mfpMf.id,
        name:               sys.name,
        product_code,
        slug,
        category:           sys.category,
        subcategory:        sys.subcategory,
        description:        sys.description,
        dimensions:         sys.dimensions,
        length_m:           sys.length_m,
        double_sided:       sys.double_sided ?? false,
        hero_image_url:     sys.hero_image_url,
        website_url:        sys.website_url,
        notes:              sys.notes,
        sort_order:         sys.sort_order ?? 0,
        sheet_format:       sys.sheet_format,
        fire_rating:        sys.fire_rating,
        acoustic_rating:    sys.acoustic_rating,
        moisture_resistant: sys.moisture_resistant ?? false,
        structural_grade:   sys.structural_grade,
        install_guide_urls: sys.install_guide_urls,
        tech_data_url:      sys.tech_data_url,
        bal_rating:         sys.bal_rating,
        australian_made:    sys.australian_made ?? false,
        source_label:       sys.source_label,
        source_url:         sys.source_url,
        verification_status: sys.verification_status,
        verified_by:        sys.verified_by,
        verified_at:        sys.verified_at,
        change_notes:       sys.reviewer_notes,
      })
      .select()
      .single()

    if (sysErr || !mfpSys) {
      console.error(`  ❌ System failed: ${sys.name} —`, sysErr?.message)
      continue
    }

    systemIdMap[sys.id] = mfpSys.id
    console.log(`  ✅ System: ${mfpSys.name} [${product_code}]`)

    await ds.from('staged_systems')
      .update({ production_system_id: mfpSys.id })
      .eq('id', sys.id)
  }

  // ── 3. Components ─────────────────────────────────────────────────────────

  const { data: dsComps } = await ds
    .from('staged_components')
    .select('*')
    .eq('manufacturer_id', dsMf.id)

  const componentIdMap: Record<string, string> = {}

  for (const comp of dsComps ?? []) {
    if (comp.production_component_id) {
      console.log(`  ⏭  Component already published: ${comp.name}`)
      componentIdMap[comp.id] = comp.production_component_id
      continue
    }

    const { data: mfpComp, error: compErr } = await mfp
      .from('components')
      .insert({
        manufacturer_id:    mfpMf.id,
        sku:                comp.sku,
        name:               comp.name,
        description:        comp.description,
        category:           comp.category,
        uom:                comp.uom,
        sort_order:         comp.sort_order ?? 0,
        length_mm:          comp.length_mm,
        width_mm:           comp.width_mm,
        height_mm:          comp.height_mm,
        thickness_mm:       comp.thickness_mm,
        depth_mm:           comp.depth_mm,
        gauge_mm:           comp.gauge_mm,
        diameter_mm:        comp.diameter_mm,
        roll_m:             comp.roll_m,
        weight_kg:          comp.weight_kg,
        weight_g:           comp.weight_g,
        pieces:             comp.pieces,
        volume_ml:          comp.volume_ml,
        pack_format:        comp.pack_format,
        supplier_pack_qty:  comp.supplier_pack_qty,
        supplier_pack_uom:  comp.supplier_pack_uom,
        supplier_pack_note: comp.supplier_pack_note,
      })
      .select()
      .single()

    if (compErr || !mfpComp) {
      console.error(`  ❌ Component failed: ${comp.name} —`, compErr?.message)
      continue
    }

    componentIdMap[comp.id] = mfpComp.id

    await ds.from('staged_components')
      .update({ production_component_id: mfpComp.id })
      .eq('id', comp.id)
  }

  console.log(`\n  ✅ ${Object.keys(componentIdMap).length} components`)

  // ── 4. System profiles ────────────────────────────────────────────────────

  const dsSystemIds = Object.keys(systemIdMap)

  if (dsSystemIds.length) {
    const { data: dsProfiles } = await ds
      .from('staged_system_profiles')
      .select('*')
      .in('staged_system_id', dsSystemIds)

    // Clear existing profiles for these systems then re-insert (no production_id tracking)
    const mfpSystemIds = Object.values(systemIdMap)
    await mfp.from('system_profiles').delete().in('system_id', mfpSystemIds)

    let profileCount = 0
    for (const p of dsProfiles ?? []) {
      const mfpSystemId = systemIdMap[p.staged_system_id]
      if (!mfpSystemId) continue

      const { error } = await mfp.from('system_profiles').insert({
        system_id:          mfpSystemId,
        name:               p.name,
        profile_name:       p.profile_name,
        product_code:       p.product_code,
        dimensions:         p.dimensions,
        sheet_format:       p.sheet_format,
        uom:                p.uom,
        length_m:           p.length_m,
        length_mm:          p.length_mm,
        width_mm:           p.width_mm,
        height_mm:          p.height_mm,
        thickness_mm:       p.thickness_mm,
        depth_mm:           p.depth_mm,
        gauge_mm:           p.gauge_mm,
        diameter_mm:        p.diameter_mm,
        roll_m:             p.roll_m,
        weight_kg:          p.weight_kg,
        weight_g:           p.weight_g,
        pieces:             p.pieces,
        volume_ml:          p.volume_ml,
        pack_format:        p.pack_format,
        bal_rating:         p.bal_rating,
        supplier_pack_qty:  p.supplier_pack_qty,
        supplier_pack_uom:  p.supplier_pack_uom,
        supplier_pack_note: p.supplier_pack_note,
        sort_order:         p.sort_order ?? 0,
      })
      if (!error) profileCount++
      else console.error(`  ❌ Profile failed: ${p.profile_name} —`, error.message)
    }
    console.log(`  ✅ ${profileCount} profiles`)
  }

  // ── 5. System colours ─────────────────────────────────────────────────────

  const dsSystemIds2 = Object.keys(systemIdMap)

  if (dsSystemIds2.length) {
    const { data: dsColours } = await ds
      .from('staged_system_colours')
      .select('*')
      .in('staged_system_id', dsSystemIds2)

    let colourCount = 0
    for (const c of dsColours ?? []) {
      const mfpSystemId = systemIdMap[c.staged_system_id]
      if (!mfpSystemId) continue

      const { error } = await mfp.from('system_colours').insert({
        system_id:   mfpSystemId,
        colour_name: c.colour_name,
        sku:         c.sku,
        image_url:   c.image_url,
        is_stocked:  c.is_stocked ?? true,
        sort_order:  c.sort_order ?? 0,
      })
      if (!error) colourCount++
    }
    console.log(`  ✅ ${colourCount} colours`)

    // ── 6. System components ───────────────────────────────────────────────

    const { data: dsSysComps } = await ds
      .from('staged_system_components')
      .select('*')
      .in('staged_system_id', dsSystemIds2)

    let scCount = 0
    for (const sc of dsSysComps ?? []) {
      const mfpSystemId    = systemIdMap[sc.staged_system_id]
      const mfpComponentId = componentIdMap[sc.staged_component_id]
      if (!mfpSystemId || !mfpComponentId) continue

      const { error } = await mfp.from('system_components').insert({
        system_id:    mfpSystemId,
        component_id: mfpComponentId,
        role:         mapRole(sc.role),
        notes:        sc.notes,
        sort_order:   sc.sort_order ?? 0,
      })
      if (!error) scCount++
    }
    console.log(`  ✅ ${scCount} system_components`)
  }

  console.log('\n🎉 Seed complete!\n')
}

// ── Entry point ───────────────────────────────────────────────────────────────

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: npx tsx scripts/seed-from-ds.ts <manufacturer-slug>')
  console.error('Example: npx tsx scripts/seed-from-ds.ts james-hardie')
  process.exit(1)
}

seed(slug).catch(err => { console.error(err); process.exit(1) })
