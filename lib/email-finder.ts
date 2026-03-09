/**
 * Email Finder — trouve les emails des serruriers sans API payante
 * Stratégies : Pages Jaunes → site web direct → Google search pattern
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

function extractEmails(html: string): string[] {
  const found = html.match(EMAIL_REGEX) || []
  return Array.from(new Set(found)).filter(e =>
    !e.includes('example') &&
    !e.includes('test@') &&
    !e.includes('placeholder') &&
    !e.includes('sentry') &&
    !e.includes('noreply') &&
    !e.includes('wordpress') &&
    !e.includes('wix') &&
    e.length < 80
  )
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,*/*',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

// Strategy 1: Pages Jaunes search
async function searchPagesJaunes(name: string, city: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${name} ${city}`)
    const html = await fetchPage(`https://www.pagesjaunes.fr/pagesblanches/recherche?quoiqui=${query}`)
    const emails = extractEmails(html)
    return emails[0] || null
  } catch {
    return null
  }
}

// Strategy 2: Scrape business website for email
async function scrapeWebsiteEmail(website: string): Promise<string | null> {
  if (!website) return null
  try {
    // Try homepage
    const html = await fetchPage(website)
    let emails = extractEmails(html)
    if (emails.length > 0) return emails[0]

    // Try /contact page
    const base = website.replace(/\/$/, '')
    try {
      const contactHtml = await fetchPage(`${base}/contact`)
      emails = extractEmails(contactHtml)
      if (emails.length > 0) return emails[0]
    } catch { /* no contact page */ }

    return null
  } catch {
    return null
  }
}

// Strategy 3: Google search for email
async function googleSearchEmail(name: string, city: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`"${name}" "${city}" serrurier email contact`)
    const html = await fetchPage(`https://www.google.com/search?q=${query}&num=5&hl=fr`)
    const emails = extractEmails(html)
    return emails[0] || null
  } catch {
    return null
  }
}

// Strategy 4: Annuaire-gratuit.net
async function searchAnnuaire(name: string, city: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`serrurier ${city}`)
    const html = await fetchPage(`https://www.annuaire-inverse.net/recherche/?q=${query}`)
    const emails = extractEmails(html)
    return emails[0] || null
  } catch {
    return null
  }
}

// Strategy 5: Societe.com / Infogreffe (emails in business registries)
async function searchSociete(name: string, city: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${name} ${city}`)
    const html = await fetchPage(`https://www.societe.com/cgi-bin/search?champs=${query}`)
    const emails = extractEmails(html)
    return emails[0] || null
  } catch {
    return null
  }
}

/**
 * Main function — tries all strategies in order, returns first email found
 */
export async function findEmail(params: {
  name: string
  city: string
  website?: string | null
}): Promise<string | null> {
  // Strategy 1: Scrape their website if they have one
  if (params.website) {
    const email = await scrapeWebsiteEmail(params.website)
    if (email) return email
  }

  // Strategy 2: Pages Jaunes
  const pjEmail = await searchPagesJaunes(params.name, params.city)
  if (pjEmail) return pjEmail

  // Strategy 3: Societe.com
  const societeEmail = await searchSociete(params.name, params.city)
  if (societeEmail) return societeEmail

  // Strategy 4: Annuaire search
  const annuaireEmail = await searchAnnuaire(params.name, params.city)
  if (annuaireEmail) return annuaireEmail

  // Strategy 5: Google (last resort)
  const googleEmail = await googleSearchEmail(params.name, params.city)
  if (googleEmail) return googleEmail

  return null
}

/**
 * Enrich multiple leads with emails in parallel (max 5 concurrent)
 */
export async function enrichLeadsWithEmails(leads: Array<{
  name: string
  city: string
  website?: string | null
}>): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>()
  const BATCH = 5

  for (let i = 0; i < leads.length; i += BATCH) {
    const batch = leads.slice(i, i + BATCH)
    const found = await Promise.allSettled(
      batch.map(l => findEmail(l))
    )
    found.forEach((r, idx) => {
      const key = `${batch[idx].name}__${batch[idx].city}`
      results.set(key, r.status === 'fulfilled' ? r.value : null)
    })
    // Small delay between batches
    if (i + BATCH < leads.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return results
}
