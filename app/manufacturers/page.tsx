import { getManufacturers } from '@/lib/data/getManufacturers'
import { ManufacturersClient } from './ManufacturersClient'

export const dynamic = 'force-dynamic'

export default async function ManufacturersPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>
}) {
  const { draft } = await searchParams
  const manufacturers = await getManufacturers()

  return <ManufacturersClient manufacturers={manufacturers} draft={draft} />
}
