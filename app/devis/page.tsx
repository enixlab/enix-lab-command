'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Devis, DevisItem } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = { brouillon: 'BROUILLON', envoyé: 'ENVOYÉ', accepté: 'ACCEPTÉ', refusé: 'REFUSÉ' }
const STATUS_BADGE: Record<string, string> = { brouillon: 'badge-gray', envoyé: 'badge-blue', accepté: 'badge-green', refusé: 'badge-red' }

const SERVICES_PRESET = [
  { label: 'Gestion Réseaux Sociaux (1 mois)', price: 800 },
  { label: 'Site Web Landing Page', price: 600 },
  { label: 'Campagne Google Ads (setup)', price: 500 },
  { label: 'Création de Contenu (pack 10 posts)', price: 400 },
  { label: 'Stratégie Marketing (audit)', price: 300 },
  { label: 'SEO On-Page', price: 450 },
]

export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [preview, setPreview] = useState<Devis | null>(null)
  const [form, setForm] = useState({ clientName: '', clientEmail: '', validDays: 30, notes: '' })
  const [items, setItems] = useState<DevisItem[]>([{ label: '', qty: 1, price: 0 }])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

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

  const save = async () => {
    if (!form.clientName || !form.clientEmail) return showMsg('❌ Nom et email obligatoires')
    if (items.some(i => !i.label)) return showMsg('❌ Tous les services doivent avoir un label')
    setSaving(true)
    try {
      await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items, total, tva }),
      })
      showMsg('✅ Devis créé !')
      setModal(false); load()
    } finally { setSaving(false) }
  }

  const printDevis = (d: Devis) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(generateDevisPDF(d))
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }

  const generateDevisPDF = (d: Devis) => `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Devis ${d.number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;color:#111;background:#fff;font-size:13px}
.header{background:#020203;color:#fff;padding:40px;display:flex;justify-content:space-between;align-items:center}
.logo-name{font-size:24px;font-weight:700;letter-spacing:3px;color:#fff}
.logo-tri{width:30px;height:30px;background:#0047FF;clip-path:polygon(50% 0%,0% 100%,100% 100%);display:inline-block;margin-right:10px;vertical-align:middle}
.devis-ref{text-align:right;color:rgba(255,255,255,.7)}
.devis-ref strong{color:#0047FF;font-size:20px;display:block}
.section{padding:32px 40px;border-bottom:1px solid #eee}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:16px}
.label{font-size:10px;color:#888;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
.value{font-size:14px;font-weight:500}
table{width:100%;border-collapse:collapse;margin-top:16px}
th{background:#f5f5f7;padding:10px 16px;text-align:left;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#666}
td{padding:12px 16px;border-bottom:1px solid #eee}
.total-row td{background:#f9f9f9;font-weight:600}
.grand-total td{background:#0047FF;color:#fff;font-size:16px;font-weight:700}
.footer{padding:32px 40px;background:#f9f9f9;display:flex;justify-content:space-between}
.bank-info{font-size:12px;color:#555}
@media print{.no-print{display:none}}
</style>
</head>
<body>
<div class="header">
  <div><div><div class="logo-tri"></div><span class="logo-name">ENIX LAB®</span></div>
  <div style="color:rgba(255,255,255,.5);font-size:11px;letter-spacing:2px;margin-top:4px">DIGITAL BLACK OPS AGENCY</div></div>
  <div class="devis-ref"><div class="label">DEVIS N°</div><strong>${d.number}</strong>
  <div style="margin-top:8px;font-size:12px">Émis le : ${new Date(d.createdAt).toLocaleDateString('fr-FR')}</div>
  <div style="font-size:12px">Valide jusqu'au : ${new Date(d.validUntil).toLocaleDateString('fr-FR')}</div></div>
</div>
<div class="section">
  <div class="info-grid">
    <div><div class="label">De</div><div class="value">ENIX LAB SAS</div>
    <div style="color:#555;font-size:12px;margin-top:4px">enix.lab.ai@gmail.com<br>enix-lab.com</div></div>
    <div><div class="label">Pour</div><div class="value">${d.clientName}</div>
    <div style="color:#555;font-size:12px;margin-top:4px">${d.clientEmail}</div></div>
  </div>
</div>
<div class="section">
  <table>
    <thead><tr><th>PRESTATION</th><th style="text-align:center">QTÉ</th><th style="text-align:right">PRIX UNIT.</th><th style="text-align:right">TOTAL HT</th></tr></thead>
    <tbody>
      ${d.items.map(i => `<tr><td>${i.label}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">${i.price.toLocaleString('fr-FR')} €</td><td style="text-align:right">${(i.qty * i.price).toLocaleString('fr-FR')} €</td></tr>`).join('')}
      <tr class="total-row"><td colspan="3">TOTAL HT</td><td style="text-align:right">${d.total.toLocaleString('fr-FR')} €</td></tr>
      <tr class="total-row"><td colspan="3">TVA 20%</td><td style="text-align:right">${d.tva.toLocaleString('fr-FR')} €</td></tr>
      <tr class="grand-total"><td colspan="3">TOTAL TTC</td><td style="text-align:right">${(d.total + d.tva).toLocaleString('fr-FR')} €</td></tr>
    </tbody>
  </table>
