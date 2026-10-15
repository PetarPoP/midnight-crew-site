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

// Livno is the origin; distances are straight-line km scaled by a road factor.
const LIVNO = [17.008, 43.827] as const

type Place = {
  name: string
  lon: number
  lat: number
  /** Pin position on the map, in % of the map box. */
  x: string
  y: string
  k: Kind
  /** Route from Livno, in the map's SVG coordinate space. */
  route: string
}

const PLACE_DATA: Place[] = [
  { name: 'Buško jezero', lon: 17.0, lat: 43.66, x: '42.03%', y: '32.89%', k: 'nas',
    route: 'M295.7,335.2C295.6,336.4 295.2,339.4 295.1,342.4C295.0,345.4 295.1,351.4 295.1,353.2' },
  { name: 'Tomislavgrad', lon: 17.226, lat: 43.718, x: '49.06%', y: '29.54%', k: 'bili',
    route: 'M295.7,335.2C297.0,335.9 300.8,337.2 303.6,339.2C306.5,341.1 311.2,345.7 312.7,346.9' },
  { name: 'Imotski', lon: 17.216, lat: 43.447, x: '48.75%', y: '45.19%', k: 'bili',
    route: 'M295.7,335.2C297.0,335.9 300.8,337.2 303.6,339.2C306.5,341.1 310.6,343.5 312.7,346.9C314.7,350.4 316.2,354.8 316.1,359.6C316.0,364.5 312.6,373.3 311.9,376.0' },
  { name: 'Split', lon: 16.44, lat: 43.508, x: '24.60%', y: '41.67%', k: 'idemo',
    route: 'M295.7,335.2C293.8,335.9 287.5,337.4 284.2,339.2C280.8,340.9 278.5,344.0 275.6,345.7C272.8,347.3 270.1,346.6 267.1,348.9C264.1,351.2 260.3,356.2 257.7,359.6C255.1,363.1 252.5,367.9 251.5,369.5' },
  { name: 'Mostar', lon: 17.808, lat: 43.343, x: '67.18%', y: '51.17%', k: 'idemo',
    route: 'M295.7,335.2C297.0,335.9 300.8,337.2 303.6,339.2C306.5,341.1 308.3,342.8 312.7,346.9C317.1,351.1 325.0,359.0 330.1,363.9C335.2,368.9 338.7,372.9 343.3,376.8C348.0,380.7 355.5,385.5 357.9,387.2' },
  { name: 'Sarajevo', lon: 18.413, lat: 43.856, x: '86.00%', y: '21.54%', k: 'bili',
    route: 'M295.7,335.2C297.4,333.3 302.4,327.2 306.0,324.1C309.5,321.0 312.8,318.7 316.9,316.5C320.9,314.4 325.0,314.7 330.1,311.1C335.1,307.5 340.1,294.8 347.2,294.8C354.3,294.8 363.2,304.9 372.9,311.1C382.5,317.3 399.7,328.6 405.0,332.1' },
  { name: 'Zagreb', lon: 15.982, lat: 45.815, x: '20.80%', y: '18.28%', k: 'bili',
    route: 'M295.7,335.2C293.0,333.0 290.0,325.8 279.5,321.9C269.0,318.1 246.5,318.5 232.8,312.2C219.2,305.9 208.6,293.2 197.8,284.0C187.1,274.7 171.5,273.2 168.3,256.8C165.0,240.3 170.4,208.7 178.4,185.4C186.3,162.1 209.6,128.5 215.9,117.1' },
]

export const PLACES = PLACE_DATA.map((p) => {
  const dx = (p.lon - LIVNO[0]) * 80.3
  const dy = -(p.lat - LIVNO[1]) * 110.6
  return { ...p, km: Math.round(Math.hypot(dx, dy) * 1.25) }
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
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    price: 70,
    placeholder: 'Fotka hoodice',
    category: 'odjeca',
    blurb: 'Debela hoodica s kapuljačom za noćne cruiseove. Vezeni MC logo, rozi detalji.',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'naljepnica',
    name: 'Naljepnica',
    price: 10,
    placeholder: 'Fotka naljepnice',
    category: 'dodaci',
    blurb: 'Vodootporna naljepnica za staklo ili branik, 20 cm. Svijetli rozo kad je uhvate farovi.',
    sizes: [],
  },
]

export const SHOP_FILTERS = [
  { key: 'sve', label: 'Sve' },
  { key: 'odjeca', label: 'Odjeća' },
  { key: 'dodaci', label: 'Dodaci' },
] as const
export type ShopFilter = (typeof SHOP_FILTERS)[number]['key']
