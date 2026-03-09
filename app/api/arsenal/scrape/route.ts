import { NextRequest, NextResponse } from 'next/server'
import { scrapeLocksmiths } from '@/lib/outscraper'
import { readData, upsertItem, FILES } from '@/lib/github'
import type { Lead } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { city = 'Paris', limit = 10 } = await req.json()

    // Get existing leads to avoid duplicates
    const existingLeads = await readData<Lead>(FILES.LEADS)
    const existingEmails = new Set(existingLeads.map(l => l.email.toLowerCase()))

    // Scrape
    const businesses = await scrapeLocksmiths(city, limit)

    let added = 0
    for (const biz of businesses) {
      // Accept leads with email OR phone — skip only if absolutely no contact info
      if (!biz.email && !biz.phone) continue
      const emailKey = (biz.email || biz.phone || '').toLowerCase()
      if (existingEmails.has(emailKey)) continue

      const lead: Lead = {
        id: randomUUID(),
        name: biz.name,
        email: biz.email || `noemail-${Date.now()}@placeholder.invalid`,
        phone: biz.phone || undefined,
        city: biz.city,
        dept: biz.dept,
        address: biz.address || undefined,
        rating: biz.rating || undefined,
        reviews: biz.reviews || undefined,
        status: 'nouveau',
        date: new Date().toLocaleDateString('fr-FR'),
        mailsSent: 0,
      }

      await upsertItem<Lead>(FILES.LEADS, lead)
      existingEmails.add(emailKey)
      added++
    }

    return NextResponse.json({ found: businesses.length, added })
  } catch (e) {
    console.error('Scrape error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