</div>
<div class="footer">
  <div class="bank-info"><strong>Coordonnées bancaires</strong><br>ENIX LAB SAS — Revolut Business<br>IBAN : FR76...<br>Paiement sous 30 jours</div>
  <div style="text-align:right;font-size:11px;color:#888">Signature :<br><br><br>______________________</div>
</div>
</body></html>`

  return (
    <div>
      {msg && <div className="fixed top-4 right-4 px-4 py-3 rounded font-mono z-50" style={{ background: 'var(--s2)', border: '1px solid var(--brand)', fontSize: 13 }}>{msg}</div>}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-oswald font-bold" style={{ fontSize: 32, letterSpacing: 1 }}>DEVIS & FACTURES</div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, marginTop: 4 }}>FACTURATION ENIX LAB</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-brand">+ Nouveau Devis</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { val: devis.length, label: 'TOTAL', color: 'white' },
          { val: devis.filter(d => d.status === 'envoyé').length, label: 'ENVOYÉS', color: 'var(--brand)' },
          { val: devis.filter(d => d.status === 'accepté').length, label: 'ACCEPTÉS', color: 'var(--success)' },
          { val: `${devis.filter(d => d.status === 'accepté').reduce((a, d) => a + d.total, 0).toLocaleString()}€`, label: 'CA SIGNÉ', color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="kpi-card">
            <div className="kpi-value" style={{ color: s.color, fontSize: 32 }}>{loading ? '—' : s.val}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="enix-card overflow-hidden">
        {loading ? <div className="p-8">{[1,2,3].map(i => <div key={i} className="skeleton h-12 mb-3 rounded" />)}</div> : (
          <table className="enix-table">
            <thead><tr><th>N° DEVIS</th><th>CLIENT</th><th>MONTANT HT</th><th>TTC</th><th>DATE</th><th>STATUT</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {devis.map(d => (
                <tr key={d.id}>
                  <td className="font-mono" style={{ color: 'var(--brand)' }}>{d.number}</td>
                  <td style={{ color: 'var(--text1)', fontWeight: 500 }}>{d.clientName}</td>
                  <td>{d.total.toLocaleString('fr-FR')} €</td>
                  <td style={{ color: 'var(--success)' }}>{(d.total + d.tva).toLocaleString('fr-FR')} €</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td><span className={`badge ${STATUS_BADGE[d.status]}`}>{STATUS_LABELS[d.status]}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => printDevis(d)} className="btn-brand" style={{ fontSize: 11, padding: '6px 10px' }}>🖨️ PDF</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box" style={{ maxWidth: 700 }}>
            <div className="font-oswald font-bold mb-6" style={{ fontSize: 20 }}>📄 Nouveau Devis</div>
            <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {[
                { label: 'CLIENT *', key: 'clientName', placeholder: 'Nom client' },
                { label: 'EMAIL *', key: 'clientEmail', placeholder: 'email@client.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input value={form[f.key as keyof typeof form] as string}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} className="enix-input" />
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2 }}>PRESTATIONS</label>
                <div className="flex gap-2">
                  <select className="enix-select" style={{ width: 240, fontSize: 12 }}
                    onChange={e => {
                      const p = SERVICES_PRESET.find(s => s.label === e.target.value)
                      if (p) setItems(prev => [...prev, { label: p.label, qty: 1, price: p.price }])
                    }}>
                    <option value="">+ Preset service</option>
                    {SERVICES_PRESET.map(s => <option key={s.label} value={s.label}>{s.label} — {s.price}€</option>)}
                  </select>
                  <button onClick={addItem} className="btn-ghost" style={{ fontSize: 12 }}>+ Ligne</button>
                </div>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input value={item.label} onChange={e => updateItem(idx, 'label', e.target.value)}
                      placeholder="Description service" className="enix-input" style={{ flex: 2 }} />
                    <input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                      min={1} className="enix-input" style={{ width: 60 }} />
                    <input type="number" value={item.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                      placeholder="€" className="enix-input" style={{ width: 100 }} />
                    <button onClick={() => removeItem(idx)} className="btn-danger" style={{ padding: '10px 12px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded mb-4" style={{ background: 'var(--s3)', border: '1px solid var(--border-b)' }}>
              <div className="flex justify-between" style={{ marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)' }}>Total HT</span>
                <span className="font-mono" style={{ color: 'white' }}>{total.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between" style={{ marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)' }}>TVA 20%</span>
                <span className="font-mono" style={{ color: 'var(--text2)' }}>{tva.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span className="font-oswald font-bold" style={{ fontSize: 18 }}>TOTAL TTC</span>
                <span className="font-oswald font-bold" style={{ fontSize: 24, color: 'var(--success)' }}>{(total + tva).toLocaleString('fr-FR')} €</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="btn-brand">{saving ? '⏳' : '✅ Créer le Devis'}</button>
              <button onClick={() => setModal(false)} className="btn-ghost">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
