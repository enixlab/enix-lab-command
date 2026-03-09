import { NextResponse } from 'next/server'
import { readData, FILES } from '@/lib/github'
import type { Lead } from '@/lib/types'

export async function GET() {
  try {
    const leads = await readData<Lead>(FILES.LEADS)
    return NextResponse.json(leads)
  } catch {
    return NextResponse.json([])
  }
}
