import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const filePath = path.join(process.cwd(), 'data', 'system-requests.json')

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const entry = {
      email: body.email || '',
      manufacturer: body.manufacturer || '',
      request: body.request || '',
      timestamp: new Date().toISOString()
    }

    let data: any[] = []

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8')
      data = raw ? JSON.parse(raw) : []
    }

    data.push(entry)

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
