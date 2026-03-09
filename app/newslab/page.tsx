'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Article } from '@/lib/types'

export default function NewsLabPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [correcting, setCorrecting] = useState<string | null>(null)
  const [correctionNote, setCorrectionNote] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tab, setTab] = useState<'queue' | 'published'>('queue')
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/articles').then(r => r.json()).then(data => {
      setArticles(Array.isArray(data) ? data : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = articles.filter(a => a.status === tab)
  const queueCount = articles.filter(a => a.status === 'queue').length
  const publishedCount = articles.filter(a => a.status === 'published').length

  const showMsg = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 3000)
  }

  const validate = async (id: string) => {
    await fetch(`/api/articles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'published' }) })
    showMsg('✅ Article publié !')
    load()
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return
    await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    showMsg('🗑️ Article supprimé.')
    load()
  }

  const correct = async (id: string) => {
    if (!correctionNote.trim()) return
    setCorrecting(null)
    setGenerating(true)
    showMsg('✍️ Régénération en cours...')
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correctionNote, action: 'regenerate' }),
      })
      if (res.ok) { showMsg('✅ Article régénéré !'); load() }
      else showMsg('❌ Erreur régénération')
    } finally {
      setGenerating(false)
      setCorrectionNote('')
    }
  }

  const generate = async () => {
    setGenerating(true)
    showMsg('🔎 Recherche mondiale en cours...')
    try {
      const res = await fetch('/api/generate/article', { method: 'POST' })
      const data = await res.json()
      showMsg(`✅ ${data.count || 0} article(s) ajouté(s) à la file`)
      load()
    } catch {
      showMsg('❌ Erreur de génération')
    } finally {
      setGenerating(false)
    }
  }

  const tagColor = (tag: string) => {
    const map: Record<string, string> = {
      'IA AGENTIQUE': 'badge-cyan', 'BAD BUZZ': 'badge-red', 'TECH-CRASH': 'badge-orange',
      'CRYPTO-GUÉRILLA': 'badge-orange', 'MARKETING-LAB': 'badge-blue', 'SOCIAL-MEDIA': 'badge-blue', 'E-COMMERCE': 'badge-green',
    }
    return map[tag] || 'badge-gray'
  }

  return (
    <div>
      {msg && (
        <div className="fixed top-4 right-4 px-4 py-3 rounded font-mono z-50"
          style={{ background: 'var(--s2)', border: '1px solid var(--brand)', fontSize: 13 }}>
          {msg}
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-oswald font-bold" style={{ fontSize: 32, letterSpacing: 1 }}>NEWSLAB</div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, marginTop: 4 }}>
            VEILLE MONDIALE AUTOMATISÉE // mag.enix-lab.com
          </div>
        </div>
        <button onClick={generate} disabled={generating} className="btn-brand" style={{ fontSize: 13 }}>
          {generating ? '⏳ En cours...' : '🔎 Générer Articles'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { val: queueCount, label: 'EN FILE', color: 'var(--brand)' },
          { val: publishedCount, label: 'PUBLIÉS', color: 'var(--success)' },
          { val: articles.filter(a => a.status === 'rejected').length, label: 'REJETÉS', color: 'var(--text3)' },
        ].map(s => (
          <div key={s.label} className="kpi-card">
            <div className="kpi-value" style={{ color: s.color }}>{s.val}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['queue', 'published'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={t === tab ? 'btn-brand' : 'btn-ghost'}
            style={{ fontSize: 12, padding: '8px 16px' }}>
            {t === 'queue' ? `📥 File (${queueCount})` : `✅ Publiés (${publishedCount})`}
          </button>
        ))}
      </div>

      {/* Articles */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="enix-card p-12 text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
          <div className="font-oswald" style={{ fontSize: 20, marginBottom: 8 }}>
            {tab === 'queue' ? 'Aucun article en attente' : 'Aucun article publié'}
          </div>
          {tab === 'queue' && (
            <button onClick={generate} className="btn-brand" style={{ marginTop: 16 }}>
              Générer des articles maintenant
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(article => (
            <div key={article.id} className="enix-card p-6">
              {/* Article header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${tagColor(article.tag)}`}>{article.tag}</span>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text3)' }}>
                      {article.source} • {new Date(article.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="font-oswald" style={{ fontSize: 20, color: 'white', lineHeight: 1.2 }}>
                    {article.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>{article.excerpt}</div>
                </div>

                {/* Actions */}
                {tab === 'queue' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => validate(article.id)} className="btn-brand" style={{ fontSize: 12, padding: '8px 16px' }}>
                      ✅ Valider
                    </button>
                    <button onClick={() => { setCorrecting(article.id); setExpanded(article.id) }}
                      className="btn-ghost" style={{ fontSize: 12, padding: '8px 16px' }}>
                      ✏️ Corriger
                    </button>
                    <button onClick={() => deleteArticle(article.id)} className="btn-danger" style={{ fontSize: 12, padding: '8px 16px' }}>
                      🗑️ Supprimer
                    </button>
                  </div>
                )}
              </div>

              {/* Correction box */}
              {correcting === article.id && (
                <div className="mt-4 p-4 rounded" style={{ background: 'var(--s3)', border: '1px solid var(--border-b)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                    📝 Tes corrections (je régénère immédiatement) :
                  </div>
                  <textarea
                    value={correctionNote}
                    onChange={e => setCorrectionNote(e.target.value)}
                    placeholder="Ex: Rends le ton plus agressif, parle de l'impact sur les PME..."
                    className="enix-input mb-3"
                    style={{ minHeight: 80, resize: 'vertical' }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => correct(article.id)} className="btn-brand" style={{ fontSize: 12 }}>
                      🔄 Régénérer
                    </button>
                    <button onClick={() => setCorrecting(null)} className="btn-ghost" style={{ fontSize: 12 }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Expand content */}
              <button
                onClick={() => setExpanded(expanded === article.id ? null : article.id)}
                className="btn-ghost mt-4"
                style={{ fontSize: 11, padding: '6px 12px' }}
              >
                {expanded === article.id ? '▲ Masquer le contenu' : '▼ Lire l\'article complet'}
              </button>

              {expanded === article.id && article.content && (
                <div
                  className="article-content mt-4 p-4 rounded"
                  style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
