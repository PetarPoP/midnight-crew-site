// Fetches driving routes from Livno to every place in src/content/places
// (OSRM demo server) and caches them in src/lib/routes.json. Runs before each
// build, so a place added in the CMS gets its real route on the next deploy.
// Places that are already cached (same coordinates) are not fetched again.
// If OSRM can't be reached the build carries on and the map draws a straight
// line for that place until the next successful build.
//
// Usage: node scripts/fetch-routes.mjs
import { fileURLToPath } from 'node:url'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const CACHE = join(ROOT, 'src/lib/routes.json')
const PLACES = join(ROOT, 'src/content/places')
const ORIGIN = { lon: 17.008, lat: 43.827 }
const TOLERANCE = 0.00025 // degrees, Douglas-Peucker

const cache = JSON.parse(readFileSync(CACHE, 'utf8'))
const places = readdirSync(PLACES)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(PLACES, f), 'utf8')))

const same = (a, b) => Math.abs(a - b) < 1e-6
let changed = false
const routes = []

for (const p of places) {
  // Routes are keyed by coordinates: several meets in one town share one route.
  if (routes.some((r) => same(r.lon, p.lon) && same(r.lat, p.lat))) continue
  const hit = cache.routes.find((r) => same(r.lon, p.lon) && same(r.lat, p.lat))
  if (hit) {
    routes.push(hit)
    continue
  }
  const name = p.location || p.name
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lon},${ORIGIN.lat};${p.lon},${p.lat}?overview=full&geometries=polyline`
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    const json = await res.json()
    const r = json.routes?.[0]
    if (!r) throw new Error(json.message || `HTTP ${res.status}`)
    const pts = simplify(decode(r.geometry), TOLERANCE)
    routes.push({
      name,
      lon: p.lon,
      lat: p.lat,
      distance_m: Math.round(r.distance * 10) / 10,
      duration_s: Math.round(r.duration * 10) / 10,
      polyline: encode(pts),
    })
    changed = true
    console.log(`route: ${name} ${(r.distance / 1000).toFixed(0)} km`)
  } catch (err) {
    console.warn(`route: could not fetch ${name} (${err.message}); the map will draw a straight line`)
  }
}

// Drop cached routes for places that were removed.
if (routes.length !== cache.routes.length) changed = true
if (changed) {
  writeFileSync(CACHE, JSON.stringify({ ...cache, routes }, null, 2) + '\n')
  console.log(`route: cache updated (${routes.length} routes)`)
}

function decode(s) {
  const pts = []
  let i = 0
  let lat = 0
  let lng = 0
  while (i < s.length) {
    const vals = []
    for (let k = 0; k < 2; k++) {
      let r = 0
      let sh = 0
      let b
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

function encode(pts) {
  let out = ''
  let pLat = 0
  let pLng = 0
  const num = (v) => {
    v = v < 0 ? ~(v << 1) : v << 1
    let s = ''
    while (v >= 32) {
      s += String.fromCharCode((32 | (v & 31)) + 63)
      v >>= 5
    }
    return s + String.fromCharCode(v + 63)
  }
  for (const [lng, lat] of pts) {
    const la = Math.round(lat * 1e5)
    const ln = Math.round(lng * 1e5)
    out += num(la - pLat) + num(ln - pLng)
    pLat = la
    pLng = ln
  }
  return out
}

// Douglas-Peucker with longitude scaled by cos(44°) so the tolerance is roughly
// the same in both directions.
function simplify(pts, tol) {
  const kx = Math.cos((44 * Math.PI) / 180)
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = [pts[a][0] * kx, pts[a][1]]
    const [bx, by] = [pts[b][0] * kx, pts[b][1]]
    const len = Math.hypot(bx - ax, by - ay) || 1e-12
    let max = 0
    let idx = -1
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0] * kx) * (by - ay)) / len
      if (d > max) {
        max = d
        idx = i
      }
    }
    if (max > tol && idx > 0) {
      keep[idx] = 1
      stack.push([a, idx], [idx, b])
    }
  }
  return pts.filter((_, i) => keep[i])
}
