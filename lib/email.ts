import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'enix.lab.ai@gmail.com',
    pass: process.env.GMAIL_APP_PASS,
  },
})

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  return transporter.sendMail({
    from: options.from || `ENIX LAB® <${process.env.GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}

export function buildLocksmithEmail(params: {
  name: string
  city: string
  landingUrl: string
  mailNumber: number
  htmlBody?: string
}): { subject: string; html: string } {
  const subjects: Record<number, string> = {
    1: `⚡ ${params.name} — Votre site internet est prêt. Il vous attend.`,
    2: `${params.name} — Votre concurrent vient de se lancer en ligne.`,
    3: `🚨 DERNIÈRE CHANCE : Site + Offre exclusive 500€ — ${params.name}`,
  }

  const defaultHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#000;color:#fff;padding:0;">
  <div style="background:linear-gradient(135deg,#0047FF,#00FFFF);padding:2px;">
    <div style="background:#000;padding:32px;">
      <h1 style="color:#0047FF;font-size:28px;margin:0;letter-spacing:2px;">⚡ ENIX LAB®</h1>
      <p style="color:#ffffff55;font-size:12px;margin:4px 0 0;letter-spacing:3px;">DIGITAL BLACK OPS AGENCY</p>
    </div>
  </div>

  <div style="padding:32px;">
    <h2 style="color:#fff;font-size:20px;">Bonjour <strong style="color:#0047FF">${params.name}</strong>,</h2>

    <p style="color:#ffffffcc;line-height:1.7;">
      Nous avons analysé votre présence en ligne à <strong>${params.city}</strong>.<br>
      Constat : <strong style="color:#FF3300">vous n'avez pas de site internet.</strong><br>
      Pendant ce temps, vos concurrents captent vos clients en ligne — chaque jour.
    </p>

    <p style="color:#ffffffcc;line-height:1.7;">
      <strong>Nous avons pris les devants.</strong><br>
      Votre site professionnel est déjà créé et en ligne.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${params.landingUrl}" style="background:#FF3300;color:#fff;padding:18px 36px;text-decoration:none;border-radius:4px;font-weight:bold;font-size:18px;display:inline-block;letter-spacing:1px;">
        → Voir mon site maintenant
      </a>
    </div>

    <p style="color:#ffffffaa;">
      Pour activer ce site avec votre domaine et vos données personnalisées,<br>
      <strong style="color:#0047FF">répondez simplement à cet email.</strong>
    </p>

    <p style="color:#ffffff55;font-size:13px;margin-top:24px;">
      Cette offre est limitée dans le temps. Nous proposons ce service à un seul serrurier par ville.
    </p>
  </div>

  <div style="padding:16px 32px;border-top:1px solid #0047FF22;">
    <p style="color:#ffffff33;font-size:11px;margin:0;">ENIX LAB® — enix.lab.ai@gmail.com | enix-lab.com</p>
    <p style="color:#ffffff33;font-size:11px;margin:4px 0 0;">Pour vous désabonner, répondez "STOP".</p>
  </div>
</div>`

  return {
    subject: subjects[params.mailNumber] || subjects[1],
    html: params.htmlBody || defaultHtml,
  }
}
