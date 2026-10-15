import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useCart } from '~/lib/cart'
import { isTyping } from '~/lib/useGameKeys'
import { KeyHint } from './ui'

const TABS = [
  { label: 'Kampanja', to: '/', hash: 'top' },
  { label: 'Galerija', to: '/', hash: 'galerija' },
  { label: 'Bili smo', to: '/', hash: 'karta' },
  { label: 'Shop', to: '/shop', hash: undefined },
] as const

export function Header({ overlay = false }: { overlay?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const { count } = useCart()
  const onShop = pathname.startsWith('/shop')
  const [homeTab, setHomeTab] = useState(0)
  const tab = onShop ? 3 : homeTab

  const select = (i: number) => {
    const next = (i + TABS.length) % TABS.length
    const t = TABS[next]
    if (t.to === '/') setHomeTab(next)
    if (t.to === pathname) {
      const el = t.hash ? document.getElementById(t.hash) : null
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
      history.replaceState(history.state, '', t.hash ? `#${t.hash}` : t.to)
    } else {
      navigate({ to: t.to, hash: t.hash })
    }
  }

  // Q / E cycle the tabs, like a festival menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.repeat) return
      const k = e.key.toLowerCase()
      if (k !== 'q' && k !== 'e') return
      const hint = document.querySelector(`[data-key-hint="${k}"] button`)
      if (hint) (hint as HTMLElement).click()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <header
      className={`relative z-20 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-5 md:px-12 md:py-[26px] ${
        overlay ? 'xl:absolute xl:inset-x-0 xl:top-0' : ''
      }`}
    >
      <Link to="/" hash="top" className="group flex items-center gap-3.5" onClick={() => setHomeTab(0)}>
        <div className="flex size-[54px] items-center justify-center rounded-full bg-pink text-2xl font-extrabold italic transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110">
          MC
        </div>
        <div>
          <div className="text-2xl leading-none font-extrabold uppercase italic">Midnight Crew</div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm font-bold tracking-[.1em]">CREW LVL 26</span>
            <div className="h-1.5 w-[120px] -skew-x-[20deg] overflow-hidden bg-white/25 md:w-[160px]">
              <div className="h-full w-[68%] origin-left animate-[xp-fill_1.4s_cubic-bezier(.2,.9,.2,1)_.3s_both] bg-lime" />
            </div>
          </div>
        </div>
      </Link>

      <nav
        aria-label="Glavna navigacija"
        className="order-3 flex w-full items-center gap-1.5 overflow-x-auto text-lg font-extrabold uppercase italic md:order-none md:w-auto md:text-xl"
      >
        <span className="hidden sm:contents">
          <span data-key-hint="q" className="contents" onClick={() => select(tab - 1)}>
            <KeyHint label="Prethodna kartica">Q</KeyHint>
          </span>
        </span>
        {TABS.map((t, i) => (
          <a
            key={t.label}
            href={t.hash ? `${t.to}#${t.hash}` : t.to}
            onClick={(e) => {
              e.preventDefault()
              select(i)
            }}
            aria-current={i === tab ? 'page' : undefined}
            className="fh-wipe shrink-0 px-3 py-2.5 transition-colors md:px-[18px]"
          >
            {t.label}
          </a>
        ))}
        <span className="hidden sm:contents">
          <span data-key-hint="e" className="contents" onClick={() => select(tab + 1)}>
            <KeyHint label="Sljedeća kartica">E</KeyHint>
          </span>
        </span>
      </nav>

      <Link
        to="/shop"
        hash="kosarica"
        className="group flex -skew-x-[14deg] items-center gap-2.5 bg-black/45 px-4 py-2.5 text-xl font-bold transition-colors hover:bg-white hover:text-ink"
        aria-label={`Košarica, ${count} artikala`}
      >
        <span className="text-lime group-hover:text-pink-deep">KOŠ</span>
        <span key={count} className="inline-block animate-[pad-press_.3s_ease-out]">{count}</span>
        <span className="hidden sm:inline"> · Košarica</span>
      </Link>
    </header>
  )
}
