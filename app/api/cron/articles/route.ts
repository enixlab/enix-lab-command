import { NextRequest, NextResponse } from 'next/server'

// Called by Vercel Cron every 2 hours
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/generate/article`, { method: 'POST' })
    const data = await res.json()
    console.log('[CRON] Articles generated:', data)
    return NextResponse.json({ success: true, ...data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
