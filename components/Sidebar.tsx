'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Dashboard', icon: '⬡', desc: 'Vue globale' },
  { href: '/crm', label: 'CRM', icon: '👥', desc: 'Contacts & Pipeline' },
  { href: '/agenda', label: 'Agenda', icon: '📅', desc: 'Rendez-vous' },
  { href: '/devis', label: 'Devis / Factures', icon: '📄', desc: 'Facturation' },
  { href: '/newslab', label: 'NewsLab', icon: '📰', desc: 'Articles automatiques' },
  { href: '/arsenal', label: 'Arsenal SMMA', icon: '⚔️', desc: 'Scraper & Prospection' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] flex flex-col"
      style={{
        background: 'var(--s1)',
        borderRight: '1px solid var(--border)',
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--brand)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              flexShrink: 0,
            }}
          />
          <div>
            <div
              className="font-oswald font-bold text-white"
              style={{ fontSize: 15, letterSpacing: 2 }}
            >
              ENIX LAB®
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 1.5, marginTop: 1 }}
            >
              COMMAND CENTER
            </div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div
        className="px-4 py-2 mx-4 mt-4 rounded"
        style={{ background: 'rgba(0,204,90,0.08)', border: '1px solid rgba(0,204,90,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: 'var(--success)',
              boxShadow: '0 0 8px var(--success)',
              animation: 'pulse 2s infinite',
            }}
          />
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--success)', letterSpacing: 1 }}>
            SYSTÈME OPÉRATIONNEL
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {NAV.map((item) => {
          const active = item.href === '/' ? path === '/' : path.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded mb-1 transition-all ${
                active ? 'nav-active' : ''
              }`}
              style={{
                color: active ? 'white' : 'var(--text2)',
                textDecoration: 'none',
                borderLeft: active ? '2px solid var(--brand)' : '2px solid transparent',
                background: active ? 'rgba(0,71,255,0.1)' : 'transparent',
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{item.desc}</div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 1 }}>
          <div>BUILD v1.0.0</div>
          <div style={{ marginTop: 2 }}>VOID CONSTRUCTIVISM</div>
          <div style={{ marginTop: 2, color: 'var(--brand)', opacity: 0.7 }}>
            {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>
    </aside>
  )
}
