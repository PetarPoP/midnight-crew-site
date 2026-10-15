import { ArrowRight, ArrowUp, Diamond } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { EVENTS, INSTAGRAM_URL, PLACES, SETTINGS, TOTAL_KM, formatKm, upcomingEvents } from '~/lib/data'

const CREDITS = [
  { name: 'Samuele Errico Piccarini', href: 'https://unsplash.com/@samuele_piccarini' },
  { name: 'Donny Jiang', href: 'https://unsplash.com/@dotnny' },
]

const NAV = [
  { label: 'Kampanja', to: '/', hash: 'top' },
  { label: 'Galerija', to: '/', hash: 'galerija' },
  { label: 'Karta', to: '/', hash: 'karta' },
  { label: 'Garaža', to: '/', hash: 'garaza' },
  { label: 'Događaji', to: '/', hash: 'dogadaji' },
  { label: 'Shop', to: '/shop', hash: undefined },
] as const

const TICKER = ['Midnight Crew', 'Livno', 'Noćni meetovi', 'Cruise', 'BiH · HR', 'Od 22:00']

export function Footer() {
  const [next] = upcomingEvents()
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-10 overflow-hidden bg-[#0f0c16]">
      {/* Skewed ticker stripe */}
      <div className="relative -mx-4 -rotate-1 bg-pink py-2.5 shadow-[0_6px_0_var(--color-pink-deep)]" aria-hidden="true">
        <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-0 motion-reduce:animate-none">
          {[0, 1].map((n) => (
            <div key={n} className="flex shrink-0 items-center">
              {[...TICKER, ...TICKER].map((t, i) => (
                <span key={i} className="flex items-center text-xl font-extrabold tracking-wide whitespace-nowrap text-white uppercase italic">
                  <span className="px-5">{t}</span>
                  <Diamond size={14} fill="currentColor" strokeWidth={0} className="text-ink/60" aria-hidden="true" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="relative grid gap-12 px-5 pt-16 pb-10 md:grid-cols-2 md:px-(--gutter) xl:grid-cols-[1.5fr_.8fr_1.1fr_1fr]">
        {/* Brand */}
        <div data-reveal="left">
          <div className="flex items-center gap-4">
            <span className="hex flex size-16 shrink-0 items-center justify-center bg-pink text-2xl font-extrabold text-white italic">MC</span>
            <div className="text-[44px] leading-[.85] font-extrabold uppercase italic sm:text-[54px]">
              Midnight
              <br />
              <span className="text-pink">Crew</span>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-lg leading-snug font-medium text-soft">
            Car meet ekipa iz Livna. Kad grad zaspe, mi palimo motore.
          </p>
          <dl className="mt-6 flex gap-8">
            <Stat label="Km prijeđeno" value={formatKm(TOTAL_KM)} />
            <Stat label="Gradova" value={String(PLACES.length)} />
            <Stat label="Meetova" value={`${EVENTS.length}+`} />
          </dl>
        </div>

        {/* Navigation */}
        <nav aria-label="Podnožje" data-reveal>
          <ColTitle>Izbornik</ColTitle>
          <ul className="space-y-1">
            {NAV.map((n) => (
              <li key={n.label}>
                <Link
                  to={n.to}
                  hash={n.hash}
                  className="group flex items-center gap-2 py-1 text-2xl font-bold text-soft uppercase italic no-underline transition-colors hover:text-white"
                >
                  <span className="h-[3px] w-0 bg-lime transition-[width] duration-200 group-hover:w-5" />
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Next meet */}
        <div data-reveal>
          <ColTitle>Sljedeći meet</ColTitle>
          <Link
            to="."
            search={(s) => ({ ...s, e: next.id })}
            resetScroll={false}
            className="group relative block overflow-hidden bg-panel p-5 no-underline shadow-[inset_4px_0_0_var(--color-lime)] transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-5xl leading-none font-extrabold text-lime italic">{next.date}</span>
              <span className="font-mono text-sm text-muted">{next.time}</span>
            </div>
            <div className="mt-3 text-2xl leading-tight font-extrabold text-white uppercase italic">{next.title}</div>
            <div className="mt-1 flex items-center justify-between text-base font-semibold text-muted">
              <span>{next.place}</span>
              <span className="text-lime transition-transform duration-200 group-hover:translate-x-1"><ArrowRight size={22} strokeWidth={3} aria-hidden="true" /></span>
            </div>
          </Link>
        </div>

        {/* Instagram */}
        <div data-reveal="right">
          <ColTitle>Javi se</ColTitle>
          <p className="mb-5 text-lg leading-snug font-medium text-soft">Sve najave, slike i lokacije meetova idu prvo na Instagram.</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex -skew-x-12 items-center gap-3 bg-white px-6 py-3.5 text-ink no-underline shadow-[5px_5px_0_var(--color-pink)] transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--color-pink)] active:translate-0 active:shadow-[2px_2px_0_var(--color-pink)]"
          >
            <span className="flex skew-x-12 items-center gap-3">
              <InstagramIcon />
              <span className="text-xl font-extrabold uppercase italic">@{SETTINGS.instagram_handle}</span>
            </span>
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="flex flex-col gap-3 px-5 py-5 text-sm font-semibold text-white/45 md:flex-row md:items-center md:justify-between md:px-(--gutter)">
          <span>© {year} Midnight Crew · Livno, BiH</span>
          <span className="font-sans text-xs">
            Fotografije:{' '}
            {CREDITS.map((c, i) => (
              <span key={c.name}>
                {i > 0 && ', '}
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  {c.name}
                </a>
              </span>
            ))}{' '}
            / Unsplash
          </span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex cursor-pointer items-center gap-2 self-start uppercase transition-colors hover:text-white md:self-auto"
          >
            Na vrh <ArrowUp size={16} strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Big faded wordmark in the background */}
      <div
        className="pointer-events-none absolute right-[-2%] bottom-6 text-[22vw] leading-none font-extrabold whitespace-nowrap text-white/[.025] uppercase italic select-none xl:text-[240px]"
        aria-hidden="true"
      >
        Midnight
      </div>
    </footer>
  )
}

function ColTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-4 flex items-center gap-3 font-mono text-sm tracking-[.2em] text-muted uppercase">
      <span className="h-3 w-1.5 -skew-x-12 bg-pink" />
      {children}
    </h3>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1 font-mono text-xs tracking-widest text-muted uppercase">{label}</dt>
      <dd className="text-3xl leading-none font-extrabold text-white italic">{value}</dd>
    </div>
  )
}

function InstagramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
