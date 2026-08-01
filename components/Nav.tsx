'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/setup', label: 'Setup', icon: '⊕' },
  { href: '/log', label: 'Log', icon: '≡' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 border-b"
      style={{ background: 'rgba(15,15,16,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--accent)' }}>ADVAIT</span>
          <nav className="flex items-center gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: pathname === l.href ? 'var(--surface2)' : 'transparent',
                  color: pathname === l.href ? 'var(--text)' : 'var(--muted)',
                }}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ color: 'var(--muted)', background: 'transparent' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--surface2)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent' }}
        >
          Logout
        </button>
      </div>
    </header>
  )
}
