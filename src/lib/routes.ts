import cache from './routes.json'

/** Decodes a Google/OSRM polyline (precision 5) into [lon, lat] pairs. */
function decode(s: string): [number, number][] {
  const pts: [number, number][] = []
  let i = 0
  let lat = 0
  let lng = 0
  while (i < s.length) {
    const vals: number[] = []
    for (let k = 0; k < 2; k++) {
      let r = 0
      let sh = 0
      let b: number
      do {
        b = s.charCodeAt(i++) - 63
        r |= (b & 31) << sh
        sh += 5
      } while (b >= 32)
      vals.push(r & 1 ? ~(r >> 1) : r >> 1)
    }
    lat += vals[0]
    lng += vals[1]
    pts.push([lng / 1e5, lat / 1e5])
  }
  return pts
}

const ORIGIN = cache.origin

/**
 * Route from Livno to a place as [lon, lat] pairs, with distance and drive
 * time. Uses the cached driving route when there is one for these
 * coordinates, otherwise a straight line with an estimated distance (until the
 * next build fetches the real route).
 */
export function routeTo(name: string, lon: number, lat: number) {
  const hit = cache.routes.find((r) => r.name === name && Math.abs(r.lon - lon) < 1e-6 && Math.abs(r.lat - lat) < 1e-6)
  const line = hit ? decode(hit.polyline) : [[ORIGIN.lon, ORIGIN.lat] as [number, number], [lon, lat] as [number, number]]
  let km: number
  let min: number
  if (hit) {
    km = Math.round(hit.distance_m / 1000)
    min = Math.round(hit.duration_s / 60)
  } else {
    // Straight-line distance × 1.3 for winding roads, at ~70 km/h.
    const dLat = ((lat - ORIGIN.lat) * Math.PI) / 180
    const dLon = ((lon - ORIGIN.lon) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((ORIGIN.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
    km = Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 1.3)
    min = Math.round((km / 70) * 60)
  }
  return { line, km, min }
}

/** Route from Livno to a place as [lon, lat] pairs (straight line if not cached). */
export function routeLonLat(name: string, lon: number, lat: number): [number, number][] {
  return routeTo(name, lon, lat).line
}
