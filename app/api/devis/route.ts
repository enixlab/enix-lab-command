import { NextRequest, NextResponse } from 'next/server'
import { readData, upsertItem, FILES } from '@/lib/github'
import type { Devis } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const devis = await readData<Devis>(FILES.DEVIS)
    return NextResponse.json(devis)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const existing = await readData<Devis>(FILES.DEVIS)
    const num = String(existing.length + 1).padStart(4, '0')
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + (body.validDays || 30))

    const devis: Devis = {
      id: randomUUID(),
      number: `ENIX-${new Date().getFullYear()}-${num}`,
      createdAt: new Date().toISOString(),
      validUntil: validUntil.toISOString(),
      status: 'brouillon',
      ...body,
    }
    await upsertItem<Devis>(FILES.DEVIS, devis)
    return NextResponse.json(devis)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
