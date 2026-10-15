import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { FILTERS, KIND_COLOR, KIND_GLYPH, LIVNO, MAX_KM, PLACES, TOTAL_KM, eventsAt, formatKm, type FilterKey } from '~/lib/data'
import { MAP, project } from '~/lib/mapData'
import { useCountUp } from '~/lib/useCountUp'
import { BaseMap } from './map/BaseMap'
import { usePanZoom } from './map/usePanZoom'
import { KeyHint, PadPrompt, SectionHead } from './ui'

const LEGEND = [
  { label: 'Naš meet', color: KIND_COLOR.nas },
  { label: 'Idemo na', color: KIND_COLOR.idemo },
  { label: 'Bili smo', color: KIND_COLOR.bili },
]

const [LIVNO_X, LIVNO_Y] = project(LIVNO.lon, LIVNO.lat)
// Opening frame: the region around Livno (everything except Zagreb).
const NEAR = PLACES.filter((p) => p.name !== 'Zagreb')
const START_BOX = [
  Math.min(...NEAR.map((p) => p.x)),
  Math.min(...NEAR.map((p) => p.y), LIVNO_Y),
  Math.max(...NEAR.map((p) => p.x)),
  Math.max(...NEAR.map((p) => p.y)),
] as const

// km per world pixel at the map's middle latitude (for the scale bar).
const KM_PER_PX = (111.32 * Math.cos((44 * Math.PI) / 180)) / 400

