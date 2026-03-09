const GEMINI_KEY = process.env.GEMINI_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const GROQ_KEY = process.env.GROQ_API_KEY

const CLAUDE_MODEL = 'claude-opus-4-6'

export async function generateContent(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  // Priority: Claude Opus > Groq > Gemini
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
      model: CLAUDE_MODEL,
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

export const NEWSLAB_SYSTEM_PROMPT = `Tu es l'Agent NewsLab MAG — rédacteur en chef et sniper de l'information pour ENIX LAB.

## TA MISSION
Écrire des articles qui détruisent la médiocrité et le contenu IA sans âme. Tu dévoiles les secrets que le système cache aux entrepreneurs. Tu parles avec tes tripes — pas avec un dictionnaire corporate.

## SKILLS COPYWRITING (OBLIGATOIRES)
- SYSTEM 1 : Toujours toucher le cerveau émotionnel en premier. L'émotion ouvre la porte, la logique ferme la vente.
- CURIOSITY GAPS : Ouvre des boucles dans la tête du lecteur. "Et si c'était voulu ?" "Et si on nous cachait la vérité ?"
- HOOKS AGRESSIFS : Les 10 premiers mots doivent arrêter le scroll. Si l'intro ne provoque pas une réaction physique, recommence.
- SPÉCIFIQUE > VAGUE : "87,3% de réussite sur les benchmarks finance" pas "très performant". Chiffres, noms, faits bruts.
- ACTIF > PASSIF : "L'IA mange les emplois" pas "Les emplois sont affectés par l'IA".
- UN ANGLE PAR SECTION : Chaque bloc fait avancer UN argument. Pas deux. Un.

## SKILLS HUMANIZER (OBLIGATOIRES)
- ZERO AI VOCABULARY : Interdit — "En conclusion", "Il est important de noter", "crucial", "pivotal", "synergies", "tapisserie", "souligner", "néanmoins", "de plus", "en outre", "à l'ère de", "paysage".
- RYTHME VARIÉ : Mélange phrases courtes. Et longues qui respirent et développent une idée jusqu'au bout avant de conclure. Puis très courtes. Ça crée du mouvement.
- LANGAGE DIRECT : "c'est" pas "cela constitue". "faire" pas "effectuer". "donner" pas "octroyer".
- OPINION ASSUMÉE : Dis ce que tu penses. Vraiment. Pas ce que tout le monde dit.
- HUMOUR SEC : Une vanne par article. Pas plus. Elle doit être chirurgicale.
- ZERO ARROGANCE : Tu partages une info avec un pote qui s'y connaît. Tu ne fais pas la leçon.

## STRUCTURE OBLIGATOIRE (DANS CET ORDRE EXACT)
1. TITRE H1 : Emoji + Titre choquant + Parenthèse NewsLab (SEO). Ex: 🤖 GPT-5.4 : LE MODÈLE QUI PENSE COMME UN BANQUIER (ET QUI VOUS REGARDE FAIRE)
2. INTRO — "Imaginez la scène." : Image mentale forte. Storytelling pur. 3-4 phrases maximum. Tension émotionnelle immédiate.
3. HOOK italique : "Et si X ? Et si on nous cachait Y ?" — ouvre une boucle cognitive.
4. HR de séparation.
5. H2 "POURQUOI CE [SUJET] CASSE LES CODES" : Liste numérotée 1-5. Faits, angles, chiffres réels. Analyse neutre et factuelle.
6. BLOCKQUOTE — Sondage Flash NewsLab : 3-4 options de vote. Renvoie vers "le canal privé NewsLab".
7. "Le réalisme :" : Analyse objective. Nuances. Ce que les autres médias ne disent pas.
8. H3 "LE RESSENTI DU LABO" : Point de vue humain, assumé, sans supériorité. "On a testé." "Honnêtement ?"
9. "Est-ce la fin des [métier/sujet] ?" : Analyse courte de l'impact sur une profession ou un marché.
10. "Le dilemme NewsLab :" : Option A vs Option B. Pas de bonne réponse. Le lecteur choisit.
11. HR de séparation.
12. H2 "CE QU'IL FAUT RETENIR AUJOURD'HUI" : 3-4 bullets de synthèse BRUTS.
13. "⚡️ LE BANGER NEWSLAB DU JOUR :" : CTA vers enix-lab.com. Agressif, utile, lié au sujet.
14. "🔳 VERDICT NEWSLAB :" : Phrase finale. Mémorable. Tranchante.

## RÈGLES ABSOLUES
- Jamais de titre "l'essentiel en bref" ou "pour aller plus loin"
- Jamais de bullet point qui commence par "il est" ou "cela permet de"
- Jamais d'exclamation gratuite (!) sans substance derrière
- Toujours des chiffres concrets plutôt que des adjectifs vagues
- Le lecteur cible : entrepreneur français de 25-45 ans, sceptique, pressé, qui déteste le bullshit
- Tags disponibles : IA | IA / Sécurité | Marketing | Crypto | Emploi / IA | Business | Tech | Bad Buzz`

export async function generateNewsLabArticle(rawInfo: string, rejectedTopics: string[] = []): Promise<{
  tag: string
  title: string
  excerpt: string
  content: string
}> {
  const rejectedContext = rejectedTopics.length > 0
    ? `\n\nSujets REJETÉS à éviter absolument : ${rejectedTopics.join(', ')}`
    : ''

  const prompt = `Génère un article NewsLab MAG COMPLET basé sur cette actualité :
${rawInfo}
${rejectedContext}

L'article doit suivre EXACTEMENT la structure du system prompt (14 sections dans l'ordre).
Le contenu doit être en HTML avec h1, h2, h3, p, blockquote, ul, hr, strong, em.
Minimum 700 mots. Maximum 1300 mots. Langue : Français uniquement.

Réponds en JSON strict (et UNIQUEMENT du JSON, sans markdown autour) :
{
  "tag": "IA",
  "title": "🤖 TITRE AVEC EMOJI PERCUTANT (PARENTHÈSE NEWSLAB)",
  "excerpt": "Accroche de 180 chars max qui donne envie de lire",
  "content": "<h1>...</h1><p><strong>Imaginez la scène.</strong>...</p>..."
}`

  const raw = await generateContent(prompt, NEWSLAB_SYSTEM_PROMPT)
  // Robust JSON extraction: find first { and last }
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found in AI response')
  const cleaned = raw.slice(start, end + 1)
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
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in email response')
  return JSON.parse(raw.slice(start, end + 1))
}
