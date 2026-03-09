import { NextRequest, NextResponse } from 'next/server'
import { readData, FILES } from '@/lib/github'
import type { Lead } from '@/lib/types'

// Called by Vercel Cron every 6 hours
// Checks for leads that need follow-up emails (J+2 and J+7)
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const leads = await readData<Lead>(FILES.LEADS)
    const now = new Date()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const toSend: { lead: Lead; mailNumber: number }[] = []

    for (const lead of leads) {
      if (!lead.lastContact) continue
      if (['réponse', 'converti', 'stop'].includes(lead.status)) continue

      const lastContact = new Date(lead.lastContact)
      const daysSince = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))

      if (lead.status === 'mail1_envoyé' && daysSince >= 2) {
        toSend.push({ lead, mailNumber: 2 })
      } else if (lead.status === 'mail2_envoyé' && daysSince >= 5) {
        toSend.push({ lead, mailNumber: 3 })
      }
    }

    let sent = 0
    for (const { lead, mailNumber } of toSend.slice(0, 10)) {
      try {
        await fetch(`${baseUrl}/api/arsenal/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: lead.id, mailNumber }),
        })
        sent++
      } catch (e) {
        console.error(`Cron email error for ${lead.email}:`, e)
      }
    }

    return NextResponse.json({ checked: leads.length, sent })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
