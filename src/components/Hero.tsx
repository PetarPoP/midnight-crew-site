import { Link } from '@tanstack/react-router'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { EVENTS, INSTAGRAM_URL, PRODUCTS, TOTAL_KM, formatKm } from '~/lib/data'
import { useCountdown } from '~/lib/useCountdown'
import { Header } from './Header'
import { Credit, PadPrompt } from './ui'

/**
 * Grid cell for a slanted tile. The outer element handles the grid span and
 * the reveal animation; the inner element is the tile itself (hover effect).
 * Below xl every tile is skewed on its own; at xl the whole grid is skewed
 * once instead, so tiles of different heights keep parallel, even gaps.
 */
function Tile({ i, className = '', children }: { i: number; className?: string; children: ReactNode }) {
  return (
    <div data-reveal="" style={{ '--i': i } as CSSProperties} className={className}>
      {children}
    </div>
  )
}

const TILE = 'fh-hover block h-full -skew-x-6 xl:skew-x-0'
const TILE_INNER = 'absolute inset-0 skew-x-6'

/**
 * Countdown text where each character is its own element keyed by position
 * and value, so only the digit that actually changed plays the tick animation.
 */
function Digits({ value }: { value: string }) {
  return (
    <>
      {value.split('').map((ch, i) =>
        ch === ':' ? (
          <span key={i}>:</span>
        ) : (
          <span key={`${i}-${ch}`} className="inline-block animate-[tick_.4s_ease-out]">
            {ch}
          </span>
        ),
      )}
    </>
  )
}

/**
 * Scroll progress through the hero (0 at the top, 1 once it has scrolled
 * away), written to --hp on the section so CSS can drive the parallax.
 */
function useHeroScroll() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    let last = -1
    const update = () => {
      raf = 0
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, el.offsetHeight)))
      if (p === last) return
      last = p
      el.style.setProperty('--hp', p.toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return ref
}

