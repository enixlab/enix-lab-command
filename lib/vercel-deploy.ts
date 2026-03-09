const VERCEL_TOKEN = process.env.VERCEL_TOKEN

export async function deployToVercel(
  projectName: string,
  html: string
): Promise<string> {
  const safeName = projectName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)

  const res = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: safeName,
      files: [{ file: 'index.html', data: html }],
      projectSettings: { framework: null },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vercel deploy error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return `https://${data.url}`
}

export function buildLocksmithLandingHTML(business: {
  name: string
  city: string
  phone?: string
  address?: string
  rating?: number
  reviews?: number
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="description" content="Serrurier ${business.city} - ${business.name}. Intervention rapide 24h/7j. Urgence serrurerie.">
<title>Serrurier ${business.city} — ${business.name} | Urgence 24h/7j</title>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--urgent:#FF3300;--urgent2:#FF6600;--dark:#0a0a0a;--card:#141414;--white:#ffffff;--blue:#0047FF}
body{background:var(--dark);color:var(--white);font-family:'Inter',sans-serif}
.banner{background:linear-gradient(90deg,var(--urgent),var(--urgent2));text-align:center;padding:14px;font-family:'Oswald',sans-serif;font-size:13px;letter-spacing:2px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.85}}
.hero{padding:80px 20px 60px;text-align:center;background:radial-gradient(ellipse at top,rgba(255,51,0,.15),transparent 60%)}
.hero h1{font-family:'Oswald',sans-serif;font-size:clamp(36px,6vw,72px);font-weight:700;line-height:1.1;margin-bottom:16px}
.hero h1 span{color:var(--urgent)}
.hero p{font-size:18px;color:rgba(255,255,255,.7);max-width:600px;margin:0 auto 32px}
.cta{display:inline-flex;align-items:center;gap:12px;background:var(--urgent);color:#fff;padding:20px 40px;border-radius:4px;font-family:'Oswald',sans-serif;font-size:24px;font-weight:700;text-decoration:none;letter-spacing:1px;animation:glow 2s infinite}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(255,51,0,.4)}50%{box-shadow:0 0 50px rgba(255,51,0,.9)}}
.services{padding:60px 20px;max-width:1000px;margin:0 auto}
.services h2{font-family:'Oswald',sans-serif;font-size:32px;margin-bottom:32px;text-align:center}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:var(--card);border:1px solid rgba(255,51,0,.2);padding:24px;border-radius:4px;transition:border-color .3s}
.card:hover{border-color:rgba(255,51,0,.6)}
.card .icon{font-size:32px;margin-bottom:12px}
.card h3{font-family:'Oswald',sans-serif;font-size:18px;margin-bottom:8px}
.card p{color:rgba(255,255,255,.6);font-size:14px;line-height:1.6}
.urgency{background:linear-gradient(135deg,rgba(255,51,0,.1),rgba(255,102,0,.05));border:1px solid rgba(255,51,0,.3);margin:40px 20px;border-radius:8px;padding:40px;text-align:center}
.counter{font-family:'Oswald',sans-serif;font-size:64px;color:var(--urgent);line-height:1}
.trust{display:flex;justify-content:center;gap:32px;flex-wrap:wrap;padding:40px 20px;max-width:800px;margin:0 auto}
.trust-item{text-align:center}
.trust-item .num{font-family:'Oswald',sans-serif;font-size:36px;color:var(--urgent)}
.trust-item p{color:rgba(255,255,255,.6);font-size:13px}
footer{text-align:center;padding:32px;color:rgba(255,255,255,.3);font-size:12px;border-top:1px solid rgba(255,255,255,.05)}
footer a{color:var(--blue);text-decoration:none}
@media(max-width:600px){.grid{grid-template-columns:1fr}.trust{gap:16px}}
</style>
</head>
<body>
<div class="banner">🚨 INTERVENTION RAPIDE — ${business.city.toUpperCase()} ET ENVIRONS — DISPONIBLE 24H/24 7J/7</div>

<section class="hero">
  <h1>Serrurier<br><span>${business.city}</span><br>Disponible Maintenant</h1>
  <p>${business.name} — Artisan certifié. Intervention 30 min. Prix transparents.</p>
  ${business.phone
    ? `<a href="tel:${business.phone}" class="cta">📞 ${business.phone}</a>`
    : `<div style="font-family:Oswald;font-size:20px;color:rgba(255,255,255,.5);">Contactez-nous par email</div>`
  }
</section>

<section class="services">
  <h2>Nos Interventions</h2>
  <div class="grid">
    <div class="card"><div class="icon">🔓</div><h3>Ouverture de Porte</h3><p>Porte claquée, serrure bloquée. Intervention en moins de 30 minutes.</p></div>
    <div class="card"><div class="icon">🔒</div><h3>Remplacement Serrure</h3><p>Serrure 3 points, blindage, anti-effraction certifié A2P.</p></div>
    <div class="card"><div class="icon">🚨</div><h3>Urgence 24h/7j</h3><p>Après cambriolage ou porte forcée — sécurisation immédiate.</p></div>
  </div>
</section>

<div class="trust">
  <div class="trust-item"><div class="num">30 min</div><p>Délai moyen d'intervention</p></div>
  <div class="trust-item"><div class="num">A2P</div><p>Serrures certifiées</p></div>
  ${business.rating ? `<div class="trust-item"><div class="num">⭐ ${business.rating}/5</div><p>${business.reviews} avis clients</p></div>` : ''}
  <div class="trust-item"><div class="num">24/7</div><p>Disponible tout le temps</p></div>
</div>

<div class="urgency">
  <p style="font-family:Oswald;font-size:14px;letter-spacing:3px;color:rgba(255,255,255,.5);margin-bottom:8px;">CLIENTS SERVIS CE MOIS</p>
  <div class="counter" id="counter">127</div>
  <p style="color:rgba(255,255,255,.6);margin-top:16px;max-width:500px;margin-left:auto;margin-right:auto;">Le serrurier de référence à ${business.city}. Réactivité garantie, tarifs transparents, artisan local.</p>
  ${business.phone ? `<a href="tel:${business.phone}" style="display:inline-block;margin-top:24px;background:var(--urgent);color:#fff;padding:16px 32px;font-family:Oswald;font-size:20px;border-radius:4px;text-decoration:none;font-weight:700;letter-spacing:1px;">📞 APPELER MAINTENANT</a>` : ''}
</div>

<footer>
  <p>${business.name} — ${business.address || business.city}${business.rating ? ` | ⭐ ${business.rating}/5 (${business.reviews} avis)` : ''}</p>
  <p style="margin-top:8px;">Site créé par <a href="https://enix-lab.com">ENIX LAB®</a> — Digital Black Ops Agency</p>
</footer>

<script>
let c=127+Math.floor(Math.random()*30);
document.getElementById('counter').textContent=c+'+';
setInterval(()=>{if(Math.random()>.7){c++;document.getElementById('counter').textContent=c+'+'}},25000);
</script>
</body>
</html>`
}
