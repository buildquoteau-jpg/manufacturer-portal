import { NextResponse } from 'next/server'
import { messagingStatus } from '@/lib/messaging/twilio'

// No auth needed — reveals only which delivery channels are server-configured,
// no PII, no per-supplier data.
export async function GET() {
  return NextResponse.json(messagingStatus())
}
