// Redirects old /admin/suppliers URL to the new unified /admin page
import { redirect } from 'next/navigation'

export default function SuppliersAdminRedirect() {
  redirect('/admin')
}
