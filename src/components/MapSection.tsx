import { useState } from 'react'
import {
  FILTERS,
  KIND_COLOR,
  KIND_GLYPH,
  MAX_KM,
  PLACES,
  TOTAL_KM,
  driveTime,
  eventsAt,
  formatKm,
  type FilterKey,
} from '~/lib/data'
import { MAP_SVG } from './mapSvg'
import { KeyHint, PadButton, SectionHead } from './ui'

const LEGEND = [
  { label: 'Naš meet', color: KIND_COLOR.nas },
  { label: 'Idemo na', color: KIND_COLOR.idemo },
  { label: 'Bili smo', color: KIND_COLOR.bili },
]

export function MapSection() {
  const [sel, setSel] = useState('Split')
  const [filter, setFilter] = useState<FilterKey>('sve')

  const selected = PLACES.find((p) => p.name === sel) ?? PLACES[0]
  const selEvents = eventsAt(sel)
  const selEvent = selEvents.length
    ? `${selEvents[0].date} · ${selEvents[0].title} · ${selEvents[0].time}`
    : 'Bili smo ovdje, bez najavljenog događaja'
  const rows = [...PLACES].sort((a, b) => a.km - b.km)
  const fi = FILTERS.findIndex((f) => f.key === filter)
  const cycleFilter = (d: number) => setFilter(FILTERS[(fi + d + FILTERS.length) % FILTERS.length].key)

  return (
    <section aria-labelledby="karta-title">
      <SectionHead
        id="karta"
        title="Karta"
        meta={`${PLACES.length} ODREDIŠTA · ${formatKm(TOTAL_KM)} KM PRIJEĐENO`}
      />
      <span id="karta-title" className="sr-only">Karta odredišta</span>

      <div className="flex gap-2 px-6 pb-3 text-base font-extrabold uppercase italic sm:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={f.key === filter}
            className={`cursor-pointer -skew-x-[14deg] px-3 py-1.5 uppercase italic ${
              f.key === filter ? 'bg-white text-ink' : 'bg-panel text-[#8e909b]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 px-5 pb-16 md:px-12 xl:grid-cols-[860px_minmax(0,1fr)]">
        {/* Map */}
        <div className="map-corners relative aspect-[860/640] w-full overflow-hidden bg-[#4f9fcc] shadow-[0_0_0_4px_#fff] [--pin:.5] sm:[--pin:.8] xl:aspect-auto xl:h-[640px] xl:w-[860px] xl:[--pin:1]">
          <div dangerouslySetInnerHTML={{ __html: MAP_SVG }} />

          {/* Active route from Livno */}
          <svg
            viewBox="190 292 250 186"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 block size-full"
            aria-hidden="true"
          >
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={selected.route} stroke="#14101c" strokeWidth="3.6" opacity=".55" />
              <path d={selected.route} stroke="#fff" strokeWidth="2.9" />
              <path d={selected.route} stroke="var(--color-pink)" strokeWidth="2" />
              <path d={selected.route} stroke="#fff" strokeWidth=".7" strokeDasharray=".8 3.2" className="animate-route-dash" />
            </g>
          </svg>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_60%,rgba(20,16,28,.38))]" />

          {/* Home base: Livno */}
          <div
            className="pointer-events-none absolute left-[42.28%] top-[23.23%] z-[6]"
            style={{ transform: 'translate(-50%,-50%) scale(var(--pin))' }}
          >
            <div className="animate-pin-pulse absolute top-1/2 left-1/2 -mt-[60px] -ml-[60px] size-[120px] rounded-full border-[3px] border-lime" />
            <div className="hex relative flex h-[68px] w-[60px] items-center justify-center bg-white">
              <div className="hex flex h-[60px] w-[52px] items-center justify-center bg-lime text-[26px] font-extrabold text-ink italic">MC</div>
            </div>
            <div className="absolute -top-11 left-1/2 -translate-x-1/2 -skew-x-12 border-l-4 border-lime bg-ink px-3 py-[3px] text-[17px] font-extrabold tracking-[.04em] whitespace-nowrap uppercase italic">
              Livno · Festival
            </div>
          </div>

          {/* Destination pins */}
          {PLACES.map((p) => {
            const on = p.name === sel
            const dim = filter !== 'sve' && p.k !== filter
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setSel(p.name)}
                aria-pressed={on}
                aria-label={`${p.name}, ${p.km} km od Livna`}
                className="absolute cursor-pointer transition-[transform,opacity] duration-200 ease-[cubic-bezier(.3,1.5,.5,1)] hover:brightness-110"
                style={{
                  left: p.x,
                  top: p.y,
                  transform: `translate(-50%,-50%) scale(calc(var(--pin) * ${on ? 1.22 : 1}))`,
                  opacity: dim ? 0.38 : 1,
                  zIndex: on ? 20 : 5,
                }}
              >
                <div className="hex flex h-[52px] w-[46px] items-center justify-center bg-white">
                  <div
                    className="hex flex h-[46px] w-10 items-center justify-center text-xl font-extrabold text-ink italic"
                    style={{ background: KIND_COLOR[p.k] }}
                  >
                    {KIND_GLYPH[p.k]}
                  </div>
                </div>
                <div
                  className={`absolute px-2.5 py-0.5 text-[15px] font-extrabold tracking-[.04em] whitespace-nowrap uppercase italic ${
                    on ? 'bg-white text-ink' : 'bg-ink text-white'
                  } ${
                    p.name === 'Tomislavgrad'
                      ? 'top-3 left-[50px] -skew-x-12'
                      : 'top-14 left-1/2 -translate-x-1/2 -skew-x-12'
                  }`}
                >
                  {p.name}
                </div>
              </button>
            )
          })}

          {/* Filter tabs */}
          <div className="absolute top-5 left-[22px] z-30 hidden items-center gap-2 text-xl font-extrabold uppercase italic sm:flex">
            <KeyHint label="Prethodni filter" onClick={() => cycleFilter(-1)}>Q</KeyHint>
            <span className="-skew-x-[14deg] bg-white px-[18px] py-2 text-ink">Karta</span>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={f.key === filter}
                className={`cursor-pointer -skew-x-[14deg] bg-ink/80 uppercase italic px-3.5 py-2 text-lg ${
                  f.key === filter ? 'text-[#f2f1ee]' : 'text-[#8e909b] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
            <KeyHint label="Sljedeći filter" onClick={() => cycleFilter(1)}>E</KeyHint>
          </div>

          {/* Compass */}
          <div className="pointer-events-none absolute top-[22px] right-11 hidden size-[62px] items-center justify-center rounded-full bg-ink/80 shadow-[inset_0_0_0_2px_rgba(255,255,255,.35)] md:flex">
            <svg width="46" height="46" viewBox="-23 -23 46 46" aria-hidden="true">
              <path d="M0,-19 L6,0 L0,-4 L-6,0 Z" fill="var(--color-pink)" />
              <path d="M0,19 L6,0 L0,4 L-6,0 Z" fill="#fff" fillOpacity=".55" />
            </svg>
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded bg-ink px-[5px] text-sm font-extrabold">N</span>
          </div>

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-5 left-[22px] hidden flex-col gap-2 bg-ink/80 px-4 py-3 text-[15px] font-bold tracking-[.06em] uppercase md:flex">
            {LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-2.5">
                <span className="hex h-[18px] w-4" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
            <div className="flex items-center gap-2.5">
              <span className="h-[5px] w-4 rounded-[3px] bg-road" />
              Autocesta
            </div>
          </div>

          {/* Scale + prompts */}
          <div className="pointer-events-none absolute right-11 bottom-5 hidden items-center gap-[18px] lg:flex">
            <div className="flex flex-col items-end gap-1 text-sm font-bold [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">
              <div className="h-2 w-[167px] border-[3px] border-t-0 border-white shadow-[0_1px_3px_rgba(0,0,0,.5)]" />
              50 km
            </div>
            <div className="flex items-center gap-2 bg-ink/80 px-3.5 py-2 text-lg font-bold uppercase">
              <PadButton letter="A" className="!size-7 bg-go !text-[15px]" />
              Odaberi
              <PadButton letter="X" className="ml-2 !size-7 bg-cyan !text-[15px] text-ink" />
              Waypoint
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="flex min-w-0 flex-col gap-3 px-2 md:grid md:grid-cols-2 xl:flex xl:px-0">
          <div className="relative h-[292px] -skew-x-6 overflow-hidden bg-pink shadow-[0_0_0_4px_#fff]" aria-live="polite">
            <div className="absolute inset-0 flex skew-x-6 flex-col justify-between px-[26px] py-[22px]">
              <div>
                <div className="text-base font-bold tracking-[.12em] uppercase">Odabrano odredište</div>
                <div className="mt-2 text-[54px] leading-[.9] font-extrabold uppercase italic">{selected.name}</div>
                <div className="mt-2.5 text-[19px] leading-[1.15] font-semibold">{selEvent}</div>
              </div>
              <div className="flex items-end gap-[26px]">
                <div>
                  <div className="font-mono text-[44px] leading-none">{selected.km}</div>
                  <div className="text-[15px] font-bold tracking-[.08em] uppercase">km od Livna</div>
                </div>
                <div>
                  <div className="font-mono text-[44px] leading-none">{driveTime(selected.km)}</div>
                  <div className="text-[15px] font-bold tracking-[.08em] uppercase">vožnja</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-ink/80 px-[18px] py-3.5 shadow-[inset_0_0_0_2px_rgba(255,255,255,.2)]">
            <div className="text-[15px] font-bold tracking-[.12em] text-cyan uppercase">Sva odredišta</div>
            {rows.map((r) => {
              const on = r.name === sel
              return (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => setSel(r.name)}
                  aria-pressed={on}
                  className={`grid cursor-pointer -skew-x-6 grid-cols-[118px_minmax(0,1fr)_62px] items-center gap-2.5 px-2 py-1 text-left ${
                    on ? 'bg-white/15' : 'hover:bg-white/10'
                  }`}
                >
                  <span className={`text-[19px] font-extrabold uppercase italic ${on ? 'text-white' : 'text-soft'}`}>{r.name}</span>
                  <span className="h-1.5 bg-white/15">
                    <span
                      className="block h-full"
                      style={{ width: `${((r.km / MAX_KM) * 100).toFixed(1)}%`, background: KIND_COLOR[r.k] }}
                    />
                  </span>
                  <span className="text-right font-mono text-[15px] text-soft">{r.km} km</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
