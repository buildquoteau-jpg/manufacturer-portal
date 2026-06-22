import { redirect } from 'next/navigation'

// Old supplier finder redirects to the new login page
export default function SupplierRedirect() {
  redirect('/supplier/login')
}
