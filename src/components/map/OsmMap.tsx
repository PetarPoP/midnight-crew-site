import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { LngLatBoundsLike, Map as MlMap } from 'maplibre-gl'
import { MAP_STYLE, loadMaplibre } from '~/lib/mapStyle'

type MapLib = Awaited<ReturnType<typeof loadMaplibre>>

/**
 * A flat, north-up MapLibre map of OpenStreetMap in the site's dark style,
 * created once the container scrolls into view. On touch screens one finger
 * scrolls the page and two fingers move the map.
 */
export function useOsmMap(ref: RefObject<HTMLDivElement | null>, start: LngLatBoundsLike) {
  const [state, setState] = useState<{ map: MlMap; lib: MapLib } | null>(null)
  const [view, setView] = useState({ zoom: 7, lat: 44 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let map: MlMap | undefined
    let cancelled = false
    let raf = 0

    const create = async () => {
      const lib = await loadMaplibre()
      if (cancelled) return
      const touch = matchMedia('(pointer: coarse)').matches
      const m = new lib.Map({
        container: el,
        style: MAP_STYLE,
        bounds: start,
        fitBoundsOptions: { padding: 50 },
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        cooperativeGestures: touch,
        minZoom: 5,
        maxZoom: 15,
        locale: {
          'CooperativeGesturesHandler.MobileHelpText': 'Dva prsta za pomicanje karte',
          'CooperativeGesturesHandler.WindowsHelpText': 'Ctrl + kotačić za zumiranje',
          'CooperativeGesturesHandler.MacHelpText': '⌘ + kotačić za zumiranje',
        },
      })
      m.touchZoomRotate.disableRotation()
      map = m
      const sync = () => {
        raf = 0
        setView({ zoom: m.getZoom(), lat: m.getCenter().lat })
      }
      m.on('move', () => {
        if (!raf) raf = requestAnimationFrame(sync)
      })
      m.once('style.load', () => {
        sync()
        setState({ map: m, lib })
      })
    }

    // The container can change size without a window resize (layout, reveal animation).
    const ro = new ResizeObserver(() => map?.resize())
    ro.observe(el)

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !map) {
        io.disconnect()
        create().catch(() => {})
      }
    })
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
      ro.disconnect()
      cancelAnimationFrame(raf)
      map?.remove()
    }
  }, [])

  return { map: state?.map ?? null, lib: state?.lib ?? null, view }
}

/** React content pinned to a point on the map (kept centred on it). */
export function MapMarker({
  map,
  lib,
  lon,
  lat,
  z = 0,
  children,
}: {
  map: MlMap
  lib: MapLib
  lon: number
  lat: number
  z?: number
  children: ReactNode
}) {
  const [el] = useState(() => document.createElement('div'))
  useEffect(() => {
    const marker = new lib.Marker({ element: el }).setLngLat([lon, lat]).addTo(map)
    return () => {
      marker.remove()
    }
  }, [map, lib, lon, lat])
  useEffect(() => {
    el.style.zIndex = String(z)
  }, [z])
  return createPortal(children, el)
}
