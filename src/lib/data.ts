import { routeTo } from './routes'

export type Kind = 'nas' | 'idemo' | 'bili'

// Content lives in src/content and is bundled at build time. The build first
// pulls it from the CMS (scripts/fetch-cms.mjs), so the files here are the
// last copy and the fallback when the CMS can't be reached.
type Json<T> = Record<string, { default: T }>
const byFile = <T,>(files: Json<T>) =>
  Object.entries(files).map(([path, mod]) => ({ id: path.split('/').pop()!.replace(/\.json$/, ''), ...mod.default }))

type Settings = { site_url: string; instagram_url: string; instagram_handle: string; rules: string; shipping_note: string }
export const SETTINGS = (import.meta.glob<{ default: Settings }>('../content/settings.json', { eager: true })['../content/settings.json'])
  .default
export const SITE_URL = SETTINGS.site_url.replace(/\/$/, '')
export const INSTAGRAM_URL = SETTINGS.instagram_url

/** Texts on the garage page (CMS: Postavke → Stranica Garaža). */
type GaragePage = {
  title: string
  description: string
  strip_button: string
  door_animation: boolean
  door_label: string
  search_placeholder: string
  no_photo: string
  no_instagram: string
  join_title: string
  join_text: string
  empty: string
}
export const GARAGE_PAGE = (import.meta.glob<{ default: GaragePage }>('../content/garage-page.json', { eager: true })['../content/garage-page.json'])
  .default

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

// Meets we went to (src/content/places): meet name, location (town) and year. Distances, drive times and route shapes
// are real driving routes from Livno, cached by scripts/fetch-routes.mjs.
export const LIVNO = { lon: 17.008, lat: 43.827 }

type PlaceFile = { name: string; location?: string; year?: number; lon: number; lat: number; kind: Kind; photo?: string }
const PLACE_DATA = byFile(import.meta.glob<{ default: PlaceFile }>('../content/places/*.json', { eager: true }))

export const PLACES = PLACE_DATA.map((p) => {
  const location = p.location || p.name
  const r = routeTo(location, p.lon, p.lat)
  return {
    id: p.id,
    /** Meet name, e.g. "Volkswagen meet". */
    name: p.name,
    /** Town, e.g. "Kotor, Crna Gora". */
    location,
    /** Town without the country, for map labels and matching events. */
    town: location.split(',')[0].trim(),
    year: p.year ?? 0,
    lon: p.lon,
    lat: p.lat,
    k: p.kind,
    photo: p.photo ?? '',
    km: r.km,
    minutes: r.min,
    line: r.line,
  }
})
/** Number of different towns we went to. */
export const TOWNS = new Set(PLACES.map((p) => p.town.toLowerCase())).size
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

export type Car = {
  id: string
  car: string
  owner: string
  /** Instagram handle without the @ (may be empty). */
  instagram: string
  year: number
  hp: number
  torque: number
  drivetrain: 'rwd' | 'fwd' | 'awd'
  note: string
  /** Transparent PNG of the car, or empty for the silhouette placeholder. */
  image: string
  /** How the photo sits in its 4:3 box: focus point in % and zoom (CMS: Položaj u boksu). */
  crop: { x: number; y: number; zoom: number }
}

type CarFile = Pick<Car, 'car'> & Partial<Omit<Car, 'id' | 'car'>> & { order?: number }

export const GARAGE: Car[] = byFile(import.meta.glob<{ default: CarFile }>('../content/garage/*.json', { eager: true }))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.car.localeCompare(b.car))
  .map(({ order: _order, ...c }) => ({
    ...c,
    owner: c.owner ?? '',
    instagram: (c.instagram ?? '')
      .trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
      .replace(/^@/, '')
      .replace(/\/.*$/, ''),
    year: c.year ?? 0,
    hp: c.hp ?? 0,
    torque: c.torque ?? 0,
    note: c.note ?? '',
    image: c.image ?? '',
    crop: { x: c.crop?.x ?? 50, y: c.crop?.y ?? 50, zoom: c.crop?.zoom ?? 1 },
    drivetrain: c.drivetrain ?? 'rwd',
  }))

/** Crew level: grows with distance, meets, crew size and places visited. */
export const CREW_XP_PARTS = [
  { key: 'km', label: 'Prijeđeni km', unit: 'km', value: () => TOTAL_KM, perUnit: 0.5 },
  { key: 'meets', label: 'Meetovi', unit: '', value: () => EVENTS.length, perUnit: 40 },
  { key: 'crew', label: 'Članovi ekipe', unit: '', value: () => GARAGE.length, perUnit: 120 },
  { key: 'places', label: 'Mjesta na karti', unit: '', value: () => PLACES.length, perUnit: 60 },
] as const

export function crewLevel() {
  const parts = CREW_XP_PARTS.map((p) => ({ key: p.key, label: p.label, value: p.value(), xp: Math.round(p.value() * p.perUnit) }))
  const xp = parts.reduce((a, p) => a + p.xp, 0)
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 4)))
  const from = 4 * level * level
  const to = 4 * (level + 1) * (level + 1)
  return { xp, level, progress: (xp - from) / (to - from), next: to - xp, parts }
}

/** Badge for a destination, by how far from Livno it is. */
export function placeBadge(km: number) {
  if (km < 30) return { name: 'Domaći teren', tier: 1 }
  if (km < 100) return { name: 'Regionalac', tier: 2 }
  if (km < 200) return { name: 'Putnik', tier: 3 }
  return { name: 'Ekspedicija', tier: 4 }
}

export const SHOP_FILTERS = [
  { key: 'sve', label: 'Sve' },
  { key: 'odjeca', label: 'Odjeća' },
  { key: 'dodaci', label: 'Dodaci' },
] as const
export type ShopFilter = (typeof SHOP_FILTERS)[number]['key']

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)
