import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import type { StyleSpecification } from 'maplibre-gl'
import { LIVNO, PLACES, type CrewEvent } from '~/lib/data'
import { routeLonLat } from '~/lib/routes'
import { Place } from './ui'

// OpenStreetMap vector tiles (OpenFreeMap, OpenMapTiles schema) in a plain
// dark style. No API key needed.
const TILES = 'https://tiles.openfreemap.org/planet'

const STYLE = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    osm: { type: 'vector', url: TILES },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#1b1626' } },
    { id: 'wood', type: 'fill', source: 'osm', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest', 'grass']]], paint: { 'fill-color': '#1f2530', 'fill-opacity': 0.5 } },
    { id: 'urban', type: 'fill', source: 'osm', 'source-layer': 'landuse', filter: ['in', ['get', 'class'], ['literal', ['residential', 'industrial', 'commercial']]], paint: { 'fill-color': '#2c2438', 'fill-opacity': 0.8 } },
    { id: 'water', type: 'fill', source: 'osm', 'source-layer': 'water', paint: { 'fill-color': '#0f3550' } },
    { id: 'river', type: 'line', source: 'osm', 'source-layer': 'waterway', paint: { 'line-color': '#1d5a80', 'line-width': 1.2 } },
    { id: 'minor', type: 'line', source: 'osm', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', ['minor', 'tertiary', 'secondary', 'service']]], paint: { 'line-color': '#5b5170', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.4, 14, 2] } },
    { id: 'major', type: 'line', source: 'osm', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', ['primary', 'trunk']]], paint: { 'line-color': '#c9c2d8', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.8, 14, 4] } },
    { id: 'motorway', type: 'line', source: 'osm', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'motorway'], paint: { 'line-color': '#f2b632', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 14, 5] } },
    { id: 'towns', type: 'symbol', source: 'osm', 'source-layer': 'place', filter: ['in', ['get', 'class'], ['literal', ['city', 'town', 'village']]], layout: { 'text-field': ['upcase', ['get', 'name']], 'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-letter-spacing': 0.12 }, paint: { 'text-color': '#e9e4f5', 'text-halo-color': '#120e1a', 'text-halo-width': 1.5 } },
  ],
}

/** Destination of an event ("Livno → Buško jezero" → Buško jezero), if it is a known place. */
function destination(place: string) {
  const last = place.split(/\s*(?:→|->)\s*/).pop()!.toLowerCase()
  return PLACES.find((p) => p.name.toLowerCase() === last) ?? PLACES.find((p) => place.toLowerCase().includes(p.name.toLowerCase()))
}

function pin(color: string, label: string) {
  const el = document.createElement('div')
  el.className = 'map3d-pin'
  el.style.setProperty('--c', color)
  el.textContent = label
  return el
}

/**
 * Hero card for the featured event: a flat, dark OpenStreetMap view of the
 * drive (roads, water, the route), with the event on top.
 */
export function Map3DCard({ event: e }: { event: CrewEvent }) {
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    let map: import('maplibre-gl').Map | undefined
    let cancelled = false

    const start = async () => {
      // Browser only: keeps MapLibre out of the server bundle.
      if (import.meta.env.SSR) return
      const [mod] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')])
      const maplibregl = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod
      maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs')
      if (cancelled) return
      const dest = destination(e.place)
      const line = dest ? routeLonLat(dest.name, dest.lon, dest.lat) : [[LIVNO.lon, LIVNO.lat] as [number, number]]
      const lons = line.map((p) => p[0])
      const lats = line.map((p) => p[1])
      const m = new maplibregl.Map({
        container: el,
        style: STYLE as unknown as StyleSpecification,
        bounds: [
          [Math.min(...lons) - 0.008, Math.min(...lats) - 0.008],
          [Math.max(...lons) + 0.008, Math.max(...lats) + 0.008],
        ],
        fitBoundsOptions: { padding: { top: 40, bottom: 100, left: 30, right: 30 } },
        interactive: false,
        attributionControl: false,
        fadeDuration: 0,
      })
      map = m
      m.on('load', () => {
        if (line.length > 1) {
          m.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } } })
          m.addLayer({ id: 'route-glow', type: 'line', source: 'route', paint: { 'line-color': '#ff18a0', 'line-width': 10, 'line-blur': 8, 'line-opacity': 0.6 } })
          m.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ff4fb8', 'line-width': 3.5 } })
        }
        new maplibregl.Marker({ element: pin('#f2e31b', 'MC') }).setLngLat([LIVNO.lon, LIVNO.lat]).addTo(m)
        if (dest) new maplibregl.Marker({ element: pin('#ff18a0', '') }).setLngLat([dest.lon, dest.lat]).addTo(m)
        setReady(true)
      })
    }

    // Only load the map once the card is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !map) start().catch(() => {})
    })
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
      map?.remove()
    }
  }, [e.place])

  return (
    <div className="fh-hover relative h-[300px] overflow-hidden bg-[#1b1626] shadow-[inset_0_0_0_2px_rgba(255,255,255,.2)]">
      <div
        ref={box}
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* Soft vignette */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_55%,rgba(10,8,16,.6))]" />
      <Link
        to="."
        search={(s) => ({ ...s, e: e.id })}
        resetScroll={false}
        className="absolute inset-0 block"
        aria-label={`${e.title}, ${e.date} ${e.time}`}
      >
        <div className="absolute inset-x-0 top-0 px-5 pt-4 text-[15px] font-bold tracking-[.12em] text-lime uppercase">Novo · Otključano</div>
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(14,11,20,.95)_40%,transparent)] px-5 pt-10 pb-6">
          <div className="text-[28px] leading-none font-extrabold uppercase italic">{e.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-semibold text-soft">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={16} strokeWidth={2.5} aria-hidden="true" /> {e.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={16} strokeWidth={2.5} aria-hidden="true" /> {e.time}
            </span>
            <span>
              <Place name={e.place} />
            </span>
          </div>
        </div>
      </Link>
      {/* Map data credit (required by the OpenStreetMap licence) */}
      <div className="absolute right-3 bottom-1.5 z-[2] font-sans text-[10px] text-white/45">
        ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          OpenStreetMap
        </a>{' '}
        ·{' '}
        <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          OpenFreeMap
        </a>
      </div>
    </div>
  )
}
