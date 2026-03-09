import { XMLParser } from 'fast-xml-parser'
import type { NewsItem } from './types'

const parser = new XMLParser({ ignoreAttributes: false })

const RSS_SOURCES = [
  // France
  { url: 'https://news.google.com/rss/search?q=intelligence+artificielle+entreprise&hl=fr&gl=FR&ceid=FR:fr', lang: 'FR', category: 'IA' },
  { url: 'https://news.google.com/rss/search?q=bad+buzz+marque+france+2026&hl=fr&gl=FR&ceid=FR:fr', lang: 'FR', category: 'Bad Buzz' },
  { url: 'https://news.google.com/rss/search?q=startup+licenciement+france&hl=fr&gl=FR&ceid=FR:fr', lang: 'FR', category: 'Emploi / IA' },
  { url: 'https://news.google.com/rss/search?q=marketing+digital+tendance+2026&hl=fr&gl=FR&ceid=FR:fr', lang: 'FR', category: 'Marketing' },
  { url: 'https://news.google.com/rss/search?q=ecommerce+france+strategy&hl=fr&gl=FR&ceid=FR:fr', lang: 'FR', category: 'Business' },
  { url: 'https://news.google.com/rss/search?q=crypto+bitcoin+france+regulation&hl=fr&gl=FR&ceid=FR:fr', lang: 'FR', category: 'Crypto' },
  // USA / English
  { url: 'https://news.google.com/rss/search?q=AI+artificial+intelligence+disruption+2026&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'IA' },
  { url: 'https://news.google.com/rss/search?q=crypto+hack+scandal+2026&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'Crypto' },
  { url: 'https://news.google.com/rss/search?q=social+media+brand+fail+2026&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'Bad Buzz' },
  { url: 'https://news.google.com/rss/search?q=tech+company+layoffs+AI+2026&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'Emploi / IA' },
  { url: 'https://news.google.com/rss/search?q=AI+security+breach+data+leak&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'IA / Sécurité' },
  { url: 'https://news.google.com/rss/search?q=startup+funding+valuation+2026&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'Business' },
  // UK
  { url: 'https://news.google.com/rss/search?q=ecommerce+disruption+retail+2026&hl=en&gl=GB&ceid=GB:en', lang: 'UK', category: 'Business' },
  { url: 'https://news.google.com/rss/search?q=marketing+agency+AI+disruption&hl=en&gl=GB&ceid=GB:en', lang: 'UK', category: 'Marketing' },
  // Suisse
  { url: 'https://news.google.com/rss/search?q=reseaux+sociaux+influence+tendance&hl=fr&gl=CH&ceid=CH:fr', lang: 'CH', category: 'Marketing' },
  // Crypto / Finance
  { url: 'https://news.google.com/rss/search?q=bitcoin+ethereum+altcoin+crash+2026&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'Crypto' },
  { url: 'https://news.google.com/rss/search?q=DeFi+Web3+regulation+2026&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'Crypto' },
  // Tech
  { url: 'https://news.google.com/rss/search?q=OpenAI+Anthropic+Google+DeepMind+2026&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'IA' },
  { url: 'https://news.google.com/rss/search?q=cybersecurity+breach+espionage+AI&hl=en&gl=US&ceid=US:en', lang: 'US', category: 'IA / Sécurité' },
]

const DIRECT_RSS = [
  { url: 'https://techcrunch.com/feed/', source: 'TechCrunch', lang: 'US', category: 'Tech' },
  { url: 'https://www.journaldunet.com/rss/', source: 'JDN', lang: 'FR', category: 'Business' },
  { url: 'https://siecledigital.fr/feed/', source: 'Siècle Digital', lang: 'FR', category: 'IA' },
  { url: 'https://www.01net.com/rss/actualites/', source: '01Net', lang: 'FR', category: 'Tech' },
  { url: 'https://decrypt.co/feed', source: 'Decrypt', lang: 'US', category: 'Crypto' },
]

async function fetchRSS(url: string, lang: string, source: string = 'Google News'): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'EnixLabBot/2.0' },
      next: { revalidate: 1800 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const parsed = parser.parse(xml)
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || []
    const arr = Array.isArray(items) ? items : [items]
    return arr.slice(0, 5).map((a: Record<string, string>) => ({
      title: String(a.title || '').replace(/<[^>]+>/g, '').trim(),
      description: String(a.description || a.summary || a.content || '').replace(/<[^>]+>/g, '').slice(0, 350),
      link: a.link || '',
      source,
      lang,
      pubDate: a.pubDate || a.updated || new Date().toISOString(),
    })).filter(i => i.title.length > 15)
  } catch {
    return []
  }
}

async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
    const ids: number[] = await res.json()
    const stories = await Promise.all(
      ids.slice(0, 30).map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())
      )
    )
    return stories
      .filter((s) => s?.title && s?.score > 100 && s?.url)
      .slice(0, 8)
      .map((s) => ({
        title: s.title,
        description: `${s.score} pts | ${s.descendants || 0} commentaires — ${s.url?.split('/')[2] || 'HN'}`,
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
  const subreddits = ['entrepreneur', 'marketing', 'technology', 'CryptoCurrency', 'AIPromptEngineering', 'MachineLearning', 'ecommerce', 'artificial']
  const results: NewsItem[] = []
  for (const sub of subreddits.slice(0, 5)) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=8`, {
        headers: { 'User-Agent': 'EnixLabBot/2.0' },
      })
      const data = await res.json()
      for (const post of (data?.data?.children || []).slice(0, 4)) {
        const d = post.data
        if (d.score > 300 && d.title && !d.is_self) {
          results.push({
            title: d.title,
            description: (d.selftext || '').slice(0, 200) || `r/${sub} — ${d.score} upvotes`,
            link: `https://reddit.com${d.permalink}`,
            source: `Reddit r/${sub}`,
            lang: 'US',
            pubDate: new Date(d.created_utc * 1000).toISOString(),
          })
        }
      }
    } catch { /* continue */ }
  }
  return results
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled([
    ...RSS_SOURCES.map((s) => fetchRSS(s.url, s.lang, 'Google News')),
    ...DIRECT_RSS.map((s) => fetchRSS(s.url, s.lang, s.source)),
    fetchHackerNews(),
    fetchReddit(),
  ])

  const all: NewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  // Sort by recency and deduplicate
  const seen = new Set<string>()
  return all
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .filter((item) => {
      const key = item.title.slice(0, 45).toLowerCase().replace(/\s+/g, ' ')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}
