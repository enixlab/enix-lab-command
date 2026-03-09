import { NextResponse } from 'next/server'
import { readData, updateItem, FILES } from '@/lib/github'
import { findEmail } from '@/lib/email-finder'
import type { Lead } from '@/lib/types'

export async function POST() {
  try {
    const leads = await readData<Lead>(FILES.LEADS)
    const withoutEmail = leads.filter(l => !l.email)

    if (withoutEmail.length === 0) {
      return NextResponse.json({ enriched: 0, message: 'Tous les leads ont déjà un email' })
    }

    let enriched = 0
    const results: { name: string; email: string | null }[] = []

    // Process in batches of 3 to avoid rate limiting
    const BATCH = 3
    for (let i = 0; i < withoutEmail.length; i += BATCH) {
      const batch = withoutEmail.slice(i, i + BATCH)

      const found = await Promise.allSettled(
        batch.map(l => findEmail({ name: l.name, city: l.city, website: l.website }))
      )

      for (let j = 0; j < batch.length; j++) {
        const lead = batch[j]
        const result = found[j]
        const email = result.status === 'fulfilled' ? result.value : null

        if (email) {
          await updateItem<Lead>(FILES.LEADS, lead.id, { email })
          enriched++
        }
        results.push({ name: lead.name, email })
      }

      // Delay between batches to avoid rate limiting
      if (i + BATCH < withoutEmail.length) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    return NextResponse.json({
      total: withoutEmail.length,
      enriched,
      results,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
