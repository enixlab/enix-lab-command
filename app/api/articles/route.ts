import { NextResponse } from 'next/server'
import { readData, FILES } from '@/lib/github'
import type { Article } from '@/lib/types'

export async function GET() {
  try {
    const articles = await readData<Article>(FILES.ARTICLES_QUEUE)
    return NextResponse.json(articles)
  } catch {
    return NextResponse.json([])
  }
}
