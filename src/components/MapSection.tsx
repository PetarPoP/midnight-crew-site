import { Check, Crosshair, Flag, Minus, Play, Plus, Square, Star } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { FILTERS, KIND_COLOR, LIVNO, MAX_KM, PLACES, TOTAL_KM, eventsAt, formatKm, placeBadge, type FilterKey } from '~/lib/data'
import type { ExpressionSpecification, GeoJSONSource, LngLatBoundsLike, Map as MlMap } from 'maplibre-gl'
import { useCountUp } from '~/lib/useCountUp'
import { MapMarker, useOsmMap } from './map/OsmMap'
import { KeyHint, PadPrompt, SectionHead } from './ui'
import { Picture } from './Picture'

const LEGEND = [
  { label: 'Naš meet', color: KIND_COLOR.nas },
  { label: 'Idemo na', color: KIND_COLOR.idemo },
  { label: 'Bili smo', color: KIND_COLOR.bili },
]

// Opening frame: the region around Livno (everything except Zagreb).
const NEAR = [...PLACES.filter((p) => p.town !== 'Zagreb'), LIVNO]
/** One pin per town; several meets in one town share it. */
const PINS = PLACES.filter((p, i) => PLACES.findIndex((q) => q.town === p.town) === i)
const FIRST = (PLACES.find((p) => p.town === 'Split') ?? PLACES[0])?.id ?? ''
const START_BOX = bounds(NEAR.map((p) => [p.lon, p.lat]))

function bounds(pts: number[][]): LngLatBoundsLike {
  const lons = pts.map((p) => p[0])
  const lats = pts.map((p) => p[1])
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ]
}

/** Room around a framed route so pins clear the tabs, buttons and legend on top of the map. */
const mapPadding = (map: MlMap) =>
  map.getContainer().clientWidth >= 768 ? { top: 160, bottom: 140, left: 140, right: 140 } : { top: 60, bottom: 50, left: 40, right: 60 }

type Line = [number, number][]
const feature = (coordinates: Line) => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates } })
const point = (coordinates: [number, number]) => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates } })

const HIDDEN = 'rgba(0,0,0,0)'
/** Line colour up to `k` (0–1) along the route, nothing after it. */
const upTo = (k: number, color: string) => ['step', ['line-progress'], color, Math.max(k, 1e-6), HIDDEN] as unknown as ExpressionSpecification

/** Route layers: pink glow, pink line, white dashes once drawn, and a "car" dot leading the line. */
function addRouteLayers(map: MlMap) {
  // lineMetrics lets the line be revealed with a gradient instead of re-uploading geometry every frame.
  map.addSource('route', { type: 'geojson', data: feature([]), lineMetrics: true })
  map.addSource('car', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-gradient': upTo(0, '#ff18a0'), 'line-width': 16, 'line-blur': 9, 'line-opacity': 0.65 } })
  map.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-gradient': upTo(0, '#ff4fb8'), 'line-width': 4.5 } })
  map.addLayer({ id: 'route-dash', type: 'line', source: 'route', layout: { 'line-join': 'round', visibility: 'none' }, paint: { 'line-color': '#fff', 'line-width': 1.6, 'line-dasharray': [0.6, 2.4] } })
  map.addLayer({ id: 'car-glow', type: 'circle', source: 'car', paint: { 'circle-radius': 14, 'circle-color': '#ff18a0', 'circle-blur': 1, 'circle-opacity': 0.8 } })
  map.addLayer({ id: 'car', type: 'circle', source: 'car', paint: { 'circle-radius': 5.5, 'circle-color': '#fff', 'circle-stroke-color': '#ff18a0', 'circle-stroke-width': 3 } })
}

/**
 * Drives the route: after `delay` ms the pink line grows from Livno to the
 * destination over `ms`, with the "car" dot at its tip. Returns a cancel function.
 */
function drawRoute(map: MlMap, line: Line, ms: number, delay: number) {
  const route = map.getSource('route') as GeoJSONSource
  const car = map.getSource('car') as GeoJSONSource
  route.setData(feature(line))
  map.setLayoutProperty('route-dash', 'visibility', 'none')
  // Cumulative length (roughly in km) so the dot matches line-progress.
  const kx = Math.cos((line[0][1] * Math.PI) / 180)
  const acc = [0]
  for (let i = 1; i < line.length; i++) acc.push(acc[i - 1] + Math.hypot((line[i][0] - line[i - 1][0]) * kx, line[i][1] - line[i - 1][1]))
  const total = acc[acc.length - 1] || 1
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)
  const paint = (k: number) => {
    map.setPaintProperty('route-glow', 'line-gradient', upTo(k, '#ff18a0'))
    map.setPaintProperty('route', 'line-gradient', upTo(k, '#ff4fb8'))
    const d = k * total
    let i = acc.findIndex((a) => a >= d)
    if (i < 1) i = 1
    const f = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1)
    car.setData(point([line[i - 1][0] + (line[i][0] - line[i - 1][0]) * f, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * f]))
  }
  paint(0)
  const t0 = performance.now() + delay
  let raf = 0
  const frame = (now: number) => {
    const k = Math.min(1, Math.max(0, (now - t0) / ms))
    paint(ease(k))
    if (k < 1) raf = requestAnimationFrame(frame)
    else map.setLayoutProperty('route-dash', 'visibility', 'visible')
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}

