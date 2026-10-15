import { MAP, project } from './mapData'

export type Kind = 'nas' | 'idemo' | 'bili'

export type CrewEvent = {
  date: string
  title: string
  place: string
  time: string
  tag: string
  k: Exclude<Kind, 'bili'>
}

export const INSTAGRAM_URL = 'https://www.instagram.com/midnight_crew_livno/'

export const EVENTS: CrewEvent[] = [
  { date: '17.10.', title: 'Subotnje okupljanje', place: 'Livno', time: '22:00', tag: 'Naš meet', k: 'nas' },
  { date: '24.10.', title: 'Noćni cruise do jezera', place: 'Livno → Buško jezero', time: '23:00', tag: 'Naš meet', k: 'nas' },
  { date: '31.10.', title: 'Halloween car meet', place: 'Split', time: '21:00', tag: 'Idemo na', k: 'idemo' },
  { date: '14.11.', title: 'Regionalni meet', place: 'Mostar', time: '20:00', tag: 'Idemo na', k: 'idemo' },
  { date: '28.11.', title: 'Zatvaranje sezone', place: 'Livno', time: '21:00', tag: 'Naš meet', k: 'nas' },
]

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

// Destinations. Distances and drive times are real driving routes from Livno
// (OSRM), baked into mapData.ts by scripts/build-map.py.
export const LIVNO = { lon: 17.008, lat: 43.827 }

const PLACE_DATA: { name: string; lon: number; lat: number; k: Kind }[] = [
  { name: 'Buško jezero', lon: 17.03, lat: 43.672, k: 'nas' },
  { name: 'Tomislavgrad', lon: 17.226, lat: 43.718, k: 'bili' },
  { name: 'Imotski', lon: 17.216, lat: 43.447, k: 'bili' },
  { name: 'Split', lon: 16.44, lat: 43.508, k: 'idemo' },
  { name: 'Mostar', lon: 17.808, lat: 43.343, k: 'idemo' },
  { name: 'Sarajevo', lon: 18.413, lat: 43.856, k: 'bili' },
  { name: 'Zagreb', lon: 15.982, lat: 45.815, k: 'bili' },
]

export const PLACES = PLACE_DATA.map((p) => {
  const r = MAP.routes[p.name as keyof typeof MAP.routes]
  const [x, y] = project(p.lon, p.lat)
  return { ...p, x, y, km: r.km, minutes: r.min, route: r.d, bbox: r.bbox }
})
export type PlaceWithKm = (typeof PLACES)[number]

export const MAX_KM = Math.max(...PLACES.map((p) => p.km))
/** Every destination driven there and back. */
export const TOTAL_KM = PLACES.reduce((a, p) => a + p.km * 2, 0)

export const formatKm = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const eventsAt = (place: string) => EVENTS.filter((e) => e.place.includes(place))

export type Product = {
  id: string
  name: string
  price: number
  placeholder: string
  category: 'odjeca' | 'dodaci'
  blurb: string
  details: string[]
  sizes: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: 'majica',
    name: 'Majica',
    price: 35,
    placeholder: 'Fotka majice',
    category: 'odjeca',
    blurb: 'Crna pamučna majica s Midnight Crew logom sprijeda i rutom Livno–Buško na leđima.',
    details: ['100% pamuk, 180 g/m²', 'Print sprijeda i na leđima', 'Unisex kroj'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    price: 70,
    placeholder: 'Fotka hoodice',
    category: 'odjeca',
    blurb: 'Debela hoodica s kapuljačom za noćne cruiseove. Vezeni MC logo, rozi detalji.',
    details: ['Pamuk i poliester, 320 g/m²', 'Vezeni logo, rozi vezice', 'Klokan džep'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'naljepnica',
    name: 'Naljepnica',
    price: 10,
    placeholder: 'Fotka naljepnice',
    category: 'dodaci',
    blurb: 'Vodootporna naljepnica za staklo ili branik, 20 cm. Svijetli rozo kad je uhvate farovi.',
    details: ['20 × 6 cm', 'Vodootporna, UV otporna', 'Reflektirajuća roza boja'],
    sizes: [],
  },
]

export const SHOP_FILTERS = [
  { key: 'sve', label: 'Sve' },
  { key: 'odjeca', label: 'Odjeća' },
  { key: 'dodaci', label: 'Dodaci' },
] as const
export type ShopFilter = (typeof SHOP_FILTERS)[number]['key']

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)
