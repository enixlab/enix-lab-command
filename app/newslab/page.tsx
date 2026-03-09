'use client'
import Image from 'next/image'
import { useEffect, useState, useCallback } from 'react'
import type { Article } from '@/lib/types'

const TAG_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  'IA':            { bg: '#0047FF12', text: '#5599FF', border: '#0047FF33', accent: '#0047FF' },
  'IA / Sécurité': { bg: '#FF004412', text: '#FF6688', border: '#FF004433', accent: '#FF0044' },
  'Marketing':     { bg: '#FF880012', text: '#FFAA44', border: '#FF880033', accent: '#FF8800' },
  'Crypto':        { bg: '#F5A62312', text: '#F5C65A', border: '#F5A62333', accent: '#F5A623' },
  'Emploi / IA':   { bg: '#FF330012', text: '#FF6644', border: '#FF330033', accent: '#FF3300' },
  'Business':      { bg: '#00CC5A12', text: '#44EE88', border: '#00CC5A33', accent: '#00CC5A' },
  'Tech':          { bg: '#00FFFF12', text: '#44EEFF', border: '#00FFFF33', accent: '#00FFFF' },
  'Bad Buzz':      { bg: '#CC000012', text: '#FF4444', border: '#CC000033', accent: '#CC0000' },
}

const CATEGORIES = ['Tout', 'IA', 'IA / Sécurité', 'Marketing', 'Crypto', 'Emploi / IA', 'Business', 'Tech', 'Bad Buzz']

function getTagStyle(tag: string) {
  return TAG_COLORS[tag] || { bg: '#ffffff08', text: 'rgba(255,255,255,0.5)', border: '#ffffff15', accent: '#888' }
}

