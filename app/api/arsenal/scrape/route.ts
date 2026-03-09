import { NextRequest, NextResponse } from 'next/server'
import { scrapeLocksmiths } from '@/lib/outscraper'
import { readData, upsertItem, updateItem, FILES } from '@/lib/github'
import { deployToVercel, buildLocksmithLandingHTML } from '@/lib/vercel-deploy'
import { sendEmail, buildLocksmithEmail } from '@/lib/email'
import type { Lead } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { city = 'Paris', limit = 10 } = await req.json()

    const existingLeads = await readData<Lead>(FILES.LEADS)
    const existingKeys = new Set(existingLeads.map(l => (l.email + l.name).toLowerCase()))

    const businesses = await scrapeLocksmiths(city, limit)

    let added = 0
    let landingDeployed = 0
    let emailsSent = 0
    const results: { name: string; landingUrl?: string; emailSent: boolean }[] = []

    for (const biz of businesses) {
      if (!biz.email && !biz.phone) continue
      const key = ((biz.email || '') + biz.name).toLowerCase()
      if (existingKeys.has(key)) continue

      // 1. Save lead to GitHub
      const leadId = randomUUID()
      const lead: Lead = {
        id: leadId,
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
      existingKeys.add(key)
      added++

      let landingUrl: string | undefined
      let emailSent = false

      // 2. Generate & deploy landing page
      try {
        const html = buildLocksmithLandingHTML({
          name: biz.name,
          city: biz.city,
          phone: biz.phone,
          address: biz.address,
          rating: biz.rating,
          reviews: biz.reviews,
        })
        landingUrl = await deployToVercel(`serrurier-${biz.name.replace(/\s+/g, '-').toLowerCase()}-${biz.city.toLowerCase()}`, html)
        await updateItem<Lead>(FILES.LEADS, leadId, {
          landingUrl,
          status: 'nouveau',
        })
        landingDeployed++
      } catch (deployErr) {
        console.error('Deploy error for', biz.name, deployErr)
      }

      // 3. Send first email if real email and landing page deployed
      if (biz.email && !biz.email.includes('placeholder') && landingUrl) {
        try {
          const emailData = buildLocksmithEmail({
            name: biz.name,
            city: biz.city,
            landingUrl,
            mailNumber: 1,
          })
          await sendEmail({
            to: biz.email,
            subject: emailData.subject,
            html: emailData.html,
          })
          await updateItem<Lead>(FILES.LEADS, leadId, {
            status: 'mail1_envoyé',
            mailsSent: 1,
            lastContact: new Date().toISOString(),
          })
          emailSent = true
          emailsSent++
        } catch (emailErr) {
          console.error('Email error for', biz.name, emailErr)
        }
      }

      results.push({ name: biz.name, landingUrl, emailSent })
    }

    return NextResponse.json({
      found: businesses.length,
      added,
      landingDeployed,
      emailsSent,
      results,
    })
  } catch (e) {
    console.error('Scrape error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
