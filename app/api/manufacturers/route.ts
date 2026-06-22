import { getManufacturers } from '@/lib/data/getManufacturers'
import { NextResponse } from 'next/server'

export async function GET() {
  const manufacturers = await getManufacturers()
  return NextResponse.json(manufacturers, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': 'https://buildquote.com.au',
    },
  })
}
