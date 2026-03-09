/**
 * Email Finder v2 — Trouve les emails des serruriers
 * Stratégies par ordre d'efficacité :
 * 1. mailto: links dans le site web (99% fiable)
 * 2. Scraping agressif du site (5 pages)
 * 3. Devinette email depuis le domaine (contact@, info@...)
 * 4. Pages Jaunes (bon URL)
 * 5. Kompass.com (B2B directory)
 * 6. Yelp / Tripadvisor
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const MAILTO_REGEX = /href=["']mailto:([^"'?\s]+)/gi

const BAD_EMAIL_DOMAINS = [
  'example', 'test', 'placeholder', 'sentry', 'noreply', 'no-reply',
  'wordpress', 'wix', 'squarespace', 'shopify', 'mailchimp', 'sendgrid',
  'google', 'facebook', 'twitter', 'instagram', 'linkedin', 'amazon',
  'apple', 'microsoft', 'adobe', 'cloudflare', 'jquery', 'bootstrap',
]

function extractEmails(html: string): string[] {
  const emails = new Set<string>()

  // Priority: extract mailto: links first (most reliable)
  let m: RegExpExecArray | null
  const mailtoRe = /href=["']mailto:([^"'?\s&]+)/gi
  while ((m = mailtoRe.exec(html)) !== null) {
    emails.add(m[1].toLowerCase().trim())
  }

  // Fallback: regex scan for any email pattern
  const found = html.match(EMAIL_REGEX) || []
  for (const e of found) emails.add(e.toLowerCase().trim())

  return Array.from(emails).filter(e =>
    e.includes('@') &&
    e.includes('.') &&
    e.length < 80 &&
    e.length > 6 &&
    !BAD_EMAIL_DOMAINS.some(bad => e.includes(bad))
  )
}

async function fetchPage(url: string, timeout = 8000): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
      'Cache-Control': 'no-cache',
    },
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

// Get domain from website URL
function getDomain(website: string): string | null {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`)
    return url.hostname.replace('www.', '')
  } catch {
    return null
  }
}

// Strategy 1: Scrape business website aggressively (5 pages + mailto: detection)
async function scrapeWebsiteEmail(website: string): Promise<string | null> {
  if (!website) return null
  const base = website.replace(/\/$/, '').replace(/^(?!https?)/, 'https://')
  const domain = getDomain(base)

  const pages = [
    base,
    `${base}/contact`,
    `${base}/nous-contacter`,
    `${base}/contactez-nous`,
    `${base}/a-propos`,
    `${base}/contact.html`,
    `${base}/contact.php`,
  ]

  for (const page of pages) {
    try {
      const html = await fetchPage(page, 6000)
      const emails = extractEmails(html)
      // Filter: prefer emails from the same domain
      const domainEmails = domain ? emails.filter(e => e.includes(domain)) : []
      if (domainEmails.length > 0) return domainEmails[0]
      if (emails.length > 0) return emails[0]
    } catch {
      // Page not found, continue
    }
  }
  return null
}

// Strategy 2: Guess email from domain (contact@, info@, bonjour@...)
async function guessEmailFromDomain(website: string): Promise<string | null> {
  const domain = getDomain(website)
  if (!domain) return null

  const candidates = [
    `contact@${domain}`,
    `info@${domain}`,
    `bonjour@${domain}`,
    `serrurier@${domain}`,
    `devis@${domain}`,
    `pro@${domain}`,
  ]

  // We can't verify without sending, so return most likely candidate
  // Return contact@ as it's the most common for French businesses
  return `contact@${domain}`
}

// Strategy 3: Pages Jaunes (good URL for businesses)
async function searchPagesJaunes(name: string, city: string): Promise<string | null> {
  try {
    const what = encodeURIComponent('serrurier')
    const where = encodeURIComponent(city)
    // Use the correct search URL for businesses
    const html = await fetchPage(
      `https://www.pagesjaunes.fr/pagejaunes/chercherlespros?quoiqui=${what}&ou=${where}&proximite=1`,
      8000
    )
    const emails = extractEmails(html)
    if (emails.length > 0) return emails[0]

    // Also try searching by business name
    const nameQuery = encodeURIComponent(name)
    const html2 = await fetchPage(
      `https://www.pagesjaunes.fr/pagejaunes/chercherlespros?quoiqui=${nameQuery}&ou=${where}`,
      8000
    )
    const emails2 = extractEmails(html2)
    return emails2[0] || null
  } catch {
    return null
  }
}

// Strategy 4: Kompass — B2B directory with business emails
async function searchKompass(name: string, city: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${name} ${city} serrurier`)
    const html = await fetchPage(`https://fr.kompass.com/searchCompany?text=${query}`, 8000)
    const emails = extractEmails(html)
    return emails[0] || null
  } catch {
    return null
  }
}

// Strategy 5: Verif.com — registre commercial français
async function searchVerif(name: string, city: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${name} ${city}`)
    const html = await fetchPage(`https://www.verif.com/recherche/${query}/`, 8000)
    const emails = extractEmails(html)
    return emails[0] || null
  } catch {
    return null
  }
}

// Strategy 6: Yelp France
async function searchYelp(name: string, city: string): Promise<string | null> {
  try {
    const find = encodeURIComponent(name)
    const loc = encodeURIComponent(city)
    const html = await fetchPage(
      `https://www.yelp.fr/search?find_desc=${find}&find_loc=${loc}`,
      8000
    )
    const emails = extractEmails(html)
    return emails[0] || null
  } catch {
    return null
  }
}

// Strategy 7: Google search for email (last resort)
async function googleSearchEmail(name: string, city: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`serrurier "${name}" "${city}" email contact @`)
    const html = await fetchPage(
      `https://www.google.com/search?q=${query}&num=10&hl=fr`,
      10000
    )
    const emails = extractEmails(html)
    // Filter out Google-owned domains
    const clean = emails.filter(e =>
      !e.includes('google') && !e.includes('gstatic') && !e.includes('schema.org')
    )
    return clean[0] || null
  } catch {
    return null
  }
}

/**
 * Main — essaie toutes les stratégies dans l'ordre
 * Retourne le meilleur email trouvé ou un guess @domain si website disponible
 */
