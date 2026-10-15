import { project } from './mapData'
import { routeTo } from './routes'

export type Kind = 'nas' | 'idemo' | 'bili'

// Content lives in src/content (edited through the CMS at /admin) and is
// bundled at build time.
type Json<T> = Record<string, { default: T }>
const byFile = <T,>(files: Json<T>) =>
  Object.entries(files).map(([path, mod]) => ({ id: path.split('/').pop()!.replace(/\.json$/, ''), ...mod.default }))

type Settings = { site_url: string; instagram_url: string; instagram_handle: string; rules: string; crew_level: number }
export const SETTINGS = (import.meta.glob<{ default: Settings }>('../content/settings.json', { eager: true })['../content/settings.json'])
  .default
export const SITE_URL = SETTINGS.site_url.replace(/\/$/, '')
export const INSTAGRAM_URL = SETTINGS.instagram_url

export type CrewEvent = {
  id: string
  /** Local date and time, "2026-10-17T22:00". */
  iso: string
  /** "17.10." */
  date: string
  /** "22:00" */
  time: string
  weekday: string
  title: string
  place: string
  tag: string
  k: Exclude<Kind, 'bili'>
  description: string
  image: string
}

const WEEKDAYS = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub']
type EventFile = { title: string; date: string; place: string; kind: 'nas' | 'idemo'; description?: string; image?: string }

export const EVENTS: CrewEvent[] = byFile(import.meta.glob<{ default: EventFile }>('../content/events/*.json', { eager: true }))
  .map((e) => {
    // Read the parts straight from the string so server and browser agree
    // regardless of their time zones.
    const [, y, mo, d, hh = '00', mm = '00'] = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(e.date) ?? []
    const iso = `${y}-${mo}-${d}T${hh}:${mm}`
    return {
      id: e.id,
      iso,
      date: `${+d}.${+mo}.`,
      time: `${hh}:${mm}`,
      weekday: WEEKDAYS[new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay()],
      title: e.title,
      place: e.place,
      tag: e.kind === 'idemo' ? 'Idemo na' : 'Naš meet',
      k: e.kind,
      description: e.description ?? '',
      image: e.image ?? '',
    }
  })
  .sort((a, b) => a.iso.localeCompare(b.iso))

export const eventById = (id: string) => EVENTS.find((e) => e.id === id)

/** Events that haven't finished yet (kept for 6 hours after they start). */
export function upcomingEvents(now = Date.now()) {
  const list = EVENTS.filter((e) => new Date(e.iso).getTime() + 6 * 3600e3 > now)
  return list.length ? list : EVENTS.slice(-1)
}

export const FILTERS: { key: 'sve' | Exclude<Kind, 'bili'>; label: string }[] = [
  { key: 'sve', label: 'Sve' },
  { key: 'nas', label: 'Naš meet' },
  { key: 'idemo', label: 'Idemo na' },
]
export type FilterKey = (typeof FILTERS)[number]['key']

export const KIND_COLOR: Record<Kind, string> = {
  nas: 'var(--color-pink)',
  idemo: 'var(--color-cyan)',
  bili: 'var(--color-bili)',
}
export const KIND_GLYPH: Record<Kind, string> = { nas: '★', idemo: '⚑', bili: '✓' }

// Destinations (src/content/places). Distances, drive times and route shapes
// are real driving routes from Livno, cached by scripts/fetch-routes.mjs.
export const LIVNO = { lon: 17.008, lat: 43.827 }

type PlaceFile = { name: string; lon: number; lat: number; kind: Kind }
const PLACE_DATA = byFile(import.meta.glob<{ default: PlaceFile }>('../content/places/*.json', { eager: true }))

export const PLACES = PLACE_DATA.map((p) => {
  const r = routeTo(p.name, p.lon, p.lat)
  const [x, y] = project(p.lon, p.lat)
  return { name: p.name, lon: p.lon, lat: p.lat, k: p.kind, x, y, km: r.km, minutes: r.min, route: r.d, bbox: r.bbox }
})
export type PlaceWithKm = (typeof PLACES)[number]

export const MAX_KM = Math.max(...PLACES.map((p) => p.km))
/** Every destination driven there and back. */
export const TOTAL_KM = PLACES.reduce((a, p) => a + p.km * 2, 0)

export const formatKm = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const eventsAt = (place: string) => upcomingEvents().filter((e) => e.place.includes(place))

export type Product = {
  id: string
  name: string
  price: number
  placeholder: string
  category: 'odjeca' | 'dodaci'
  blurb: string
  details: string[]
  sizes: string[]
  image: string
}

type ProductFile = Omit<Product, 'id' | 'placeholder'> & { order?: number }

export const PRODUCTS: Product[] = byFile(import.meta.glob<{ default: ProductFile }>('../content/products/*.json', { eager: true }))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name))
  .map(({ order: _order, ...p }) => ({
    ...p,
    details: p.details ?? [],
    sizes: p.sizes ?? [],
    image: p.image ?? '',
    placeholder: `Fotka: ${p.name.toLowerCase()}`,
  }))

export const SHOP_FILTERS = [
  { key: 'sve', label: 'Sve' },
  { key: 'odjeca', label: 'Odjeća' },
  { key: 'dodaci', label: 'Dodaci' },
] as const
export type ShopFilter = (typeof SHOP_FILTERS)[number]['key']

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)
