import { useEffect, useState } from 'react'
import { EVENTS, INSTAGRAM_URL, PRODUCTS, TOTAL_KM, formatKm } from '~/lib/data'
import { useCountdown } from '~/lib/useCountdown'
import { Credit, KeyHint, PadButton } from './ui'

const TABS = [
  { label: 'Kampanja', href: '#top' },
  { label: 'Galerija', href: '#galerija' },
  { label: 'Bili smo', href: '#karta' },
  { label: 'Shop', href: '#shop' },
]

function goTo(href: string) {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(null, '', href)
}

export function Hero({ cart }: { cart: number }) {
  const cd = useCountdown()
  const [tab, setTab] = useState(0)
  const featured = EVENTS[1]

  const select = (i: number) => {
    const next = (i + TABS.length) % TABS.length
    setTab(next)
    goTo(TABS[next].href)
  }

  // Q / E cycle the tabs, like a festival menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const k = e.key.toLowerCase()
      if (k === 'q') setTab((cur) => { const n = (cur + TABS.length - 1) % TABS.length; goTo(TABS[n].href); return n })
      if (k === 'e') setTab((cur) => { const n = (cur + 1) % TABS.length; goTo(TABS[n].href); return n })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <section id="top" className="relative pb-10 xl:h-[800px] xl:pb-0">
      {/* Background photo */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="size-full object-cover"
          fetchPriority="high"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(20,16,28,.75),rgba(20,16,28,.1)_55%,rgba(20,16,28,.5))]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent xl:hidden" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-5 md:px-12 md:py-[26px] xl:absolute xl:inset-x-0 xl:top-0">
        <a href="#top" className="flex items-center gap-3.5" onClick={() => setTab(0)}>
          <div className="flex size-[54px] items-center justify-center rounded-full bg-pink text-2xl font-extrabold italic">MC</div>
          <div>
            <div className="text-2xl leading-none font-extrabold uppercase italic">Midnight Crew</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-sm font-bold tracking-[.1em]">CREW LVL 26</span>
              <div className="h-1.5 w-[120px] -skew-x-[20deg] bg-white/25 md:w-[160px]">
                <div className="h-full w-[68%] bg-lime" />
              </div>
            </div>
          </div>
        </a>

        <nav
          aria-label="Glavna navigacija"
          className="order-3 flex w-full items-center gap-1.5 overflow-x-auto text-lg font-extrabold uppercase italic md:order-none md:w-auto md:text-xl"
        >
          <span className="hidden sm:contents"><KeyHint label="Prethodna kartica" onClick={() => select(tab - 1)}>Q</KeyHint></span>
          {TABS.map((t, i) => (
            <a
              key={t.label}
              href={t.href}
              onClick={(e) => { e.preventDefault(); select(i) }}
              aria-current={i === tab ? 'page' : undefined}
              className={`shrink-0 px-3 py-2.5 transition-colors md:px-[18px] ${
                i === tab ? '-skew-x-[14deg] bg-white text-ink' : 'hover:text-lime'
              }`}
            >
              {t.label}
            </a>
          ))}
          <span className="hidden sm:contents"><KeyHint label="Sljedeća kartica" onClick={() => select(tab + 1)}>E</KeyHint></span>
        </nav>

        <a
          href="#shop"
          className="flex -skew-x-[14deg] items-center gap-2.5 bg-black/45 px-4 py-2.5 text-xl font-bold md:order-none"
          aria-label={`Košarica, ${cart} artikala`}
        >
          <span className="text-lime">KOŠ</span> {cart}<span className="hidden sm:inline"> · Košarica</span>
        </a>
      </header>

      {/* Tile grid */}
      <div className="relative z-[1] grid grid-cols-1 gap-3 px-7 pt-2 md:grid-cols-2 md:px-12 xl:absolute xl:top-[150px] xl:left-12 xl:grid-cols-[380px_220px_220px] xl:grid-rows-[250px_170px_170px] xl:p-0">
        {/* Next event + countdown */}
        <div className="relative h-[340px] -skew-x-6 overflow-hidden bg-pink shadow-[0_0_0_4px_#fff] md:col-span-2 xl:col-span-1 xl:row-span-2 xl:h-auto">
          <div className="absolute inset-0 flex skew-x-6 flex-col justify-between px-8 py-[26px] md:px-[34px]">
            <div>
              <div className="text-lg font-bold tracking-[.12em] uppercase">Sljedeći događaj</div>
              <div className="mt-2.5 text-[52px] leading-[.88] font-extrabold uppercase italic md:text-[64px]">
                Subotnje
                <br />
                okupljanje
              </div>
            </div>
            <div>
              <div className="font-mono text-[40px] leading-none tabular-nums md:text-[50px]" aria-label="Odbrojavanje do sljedećeg okupljanja">
                {cd.d}:{cd.h}:{cd.m}:{cd.s}
              </div>
              <div className="mt-2 text-lg font-bold tracking-[.06em] uppercase">
                Sub {cd.label || EVENTS[0].date} · 22:00 · Livno
              </div>
            </div>
          </div>
        </div>

        {/* Gallery tile */}
        <a
          id="galerija"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative h-[200px] scroll-mt-6 -skew-x-6 overflow-hidden bg-[#222] xl:h-auto"
        >
          <div className="absolute inset-y-0 -inset-x-[30px] skew-x-6">
            <img
              src="/images/galerija.jpg"
              alt="Auto u magli, noćna fotografija"
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(0,0,0,.8),transparent)] px-[22px] py-3 text-[28px] font-extrabold uppercase italic">
            <span className="inline-block skew-x-6">Galerija</span>
          </div>
        </a>

        {/* Km driven */}
        <a href="#karta" className="relative h-[200px] -skew-x-6 bg-lime text-ink xl:h-auto">
          <div className="absolute inset-0 flex skew-x-6 flex-col justify-between px-6 py-5">
            <div className="text-base font-bold tracking-[.12em] uppercase">Prijeđeno</div>
            <div>
              <div className="text-[72px] leading-[.85] font-extrabold italic">{formatKm(TOTAL_KM)}</div>
              <div className="text-[22px] font-extrabold uppercase italic">km · Bili smo</div>
            </div>
          </div>
        </a>

        {/* Rules */}
        <div className="relative h-[200px] -skew-x-6 bg-ink/80 shadow-[inset_0_0_0_2px_rgba(255,255,255,.2)] md:col-span-2 xl:h-auto">
          <div className="absolute inset-0 flex skew-x-6 flex-col justify-between px-[26px] py-[18px]">
            <div className="text-base font-bold tracking-[.12em] text-cyan uppercase">Pravila festivala</div>
            <p className="text-[22px] leading-[1.1] font-semibold md:text-[26px]">
              Bez članarine, bez drame, bez paljenja guma na meetu. Jedino pravilo: poštuj mjesto i ljude oko sebe.
            </p>
          </div>
        </div>

        {/* Shop */}
        <a href="#shop" className="relative h-[170px] -skew-x-6 bg-cyan text-ink transition hover:brightness-110">
          <div className="absolute inset-0 flex skew-x-6 items-end justify-between px-[30px] py-[18px]">
            <span className="text-[40px] leading-[.9] font-extrabold uppercase italic">Shop</span>
            <span className="text-lg font-bold">{PRODUCTS.length} artikla</span>
          </div>
        </a>

        {/* Location */}
        <div className="relative h-[170px] -skew-x-6 bg-white text-ink xl:col-span-2">
          <div className="absolute inset-0 flex skew-x-6 items-center justify-between gap-5 px-[30px] py-[18px]">
            <div>
              <div className="text-base font-bold tracking-[.12em] text-pink-deep uppercase">Lokacija</div>
              <div className="text-[30px] leading-none font-extrabold uppercase italic md:text-4xl">Instagram, 2h prije</div>
            </div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none bg-ink px-[18px] py-3 text-lg font-bold text-white transition hover:bg-pink"
            >
              Zaprati
            </a>
          </div>
        </div>
      </div>

      {/* Unlocked event */}
      <a
        href="#dogadaji"
        className="relative z-[1] mx-5 mt-6 block border-l-[6px] border-lime bg-ink/85 px-[22px] py-[18px] md:mx-12 xl:absolute xl:top-[150px] xl:right-12 xl:m-0 xl:w-[260px]"
      >
        <div className="text-[15px] font-bold tracking-[.12em] text-lime">NOVO · OTKLJUČANO</div>
        <div className="mt-1.5 text-[30px] leading-none font-extrabold uppercase italic">{featured.title}</div>
        <div className="mt-1.5 text-lg text-soft">
          {featured.date} · {featured.time} · {featured.place}
        </div>
      </a>

      {/* Button prompts */}
      <div className="relative z-[1] hidden justify-end gap-7 px-12 pt-6 pb-2 text-xl font-bold uppercase md:flex xl:absolute xl:inset-x-12 xl:bottom-[26px] xl:p-0">
        <a href="#dogadaji" className="flex items-center gap-2 hover:text-lime">
          <PadButton letter="A" className="bg-go" />Odaberi
        </a>
        <a href="#top" className="flex items-center gap-2 hover:text-lime">
          <PadButton letter="B" className="bg-stop" />Natrag
        </a>
        <a href="#karta" className="flex items-center gap-2 hover:text-lime">
          <PadButton letter="X" className="bg-cyan" />Karta
        </a>
      </div>

      <Credit
        name="Samuele Errico Piccarini"
        href="https://unsplash.com/@samuele_piccarini"
        className="absolute bottom-2 left-3 z-[1] hidden xl:block"
      />
    </section>
  )
}
