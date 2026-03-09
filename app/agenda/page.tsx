'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Appointment } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = { confirmé: 'CONFIRMÉ', en_attente: 'EN ATTENTE', annulé: 'ANNULÉ' }
const STATUS_BADGE: Record<string, string> = { confirmé: 'badge-green', en_attente: 'badge-orange', annulé: 'badge-red' }
const SERVICES = ['Audit Marketing', 'Stratégie SMMA', 'Consulting Site Web', 'SEO', 'Pub Google/Meta', 'Présentation Offre', 'Autre']
const TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']

export default function AgendaPage() {
  const [appts, setAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ contactName: '', email: '', phone: '', date: '', time: '10:00', service: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [view, setView] = useState<'upcoming' | 'all'>('upcoming')

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/agenda').then(r => r.json()).then(data => setAppts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3000) }

  const save = async () => {
    if (!form.contactName || !form.email || !form.date) return showMsg('❌ Nom, email et date obligatoires')
    setSaving(true)
    try {
      await fetch('/api/agenda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      showMsg('✅ RDV créé !')
      setModal(false); load()
      setForm({ contactName: '', email: '', phone: '', date: '', time: '10:00', service: '', notes: '' })
    } finally { setSaving(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/agenda`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    load()
  }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = appts.filter(a => a.date >= today && a.status !== 'annulé').sort((a, b) => a.date.localeCompare(b.date))
  const displayed = view === 'upcoming' ? upcoming : appts.sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      {msg && <div className="fixed top-4 right-4 px-4 py-3 rounded font-mono z-50" style={{ background: 'var(--s2)', border: '1px solid var(--brand)', fontSize: 13 }}>{msg}</div>}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-oswald font-bold" style={{ fontSize: 32, letterSpacing: 1 }}>AGENDA</div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, marginTop: 4 }}>RENDEZ-VOUS ENIX LAB</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-brand">+ Nouveau RDV</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { val: upcoming.length, label: 'RDV À VENIR', color: 'var(--cyan)' },
          { val: appts.filter(a => a.status === 'confirmé').length, label: 'CONFIRMÉS', color: 'var(--success)' },
          { val: appts.filter(a => a.date === today).length, label: "AUJOURD'HUI", color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="kpi-card">
            <div className="kpi-value" style={{ color: s.color }}>{loading ? '—' : s.val}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('upcoming')} className={view === 'upcoming' ? 'btn-brand' : 'btn-ghost'} style={{ fontSize: 12 }}>
          📅 À venir ({upcoming.length})
        </button>
        <button onClick={() => setView('all')} className={view === 'all' ? 'btn-brand' : 'btn-ghost'} style={{ fontSize: 12 }}>
          Tous ({appts.length})
        </button>
      </div>

      <div className="space-y-3">
        {loading ? [1,2,3].map(i => <div key={i} className="skeleton h-20 rounded" />) :
          displayed.length === 0 ? (
            <div className="enix-card p-12 text-center">
              <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
              <div className="font-oswald" style={{ fontSize: 20 }}>Aucun rendez-vous</div>
              <button onClick={() => setModal(true)} className="btn-brand" style={{ marginTop: 16 }}>Créer un RDV</button>
            </div>
          ) : displayed.map(a => (
            <div key={a.id} className="enix-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 rounded" style={{ background: 'var(--s3)', minWidth: 70 }}>
                    <div className="font-oswald font-bold" style={{ fontSize: 22, color: a.date === today ? 'var(--warning)' : 'var(--brand)' }}>
                      {new Date(a.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit' })}
                    </div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>
                      {new Date(a.date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text1)', fontSize: 15 }}>{a.contactName}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 13 }}>{a.service} · {a.time}</div>
                    <div className="font-mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{a.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${STATUS_BADGE[a.status]}`}>{STATUS_LABELS[a.status]}</span>
                  {a.status === 'en_attente' && (
                    <button onClick={() => updateStatus(a.id, 'confirmé')} className="btn-brand" style={{ fontSize: 11, padding: '6px 12px' }}>✅ Confirmer</button>
                  )}
                  {a.status !== 'annulé' && (
                    <button onClick={() => updateStatus(a.id, 'annulé')} className="btn-danger" style={{ fontSize: 11, padding: '6px 12px' }}>Annuler</button>
                  )}
                </div>
              </div>
              {a.notes && <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--s3)', borderRadius: 4, fontSize: 12, color: 'var(--text2)' }}>📝 {a.notes}</div>}
            </div>
          ))
        }
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="font-oswald font-bold mb-6" style={{ fontSize: 20 }}>📅 Nouveau Rendez-vous</div>
            <div className="space-y-4">
              {[
                { label: 'NOM *', key: 'contactName', type: 'text', placeholder: 'Jean Dupont' },
                { label: 'EMAIL *', key: 'email', type: 'email', placeholder: 'jean@example.com' },
                { label: 'TÉLÉPHONE', key: 'phone', type: 'text', placeholder: '+33...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} className="enix-input" />
                </div>
              ))}
              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>DATE *</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    min={today} className="enix-input" />
                </div>
                <div>
                  <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>HEURE</label>
                  <select value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="enix-select">
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>SERVICE</label>
                <select value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))} className="enix-select">
                  <option value="">Sélectionner...</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>NOTES</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Contexte du RDV..." className="enix-input" style={{ minHeight: 60, resize: 'vertical' }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving} className="btn-brand">{saving ? '⏳' : '✅ Créer RDV'}</button>
              <button onClick={() => setModal(false)} className="btn-ghost">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
