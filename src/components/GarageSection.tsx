import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { JoinModal } from './JoinModal'
import { GARAGE, crewLevel, type Car } from '~/lib/data'
import { isTyping } from '~/lib/useGameKeys'
import { KeyHint, PadPrompt, SectionHead } from './ui'

const DRIVE = { rwd: 'Zadnji', fwd: 'Prednji', awd: '4×4' } as const

/** Car-select screen in the style of a racing game's garage. */
export function GarageSection() {
  const [i, setI] = useState(0)
  const [join, setJoin] = useState(false)
  const [dir, setDir] = useState(1)
  const ref = useRef<HTMLElement>(null)
  const n = GARAGE.length
  const lvl = crewLevel()

  const go = useCallback(
    (d: number) => {
      if (!n) return
      setDir(d)
      setI((x) => (x + d + n) % n)
    },
    [n],
  )

  // ← / → switch cars while the garage is on screen and nothing else has focus.
  useEffect(() => {
    const el = ref.current
    if (!el || n < 2) return
    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.intersectionRatio > 0.45), { threshold: [0, 0.45, 1] })
    io.observe(el)
    const onKey = (e: KeyboardEvent) => {
      if (!visible || isTyping(e) || e.repeat) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const a = document.activeElement
      if (a && a !== document.body && !el.contains(a)) return
      if (document.querySelector('[data-modal]')) return
      e.preventDefault()
      go(e.key === 'ArrowRight' ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      io.disconnect()
      window.removeEventListener('keydown', onKey)
    }
  }, [go, n])

  const car = GARAGE[i]

  return (
    <section ref={ref} aria-labelledby="garaza-title">
      <SectionHead id="garaza" title="Garaža" meta={`${n} ${n === 1 ? 'AUTO' : 'AUTA'} · CREW LVL ${lvl.level}`} />
      <span id="garaza-title" className="sr-only">
        Auti ekipe
      </span>

      {!car ? (
        <p className="px-5 pb-16 text-xl text-muted md:px-(--gutter)">Garaža je prazna. Dodaj prvi auto u CMS-u.</p>
      ) : (
        <div className="px-5 pb-20 md:px-(--gutter)">
          {/* Tilted, skewed stage for drama; the content inside is turned back so the car stays level */}
          <div data-reveal="" className="md:px-10 md:py-6">
          <div
            className="garage-tilt relative overflow-hidden bg-[#161220] shadow-[0_0_0_4px_#fff,14px_14px_0_var(--color-pink)]"
          >
            <div className="garage-untilt relative grid min-h-[560px] grid-rows-[auto_1fr_auto] md:min-h-[620px]">
              <Showroom year={car.year} />
              {/* Name plate + counter */}
              <div className="flex items-start justify-between gap-4 px-5 pt-5 md:px-8 md:pt-7">
                <div key={car.id} className="animate-swap-in">
                  <div className="flex items-center gap-3 text-sm font-bold tracking-[.14em] text-lime">
                    <span>{car.year}</span>
                    <span className="h-3 w-px bg-white/30" />
                    <span>{DRIVE[car.drivetrain]} pogon</span>
                  </div>
                  <h3 className="mt-1 max-w-[18ch] text-[40px] leading-[.88] font-extrabold uppercase italic md:text-[64px]">{car.car}</h3>
                  <div className="mt-2 inline-block -skew-x-12 bg-white px-3 py-0.5 text-lg font-extrabold text-ink uppercase italic">
                    <span className="inline-block skew-x-12">{car.owner}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xl font-extrabold italic">
                  <KeyHint label="Prethodni auto" onClick={() => go(-1)}>
                    ←
                  </KeyHint>
                  <span className="min-w-[4ch] text-center tabular-nums">
                    {i + 1}/{n}
                  </span>
                  <KeyHint label="Sljedeći auto" onClick={() => go(1)}>
                    →
                  </KeyHint>
                </div>
              </div>

              {/* Stage */}
              <div className="relative flex items-center justify-center px-4 py-6 md:px-16">
                <div
                  key={car.id}
                  className="relative z-[1] w-full max-w-[860px] animate-[car-in_.5s_cubic-bezier(.2,.9,.2,1)_both]"
                  style={{ '--dx': `${dir * 80}px` } as CSSProperties}
                >
                  {/* Turntable the car stands on */}
                  <div aria-hidden="true" className="garage-turntable absolute top-full left-[-9%] -z-[1] w-[118%] -translate-y-[58%]" />
                  <CarImage car={car} />
                  {/* Reflection on the polished floor */}
                  <div aria-hidden="true" className="garage-reflection pointer-events-none absolute inset-x-0 top-full">
                    <CarImage car={car} />
                  </div>
                </div>
              </div>

              {/* Stats + actions */}
              <div className="relative grid gap-6 px-5 pb-5 md:grid-cols-[minmax(0,420px)_1fr] md:items-end md:px-8 md:pb-7">
                <div key={car.id} className="grid animate-swap-in gap-2.5 -skew-x-6 bg-ink/70 px-5 py-4 shadow-[inset_4px_0_0_var(--color-pink)]">
                  <div className="grid skew-x-6 gap-2.5">
                    <Stat label="Snaga" value={`${car.hp} KS`} ratio={car.hp / 600} />
                    <Stat label="Moment" value={`${car.torque} Nm`} ratio={car.torque / 700} />
                    <Stat label="Pogon" value={DRIVE[car.drivetrain]} ratio={car.drivetrain === 'awd' ? 1 : car.drivetrain === 'rwd' ? 0.66 : 0.4} />
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 md:items-end">
                  {car.note && <p className="max-w-[44ch] text-base leading-snug text-soft md:text-right">{car.note}</p>}
                  <div className="flex items-center gap-2 text-xl font-bold uppercase">
                    {car.instagram ? (
                      <PadPrompt pad="a" href={`https://www.instagram.com/${car.instagram}/`}>
                        @{car.instagram}
                      </PadPrompt>
                    ) : (
                      <span className="text-base text-muted">Bez Instagrama</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Car picker */}
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Svi auti">
            {GARAGE.map((c, k) => (
              <li key={c.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setDir(k > i ? 1 : -1)
                    setI(k)
                  }}
                  aria-pressed={k === i}
                  aria-label={`${c.car}, ${c.owner}`}
                  className={`group relative block h-[84px] w-[132px] cursor-pointer -skew-x-6 overflow-hidden transition-[background-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-white ${
                    k === i ? 'bg-white/15 shadow-[inset_0_-4px_0_var(--color-pink)]' : 'bg-panel hover:bg-white/10'
                  }`}
                >
                  <span className="absolute inset-0 flex skew-x-6 items-center justify-center px-2">
                    <CarImage car={c} small />
                  </span>
                </button>
              </li>
            ))}
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => setJoin(true)}
                className="flex cursor-pointer h-[84px] w-[132px] -skew-x-6 items-center justify-center border-2 border-dashed border-white/25 text-center text-sm font-extrabold tracking-wide text-muted uppercase italic transition-colors hover:border-white hover:text-white"
              >
                <span className="skew-x-6">
                  Tvoj auto?
                  <br />
                  Javi se
                </span>
              </button>
            </li>
          </ul>
        </div>
      )}
      {join && createPortal(<JoinModal onClose={() => setJoin(false)} />, document.body)}
    </section>
  )
}

