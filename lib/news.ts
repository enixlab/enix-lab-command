import { XMLParser } from 'fast-xml-parser'
import type { NewsItem } from './types'

const parser = new XMLParser({ ignoreAttributes: false })

const RSS_SOURCES = [
  { url: 'https://news.google.com/rss/search?q=bad+buzz+marketing+2026&hl=fr&gl=FR&ceid=FR:fr', lang: 'FR', category: 'BAD BUZZ' },
  { url: 'https://news.google.com/rss/search?q=intelligence+artificielle+marketing&hl=fr&gl=FR&ceid=FR:fr', lang: 'FR', category: 'IA AGENTIQUE' },
  { url: 'https://news.google.com/rss/search?q=startup+scandale+france&hl=fr&gl=FR&ceid=FR:fr', lang: 'FR', category: 'TECH-CRASH' },
  { url: 'https://news.google.com/rss/search?q=crypto+hack+scandal+2026&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'CRYPTO-GUÉRILLA' },
  { url: 'https://news.google.com/rss/search?q=AI+marketing+disruption+2026&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'IA AGENTIQUE' },
  { url: 'https://news.google.com/rss/search?q=social+media+fail+brand&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'BAD BUZZ' },
  { url: 'https://news.google.com/rss/search?q=tech+company+crash+layoffs&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'TECH-CRASH' },
  { url: 'https://news.google.com/rss/search?q=marketing+digital+europe&hl=fr&gl=BE&ceid=BE:fr', lang: 'EU', category: 'MARKETING-LAB' },
  { url: 'https://news.google.com/rss/search?q=reseaux+sociaux+tendance&hl=fr&gl=CH&ceid=CH:fr', lang: 'CH', category: 'SOCIAL-MEDIA' },
  { url: 'https://news.google.com/rss/search?q=ecommerce+disruption+2026&hl=en&gl=GB&ceid=GB:en', lang: 'EU', category: 'E-COMMERCE' },
]

async function fetchRSS(url: string, lang: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'EnixLabBot/1.0' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const parsed = parser.parse(xml)
    const items = parsed?.rss?.channel?.item || []
    const arr = Array.isArray(items) ? items : [items]
    return arr.slice(0, 6).map((a: Record<string, string>) => ({
      title: a.title || '',
      description: String(a.description || a.summary || '').replace(/<[^>]+>/g, '').slice(0, 300),
      link: a.link || '',
      source: 'Google News',
      lang,
      pubDate: a.pubDate || new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
    const ids: number[] = await res.json()
    const top = ids.slice(0, 25)
    const stories = await Promise.all(
      top.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())
      )
    )
    return stories
      .filter((s) => s?.title && s?.score > 80 && s?.url)
      .slice(0, 8)
      .map((s) => ({
        title: s.title,
        description: `${s.score} points | ${s.descendants || 0} comments | HN`,
        link: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        source: 'HackerNews',
        lang: 'US',
        pubDate: new Date(s.time * 1000).toISOString(),
      }))
  } catch {
    return []
  }
}

async function fetchReddit(): Promise<NewsItem[]> {
  try {
    const subreddits = ['marketing', 'technology', 'entrepreneur', 'cryptocurrency', 'socialmedia']
    const results: NewsItem[] = []
    for (const sub of subreddits.slice(0, 3)) {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=10`, {
        headers: { 'User-Agent': 'EnixLabBot/1.0' },
      })
      const data = await res.json()
      const posts = data?.data?.children || []
      for (const post of posts.slice(0, 4)) {
        const d = post.data
        if (d.score > 500) {
          results.push({
            title: d.title,
            description: (d.selftext || '').slice(0, 200) || `r/${sub} | ${d.score} upvotes`,
            link: `https://reddit.com${d.permalink}`,
            source: `Reddit r/${sub}`,
            lang: 'US',
            pubDate: new Date(d.created_utc * 1000).toISOString(),
          })
        }
      }
    }
    return results
  } catch {
    return []
  }
}

async function fetchDevTo(): Promise<NewsItem[]> {
  try {
    const tags = ['ai', 'marketing', 'webdev', 'startup']
    const results: NewsItem[] = []
    for (const tag of tags.slice(0, 2)) {
      const res = await fetch(`https://dev.to/api/articles?tag=${tag}&per_page=5&top=7`)
      const articles = await res.json()
      for (const a of (Array.isArray(articles) ? articles : []).slice(0, 3)) {
        results.push({
          title: a.title,
          description: a.description || '',
          link: a.url,
          source: 'Dev.to',
          lang: 'US',
          pubDate: a.published_at,
        })
      }
    }
    return results
  } catch {
    return []
  }
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled([
    ...RSS_SOURCES.map((s) => fetchRSS(s.url, s.lang)),
    fetchHackerNews(),
    fetchReddit(),
    fetchDevTo(),
  ])

  const all: NewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  // Deduplicate by title similarity
  const seen = new Set<string>()
  return all.filter((item) => {
    const key = item.title.slice(0, 40).toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
