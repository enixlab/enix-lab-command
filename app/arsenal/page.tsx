'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Lead } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = {
  nouveau: 'NOUVEAU', mail1_envoyé: 'MAIL 1 ✓', mail2_envoyé: 'MAIL 2 ✓',
  mail3_envoyé: 'MAIL 3 ✓', réponse: 'RÉPONSE ⚡', converti: 'CONVERTI 💰', stop: 'STOP',
}
const STATUS_BADGE: Record<string, string> = {
  nouveau: 'badge-blue', mail1_envoyé: 'badge-orange', mail2_envoyé: 'badge-orange',
  mail3_envoyé: 'badge-orange', réponse: 'badge-cyan', converti: 'badge-green', stop: 'badge-gray',
}

export default function ArsenalPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [city, setCity] = useState('Paris')
  const [limit, setLimit] = useState(10)
  const [filter, setFilter] = useState<string>('all')
  const [msg, setMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [enriching, setEnriching] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/leads').then(r => r.json()).then(data => {
      setLeads(Array.isArray(data) ? data : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const showMsg = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 4000)
  }

  const enrichEmails = async () => {
    setEnriching(true)
    showMsg('🔍 Recherche emails en cours (Pages Jaunes, Kompass, sites web)...')
    try {
      const res = await fetch('/api/arsenal/enrich', { method: 'POST' })
      const data = await res.json()
      if (data.error) showMsg(`❌ ${data.error}`)
      else showMsg(`✅ ${data.enriched}/${data.total} emails trouvés`)
      load()
    } catch {
      showMsg('❌ Erreur enrichissement')
    } finally {
      setEnriching(false)
    }
  }

  const launchScrape = async () => {
    setScraping(true)
    showMsg(`🔎 Scraping serruriers à ${city}...`)
    try {
      const res = await fetch('/api/arsenal/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, limit }),
      })
      const data = await res.json()
      showMsg(`✅ ${data.found || 0} leads trouvés, ${data.added || 0} ajoutés`)
      load()
    } catch {
      showMsg('❌ Erreur scraper')
    } finally {
      setScraping(false)
    }
  }

  const deployAndSend = async (lead: Lead, mailNum: 1 | 2 | 3) => {
    setSending(lead.id)
    showMsg(`📨 Déploiement landing page + envoi mail ${mailNum}...`)
    try {
      const res = await fetch('/api/arsenal/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, mailNumber: mailNum }),
      })
      const data = await res.json()
      if (data.success) {
        showMsg(`✅ Mail ${mailNum} envoyé à ${lead.email || lead.name}`)
        load()
      } else {
        showMsg(`❌ Erreur: ${data.error}`)
      }
    } catch {
      showMsg('❌ Erreur envoi')
    } finally {
      setSending(null)
    }
  }

  const filtered = leads.filter(l => {
    const matchFilter = filter === 'all' || l.status === filter
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase()) || (l.email || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const stats = {
    total: leads.length,
    sansEmail: leads.filter(l => !l.email).length,
    contacted: leads.filter(l => ['mail1_envoyé','mail2_envoyé','mail3_envoyé'].includes(l.status)).length,
    réponses: leads.filter(l => l.status === 'réponse').length,
    convertis: leads.filter(l => l.status === 'converti').length,
  }

  return (
    <div>
      {msg && (
        <div className="fixed top-4 right-4 px-4 py-3 rounded font-mono z-50"
          style={{ background: 'var(--s2)', border: '1px solid var(--brand)', fontSize: 13, maxWidth: 400 }}>
          {msg}
        </div>
      )}

      <div className="mb-8">
        <div className="font-oswald font-bold" style={{ fontSize: 32, letterSpacing: 1 }}>ARSENAL SMMA</div>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, marginTop: 4 }}>
          PROSPECTION AUTOMATIQUE SERRURIERS FRANCE
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { val: stats.total, label: 'LEADS TOTAL', color: 'white' },
          { val: stats.sansEmail, label: 'SANS EMAIL', color: 'var(--danger)' },
          { val: stats.contacted, label: 'CONTACTÉS', color: 'var(--warning)' },
          { val: stats.réponses, label: 'RÉPONSES', color: 'var(--cyan)' },
          { val: stats.convertis, label: 'CONVERTIS', color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="kpi-card">
            <div className="kpi-value" style={{ color: s.color }}>{s.val}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scraper Config */}
      <div className="enix-card p-6 mb-6">
        <div className="font-oswald font-bold mb-4" style={{ fontSize: 16, letterSpacing: 1 }}>
          🎯 LANCER LE SCRAPER
        </div>
        <div className="flex gap-4 items-end flex-wrap">
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>VILLE CIBLE</label>
            <input value={city} onChange={e => setCity(e.target.value)}
              placeholder="Paris, Lyon, Marseille..." className="enix-input" />
          </div>
          <div style={{ width: 120 }}>
            <label className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, display: 'block', marginBottom: 6 }}>LIMITE</label>
            <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))}
              min={1} max={50} className="enix-input" />
          </div>
          <button onClick={launchScrape} disabled={scraping} className="btn-brand" style={{ fontSize: 13 }}>
            {scraping ? '⏳ Scraping...' : '🔎 Lancer'}
          </button>
          <button onClick={enrichEmails} disabled={enriching || stats.sansEmail === 0} className="btn-ghost" style={{ fontSize: 13 }}>
            {enriching ? '⏳ Recherche...' : `📧 Enrichir emails (${stats.sansEmail})`}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12 }}>
          Scrape Google Maps → trouve emails (Pages Jaunes, Kompass, site web) → génère landing page → envoie séquence email
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..." className="enix-input" style={{ width: 200 }} />
        {['all', 'nouveau', 'mail1_envoyé', 'réponse', 'converti', 'stop'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={f === filter ? 'btn-brand' : 'btn-ghost'}
            style={{ fontSize: 11, padding: '8px 14px' }}>
            {f === 'all' ? `Tous (${leads.length})` : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <div className="enix-card overflow-hidden">
        {loading ? (
          <div className="p-8">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-10 mb-3 rounded" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
            <div className="font-oswald" style={{ fontSize: 20, marginBottom: 8 }}>Aucun lead trouvé</div>
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>Lance le scraper pour trouver des prospects</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="enix-table">
              <thead>
                <tr>
                  <th>NOM</th>
                  <th>VILLE</th>
                  <th>EMAIL</th>
                  <th>TÉLÉPHONE</th>
                  <th>STATUT</th>
                  <th>LANDING PAGE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}>
                    <td style={{ color: 'var(--text1)', fontWeight: 500 }}>{lead.name}</td>
                    <td>{lead.city}</td>
                    <td className="font-mono" style={{ fontSize: 12, color: lead.email ? 'var(--text2)' : 'var(--text3)' }}>
                      {lead.email || <em>Pas d&apos;email</em>}
                    </td>
                    <td className="font-mono" style={{ fontSize: 12 }}>{lead.phone || '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[lead.status] || 'badge-gray'}`}>{STATUS_LABELS[lead.status]}</span></td>
                    <td>
                      {lead.landingUrl ? (
                        <a href={lead.landingUrl} target="_blank" rel="noopener"
                          style={{ color: 'var(--cyan)', fontSize: 12, textDecoration: 'none' }}>
                          🔗 Voir
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {lead.status === 'nouveau' && (
                          <button onClick={() => deployAndSend(lead, 1)}
                            disabled={sending === lead.id}
                            className="btn-brand"
                            style={{ fontSize: 11, padding: '6px 10px' }}>
                            {sending === lead.id ? '⏳' : '📨 Mail 1'}
                          </button>
                        )}
                        {lead.status === 'mail1_envoyé' && (
                          <button onClick={() => deployAndSend(lead, 2)}
                            disabled={sending === lead.id}
                            className="btn-brand"
                            style={{ fontSize: 11, padding: '6px 10px' }}>
                            {sending === lead.id ? '⏳' : '📨 Relance'}
                          </button>
                        )}
                        {lead.status === 'mail2_envoyé' && (
                          <button onClick={() => deployAndSend(lead, 3)}
                            disabled={sending === lead.id}
                            className="btn-brand"
                            style={{ fontSize: 11, padding: '6px 10px' }}>
                            {sending === lead.id ? '⏳' : '📨 Finale 500€'}
                          </button>
                        )}
                        {lead.landingUrl && (
                          <a href={lead.landingUrl} target="_blank" rel="noopener" className="btn-ghost" style={{ fontSize: 11, padding: '6px 10px' }}>🔗</a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
