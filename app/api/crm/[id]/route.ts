import { NextRequest, NextResponse } from 'next/server'
import { updateItem, deleteItem, FILES } from '@/lib/github'
import type { Contact } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    await updateItem<Contact>(FILES.CRM, params.id, { ...body, updatedAt: new Date().toISOString() })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteItem(FILES.CRM, params.id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