export async function findEmail(params: {
  name: string
  city: string
  website?: string | null
}): Promise<string | null> {
  // 1. Si site web : scraping agressif (toutes les pages de contact)
  if (params.website) {
    const siteEmail = await scrapeWebsiteEmail(params.website)
    if (siteEmail) return siteEmail
  }

  // Run strategies in parallel for speed
  const [pjEmail, kompassEmail, verifEmail] = await Promise.allSettled([
    searchPagesJaunes(params.name, params.city),
    searchKompass(params.name, params.city),
    searchVerif(params.name, params.city),
  ])

  if (pjEmail.status === 'fulfilled' && pjEmail.value) return pjEmail.value
  if (kompassEmail.status === 'fulfilled' && kompassEmail.value) return kompassEmail.value
  if (verifEmail.status === 'fulfilled' && verifEmail.value) return verifEmail.value

  // 4. Yelp + Google en parallèle
  const [yelpEmail, googleEmail] = await Promise.allSettled([
    searchYelp(params.name, params.city),
    googleSearchEmail(params.name, params.city),
  ])

  if (yelpEmail.status === 'fulfilled' && yelpEmail.value) return yelpEmail.value
  if (googleEmail.status === 'fulfilled' && googleEmail.value) return googleEmail.value

  // 5. Dernier recours : devinette depuis le domaine du site
  if (params.website) {
    return guessEmailFromDomain(params.website)
  }

  return null
}

/**
 * Enrichit une liste de leads avec emails (max 3 concurrent, avec délai)
 */
export async function enrichLeadsWithEmails(leads: Array<{
  name: string
  city: string
  website?: string | null
}>): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>()
  const BATCH = 3 // Reduced to avoid rate limiting

  for (let i = 0; i < leads.length; i += BATCH) {
    const batch = leads.slice(i, i + BATCH)
    const found = await Promise.allSettled(batch.map(l => findEmail(l)))
    found.forEach((r, idx) => {
      const key = `${batch[idx].name}__${batch[idx].city}`
      results.set(key, r.status === 'fulfilled' ? r.value : null)
    })
    if (i + BATCH < leads.length) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  return results
}
