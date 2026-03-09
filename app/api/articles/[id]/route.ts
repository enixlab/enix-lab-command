import { NextRequest, NextResponse } from 'next/server'
import { updateItem, deleteItem, readData, writeData, FILES } from '@/lib/github'
import { generateNewsLabArticle } from '@/lib/ai'
import type { Article } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { id } = params

    if (body.action === 'regenerate' && body.correctionNote) {
      // Get current article
      const articles = await readData<Article>(FILES.ARTICLES_QUEUE)
      const article = articles.find(a => a.id === id)
      if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      // Get rejected topics for learning
      const rejected = await readData<{ topic: string }>(FILES.REJECTED_TOPICS)
      const rejectedTopics = rejected.map(r => r.topic)

      // Regenerate with correction
      const prompt = `Article original: "${article.title}"\nCorrection demandée: ${body.correctionNote}\nRégénère l'article en prenant en compte ces corrections.`
      const generated = await generateNewsLabArticle(prompt, rejectedTopics)

      await updateItem<Article>(FILES.ARTICLES_QUEUE, id, {
        ...generated,
        correctionNote: body.correctionNote,
        status: 'queue',
      })
      return NextResponse.json({ success: true })
    }

    if (body.status === 'rejected') {
      // Learn from rejection
      const articles = await readData<Article>(FILES.ARTICLES_QUEUE)
      const article = articles.find(a => a.id === id)
      if (article) {
        const rejected = await readData<{ topic: string; date: string }>(FILES.REJECTED_TOPICS)
        rejected.push({ topic: article.title.slice(0, 60), date: new Date().toISOString() })
        await writeData(FILES.REJECTED_TOPICS, rejected.slice(-50)) // Keep last 50
      }
    }

    await updateItem<Article>(FILES.ARTICLES_QUEUE, id, {
      ...body,
      ...(body.status === 'published' ? { publishedAt: new Date().toISOString() } : {}),
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Learn from deletion
    const articles = await readData<Article>(FILES.ARTICLES_QUEUE)
    const article = articles.find(a => a.id === params.id)
    if (article) {
      const rejected = await readData<{ topic: string; date: string }>(FILES.REJECTED_TOPICS)
      rejected.push({ topic: article.title.slice(0, 60), date: new Date().toISOString() })
      await writeData(FILES.REJECTED_TOPICS, rejected.slice(-50))
    }

    await deleteItem(FILES.ARTICLES_QUEUE, params.id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