export function MapSection() {
  const [sel, setSel] = useState('Split')
  const [filter, setFilter] = useState<FilterKey>('sve')
  const map = usePanZoom(MAP.W, MAP.H, START_BOX)
  const firstSel = useRef(true)

  const selected = PLACES.find((p) => p.name === sel) ?? PLACES[0]
  const selEvents = eventsAt(sel)
  const selEvent = selEvents.length
    ? `${selEvents[0].date} · ${selEvents[0].title} · ${selEvents[0].time}`
    : 'Bili smo ovdje, bez najavljenog događaja'
  const rows = [...PLACES].sort((a, b) => a.km - b.km)
  const fi = FILTERS.findIndex((f) => f.key === filter)
  const cycleFilter = (d: number) => setFilter(FILTERS[(fi + d + FILTERS.length) % FILTERS.length].key)
  const nextPlace = () => setSel(rows[(rows.findIndex((r) => r.name === sel) + 1) % rows.length].name)
  // Longer routes take a bit longer to draw.
  const drawDur = `${Math.min(2.4, 0.7 + selected.km / 200).toFixed(2)}s`
  const km = useCountUp(selected.km)
  const minutes = useCountUp(selected.minutes)
  const waypointUrl = `https://www.google.com/maps/dir/?api=1&origin=Livno&destination=${encodeURIComponent(selected.name)}&travelmode=driving`

  // Fly the camera to the whole route whenever the destination changes.
  useEffect(() => {
    if (firstSel.current) {
      firstSel.current = false
      return
    }
    const [x0, y0, x1, y1] = selected.bbox
    map.flyTo([Math.min(x0, selected.x), Math.min(y0, selected.y), Math.max(x1, selected.x), Math.max(y1, selected.y)])
  }, [sel])

  // Scale bar: pick a round distance that is 70–180px wide at this zoom.
  const pxPerKm = map.view.s / KM_PER_PX
  const scaleKm = [5, 10, 20, 25, 50, 100, 200].find((k) => k * pxPerKm >= 70) ?? 200

  const worldStyle = { ...map.worldStyle, width: MAP.W, height: MAP.H } as CSSProperties

  // Markers keep the same on-screen size at every zoom level.
  const marker = (scale = 1) => ({ transform: `translate(-50%,-50%) scale(calc(var(--pin) * ${scale} / var(--s)))` })

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
        <div
          ref={map.ref}
          data-reveal="left"
          tabIndex={0}
          aria-label="Karta, povuci za pomicanje, kotačić za zumiranje"
          onKeyDown={(e) => {
            const step = 90
            const moves: Record<string, [number, number]> = {
              ArrowLeft: [step, 0],
              ArrowRight: [-step, 0],
              ArrowUp: [0, step],
              ArrowDown: [0, -step],
            }
            if (moves[e.key]) {
              e.preventDefault()
              map.pan(...moves[e.key])
            } else if (e.key === '+' || e.key === '=') map.zoomBy(1.4)
            else if (e.key === '-') map.zoomBy(1 / 1.4)
          }}
          className={`map-corners relative aspect-[860/640] w-full touch-pan-y overflow-hidden bg-[#4f9fcc] shadow-[0_0_0_4px_#fff] outline-none select-none [--pin:.6] focus-visible:shadow-[0_0_0_4px_var(--color-lime)] sm:[--pin:.8] md:touch-none xl:aspect-auto xl:h-[640px] xl:w-[860px] xl:[--pin:1] ${
            map.moving ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <div ref={map.worldRef} className="absolute top-0 left-0" style={worldStyle}>
            <BaseMap />

            {/* Active route from Livno */}
            <svg width={MAP.W} height={MAP.H} viewBox={`0 0 ${MAP.W} ${MAP.H}`} className="pointer-events-none absolute inset-0" aria-hidden="true">
              {/* key restarts the draw animation every time the destination changes */}
              <g key={sel} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ '--dur': drawDur } as CSSProperties}>
                <path d={selected.route} pathLength={1} className="route-draw" stroke="#14101c" opacity=".55" style={{ strokeWidth: 'calc(12px / var(--s))' }} />
                <path d={selected.route} pathLength={1} className="route-draw" stroke="#fff" style={{ strokeWidth: 'calc(10px / var(--s))' }} />
                <path d={selected.route} pathLength={1} className="route-draw" stroke="var(--color-pink)" style={{ strokeWidth: 'calc(7px / var(--s))' }} />
                <g className="route-after">
                  <path
                    d={selected.route}
                    stroke="#fff"
                    className="animate-route-dash"
                    pathLength={400}
                    strokeDasharray="1 3"
                    style={{ strokeWidth: 'calc(2.4px / var(--s))' }}
                  />
                </g>
                {/* the "car" leading the route */}
                <circle fill="#fff" stroke="var(--color-pink)" style={{ r: 'calc(6px / var(--s))', strokeWidth: 'calc(3px / var(--s))' } as CSSProperties}>
                  <animateMotion dur={drawDur} path={selected.route} fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".6 0 .3 1" />
                </circle>
              </g>
            </svg>

            {/* Home base: Livno */}
            <div className="pointer-events-none absolute z-[6]" style={{ left: LIVNO_X, top: LIVNO_Y, ...marker() }}>
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
                  className="group absolute cursor-pointer transition-opacity duration-200 hover:z-30 hover:brightness-110 focus-visible:outline-none"
                  style={{ left: p.x, top: p.y, opacity: dim ? 0.38 : 1, zIndex: on ? 20 : 5, ...marker(on ? 1.22 : 1) }}
                >
                  <div className="hex flex h-[52px] w-[46px] items-center justify-center bg-white transition-transform duration-200 ease-[cubic-bezier(.3,1.6,.5,1)] group-hover:scale-115 group-focus-visible:scale-115">
                    <div
                      className="hex flex h-[46px] w-10 items-center justify-center text-xl font-extrabold text-ink italic"
                      style={{ background: KIND_COLOR[p.k] }}
                    >
                      {KIND_GLYPH[p.k]}
                    </div>
                  </div>
                  <div
                    className={`absolute top-14 left-1/2 -translate-x-1/2 -skew-x-12 px-2.5 py-0.5 text-[15px] font-extrabold tracking-[.04em] whitespace-nowrap uppercase italic ${
                      on
                        ? 'bg-white text-ink'
                        : 'bg-ink text-white group-hover:bg-white group-hover:text-ink group-focus-visible:bg-white group-focus-visible:text-ink'
                    }`}
                  >
                    {p.name}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_60%,rgba(20,16,28,.38))]" />

          {/* Filter tabs */}
          <div data-map-ui className="absolute top-5 left-[22px] z-30 hidden items-center gap-2 text-xl font-extrabold uppercase italic sm:flex">
            <KeyHint label="Prethodni filter" onClick={() => cycleFilter(-1)}>Q</KeyHint>
            <span className="-skew-x-[14deg] bg-white px-[18px] py-2 text-ink">Karta</span>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={f.key === filter}
                className={`fh-wipe cursor-pointer px-3.5 py-2 text-lg uppercase italic ${f.key === filter ? '' : 'text-[#8e909b]'}`}
              >
                <span aria-hidden="true" className="absolute inset-0 -z-20 -skew-x-[14deg] bg-ink/80" />
                {f.label}
              </button>
            ))}
            <KeyHint label="Sljedeći filter" onClick={() => cycleFilter(1)}>E</KeyHint>
          </div>

          {/* Compass + zoom */}
          <div data-map-ui className="absolute right-3 bottom-3 z-30 flex flex-col items-center gap-2 md:top-[22px] md:right-11 md:bottom-auto">
            <div className="pointer-events-none relative hidden size-[62px] items-center justify-center rounded-full bg-ink/80 shadow-[inset_0_0_0_2px_rgba(255,255,255,.35)] md:flex">
              <svg width="46" height="46" viewBox="-23 -23 46 46" aria-hidden="true">
                <path d="M0,-19 L6,0 L0,-4 L-6,0 Z" fill="var(--color-pink)" />
                <path d="M0,19 L6,0 L0,4 L-6,0 Z" fill="#fff" fillOpacity=".55" />
              </svg>
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded bg-ink px-[5px] text-sm font-extrabold">N</span>
            </div>
            <div className="flex flex-col bg-ink/80 text-xl font-extrabold shadow-[inset_0_0_0_2px_rgba(255,255,255,.2)] md:text-2xl">
              <MapButton label="Približi" onClick={() => map.zoomBy(1.5)}>+</MapButton>
              <MapButton label="Udalji" onClick={() => map.zoomBy(1 / 1.5)}>−</MapButton>
              <MapButton label="Vrati na Livno" onClick={() => map.flyTo(START_BOX)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              </MapButton>
            </div>
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
              <div
                className="h-2 border-[3px] border-t-0 border-white shadow-[0_1px_3px_rgba(0,0,0,.5)] transition-[width] duration-200"
                style={{ width: scaleKm * pxPerKm }}
              />
              {scaleKm} km
            </div>
            <div data-map-ui className="pointer-events-auto flex items-center gap-1 bg-ink/80 px-2 py-1.5 text-lg font-bold uppercase">
              <PadPrompt pad="a" onClick={nextPlace} glyphClassName="!size-7 !text-[15px]">
                Odaberi
              </PadPrompt>
              <PadPrompt pad="x" href={waypointUrl} glyphClassName="!size-7 !text-[15px]">
                Waypoint
              </PadPrompt>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-2 left-3 font-sans text-[10px] text-ink/50 md:hidden">
            Dva prsta za pomicanje karte
          </div>
        </div>

        {/* Side panel */}
        <div className="flex min-w-0 flex-col gap-3 px-2 md:grid md:grid-cols-2 xl:flex xl:px-0">
          <div data-reveal="right" className="relative h-[292px] -skew-x-6 overflow-hidden bg-pink shadow-[0_0_0_4px_#fff]" aria-live="polite">
            <div className="absolute inset-0 flex skew-x-6 flex-col justify-between px-[26px] py-[22px]">
              <div>
                <div className="text-base font-bold tracking-[.12em] uppercase">Odabrano odredište</div>
                <div key={sel} className="animate-swap-in">
                  <div className="mt-2 text-[54px] leading-[.9] font-extrabold uppercase italic">{selected.name}</div>
                  <div className="mt-2.5 text-[19px] leading-[1.15] font-semibold">{selEvent}</div>
                </div>
              </div>
              <div className="flex items-end gap-[26px]">
                <div>
                  <div className="font-mono text-[44px] leading-none tabular-nums">{km}</div>
                  <div className="text-[15px] font-bold tracking-[.08em] uppercase">km od Livna</div>
                </div>
                <div>
                  <div className="font-mono text-[44px] leading-none tabular-nums">
                    {Math.floor(minutes / 60)}h {String(minutes % 60).padStart(2, '0')}
                  </div>
                  <div className="text-[15px] font-bold tracking-[.08em] uppercase">vožnja</div>
                </div>
              </div>
            </div>
          </div>

          <div
            data-reveal="right"
            style={{ '--i': 2 } as CSSProperties}
            className="flex min-h-0 flex-1 flex-col gap-1.5 bg-ink/80 px-[18px] py-3.5 shadow-[inset_0_0_0_2px_rgba(255,255,255,.2)]"
          >
            <div className="text-[15px] font-bold tracking-[.12em] text-cyan uppercase">Sva odredišta</div>
            {rows.map((r) => {
              const on = r.name === sel
              return (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => setSel(r.name)}
                  aria-pressed={on}
                  className={`group grid cursor-pointer -skew-x-6 grid-cols-[118px_minmax(0,1fr)_62px] items-center gap-2.5 px-2 py-1 text-left transition-[background-color,translate] duration-200 hover:translate-x-1.5 focus-visible:outline-2 focus-visible:outline-white ${
                    on ? 'bg-white/15 shadow-[inset_4px_0_0_var(--color-pink)]' : 'hover:bg-white/10'
                  }`}
                >
                  <span className={`text-[19px] font-extrabold uppercase italic transition-colors group-hover:text-white ${on ? 'text-white' : 'text-soft'}`}>
                    {r.name}
                  </span>
                  <span className="h-1.5 bg-white/15">
                    <span
                      className="block h-full transition-[width] duration-700 ease-out"
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

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-8 cursor-pointer items-center justify-center transition-colors md:size-10 hover:bg-white hover:text-ink active:scale-90"
    >
      {children}
    </button>
  )
}