export function MapSection() {
  const [sel, setSelRaw] = useState(FIRST)
  const [playing, setPlaying] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('sve')
  const box = useRef<HTMLDivElement>(null)
  const { map, lib, view } = useOsmMap(box, START_BOX)
  const firstSel = useRef(true)

  const selected = PLACES.find((p) => p.id === sel) ?? PLACES[0]
  const selEvents = eventsAt(selected.town)
  const selEvent = selEvents.length
    ? `${selEvents[0].date} · ${selEvents[0].title} · ${selEvents[0].time}`
    : 'Bili smo ovdje, bez najavljenog događaja'
  const rows = [...PLACES].sort((a, b) => a.km - b.km)
  const fi = FILTERS.findIndex((f) => f.key === filter)
  const cycleFilter = (d: number) => setFilter(FILTERS[(fi + d + FILTERS.length) % FILTERS.length].key)
  // Picking a place by hand stops the replay.
  const setSel = (id: string) => {
    setPlaying(false)
    setSelRaw(id)
  }
  const nextPlace = () => setSel(rows[(rows.findIndex((r) => r.id === sel) + 1) % rows.length].id)
  const badge = placeBadge(selected.km)

  // Replay: drive to every destination in order, nearest first.
  useEffect(() => {
    if (!playing) return
    const at = rows.findIndex((r) => r.id === sel)
    const last = at === rows.length - 1
    const id = setTimeout(() => (last ? setPlaying(false) : setSelRaw(rows[at + 1].id)), last ? 3000 : 4200)
    return () => clearTimeout(id)
  }, [playing, sel])
  const startReplay = () => {
    if (playing) return setPlaying(false)
    setSelRaw(rows[0].id)
    setPlaying(true)
  }
  // Longer routes take a bit longer to draw.
  const drawMs = Math.min(2600, 1100 + selected.km * 5)
  const km = useCountUp(selected.km)
  const minutes = useCountUp(selected.minutes)
  const waypointUrl = `https://www.google.com/maps/dir/?api=1&origin=Livno&destination=${encodeURIComponent(selected.location)}&travelmode=driving`

  // Route layers, once the map is ready.
  useEffect(() => {
    if (map && !map.getSource('route')) addRouteLayers(map)
  }, [map])

  // Fly the camera to the route, then drive it, whenever the destination changes.
  useEffect(() => {
    if (!map) return
    if (firstSel.current) {
      // Opening frame, with room for the controls on top of the map.
      firstSel.current = false
      map.fitBounds(START_BOX, { padding: mapPadding(map), duration: 0 })
      return drawRoute(map, selected.line, drawMs, 300)
    }
    const cam = map.cameraForBounds(bounds([...selected.line, [selected.lon, selected.lat]]), { padding: mapPadding(map) })
    if (cam) map.flyTo({ ...cam, duration: 1500, curve: 1.3, essential: true })
    return drawRoute(map, selected.line, drawMs, 700)
  }, [map, sel])

  // Scale bar: pick a round distance that is 70–180px wide at this zoom.
  const pxPerKm = 1000 / ((40075016.686 * Math.cos((view.lat * Math.PI) / 180)) / (512 * 2 ** view.zoom))
  const scaleKm = [1, 2, 5, 10, 20, 25, 50, 100, 200].find((k) => k * pxPerKm >= 70) ?? 200

  // Pins keep the same on-screen size at every zoom level (smaller on phones).
  const pinScale = (scale = 1) => ({ scale: `calc(var(--pin) * ${scale})` }) as CSSProperties

  return (
    <section aria-labelledby="karta-title">
      <SectionHead
        id="karta"
        title="Karta"
        meta={`${PLACES.length} MEETOVA · ${formatKm(TOTAL_KM)} KM PRIJEĐENO`}
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

      <div className="grid grid-cols-1 gap-3 px-5 pb-16 md:px-(--gutter) xl:grid-cols-[minmax(0,1fr)_440px]">
        {/* Map */}
        <div
          data-reveal="left"
          className="map-corners relative aspect-[860/640] w-full overflow-hidden bg-[#1b1626] shadow-[0_0_0_4px_#fff] [--pin:.6] has-[canvas:focus-visible]:shadow-[0_0_0_4px_var(--color-lime)] sm:[--pin:.8] xl:aspect-auto xl:h-[clamp(640px,46vw,760px)] xl:w-full xl:[--pin:1]"
        >
          <div className="absolute inset-0">
            <div ref={box} className="size-full" aria-label="Karta odredišta" />
          </div>

          {map && lib && (
            <>
              {/* Home base: Livno */}
              <MapMarker map={map} lib={lib} lon={LIVNO.lon} lat={LIVNO.lat} z={6}>
                <div className="pointer-events-none relative" style={pinScale()}>
                  <div className="animate-pin-pulse absolute top-1/2 left-1/2 -mt-[60px] -ml-[60px] size-[120px] rounded-full border-[3px] border-lime" />
                  <div className="hex relative flex h-[68px] w-[60px] items-center justify-center bg-white">
                    <div className="hex flex h-[60px] w-[52px] items-center justify-center bg-lime text-[26px] font-extrabold text-ink italic">MC</div>
                  </div>
                  <div className="absolute -top-11 left-1/2 -translate-x-1/2 -skew-x-12 bg-ink px-3 py-[3px] text-[17px] font-extrabold tracking-[.04em] whitespace-nowrap uppercase italic">
                    Livno · Festival
                  </div>
                </div>
              </MapMarker>

              {/* Destination pins */}
              {PINS.map((p) => {
                const on = p.town === selected.town
                const dim = filter !== 'sve' && p.k !== filter
                return (
                  <MapMarker key={p.town} map={map} lib={lib} lon={p.lon} lat={p.lat} z={on ? 20 : 5}>
                    <button
                      type="button"
                      onClick={() => setSel(p.id)}
                      aria-pressed={on}
                      aria-label={`${p.town}, ${p.km} km od Livna`}
                      className="group relative block cursor-pointer transition-opacity duration-200 hover:brightness-110 focus-visible:outline-none"
                      style={{ opacity: dim ? 0.38 : 1, ...pinScale(on ? 1.22 : 1) }}
                    >
                      {on && (
                        <div className="animate-pin-pulse pointer-events-none absolute top-[26px] left-1/2 -mt-[45px] -ml-[45px] size-[90px] rounded-full border-[3px] border-lime" />
                      )}
                      <div
                        className={`hex relative flex h-[52px] w-[46px] items-center justify-center transition-transform duration-200 ease-[cubic-bezier(.3,1.6,.5,1)] group-hover:scale-115 group-focus-visible:scale-115 ${on ? 'bg-lime' : 'bg-white'}`}
                      >
                        <div
                          className="hex flex h-[46px] w-10 items-center justify-center text-xl font-extrabold text-ink italic"
                          style={{ background: KIND_COLOR[p.k] }}
                        >
                          <KindIcon k={p.k} />
                        </div>
                      </div>
                      <div
                        className={`absolute top-14 left-1/2 -translate-x-1/2 -skew-x-12 px-2.5 py-0.5 text-[15px] font-extrabold tracking-[.04em] whitespace-nowrap uppercase italic ${
                          on
                            ? 'bg-white text-ink'
                            : 'bg-ink text-white group-hover:bg-white group-hover:text-ink group-focus-visible:bg-white group-focus-visible:text-ink'
                        }`}
                      >
                        {p.town}
                      </div>
                    </button>
                  </MapMarker>
                )
              })}
            </>
          )}

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_55%,rgba(10,8,16,.75))]" />

          {/* Filter tabs */}
          <div data-map-ui className="absolute top-5 left-[22px] z-30 hidden items-center gap-2 text-xl font-extrabold uppercase italic sm:flex">
            <KeyHint label="Prethodni filter" onClick={() => cycleFilter(-1)} className="mr-3 bg-ink/70">
              Q
            </KeyHint>
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
            <KeyHint label="Sljedeći filter" onClick={() => cycleFilter(1)} className="ml-3 bg-ink/70">
              E
            </KeyHint>
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
              <MapButton label="Približi" onClick={() => map?.zoomIn()}>
                <Plus size={20} strokeWidth={3} aria-hidden="true" />
              </MapButton>
              <MapButton label="Udalji" onClick={() => map?.zoomOut()}>
                <Minus size={20} strokeWidth={3} aria-hidden="true" />
              </MapButton>
              <MapButton label="Vrati na Livno" onClick={() => map && map.fitBounds(START_BOX, { padding: mapPadding(map), duration: 1200 })}>
                <Crosshair size={19} strokeWidth={2.5} aria-hidden="true" />
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

        </div>

        {/* Side panel */}
        <div className="flex min-w-0 flex-col gap-3 px-2 md:grid md:grid-cols-2 xl:flex xl:px-0">
          <div data-reveal="right" className="relative h-[292px] overflow-hidden bg-pink shadow-[inset_0_0_0_4px_#fff]" aria-live="polite">
            {selected.photo && (
              <Picture
                key={selected.photo}
                src={selected.photo}
                sizes="(min-width: 1280px) 210px, 48vw"
                alt=""
                loading="lazy"
                className="absolute inset-y-1 right-1 w-[48%] animate-[fade-in_.5s_ease-out] object-cover [mask-image:linear-gradient(90deg,transparent,#000_45%)]"
              />
            )}
            <div className="absolute inset-0 flex flex-col justify-between px-[26px] py-[22px]">
              <div>
                <div className="flex items-center justify-between gap-3 text-base font-bold tracking-[.12em] uppercase">
                  <span>Odabrano odredište</span>
                  <span
                    key={badge.name}
                    title={`Bedž za ${badge.tier >= 3 ? 'daleke vožnje' : 'vožnje'} od Livna`}
                    className="flex animate-swap-in items-center gap-1.5 bg-ink px-2.5 py-0.5 text-sm tracking-[.08em] text-lime"
                  >
                    <span className="flex" aria-label={`${badge.tier} zvjezdice`}>
                      {Array.from({ length: badge.tier }, (_, i) => (
                        <Star key={i} size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                      ))}
                    </span>
                    <span className="text-white">{badge.name}</span>
                  </span>
                </div>
                <div key={sel} className="animate-swap-in">
                  <div className="mt-2 font-mono text-sm tracking-[.08em] text-lime uppercase">
                    {selected.location}
                    {selected.year ? ` · ${selected.year}` : ''}
                  </div>
                  <div className={`mt-1 leading-[.9] font-extrabold uppercase italic ${selected.name.length > 16 ? 'text-[38px]' : 'text-[54px]'}`}>
                    {selected.name}
                  </div>
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
            <div className="flex items-center justify-between gap-3 text-[15px] font-bold tracking-[.12em] text-cyan uppercase">
              <span>Svi meetovi</span>
              <button
                type="button"
                onClick={startReplay}
                aria-pressed={playing}
                className={`fh-wipe flex cursor-pointer items-center gap-2 px-3 py-1 text-sm font-extrabold tracking-[.08em] uppercase italic ${playing ? 'text-lime' : 'text-white'}`}
              >
                {playing ? <Square size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" /> : <Play size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" />}
                {playing ? 'Zaustavi' : 'Reprodukcija'}
              </button>
            </div>
            {/* Scrolls when there are many meets. */}
            <div className="mc-scroll -mx-1 flex max-h-[380px] min-h-0 flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-1 pr-2">
            {rows.map((r) => {
              const on = r.id === sel
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSel(r.id)}
                  aria-pressed={on}
                  className={`group grid cursor-pointer -skew-x-6 grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_62px] items-center gap-2.5 px-2 py-1 text-left transition-[background-color,translate] duration-200 hover:translate-x-1.5 focus-visible:outline-2 focus-visible:outline-white ${
                    on ? 'bg-lime/15 shadow-[inset_4px_0_0_var(--color-lime)]' : 'hover:bg-white/10'
                  }`}
                >
                  <span className={`min-w-0 transition-colors ${on ? 'text-lime' : 'text-soft group-hover:text-white'}`}>
                    <span className="block truncate text-[17px] leading-tight font-extrabold uppercase italic">{r.name}</span>
                    <span className="block truncate font-mono text-xs text-muted">
                      {r.town}
                      {r.year ? ` · ${r.year}` : ''}
                    </span>
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

/** Pin icon by event kind: our meet, a meet we go to, a place we have been. */
function KindIcon({ k }: { k: 'nas' | 'idemo' | 'bili' }) {
  const p = { size: 20, strokeWidth: 3, 'aria-hidden': true as const }
  if (k === 'nas') return <Star {...p} fill="currentColor" strokeWidth={0} size={22} />
  if (k === 'idemo') return <Flag {...p} fill="currentColor" />
  return <Check {...p} strokeWidth={3.5} />
}
