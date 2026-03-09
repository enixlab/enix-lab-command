import { NextResponse } from 'next/server'
import { fetchAllNews } from '@/lib/news'
import { generateNewsLabArticle } from '@/lib/ai'
import { readData, upsertItem, FILES } from '@/lib/github'
import type { Article } from '@/lib/types'
import { randomUUID } from 'crypto'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'IA':            ['ai ', 'artificial intelligence', 'openai', 'anthropic', 'gpt', 'llm', 'chatgpt', 'claude', 'gemini', 'intelligence artificielle', 'modèle', 'deepseek', 'mistral'],
  'IA / Sécurité': ['hack', 'breach', 'leak', 'espionage', 'vulnerability', 'exploit', 'data leak', 'cyberattack', 'cybersécurité', 'fuite', 'piratage'],
  'Crypto':        ['bitcoin', 'crypto', 'ethereum', 'defi', 'web3', 'blockchain', 'altcoin', 'nft', 'stablecoin', 'btc', 'eth'],
  'Emploi / IA':   ['layoff', 'licenciement', 'emploi', 'job', 'automatisation', 'chômage', 'postes supprimés', 'remplacement'],
  'Bad Buzz':      ['scandal', 'controversy', 'backlash', 'fail', 'bad buzz', 'polémique', 'scandale', 'bad', 'boycott', 'outrage'],
  'Marketing':     ['marketing', 'advertising', 'brand', 'campaign', 'influencer', 'social media', 'réseaux sociaux', 'publicité', 'agence'],
  'Business':      ['startup', 'funding', 'valuation', 'acquisition', 'levée', 'ipo', 'merger', 'investment', 'investissement', 'stratégie'],
  'Tech':          ['apple', 'google', 'microsoft', 'meta', 'tesla', 'nvidia', 'samsung', 'hardware', 'software', 'tech'],
}

function guessCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) return cat
  }
  return 'Tech'
}

export async function POST() {
  try {
    const newsItems = await fetchAllNews()
    if (newsItems.length === 0) {
      return NextResponse.json({ count: 0, message: 'No news found' })
    }

    const rejected = await readData<{ topic: string }>(FILES.REJECTED_TOPICS)
    const rejectedTopics = rejected.map(r => r.topic)

    const existing = await readData<Article>(FILES.ARTICLES_QUEUE)
    const existingTitles = new Set(existing.map(a => a.title.slice(0, 35).toLowerCase()))

    const selected = newsItems
      .filter(n => n.title.length > 20 && !existingTitles.has(n.title.slice(0, 35).toLowerCase()))
      .slice(0, 6)

    let count = 0
    const errors: string[] = []

    for (const item of selected.slice(0, 3)) {
      try {
        const raw = `Titre: ${item.title}\nDescription: ${item.description}\nSource: ${item.source} (${item.lang})\nLien: ${item.link}`
        let generated

        try {
          generated = await generateNewsLabArticle(raw, rejectedTopics)
        } catch (aiError) {
          // Clean fallback: use guessed category
          const catGuess = guessCategory(item.title, item.description)
          generated = {
            tag: catGuess,
            title: item.title,
            excerpt: item.description.slice(0, 180),
            content: `<h1>${item.title}</h1><p>${item.description}</p><p>Source : <a href="${item.link}" target="_blank">${item.source}</a></p>`,
          }
          errors.push(`AI fallback: ${String(aiError).slice(0, 80)}`)
        }

        const titleKey = generated.title.slice(0, 35).toLowerCase()
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
        errors.push(String(e).slice(0, 100))
      }
    }

    return NextResponse.json({ count, errors: errors.length > 0 ? errors : undefined })
  } catch (e) {
    return NextResponse.json({ error: String(e), count: 0 }, { status: 500 })
  }
}
