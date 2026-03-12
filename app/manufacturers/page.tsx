import { Suspense } from 'react'
import ManufacturersClient from './ManufacturersClient'

export default function ManufacturersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page text-text-primary p-6">Loading manufacturer portal…</div>}>
      <ManufacturersClient />
    </Suspense>
  )
}
