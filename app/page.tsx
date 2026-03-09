'use client'
import { useEffect, useState } from 'react'
import type { DashboardStats, Article, Lead } from '@/lib/types'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0, articlesQueue: 0, totalContacts: 0,
    mailsSent: 0, convertedLeads: 0, publishedArticles: 0,
  })
  const [recentArticles, setRecentArticles] = useState<Article[]>([])
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/articles').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/crm').then(r => r.json()),
    ]).then(([articles, leads, contacts]) => {
      const queue = (articles || []).filter((a: Article) => a.status === 'queue')
      const published = (articles || []).filter((a: Article) => a.status === 'published')
      const converted = (leads || []).filter((l: Lead) => l.status === 'converti')
      const mailsSent = (leads || []).reduce((acc: number, l: Lead) => acc + (l.mailsSent || 0), 0)
      setStats({
        totalLeads: (leads || []).length,
        articlesQueue: queue.length,
        totalContacts: (contacts || []).length,
        mailsSent,
        convertedLeads: converted.length,
        publishedArticles: published.length,
      })
      setRecentArticles(queue.slice(0, 3))
      setRecentLeads((leads || []).slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  const KPI = ({ value, label, sub, color }: { value: number | string, label: string, sub?: string, color?: string }) => (
    <div className="kpi-card">
      <div className="kpi-value" style={{ color: color || 'white' }}>{loading ? '—' : value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{sub}</div>}
    </div>
  )

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      nouveau: 'badge-blue', mail1_envoyé: 'badge-orange', mail2_envoyé: 'badge-orange',
      mail3_envoyé: 'badge-orange', réponse: 'badge-cyan', converti: 'badge-green',
      stop: 'badge-gray', queue: 'badge-blue', published: 'badge-green',
    }
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-oswald font-bold" style={{ fontSize: 32, letterSpacing: 1 }}>
            WAR ROOM
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, marginTop: 4 }}>
            ENIX LAB® — COMMAND CENTER // DIGITAL BLACK OPS
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono" style={{ fontSize: 20, color: 'var(--brand)' }}>
            {time.toLocaleTimeString('fr-FR')}
          </div>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>
            {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <KPI value={stats.totalLeads} label="Leads Totaux" sub={`${stats.convertedLeads} convertis`} color="var(--cyan)" />
        <KPI value={stats.articlesQueue} label="Articles en file" sub={`${stats.publishedArticles} publiés`} color="var(--brand)" />
        <KPI value={stats.totalContacts} label="Contacts CRM" color="white" />
        <KPI value={stats.mailsSent} label="Emails Envoyés" color="var(--warning)" />
        <KPI value={stats.convertedLeads} label="Conversions" sub="Arsenal SMMA" color="var(--success)" />
        <KPI value={`${stats.totalLeads > 0 ? Math.round(stats.convertedLeads / stats.totalLeads * 100) : 0}%`} label="Taux Conversion" color="white" />
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Recent Articles */}
        <div className="enix-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-oswald font-bold" style={{ fontSize: 16, letterSpacing: 1 }}>
              📰 FILE ARTICLES
            </div>
            <a href="/newslab" className="btn-ghost" style={{ fontSize: 11 }}>Voir tout →</a>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-12" />)}
            </div>
          ) : recentArticles.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              Aucun article en attente
            </div>
          ) : (
            <div className="space-y-3">
              {recentArticles.map(a => (
                <div key={a.id} className="p-3 rounded" style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-blue">{a.tag}</span>
                    <span className="badge badge-orange">EN ATTENTE</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 500 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{a.excerpt?.slice(0, 80)}...</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="enix-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-oswald font-bold" style={{ fontSize: 16, letterSpacing: 1 }}>
              ⚔️ DERNIERS LEADS
            </div>
            <a href="/arsenal" className="btn-ghost" style={{ fontSize: 11 }}>Voir tout →</a>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-10" />)}
            </div>
          ) : recentLeads.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              Aucun lead — Lance le scraper
            </div>
          ) : (
            <table className="enix-table">
              <thead>
                <tr>
                  <th>NOM</th>
                  <th>VILLE</th>
                  <th>STATUT</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map(l => (
                  <tr key={l.id}>
                    <td style={{ color: 'var(--text1)', fontWeight: 500 }}>{l.name}</td>
                    <td>{l.city}</td>
                    <td>{statusBadge(l.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="enix-card p-6 mt-6">
        <div className="font-oswald font-bold mb-4" style={{ fontSize: 14, letterSpacing: 2, color: 'var(--text3)' }}>
          ACTIONS RAPIDES
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/newslab" className="btn-brand">📰 Générer Articles</a>
          <a href="/arsenal" className="btn-brand">⚔️ Lancer Scraper</a>
          <a href="/crm" className="btn-brand">👥 Ajouter Contact</a>
          <a href="/devis" className="btn-brand">📄 Nouveau Devis</a>
          <a href="/agenda" className="btn-brand">📅 Prendre RDV</a>
        </div>
      </div>
    </div>
  )
}