export default function NewsLabPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [correcting, setCorrecting] = useState<string | null>(null)
  const [correctionNote, setCorrectionNote] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tab, setTab] = useState<'queue' | 'published'>('queue')
  const [categoryFilter, setCategoryFilter] = useState('Tout')
  const [msg, setMsg] = useState<string | null>(null)
  const [autoGenDone, setAutoGenDone] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/articles').then(r => r.json()).then(data => {
      setArticles(Array.isArray(data) ? data : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-generate if queue has fewer than 3 articles
  useEffect(() => {
    if (!loading && !autoGenDone) {
      const queueCount = articles.filter(a => a.status === 'queue').length
      if (queueCount < 3) {
        setAutoGenDone(true)
        runGenerate()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, articles])

  const filteredArticles = articles.filter(a => {
    if (a.status !== tab) return false
    if (categoryFilter !== 'Tout' && a.tag !== categoryFilter) return false
    return true
  })
  const queueCount = articles.filter(a => a.status === 'queue').length
  const publishedCount = articles.filter(a => a.status === 'published').length

  const showMsg = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 4000)
  }

  const runGenerate = async () => {
    setGenerating(true)
    showMsg('🌐 Veille mondiale en cours — sources FR/US/UK/CH...')
    try {
      const res = await fetch('/api/generate/article', { method: 'POST' })
      const data = await res.json()
      if (data.error) showMsg(`❌ ${data.error}`)
      else showMsg(`✅ ${data.count || 0} article(s) généré(s) par Claude Opus`)
      load()
    } catch {
      showMsg('❌ Erreur de génération')
    } finally {
      setGenerating(false)
    }
  }

  const validate = async (id: string) => {
    await fetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    })
    showMsg('✅ Article publié !')
    load()
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return
    await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    showMsg('🗑️ Supprimé.')
    load()
  }

  const correct = async (id: string) => {
    if (!correctionNote.trim()) return
    setCorrecting(null)
    setGenerating(true)
    showMsg('✍️ Régénération Claude Opus en cours...')
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

  return (
    <div>
      {/* Toast */}
      {msg && (
        <div className="fixed top-4 right-4 px-5 py-3 rounded font-mono z-50"
          style={{ background: 'var(--s2)', border: '1px solid var(--brand)', fontSize: 13, boxShadow: '0 0 24px rgba(0,71,255,0.3)' }}>
          {msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Image src="/logo-small.png" alt="ENIX LAB" width={28} height={28} style={{ objectFit: 'contain' }} />
            <div className="font-oswald font-bold" style={{ fontSize: 30, letterSpacing: 2 }}>NEWSLAB MAG</div>
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, marginTop: 4 }}>
            VEILLE MONDIALE AUTOMATISÉE — CLAUDE OPUS 4.6 — mag.enix-lab.com
          </div>
        </div>
        <button onClick={runGenerate} disabled={generating} className="btn-brand" style={{ fontSize: 13 }}>
          {generating ? '⏳ Génération...' : '🔎 Générer Articles'}
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
      <div className="flex gap-2 mb-4">
        {(['queue', 'published'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={t === tab ? 'btn-brand' : 'btn-ghost'}
            style={{ fontSize: 12, padding: '8px 16px' }}>
            {t === 'queue' ? `📥 File (${queueCount})` : `✅ Publiés (${publishedCount})`}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => {
          const style = cat === 'Tout' ? null : getTagStyle(cat)
          const active = categoryFilter === cat
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: active
                  ? `1px solid ${style?.accent || 'var(--brand)'}`
                  : '1px solid rgba(255,255,255,0.1)',
                background: active
                  ? (style?.bg || 'rgba(0,71,255,0.15)')
                  : 'transparent',
                color: active
                  ? (style?.text || 'white')
                  : 'rgba(255,255,255,0.4)',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
                fontWeight: 700,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Articles */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded" />)}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="enix-card p-12 text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
          <div className="font-oswald" style={{ fontSize: 20, marginBottom: 8 }}>
            {generating ? 'Génération en cours...' : tab === 'queue' ? 'Aucun article en attente' : 'Aucun article publié'}
          </div>
          {!generating && tab === 'queue' && (
            <button onClick={runGenerate} className="btn-brand" style={{ marginTop: 16 }}>
              Générer maintenant
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map(article => {
            const tagStyle = getTagStyle(article.tag)
            return (
              <div key={article.id} className="enix-card" style={{ overflow: 'hidden' }}>
                {/* Tag accent line */}
                <div style={{ height: 3, background: tagStyle.accent, opacity: 0.8 }} />

                <div className="p-6">
                  {/* Article header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          background: tagStyle.bg,
                          color: tagStyle.text,
                          border: `1px solid ${tagStyle.border}`,
                        }}>
                          {article.tag}
                        </span>
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text3)' }}>
                          {article.source} • {new Date(article.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                        {article.lang && (
                          <span className="font-mono" style={{ fontSize: 9, color: 'var(--text3)', opacity: 0.6 }}>
                            [{article.lang}]
                          </span>
                        )}
                      </div>
                      <div
                        className="font-oswald"
                        style={{ fontSize: 19, color: 'white', lineHeight: 1.25, cursor: 'pointer' }}
                        onClick={() => setExpanded(expanded === article.id ? null : article.id)}
                      >
                        {article.title}
                        <span style={{ fontSize: 12, color: 'var(--brand)', marginLeft: 8, opacity: 0.7 }}>
                          {expanded === article.id ? '▲' : '▼'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>
                        {article.excerpt}
                      </div>
                    </div>

                    {/* Actions */}
                    {tab === 'queue' && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => validate(article.id)} className="btn-brand" style={{ fontSize: 12, padding: '8px 16px' }}>
                          ✅ Publier
                        </button>
                        <button
                          onClick={() => {
                            setCorrecting(correcting === article.id ? null : article.id)
                            setExpanded(article.id)
                          }}
                          className="btn-ghost" style={{ fontSize: 12, padding: '8px 16px' }}>
                          ✏️ Corriger
                        </button>
                        <button onClick={() => deleteArticle(article.id)} className="btn-danger" style={{ fontSize: 12, padding: '8px 16px' }}>
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Correction box */}
                  {correcting === article.id && (
                    <div className="mt-4 p-4 rounded" style={{ background: 'var(--s3)', border: '1px solid var(--border-b)' }}>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                        📝 Instructions pour Claude Opus (régénération immédiate) :
                      </div>
                      <textarea
                        value={correctionNote}
                        onChange={e => setCorrectionNote(e.target.value)}
                        placeholder="Ex: Rends le ton plus agressif, ajoute des chiffres concrets, parle de l'impact sur les PME..."
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

                  {/* Expand/collapse */}
                  <button
                    onClick={() => setExpanded(expanded === article.id ? null : article.id)}
                    className="btn-ghost mt-4"
                    style={{ fontSize: 11, padding: '6px 12px' }}
                  >
                    {expanded === article.id ? '▲ Masquer' : '▼ Lire l\'article complet'}
                  </button>

                  {expanded === article.id && article.content && (
                    <div
                      className="article-content mt-4 p-5 rounded"
                      style={{ background: 'var(--s3)', border: `1px solid ${tagStyle.border}` }}
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
