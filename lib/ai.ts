const GEMINI_KEY = process.env.GEMINI_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const GROQ_KEY = process.env.GROQ_API_KEY

export async function generateContent(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  // Priority: Claude > Groq > Gemini
  if (ANTHROPIC_KEY) return generateWithClaude(prompt, systemPrompt)
  if (GROQ_KEY) return generateWithGroq(prompt, systemPrompt)
  return generateWithGemini(prompt)
}

async function generateWithGroq(prompt: string, system?: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system || NEWSLAB_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4096,
      temperature: 0.85,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Groq error')
  return data.choices[0].message.content
}

async function generateWithClaude(prompt: string, system?: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: system || NEWSLAB_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Claude error')
  return data.content[0].text
}

async function generateWithGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Gemini error')
  return data.candidates[0].content.parts[0].text
}

export const NEWSLAB_SYSTEM_PROMPT = `Tu es le rédacteur en chef de NewsLab by ENIX LAB.
Tu écris des articles de blog ultra-humains, avec des opinions tranchées, du relief, de l'émotion.
JAMAIS de formulations robotiques ou fades. TU PRENDS POSITION.
Ton style : Direct, provocateur, expert, avec de l'humour noir.
Structure obligatoire : Hook (imaginez la scène) → Analyse → Sections numérotées → Sondage Flash → Ressenti du Labo → Conclusion → BANGER DU JOUR.
Tags disponibles : IA AGENTIQUE | BAD BUZZ | TECH-CRASH | CRYPTO-GUÉRILLA | MARKETING-LAB | SOCIAL-MEDIA | E-COMMERCE`

export async function generateNewsLabArticle(rawInfo: string, rejectedTopics: string[] = []): Promise<{
  tag: string
  title: string
  excerpt: string
  content: string
}> {
  const rejectedContext = rejectedTopics.length > 0
    ? `\n\nSujets REJETÉS à éviter absolument : ${rejectedTopics.join(', ')}`
    : ''

  const prompt = `Génère un article NewsLab COMPLET et PERCUTANT basé sur cette info :
${rawInfo}
${rejectedContext}

Réponds en JSON strict avec cette structure :
{
  "tag": "IA AGENTIQUE",
  "title": "Titre avec emoji percutant",
  "excerpt": "Accroche de 150 chars max",
  "content": "HTML complet de l'article avec h1, h2, h3, p, blockquote, ul, hr"
}

RÈGLES : Ton ultra-humain. Jamais fade. Prise de position forte. Structure NewsLab complète. JSON uniquement.`

  const raw = await generateContent(prompt, NEWSLAB_SYSTEM_PROMPT)
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

export async function generateLandingPageHTML(business: {
  name: string
  city: string
  phone?: string
  address?: string
  rating?: number
  reviews?: number
}): Promise<string> {
  const prompt = `Génère une landing page HTML COMPLÈTE et PRO pour ce serrurier :
Nom : ${business.name}
Ville : ${business.city}
${business.phone ? `Téléphone : ${business.phone}` : ''}
${business.address ? `Adresse : ${business.address}` : ''}
${business.rating ? `Note : ${business.rating}/5 (${business.reviews} avis)` : ''}

STYLE : Urgence maximale. Fond sombre #0a0a0a. Rouge urgence #FF3300. Orange #FF6600.
Font : Oswald pour titres, Inter pour texte.
Éléments obligatoires : Banner urgence, Hero avec CTA téléphone, 3 services en grid, section compteur clients, footer avec signature "Site créé par ENIX LAB®".
Animation glow sur le bouton CTA. Responsive mobile.
Renvoie UNIQUEMENT le HTML complet, rien d'autre.`

  return generateContent(prompt, 'Tu es un expert développeur web spécialisé landing pages haute conversion.')
}

export async function generateEmailContent(lead: {
  name: string
  city: string
  landingUrl: string
  mailNumber: 1 | 2 | 3
}): Promise<{ subject: string; html: string }> {
  const contexts = {
    1: 'premier contact, ton professionnel mais direct, créer la curiosité et urgence',
    2: 'relance J+2, légèrement plus pressant, mentionner que la concurrence bouge',
    3: 'offre finale J+7 à 500€, dernière chance, FOMO maximal'
  }

  const prompt = `Génère un email de prospection pour un serrurier sans site web.
Destinataire : ${lead.name} à ${lead.city}
URL du site créé pour lui : ${lead.landingUrl}
Contexte : ${contexts[lead.mailNumber]}

Réponds en JSON :
{
  "subject": "Objet email percutant (max 60 chars)",
  "htmlBody": "Corps email en HTML inline-styled, professionnel, fond noir #000, texte blanc, accent bleu #0047FF, bouton CTA rouge #FF3300 vers le site"
}

Ton : Professionnel, direct, créateur d'urgence. Jamais fade. JSON uniquement.`

  const raw = await generateContent(prompt)
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}
