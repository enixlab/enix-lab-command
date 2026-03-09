import { NextRequest, NextResponse } from 'next/server'
import { readData, upsertItem, updateItem, FILES } from '@/lib/github'
import type { Appointment } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const appts = await readData<Appointment>(FILES.AGENDA)
    return NextResponse.json(appts)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const appt: Appointment = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'en_attente',
      ...body,
    }
    await upsertItem<Appointment>(FILES.AGENDA, appt)
    return NextResponse.json(appt)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    await updateItem<Appointment>(FILES.AGENDA, id, updates)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
