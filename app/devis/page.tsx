'use client'
import Image from 'next/image'
import { useEffect, useState, useCallback } from 'react'
import type { Devis, DevisItem } from '@/lib/types'

const STATUS_CONFIG: Record<string, { label: string; badge: string; next?: string; nextLabel?: string }> = {
  brouillon: { label: 'BROUILLON', badge: 'badge-gray', next: 'envoyé', nextLabel: '📤 Marquer Envoyé' },
  envoyé:    { label: 'ENVOYÉ',    badge: 'badge-blue', next: 'accepté', nextLabel: '✅ Marquer Accepté' },
  accepté:   { label: 'ACCEPTÉ',  badge: 'badge-green', next: 'refusé', nextLabel: '❌ Marquer Refusé' },
  refusé:    { label: 'REFUSÉ',   badge: 'badge-red' },
}

const SERVICES_PRESET = [
  { label: 'Gestion Réseaux Sociaux (1 mois)', price: 800 },
  { label: 'Site Web Landing Page', price: 600 },
  { label: 'Campagne Google Ads (setup + gestion)', price: 500 },
  { label: 'Création de Contenu (pack 10 posts)', price: 400 },
  { label: 'Audit Marketing Stratégique', price: 300 },
  { label: 'SEO On-Page & Technique', price: 450 },
  { label: 'Campagne Email Marketing', price: 350 },
  { label: 'Community Management (1 mois)', price: 650 },
  { label: 'Identité Visuelle Complète', price: 900 },
  { label: 'Stratégie Growth Hacking', price: 700 },
  { label: 'Formation Équipe (demi-journée)', price: 1200 },
  { label: 'Newsletter Mensuelle (setup + 1 envoi)', price: 250 },
]