export function Hero() {
  const cd = useCountdown()
  const featured = EVENTS[1]
  const ref = useHeroScroll()

  return (
    <section
      ref={ref}
      id="top"
      className="relative min-h-svh overflow-hidden pb-10 xl:h-[max(100svh,800px)] xl:min-h-0 xl:pb-0 [--top:max(150px,calc(50%-255px))]"
    >
      {/* Background photo: drifts down at a fraction of the scroll speed */}
      <div className="hero-bg absolute inset-0 overflow-hidden">
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="size-full animate-[hero-zoom_14s_ease-out_both] object-cover"
          fetchPriority="high"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(20,16,28,.75),rgba(20,16,28,.1)_55%,rgba(20,16,28,.5))]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <Header overlay />

      {/* Tile grid */}
      <div className="hero-fade relative z-[1] grid grid-cols-1 gap-3 px-7 pt-2 md:grid-cols-2 md:px-12 xl:absolute xl:top-(--top) xl:left-12 xl:-skew-x-6 xl:grid-cols-[380px_220px_220px] xl:grid-rows-[250px_170px_170px] xl:p-0">
        {/* Next event + countdown */}
        <Tile i={0} className="h-[340px] md:col-span-2 xl:col-span-1 xl:row-span-2 xl:h-auto">
          <Link to="/" hash="dogadaji" className={`${TILE} bg-pink shadow-[0_0_0_4px_#fff]`}>
            <div className={`${TILE_INNER} flex flex-col justify-between px-8 py-[26px] md:px-[34px]`}>
              <div>
                <div className="text-lg font-bold tracking-[.12em] uppercase">Sljedeći događaj</div>
                <div className="mt-2.5 text-[52px] leading-[.88] font-extrabold uppercase italic md:text-[64px]">
                  Subotnje
                  <br />
                  okupljanje
                </div>
              </div>
              <div>
                <div
                  className="font-mono text-[40px] leading-none tabular-nums md:text-[50px]"
                  aria-label="Odbrojavanje do sljedećeg okupljanja"
                >
                  <Digits value={`${cd.d}:${cd.h}:${cd.m}:${cd.s}`} />
                </div>
                <div className="mt-2 text-lg font-bold tracking-[.06em] uppercase">Sub {cd.label || EVENTS[0].date} · 22:00 · Livno</div>
              </div>
            </div>
          </Link>
        </Tile>

        {/* Gallery tile */}
        <Tile i={1} className="h-[200px] xl:h-auto">
          <a id="galerija" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${TILE} group scroll-mt-6 bg-[#222]`}>
            <div className="absolute inset-y-0 -inset-x-[30px] skew-x-6">
              <img
                src="/images/galerija.jpg"
                alt="Auto u magli, noćna fotografija"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(0,0,0,.8),transparent)] px-[22px] py-3 text-[28px] font-extrabold uppercase italic">
              <span className="inline-block skew-x-6">Galerija</span>
            </div>
          </a>
        </Tile>

        {/* Km driven */}
        <Tile i={2} className="h-[200px] xl:h-auto">
          <Link to="/" hash="karta" className={`${TILE} bg-lime text-ink`}>
            <div className={`${TILE_INNER} flex flex-col justify-between px-6 py-5`}>
              <div className="text-base font-bold tracking-[.12em] uppercase">Prijeđeno</div>
              <div>
                <div className="text-[72px] leading-[.85] font-extrabold italic">{formatKm(TOTAL_KM)}</div>
                <div className="text-[22px] font-extrabold uppercase italic">km · Bili smo</div>
              </div>
            </div>
          </Link>
        </Tile>

        {/* Rules */}
        <Tile i={3} className="h-[200px] md:col-span-2 xl:h-auto">
          <div className="relative h-full -skew-x-6 bg-ink/80 shadow-[inset_0_0_0_2px_rgba(255,255,255,.2)] xl:skew-x-0">
            <div className={`${TILE_INNER} flex flex-col justify-between px-[26px] py-[18px]`}>
              <div className="text-base font-bold tracking-[.12em] text-cyan uppercase">Pravila festivala</div>
              <p className="text-[22px] leading-[1.1] font-semibold md:text-[26px]">
                Bez članarine, bez drame, bez paljenja guma na meetu. Jedino pravilo: poštuj mjesto i ljude oko sebe.
              </p>
            </div>
          </div>
        </Tile>

        {/* Shop */}
        <Tile i={4} className="h-[170px] xl:h-auto">
          <Link to="/shop" className={`${TILE} bg-cyan text-ink`}>
            <div className={`${TILE_INNER} flex items-end justify-between px-[30px] py-[18px]`}>
              <span className="text-[40px] leading-[.9] font-extrabold uppercase italic">Shop</span>
              <span className="text-lg font-bold">{PRODUCTS.length} artikla</span>
            </div>
          </Link>
        </Tile>

        {/* Location */}
        <Tile i={5} className="h-[170px] xl:col-span-2 xl:h-auto">
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${TILE} group bg-white text-ink`}>
            <div className={`${TILE_INNER} flex items-center justify-between gap-5 px-[30px] py-[18px]`}>
              <div>
                <div className="text-base font-bold tracking-[.12em] text-pink-deep uppercase">Lokacija</div>
                <div className="text-[30px] leading-none font-extrabold uppercase italic md:text-4xl">Instagram, 2h prije</div>
              </div>
              <span className="flex-none bg-ink px-[18px] py-3 text-lg font-bold text-white transition-colors group-hover:bg-pink">
                Zaprati
              </span>
            </div>
          </a>
        </Tile>
      </div>

      {/* Unlocked event */}
      <div className="hero-fade relative z-[1] mx-5 mt-6 md:mx-12 xl:absolute xl:top-(--top) xl:right-12 xl:m-0 xl:w-[260px]">
        <div data-reveal="right" style={{ '--i': 3 } as CSSProperties}>
          <Link to="/" hash="dogadaji" className="fh-hover block border-l-[6px] border-lime bg-ink/85 px-[22px] py-[18px]">
            <div className="text-[15px] font-bold tracking-[.12em] text-lime">
              NOVO · OTKLJUČANO
              <span className="ml-2 inline-block size-2 animate-pulse rounded-full bg-lime align-middle" />
            </div>
            <div className="mt-1.5 text-[30px] leading-none font-extrabold uppercase italic">{featured.title}</div>
            <div className="mt-1.5 text-lg text-soft">
              {featured.date} · {featured.time} · {featured.place}
            </div>
          </Link>
        </div>
      </div>

      {/* Button prompts: click or press A / B / X */}
      <div className="hero-fade relative z-[1] hidden justify-end gap-3 px-12 pt-6 pb-2 text-xl font-bold uppercase md:flex xl:absolute xl:inset-x-12 xl:bottom-[26px] xl:p-0">
        <PadPrompt pad="a" to="/" hash="dogadaji">
          Odaberi
        </PadPrompt>
        <PadPrompt pad="b" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Natrag
        </PadPrompt>
        <PadPrompt pad="x" to="/" hash="karta">
          Karta
        </PadPrompt>
      </div>

      <Credit
        name="Samuele Errico Piccarini"
        href="https://unsplash.com/@samuele_piccarini"
        className="hero-fade absolute bottom-2 left-3 z-[1] hidden xl:block"
      />
    </section>
  )
}
