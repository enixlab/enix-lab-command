import { NextRequest, NextResponse } from 'next/server'
import { readData, upsertItem, FILES } from '@/lib/github'
import type { Contact } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const contacts = await readData<Contact>(FILES.CRM)
    return NextResponse.json(contacts)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const contact: Contact = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...body,
    }
    await upsertItem<Contact>(FILES.CRM, contact)
    return NextResponse.json(contact)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