export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ clientName: '', clientEmail: '', validDays: 30, notes: '' })
  const [items, setItems] = useState<DevisItem[]>([{ label: '', qty: 1, price: 0 }])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [tab, setTab] = useState<'all' | 'brouillon' | 'envoyé' | 'accepté'>('all')

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/devis').then(r => r.json()).then(data => setDevis(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3000) }
  const total = items.reduce((acc, i) => acc + i.qty * i.price, 0)
  const tva = Math.round(total * 0.2)

  const addItem = () => setItems(p => [...p, { label: '', qty: 1, price: 0 }])
  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx))
  const updateItem = (idx: number, key: keyof DevisItem, val: string | number) =>
    setItems(p => p.map((item, i) => i === idx ? { ...item, [key]: val } : item))

  const addPreset = (preset: { label: string; price: number }) => {
    setItems(p => [...p.filter(i => i.label !== ''), { label: preset.label, qty: 1, price: preset.price }])
  }

  const save = async () => {
    if (!form.clientName || !form.clientEmail) return showMsg('❌ Nom et email obligatoires')
    if (items.some(i => !i.label)) return showMsg('❌ Tous les services doivent avoir un label')
    setSaving(true)
    try {
      await fetch('/api/devis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, items, total, tva }) })
      showMsg('✅ Devis créé !')
      setModal(false)
      setForm({ clientName: '', clientEmail: '', validDays: 30, notes: '' })
      setItems([{ label: '', qty: 1, price: 0 }])
      load()
    } finally { setSaving(false) }
  }

  const changeStatus = async (d: Devis, status: string) => {
    await fetch(`/api/devis/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    showMsg(`✅ Statut mis à jour : ${STATUS_CONFIG[status]?.label}`)
    load()
  }

  const printDevis = (d: Devis) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(generatePDF(d))
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }

  const filtered = tab === 'all' ? devis : devis.filter(d => d.status === tab)

  const stats = {
    total: devis.length,
    caHT: devis.filter(d => d.status === 'accepté').reduce((a, d) => a + d.total, 0),
    accepté: devis.filter(d => d.status === 'accepté').length,
    envoyé: devis.filter(d => d.status === 'envoyé').length,
  }

  const generatePDF = (d: Devis) => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Devis ${d.number} — ENIX LAB®</title>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',Arial,sans-serif;color:#0a0a0d;background:#fff;font-size:13px;line-height:1.5}
.header{background:#020203;color:#fff;padding:40px 48px;display:flex;justify-content:space-between;align-items:flex-start}
.brand{display:flex;align-items:center;gap:14px}
.brand-text .name{font-family:'Oswald',sans-serif;font-size:26px;font-weight:700;letter-spacing:3px;color:#fff}
.brand-text .sub{font-size:10px;letter-spacing:3px;color:rgba(255,255,255,.4);margin-top:3px}
.devis-meta{text-align:right}
.devis-meta .num{font-family:'Oswald',sans-serif;font-size:28px;font-weight:700;color:#0047FF;letter-spacing:2px}
.devis-meta .date{font-size:12px;color:rgba(255,255,255,.5);margin-top:6px}
.accent{height:3px;background:linear-gradient(90deg,#0047FF,#00FFFF)}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #eee}
.party{padding:32px 48px}
.party:first-child{border-right:1px solid #eee}
.party-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:10px;font-weight:500}
.party-name{font-family:'Oswald',sans-serif;font-size:18px;font-weight:600;margin-bottom:4px}
.party-detail{font-size:12px;color:#555}
.section{padding:32px 48px}
.section-title{font-family:'Oswald',sans-serif;font-size:13px;letter-spacing:2px;color:#888;margin-bottom:20px;text-transform:uppercase}
table{width:100%;border-collapse:collapse}
thead tr{background:#f5f5f7}
th{padding:12px 16px;text-align:left;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#666;font-weight:600;border-bottom:2px solid #0047FF}
td{padding:14px 16px;border-bottom:1px solid #f0f0f0;color:#333}
tbody tr:hover td{background:#fafafe}
.text-right{text-align:right}
.text-center{text-align:center}
.totals{margin-top:24px;display:flex;justify-content:flex-end}
.totals-box{width:320px}
.total-row{display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #f0f0f0}
.total-row.main{background:#0047FF;color:#fff;border-radius:4px;padding:16px;margin-top:4px}
.total-row.main .amount{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700}
.conditions{background:#f9f9fb;padding:32px 48px;border-top:1px solid #eee}
.conditions-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.cond-block .cond-title{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:8px;font-weight:600}
.cond-block .cond-val{font-size:13px;color:#333}
.footer{background:#020203;padding:20px 48px;display:flex;justify-content:space-between;align-items:center}
.footer-left{font-size:11px;color:rgba(255,255,255,.3)}
.footer-right{font-size:10px;letter-spacing:2px;color:rgba(255,255,255,.2)}
.badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1px}
.badge-green{background:rgba(0,204,90,.15);color:#00cc5a;border:1px solid rgba(0,204,90,.3)}
.badge-blue{background:rgba(0,71,255,.15);color:#0047FF;border:1px solid rgba(0,71,255,.3)}
.badge-gray{background:#f0f0f0;color:#888}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none}}
</style>
</head>
<body>
<div class="header">
  <div class="brand">
    <div style="width:36px;height:36px;background:#0047FF;clip-path:polygon(50% 0%,0% 100%,100% 100%);flex-shrink:0"></div>
    <div class="brand-text">
      <div class="name">ENIX LAB®</div>
      <div class="sub">DIGITAL BLACK OPS AGENCY</div>
    </div>
  </div>
  <div class="devis-meta">
    <div style="font-size:11px;letter-spacing:2px;color:rgba(255,255,255,.4);margin-bottom:6px">DEVIS N°</div>
    <div class="num">${d.number}</div>
    <div class="date">Émis le ${new Date(d.createdAt).toLocaleDateString('fr-FR', {day:'2-digit',month:'long',year:'numeric'})}</div>
    <div class="date">Valide jusqu'au ${new Date(d.validUntil).toLocaleDateString('fr-FR', {day:'2-digit',month:'long',year:'numeric'})}</div>
  </div>
</div>
<div class="accent"></div>
<div class="parties">
  <div class="party">
    <div class="party-label">Prestataire</div>
    <div class="party-name">ENIX LAB SAS</div>
    <div class="party-detail">enix.lab.ai@gmail.com</div>
    <div class="party-detail">enix-lab.com</div>
    <div class="party-detail" style="margin-top:8px;font-size:11px;color:#aaa">Digital Black Ops Agency — Paris, France</div>
  </div>
  <div class="party">
    <div class="party-label">Client</div>
    <div class="party-name">${d.clientName}</div>
    <div class="party-detail">${d.clientEmail}</div>
    ${d.notes ? `<div class="party-detail" style="margin-top:8px;font-size:11px;color:#888">${d.notes}</div>` : ''}
  </div>
</div>
<div class="section">
  <div class="section-title">Détail des Prestations</div>
  <table>
    <thead>
      <tr>
        <th style="width:50%">PRESTATION</th>
        <th class="text-center" style="width:10%">QTÉ</th>
        <th class="text-right" style="width:20%">PRIX UNIT. HT</th>
        <th class="text-right" style="width:20%">TOTAL HT</th>
      </tr>
    </thead>
    <tbody>
      ${d.items.map((i, idx) => `<tr>
        <td>${i.label}</td>
        <td class="text-center">${i.qty}</td>
        <td class="text-right">${i.price.toLocaleString('fr-FR')} €</td>
        <td class="text-right" style="font-weight:600">${(i.qty*i.price).toLocaleString('fr-FR')} €</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Sous-total HT</span><span>${d.total.toLocaleString('fr-FR')} €</span></div>
      <div class="total-row"><span>TVA 20%</span><span>${d.tva.toLocaleString('fr-FR')} €</span></div>
      <div class="total-row main"><span style="font-size:14px;font-weight:600">TOTAL TTC</span><span class="amount">${(d.total+d.tva).toLocaleString('fr-FR')} €</span></div>
    </div>
  </div>
</div>
<div class="conditions">
  <div class="conditions-grid">
    <div class="cond-block">
      <div class="cond-title">Modalités de paiement</div>
      <div class="cond-val">Virement bancaire — 30% à la commande, solde à la livraison</div>
      <div class="cond-val" style="margin-top:4px;font-size:12px;color:#888">ENIX LAB SAS — Revolut Business<br>IBAN : FR76 XXXX XXXX XXXX XXXX XXXX XXX</div>
    </div>
    <div class="cond-block">
      <div class="cond-title">Signature client</div>
      <div style="border:1px solid #ddd;border-radius:4px;padding:24px;text-align:center;color:#ccc;font-size:12px">Bon pour accord — Date et signature</div>
    </div>
  </div>
</div>
<div class="footer">
  <div class="footer-left">ENIX LAB SAS — enix.lab.ai@gmail.com — enix-lab.com</div>
  <div class="footer-right">DIGITAL BLACK OPS AGENCY®</div>
</div>
</body></html>`

  return (
    <div>
      {msg && <div className="fixed top-4 right-4 px-5 py-3 rounded font-mono z-50" style={{ background: 'var(--s2)', border: '1px solid var(--brand)', fontSize: 13, boxShadow: '0 0 24px rgba(0,71,255,0.3)' }}>{msg}</div>}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Image src="/logo-small.png" alt="ENIX LAB" width={26} height={26} style={{ objectFit: 'contain' }} />
            <div className="font-oswald font-bold" style={{ fontSize: 30, letterSpacing: 2 }}>DEVIS & FACTURES</div>
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, marginTop: 4 }}>FACTURATION ENIX LAB SAS</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-brand">+ Nouveau Devis</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { val: stats.total, label: 'TOTAL DEVIS', color: 'white' },
          { val: stats.envoyé, label: 'EN ATTENTE', color: 'var(--brand)' },
          { val: stats.accepté, label: 'SIGNÉS', color: 'var(--success)' },
          { val: `${stats.caHT.toLocaleString('fr-FR')} €`, label: 'CA SIGNÉ HT', color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="kpi-card">
            <div className="kpi-value" style={{ color: s.color, fontSize: 28 }}>{loading ? '—' : s.val}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'brouillon', 'envoyé', 'accepté'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={t === tab ? 'btn-brand' : 'btn-ghost'}
            style={{ fontSize: 12, padding: '8px 16px' }}>
            {t === 'all' ? `Tous (${devis.length})` : STATUS_CONFIG[t].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="enix-card overflow-hidden">
        {loading ? (
          <div className="p-8">{[1,2,3].map(i => <div key={i} className="skeleton h-14 mb-3 rounded" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <div className="font-oswald" style={{ fontSize: 20, marginBottom: 8 }}>Aucun devis</div>
            <button onClick={() => setModal(true)} className="btn-brand" style={{ marginTop: 12 }}>Créer un devis</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="enix-table">
              <thead>
                <tr>
                  <th>N° DEVIS</th>
                  <th>CLIENT</th>
                  <th>EMAIL</th>
                  <th>MONTANT HT</th>
                  <th>TTC</th>
                  <th>ÉMIS LE</th>
                  <th>STATUT</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.brouillon
                  return (
                    <tr key={d.id}>
                      <td className="font-mono" style={{ color: 'var(--brand)', fontWeight: 600 }}>{d.number}</td>
                      <td style={{ color: 'var(--text1)', fontWeight: 500 }}>{d.clientName}</td>
                      <td className="font-mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{d.clientEmail}</td>
                      <td className="font-mono">{d.total.toLocaleString('fr-FR')} €</td>
                      <td className="font-mono" style={{ color: 'var(--success)', fontWeight: 600 }}>{(d.total + d.tva).toLocaleString('fr-FR')} €</td>
                      <td className="font-mono" style={{ fontSize: 12 }}>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => printDevis(d)} className="btn-brand" style={{ fontSize: 11, padding: '6px 10px' }}>
                            🖨️ PDF
                          </button>
                          {cfg.next && (
                            <button onClick={() => changeStatus(d, cfg.next!)} className="btn-ghost" style={{ fontSize: 11, padding: '6px 10px' }}>
                              {cfg.nextLabel}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box" style={{ maxWidth: 760 }}>
            <div className="flex items-center gap-3 mb-6">
              <Image src="/logo-small.png" alt="" width={24} height={24} style={{ objectFit: 'contain' }} />
              <div className="font-oswald font-bold" style={{ fontSize: 20 }}>NOUVEAU DEVIS — ENIX LAB®</div>
            </div>

            {/* Client info */}
            <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>NOM CLIENT *</label>
                <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Nom ou société" className="enix-input" />
              </div>
              <div>
                <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>EMAIL *</label>
                <input value={form.clientEmail} onChange={e => setForm(p => ({ ...p, clientEmail: e.target.value }))} placeholder="email@client.com" className="enix-input" />
              </div>
            </div>

            {/* Services */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2 }}>PRESTATIONS</label>
                <button onClick={addItem} className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>+ Ligne vide</button>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {SERVICES_PRESET.map(s => (
                  <button key={s.label} onClick={() => addPreset(s)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)',
                      background: 'var(--s3)', color: 'var(--text2)', fontSize: 11, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--brand)'; (e.target as HTMLElement).style.color = 'white' }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--text2)' }}
                  >
                    {s.label.split('(')[0].trim()} <span style={{ color: 'var(--brand)' }}>{s.price}€</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input value={item.label} onChange={e => updateItem(idx, 'label', e.target.value)}
                      placeholder="Description de la prestation" className="enix-input" style={{ flex: 3 }} />
                    <input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                      min={1} className="enix-input" style={{ width: 60 }} />
                    <div style={{ position: 'relative', width: 110 }}>
                      <input type="number" value={item.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                        placeholder="0" className="enix-input" style={{ paddingRight: 28 }} />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>€</span>
                    </div>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="btn-danger" style={{ padding: '10px 12px', flexShrink: 0 }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>NOTES (facultatif)</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Conditions particulières, délai de livraison..." className="enix-input" />
            </div>

            {/* Total */}
            <div className="p-5 rounded mb-5" style={{ background: 'var(--s3)', border: '1px solid var(--border-b)' }}>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--text2)' }}>Sous-total HT</span>
                <span className="font-mono">{total.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between mb-3" style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text2)' }}>TVA 20%</span>
                <span className="font-mono" style={{ color: 'var(--text3)' }}>{tva.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-oswald font-bold" style={{ fontSize: 18 }}>TOTAL TTC</span>
                <span className="font-oswald font-bold" style={{ fontSize: 28, color: 'var(--success)' }}>{(total + tva).toLocaleString('fr-FR')} €</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="btn-brand">
                {saving ? '⏳ Création...' : '✅ Créer le Devis'}
              </button>
              <button onClick={() => setModal(false)} className="btn-ghost">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
