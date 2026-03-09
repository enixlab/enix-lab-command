import { NextRequest, NextResponse } from 'next/server'
import { scrapeLocksmiths } from '@/lib/outscraper'
import { readData, upsertItem, updateItem, FILES } from '@/lib/github'
import { deployToVercel, buildLocksmithLandingHTML } from '@/lib/vercel-deploy'
import { sendEmail, buildLocksmithEmail } from '@/lib/email'
import { findEmail } from '@/lib/email-finder'
import type { Lead } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { city = 'Paris', limit = 10 } = await req.json()

    const existingLeads = await readData<Lead>(FILES.LEADS)
    const existingKeys = new Set(existingLeads.map(l => l.name.toLowerCase() + l.city.toLowerCase()))

    const businesses = await scrapeLocksmiths(city, limit)

    let added = 0
    let emailsFound = 0
    let landingDeployed = 0
    let emailsSent = 0
    const results: { name: string; email?: string; landingUrl?: string; emailSent: boolean }[] = []

    for (const biz of businesses) {
      if (!biz.phone && !biz.email && !biz.address) continue
      const key = biz.name.toLowerCase() + biz.city.toLowerCase()
      if (existingKeys.has(key)) continue

      // 1. Try to find email if Outscraper didn't return one
      let email = biz.email || null
      if (!email) {
        try {
          email = await findEmail({
            name: biz.name,
            city: biz.city,
            website: biz.website,
          })
          if (email) emailsFound++
        } catch {
          email = null
        }
      }

      // 2. Save lead
      const leadId = randomUUID()
      const lead: Lead = {
        id: leadId,
        name: biz.name,
        email: email || undefined,
        phone: biz.phone || undefined,
        city: biz.city,
        dept: biz.dept,
        address: biz.address || undefined,
        website: biz.website || undefined,
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

      // 3. Generate & deploy landing page
      try {
        const html = buildLocksmithLandingHTML({
          name: biz.name,
          city: biz.city,
          phone: biz.phone || undefined,
          address: biz.address || undefined,
          rating: biz.rating || undefined,
          reviews: biz.reviews || undefined,
        })
        const safeName = biz.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)
        landingUrl = await deployToVercel(`serrurier-${safeName}-${biz.city.toLowerCase().replace(/\s+/g, '-')}`, html)
        await updateItem<Lead>(FILES.LEADS, leadId, { landingUrl })
        landingDeployed++
      } catch (deployErr) {
        console.error('Deploy error:', biz.name, deployErr)
      }

      // 4. Send first email automatically if email found + landing deployed
      if (email && landingUrl) {
        try {
          const emailData = buildLocksmithEmail({
            name: biz.name,
            city: biz.city,
            landingUrl,
            mailNumber: 1,
          })
          await sendEmail({ to: email, subject: emailData.subject, html: emailData.html })
          await updateItem<Lead>(FILES.LEADS, leadId, {
            status: 'mail1_envoyé',
            mailsSent: 1,
            lastContact: new Date().toISOString(),
          })
          emailSent = true
          emailsSent++
        } catch (emailErr) {
          console.error('Email error:', biz.name, emailErr)
        }
      }

      results.push({ name: biz.name, email: email || undefined, landingUrl, emailSent })
    }

    return NextResponse.json({
      found: businesses.length,
      added,
      emailsFound,
      landingDeployed,
      emailsSent,
      results,
    })
  } catch (e) {
    console.error('Scrape error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
