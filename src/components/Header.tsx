import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCart } from '~/lib/cart'
import { crewLevel } from '~/lib/data'
import { isTyping } from '~/lib/useGameKeys'
import { KeyHint } from './ui'
import { useGarageDoor } from './GarageDoor'

const TABS = [
  { label: 'Kampanja', to: '/', hash: 'top' },
  { label: 'Galerija', to: '/', hash: 'galerija' },
  { label: 'Bili smo', to: '/', hash: 'karta' },
  { label: 'Garaža', to: '/garaza', hash: undefined },
  { label: 'Shop', to: '/shop', hash: undefined },
] as const

export function Header({ overlay = false }: { overlay?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const door = useGarageDoor()
  const { count } = useCart()
  const [homeTab, setHomeTab] = useState(0)
  // Pages other than the landing page have their own tab.
  const pageTab = TABS.findIndex((t) => t.to !== '/' && pathname.startsWith(t.to))
  const tab = pageTab >= 0 ? pageTab : homeTab
  const lvl = crewLevel()
  const [compact, setCompact] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const [spacer, setSpacer] = useState<number>()

  // Shrink once the page has scrolled past the top.
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The header is fixed, so an in-flow spacer keeps its full (unshrunk) height.
  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      if (window.scrollY <= 60) setSpacer(el.offsetHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const select = (i: number) => {
    const next = (i + TABS.length) % TABS.length
    const t = TABS[next]
    if (t.to === '/') setHomeTab(next)
    if (t.to === pathname) {
      const el = t.hash ? document.getElementById(t.hash) : null
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
      history.replaceState(history.state, '', t.hash ? `#${t.hash}` : t.to)
    } else if (t.to === '/garaza' || pathname === '/garaza') {
      door.enter(t.hash ? `${t.to}#${t.hash}` : t.to)
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
    <>
      <div aria-hidden="true" className={overlay ? 'xl:hidden' : ''} style={{ height: spacer ?? 'var(--header-h)' }} />
      <header
        ref={headerRef}
        data-compact={compact || undefined}
        className={`fixed inset-x-0 top-0 z-30 flex flex-wrap items-center justify-between gap-x-3 gap-y-4 px-5 py-5 sm:gap-x-6 transition-[padding,background-color,box-shadow,gap] duration-300 ease-out md:px-(--gutter) md:py-[26px] ${
          compact
            ? 'gap-y-2 bg-ink/90 !py-2.5 shadow-[0_1px_0_rgba(255,255,255,.08),0_12px_30px_-12px_rgba(0,0,0,.7)] backdrop-blur-md md:!py-3'
            : ''
        }`}
      >
        <Link to="/" hash="top" className="group flex items-center gap-3.5" onClick={() => setHomeTab(0)}>
          <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-pink font-extrabold italic transition-[width,height,font-size,rotate,scale] duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 ${
              compact ? 'size-10 text-lg' : 'size-[54px] text-2xl'
            }`}
          >
            {/* Italic caps sit low in the circle; nudge them up so they look centred */}
            <span className="-translate-y-[2px] pr-[2px]">MC</span>
          </div>
          <div>
            <div
              className={`leading-none font-extrabold uppercase italic transition-[font-size] duration-300 ${compact ? 'text-xl' : 'text-2xl'}`}
            >
              Midnight Crew
            </div>
            <div
              className={`flex items-center gap-2 overflow-hidden transition-[max-height,opacity,margin] duration-300 ${
                compact ? 'mt-0 max-h-0 opacity-0' : 'mt-1.5 max-h-6 opacity-100'
              }`}
            >
              <span className="text-sm font-bold tracking-[.1em]">CREW LVL {lvl.level}</span>
              <div className="h-1.5 w-[70px] -skew-x-[20deg] overflow-hidden bg-white/25 sm:w-[120px] md:w-[160px]">
                <div
                  className="h-full origin-left animate-[xp-fill_1.4s_cubic-bezier(.2,.9,.2,1)_.3s_both] bg-lime"
                  style={{ width: `${Math.round(lvl.progress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Link>

        <nav
          aria-label="Glavna navigacija"
          className="order-3 flex w-full items-center gap-1.5 overflow-x-auto text-lg font-extrabold uppercase italic md:order-none md:w-auto md:text-xl"
        >
          <span className="hidden sm:contents">
            <span data-key-hint="q" className="mr-4 flex" onClick={() => select(tab - 1)}>
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
              className={`fh-wipe shrink-0 px-3 transition-[color,padding] duration-300 md:px-[18px] ${compact ? 'py-1.5' : 'py-2.5'}`}
            >
              {t.label}
            </a>
          ))}
          <span className="hidden sm:contents">
            <span data-key-hint="e" className="ml-4 flex" onClick={() => select(tab + 1)}>
              <KeyHint label="Sljedeća kartica">E</KeyHint>
            </span>
          </span>
        </nav>

        <Link
          to="/shop"
          hash="kosarica"
          className={`group flex -skew-x-[14deg] items-center gap-2.5 bg-black/45 px-4 text-xl font-bold transition-[color,background-color,padding] duration-300 hover:bg-white hover:text-ink ${
            compact ? 'py-1.5' : 'py-2.5'
          }`}
          aria-label={`Košarica, ${count} artikala`}
        >
          <span className="text-lime group-hover:text-pink-deep">KOŠ</span>
          <span key={count} className="inline-block animate-[pad-press_.3s_ease-out]">
            {count}
          </span>
          <span className="hidden sm:inline"> · Košarica</span>
        </Link>
      </header>
    </>
  )
}
