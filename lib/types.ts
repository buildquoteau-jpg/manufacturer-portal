export interface LineItem {
  id: string
  name: string
  sku: string
  productId: string
  desc: string
  uom: string
  qty: string
}

export interface BuilderDetails {
  builderName: string
  company: string
  abn: string
  phone: string
  email: string
}

export interface SupplierDetails {
  supplierName: string
  supplierEmail: string
  accountNumber: string
}

export interface RFQPayload {
  rfqId: string
  builder: BuilderDetails
  supplier: SupplierDetails
  items: LineItem[]
  delivery: 'delivery' | 'pickup'
  siteAddress?: string
  dateRequired: string
  message: string
  sendCopyToSelf: boolean
}
