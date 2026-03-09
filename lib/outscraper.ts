const OUTSCRAPER_KEY = process.env.OUTSCRAPER_API_KEY

const CITIES_FRANCE = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg',
  'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre',
  'Saint-Etienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes',
  'Villeurbanne', 'Le Mans', 'Clermont-Ferrand', 'Brest', 'Tours',
  'Amiens', 'Limoges', 'Perpignan', 'Metz', 'Besançon', 'Caen',
  'Orléans', 'Mulhouse', 'Rouen', 'Boulogne-Billancourt', 'Nancy',
]

export interface ScrapedBusiness {
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string
  dept: string
  website: string | null
  rating: number | null
  reviews: number | null
}

export async function scrapeLocksmiths(
  city: string,
  limit = 20
): Promise<ScrapedBusiness[]> {
  const query = `serrurier ${city}`

  const url = new URL('https://api.outscraper.com/maps/search-v2')
  url.searchParams.set('query', query)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('skip_places_with_website', 'true')
  url.searchParams.set('async', 'false')

  const res = await fetch(url.toString(), {
    headers: { 'X-API-KEY': OUTSCRAPER_KEY! },
  })

  if (!res.ok) throw new Error(`Outscraper error: ${res.status}`)

  const data = await res.json()
  const results = data.data || []

  return results
    .filter((r: Record<string, unknown>) => r.name)
    .map((r: Record<string, string | number | string[]>) => {
      // Extract first email from emails array
      const emails = Array.isArray(r.emails) ? r.emails : []
      const emailStr = emails[0] || null

      const postalCode = String(r.postal_code || '')
      const dept = postalCode.slice(0, 2) || city.slice(0, 2)

      return {
        name: String(r.name || ''),
        email: typeof emailStr === 'string' ? emailStr : null,
        phone: typeof r.phone === 'string' ? r.phone : null,
        address: typeof r.full_address === 'string' ? r.full_address : null,
        city: typeof r.city === 'string' ? r.city : city,
        dept,
        website: typeof r.site === 'string' ? r.site : null,
        rating: typeof r.reviews_score === 'number' ? r.reviews_score : null,
        reviews: typeof r.reviews === 'number' ? r.reviews : null,
      }
    })
}

export async function scrapeAllFrance(
  citiesCount = 5,
  limitPerCity = 10
): Promise<ScrapedBusiness[]> {
  const cities = CITIES_FRANCE.slice(0, citiesCount)
  const results: ScrapedBusiness[] = []

  for (const city of cities) {
    try {
      const businesses = await scrapeLocksmiths(city, limitPerCity)
      // Only include those WITHOUT website but WITH email
      const filtered = businesses.filter((b) => !b.website && b.email)
      results.push(...filtered)
      // Rate limit
      await new Promise((r) => setTimeout(r, 500))
    } catch (e) {
      console.error(`Scrape error for ${city}:`, e)
    }
  }

  return results
}
