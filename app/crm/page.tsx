'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Contact } from '@/lib/types'

const STATUSES: Contact['status'][] = ['prospect', 'lead', 'client', 'perdu']
const STATUS_LABELS: Record<string, string> = { prospect: 'PROSPECT', lead: 'LEAD', client: 'CLIENT', perdu: 'PERDU' }
const STATUS_BADGE: Record<string, string> = { prospect: 'badge-blue', lead: 'badge-orange', client: 'badge-green', perdu: 'badge-gray' }

const SERVICES = ['SMMA', 'Site Web', 'SEO', 'Publicité', 'Stratégie', 'Autre']

const emptyContact = (): Omit<Contact, 'id' | 'createdAt'> => ({
  name: '', email: '', phone: '', company: '', status: 'prospect', service: '', budget: 0, notes: '',
})

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState(emptyContact())
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/crm').then(r => r.json()).then(data => {
      setContacts(Array.isArray(data) ? data : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3000) }

  const openNew = () => { setEditing(null); setForm(emptyContact()); setModal(true) }
  const openEdit = (c: Contact) => {
    setEditing(c)
    setForm({ name: c.name, email: c.email, phone: c.phone || '', company: c.company || '', status: c.status, service: c.service || '', budget: c.budget || 0, notes: c.notes || '' })
    setModal(true)
  }

  const save = async () => {
    if (!form.name || !form.email) return showMsg('❌ Nom et email obligatoires')
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/crm/${editing.id}` : '/api/crm'
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      showMsg(editing ? '✅ Contact mis à jour' : '✅ Contact ajouté')
      setModal(false); load()
    } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce contact ?')) return
    await fetch(`/api/crm/${id}`, { method: 'DELETE' })
    showMsg('🗑️ Contact supprimé'); load()
  }

  const filtered = contacts.filter(c => {
    const mf = filter === 'all' || c.status === filter
    const ms = !search || [c.name, c.email, c.company || ''].some(s => s.toLowerCase().includes(search.toLowerCase()))
    return mf && ms
  })

  const pipeline = STATUSES.map(s => ({ status: s, contacts: contacts.filter(c => c.status === s) }))

  return (
    <div>
      {msg && <div className="fixed top-4 right-4 px-4 py-3 rounded font-mono z-50" style={{ background: 'var(--s2)', border: '1px solid var(--brand)', fontSize: 13 }}>{msg}</div>}

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-oswald font-bold" style={{ fontSize: 32, letterSpacing: 1 }}>CRM</div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, marginTop: 4 }}>CONTACTS & PIPELINE ENIX LAB</div>
        </div>
        <button onClick={openNew} className="btn-brand">+ Nouveau Contact</button>
      </div>

      {/* Pipeline */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {pipeline.map(col => (
          <div key={col.status} className="enix-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className={`badge ${STATUS_BADGE[col.status]}`}>{STATUS_LABELS[col.status]}</span>
              <span className="font-mono" style={{ fontSize: 20, color: 'white', fontWeight: 700 }}>{col.contacts.length}</span>
            </div>
            {col.contacts.slice(0, 3).map(c => (
              <div key={c.id} className="p-2 mb-2 rounded" style={{ background: 'var(--s3)', cursor: 'pointer', fontSize: 12 }}
                onClick={() => openEdit(c)}>
                <div style={{ fontWeight: 500, color: 'var(--text1)' }}>{c.name}</div>
                <div style={{ color: 'var(--text3)' }}>{c.company || c.email}</div>
                {c.budget ? <div style={{ color: 'var(--success)', marginTop: 2 }}>{c.budget.toLocaleString()}€</div> : null}
              </div>
            ))}
            {col.contacts.length > 3 && <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>+{col.contacts.length - 3} autres</div>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="enix-input" style={{ width: 220 }} />
        {['all', ...STATUSES].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={f === filter ? 'btn-brand' : 'btn-ghost'} style={{ fontSize: 11, padding: '8px 14px' }}>
            {f === 'all' ? `Tous (${contacts.length})` : STATUS_LABELS[f as Contact['status']]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="enix-card overflow-hidden">
        {loading ? (
          <div className="p-8">{[1,2,3].map(i => <div key={i} className="skeleton h-12 mb-3 rounded" />)}</div>
        ) : (
          <table className="enix-table">
            <thead>
              <tr><th>NOM</th><th>SOCIÉTÉ</th><th>EMAIL</th><th>SERVICE</th><th>BUDGET</th><th>STATUT</th><th>ACTIONS</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text1)', fontWeight: 500 }}>{c.name}</td>
                  <td>{c.company || '—'}</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{c.email}</td>
                  <td>{c.service || '—'}</td>
                  <td style={{ color: c.budget ? 'var(--success)' : 'var(--text3)' }}>
                    {c.budget ? `${c.budget.toLocaleString()}€` : '—'}
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[c.status]}`}>{STATUS_LABELS[c.status]}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="btn-ghost" style={{ fontSize: 11, padding: '6px 10px' }}>✏️</button>
                      <button onClick={() => remove(c.id)} className="btn-danger" style={{ fontSize: 11, padding: '6px 10px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="font-oswald font-bold mb-6" style={{ fontSize: 20 }}>
              {editing ? '✏️ Modifier Contact' : '+ Nouveau Contact'}
            </div>
            <div className="space-y-4">
              {[
                { label: 'NOM *', key: 'name', type: 'text', placeholder: 'Jean Dupont' },
                { label: 'EMAIL *', key: 'email', type: 'email', placeholder: 'jean@example.com' },
                { label: 'TÉLÉPHONE', key: 'phone', type: 'text', placeholder: '+33...' },
                { label: 'SOCIÉTÉ', key: 'company', type: 'text', placeholder: 'Acme Corp' },
                { label: 'BUDGET (€)', key: 'budget', type: 'number', placeholder: '1000' },
              ].map(f => (
                <div key={f.key}>
                  <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={String(form[f.key as keyof typeof form] || '')}
                    onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    placeholder={f.placeholder} className="enix-input" />
                </div>
              ))}
              <div>
                <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>STATUT</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Contact['status'] }))} className="enix-select">
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
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
                  placeholder="Notes sur le client..." className="enix-input" style={{ minHeight: 80, resize: 'vertical' }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving} className="btn-brand">{saving ? '⏳' : editing ? 'Mettre à jour' : 'Créer'}</button>
              <button onClick={() => setModal(false)} className="btn-ghost">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
