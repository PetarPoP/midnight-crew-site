import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import { LIVNO, PLACES, type CrewEvent } from '~/lib/data'
import { MAP_STYLE, loadMaplibre } from '~/lib/mapStyle'
import { routeLonLat } from '~/lib/routes'
import { Place } from './ui'

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
 * Hero card for the featured event: a slowly orbiting 3D OpenStreetMap view of
 * the drive (terrain, roads, the route), with the event on top.
 */
export function Map3DCard({ event: e }: { event: CrewEvent }) {
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    let map: import('maplibre-gl').Map | undefined
    let raf = 0
    let visible = false
    let cancelled = false
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

    const spin = () => {
      if (map && visible && !reduce) map.setBearing((map.getBearing() + 0.04) % 360)
      raf = requestAnimationFrame(spin)
    }

    const start = async () => {
      const maplibregl = await loadMaplibre()
      if (cancelled) return
      const dest = destination(e.place)
      const line = dest ? routeLonLat(dest.name, dest.lon, dest.lat) : [[LIVNO.lon, LIVNO.lat] as [number, number]]
      const lons = line.map((p) => p[0])
      const lats = line.map((p) => p[1])
      const m = new maplibregl.Map({
        container: el,
        style: MAP_STYLE,
        bounds: [
          [Math.min(...lons) - 0.008, Math.min(...lats) - 0.008],
          [Math.max(...lons) + 0.008, Math.max(...lats) + 0.008],
        ],
        fitBoundsOptions: { padding: { top: 40, bottom: 100, left: 30, right: 30 } },
        pitch: 62,
        bearing: -20,
        interactive: false,
        attributionControl: false,
        fadeDuration: 0,
      })
      map = m
      m.on('load', () => {
        m.setTerrain({ source: 'dem', exaggeration: 1.6 })
        if (line.length > 1) {
          m.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } } })
          m.addLayer({ id: 'route-glow', type: 'line', source: 'route', paint: { 'line-color': '#ff18a0', 'line-width': 10, 'line-blur': 8, 'line-opacity': 0.6 } })
          m.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ff4fb8', 'line-width': 3.5 } })
        }
        new maplibregl.Marker({ element: pin('#f2e31b', 'MC') }).setLngLat([LIVNO.lon, LIVNO.lat]).addTo(m)
        if (dest) new maplibregl.Marker({ element: pin('#ff18a0', '') }).setLngLat([dest.lon, dest.lat]).addTo(m)
        setReady(true)
      })
      raf = requestAnimationFrame(spin)
    }

    // Only load the map once the card is on screen; only orbit while it is.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !map) start().catch(() => {})
    })
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
      cancelAnimationFrame(raf)
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
      {/* Vignette, like the in-game map */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_45%,rgba(10,8,16,.85))]" />
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
    </div>
  )
}
