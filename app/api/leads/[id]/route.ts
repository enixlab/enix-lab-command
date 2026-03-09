import { NextRequest, NextResponse } from 'next/server'
import { updateItem, FILES } from '@/lib/github'
import type { Lead } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    await updateItem<Lead>(FILES.LEADS, params.id, body)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
