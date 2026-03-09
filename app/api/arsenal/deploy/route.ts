import { NextRequest, NextResponse } from 'next/server'
import { readData, updateItem, FILES } from '@/lib/github'
import { generateLandingPageHTML } from '@/lib/ai'
import { buildLocksmithLandingHTML, deployToVercel } from '@/lib/vercel-deploy'
import { buildLocksmithEmail, sendEmail } from '@/lib/email'
import type { Lead } from '@/lib/types'

const STATUS_MAP: Record<number, Lead['status']> = {
  1: 'mail1_envoyé',
  2: 'mail2_envoyé',
  3: 'mail3_envoyé',
}

export async function POST(req: NextRequest) {
  try {
    const { leadId, mailNumber = 1 } = await req.json()

    const leads = await readData<Lead>(FILES.LEADS)
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    // Generate landing page if not exists
    let landingUrl = lead.landingUrl
    if (!landingUrl) {
      // Try AI-generated HTML first, fallback to template
      let html: string
      try {
        html = await generateLandingPageHTML({
          name: lead.name,
          city: lead.city,
          phone: lead.phone,
          address: lead.address,
          rating: lead.rating,
          reviews: lead.reviews,
        })
      } catch {
        // Fallback to static template
        html = buildLocksmithLandingHTML({
          name: lead.name,
          city: lead.city,
          phone: lead.phone,
          address: lead.address,
          rating: lead.rating,
          reviews: lead.reviews,
        })
      }

      const projectName = `serrurier-${lead.name}-${lead.city}`
      landingUrl = await deployToVercel(projectName, html)
    }

    // Build email
    const { subject, html: emailHtml } = buildLocksmithEmail({
      name: lead.name,
      city: lead.city,
      landingUrl,
      mailNumber,
    })

    // Send email
    if (!lead.email) throw new Error('Pas d\'email pour ce lead')
    await sendEmail({ to: lead.email, subject, html: emailHtml })

    // Update lead
    await updateItem<Lead>(FILES.LEADS, leadId, {
      status: STATUS_MAP[mailNumber] || 'mail1_envoyé',
      landingUrl,
      mailsSent: (lead.mailsSent || 0) + 1,
      lastContact: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, landingUrl })
  } catch (e) {
    console.error('Deploy error:', e)
    return NextResponse.json({ error: String(e), success: false }, { status: 500 })
  }
}