function Stat({ label, value, ratio }: { label: string; value: string; ratio: number }) {
  return (
    <div className="grid grid-cols-[84px_minmax(0,1fr)_90px] items-center gap-3 text-sm font-bold tracking-[.12em] uppercase">
      <span className="text-muted">{label}</span>
      <span className="h-2 -skew-x-[20deg] bg-white/15">
        <span
          className="block h-full origin-left animate-[xp-fill_.8s_cubic-bezier(.2,.9,.2,1)_both] bg-lime"
          style={{ width: `${Math.round(Math.min(1, Math.max(0.06, ratio)) * 100)}%` }}
        />
      </span>
      <span className="text-right font-mono text-base text-white normal-case">{value}</span>
    </div>
  )
}

/** The car cut-out (transparent PNG), or a silhouette until one is uploaded. */
/** Forza-style showroom behind the car: back wall with light panels, ceiling light bars, polished floor. */
function Showroom({ year }: { year: number }) {
  return (
    <div aria-hidden="true" className="garage-showroom pointer-events-none absolute -z-[1] -inset-y-[6%] inset-x-0 overflow-hidden">
      <div className="garage-ceiling" />
      <div className="garage-wall">
        <div className="garage-year">{year}</div>
      </div>
      <div className="garage-floor" />
    </div>
  )
}

function CarImage({ car, small = false }: { car: Car; small?: boolean }) {
  if (car.image) {
    return (
      <img
        src={car.image}
        alt={`${car.car}, ${car.owner}`}
        loading={small ? 'lazy' : 'eager'}
        draggable={false}
        className={`mx-auto max-h-full w-full object-contain ${small ? 'h-full' : 'drop-shadow-[0_28px_28px_rgba(0,0,0,.65)]'}`}
      />
    )
  }
  return <Silhouette small={small} />
}

function Silhouette({ small }: { small: boolean }) {
  return (
    <svg viewBox="0 0 600 200" className={`mx-auto w-full ${small ? 'h-full' : ''}`} role="img" aria-label="Silueta auta, fotka još nije dodana">
      <path
        d="M24 142c0-18 26-28 78-36l76-34c26-14 62-22 112-22h92c40 0 70 16 96 46l44 10c24 6 40 18 40 36v6H24z"
        fill="#2c2538"
        stroke="rgba(255,255,255,.28)"
        strokeWidth="2"
        strokeDasharray="6 5"
      />
      <path d="M196 76c22-12 54-18 96-18h82c24 0 44 10 62 30H196z" fill="#161220" opacity=".7" />
      {[140, 470].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="150" r="38" fill="#0e0b15" stroke="rgba(255,255,255,.28)" strokeWidth="2" />
          <circle cx={cx} cy="150" r="20" fill="#2c2538" />
        </g>
      ))}
    </svg>
  )
}
