import { getPublicSuppliers } from '@/lib/data/getPublicSuppliers'
import { SupplierDirectoryClient } from './SupplierDirectoryClient'

export const dynamic = 'force-dynamic'

export default async function SuppliersPage() {
  const suppliers = await getPublicSuppliers()
  return <SupplierDirectoryClient suppliers={suppliers} />
}
