import { NextRequest, NextResponse } from 'next/server'
import { updateItem, deleteItem, FILES } from '@/lib/github'
import type { Devis } from '@/lib/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await req.json()
    await updateItem<Devis>(FILES.DEVIS, params.id, updates)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteItem(FILES.DEVIS, params.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
