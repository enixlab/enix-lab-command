import { NextResponse } from 'next/server'
import { fetchAllNews } from '@/lib/news'
import { generateNewsLabArticle } from '@/lib/ai'
import { readData, upsertItem, FILES } from '@/lib/github'
import type { Article } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST() {
  try {
    // Fetch news from all sources
    const newsItems = await fetchAllNews()
    if (newsItems.length === 0) {
      return NextResponse.json({ count: 0, message: 'No news found' })
    }

    // Get rejected topics to avoid
    const rejected = await readData<{ topic: string }>(FILES.REJECTED_TOPICS)
    const rejectedTopics = rejected.map(r => r.topic)

    // Get existing article titles to avoid duplicates
    const existing = await readData<Article>(FILES.ARTICLES_QUEUE)
    const existingTitles = new Set(existing.map(a => a.title.slice(0, 30).toLowerCase()))

    // Pick top 3 most interesting items
    const selected = newsItems
      .filter(n => n.title.length > 20)
      .slice(0, 5)

    let count = 0
    const errors: string[] = []

    for (const item of selected.slice(0, 3)) {
      try {
        const raw = `Titre: ${item.title}\nDescription: ${item.description}\nSource: ${item.source} (${item.lang})\nLien: ${item.link}`
        let generated

        try {
          generated = await generateNewsLabArticle(raw, rejectedTopics)
        } catch (aiError) {
          // Fallback: create article directly from raw news data (no AI)
          const tags = ['IA AGENTIQUE','BAD BUZZ','TECH-CRASH','MARKETING-LAB','SOCIAL-MEDIA','CRYPTO-GUÉRILLA','E-COMMERCE']
          const tagGuess = tags.find(t =>
            item.title.toLowerCase().includes(t.toLowerCase().split(' ')[0]) ||
            item.description.toLowerCase().includes(t.toLowerCase().split(' ')[0])
          ) || tags[Math.floor(Math.random() * tags.length)]

          generated = {
            tag: tagGuess,
            title: item.title,
            excerpt: item.description.slice(0, 160),
            content: `<h1>${item.title}</h1><p>${item.description}</p><p>Source : <a href="${item.link}" target="_blank">${item.source}</a></p><hr><p style="color:#888;font-size:12px">⚠️ Article non transformé — configurez votre clé ANTHROPIC_API_KEY ou GROQ_API_KEY pour activer la rédaction IA NewsLab.</p>`
          }
          errors.push(`AI error (fallback used): ${String(aiError).slice(0, 100)}`)
        }

        const titleKey = generated.title.slice(0, 30).toLowerCase()
        if (existingTitles.has(titleKey)) continue

        const article: Article = {
          id: randomUUID(),
          tag: generated.tag,
          title: generated.title,
          excerpt: generated.excerpt,
          content: generated.content,
          source: item.source,
          sourceUrl: item.link,
          lang: item.lang,
          status: 'queue',
          createdAt: new Date().toISOString(),
        }

        await upsertItem<Article>(FILES.ARTICLES_QUEUE, article)
        existingTitles.add(titleKey)
        count++
      } catch (e) {
        errors.push(String(e))
      }
    }

    return NextResponse.json({ count, errors: errors.length > 0 ? errors : undefined })
  } catch (e) {
    return NextResponse.json({ error: String(e), count: 0 }, { status: 500 })
  }
}
