// Pulls the content from the Midnight Crew CMS (Payload on Cloudflare) into
// src/content and the photos into public/images/cms. Runs first in "npm run build",
// so a save in the CMS shows up on the next deploy (the CMS calls the deploy hook).
//
// If the CMS can't be reached or is still empty, the build carries on with the
// content that is already in src/content. Set REQUIRE_CMS=1 to fail instead.
//
// Usage: node scripts/fetch-cms.mjs   (CMS_URL=http://localhost:3100 for a local CMS)
import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const CONTENT = join(ROOT, 'src/content')
const PHOTOS = join(ROOT, 'public/images/cms')
const CMS_URL = (process.env.CMS_URL || 'https://midnight-crew-cms.pop-sites.workers.dev').replace(/\/$/, '')
const TIME_ZONE = 'Europe/Sarajevo'

const get = async (path) => {
  const res = await fetch(`${CMS_URL}/api/${path}`, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return res.json()
}
const all = async (collection, sort) => (await get(`${collection}?pagination=false&depth=1&sort=${sort}`)).docs

let data
try {
  const [events, products, places, garage, settings, garagePage] = await Promise.all([
    all('events', 'date'),
    all('products', 'order'),
    all('places', 'name'),
    all('garage', 'order'),
    get('globals/settings?depth=0'),
    get('globals/garagePage?depth=0'),
  ])
  data = { events, products, places, garage, settings, garagePage }
} catch (e) {
  if (process.env.REQUIRE_CMS === '1') throw e
  console.warn(`fetch-cms: CMS not reachable (${e.message}), keeping src/content as it is`)
  process.exit(0)
}

if (![data.events, data.products, data.places, data.garage].some((l) => l.length) && !data.settings.site_url) {
  console.warn('fetch-cms: CMS is still empty, keeping src/content as it is')
  process.exit(0)
}

/** Download a CMS photo once and return its public path ("" when there is none). */
const photos = new Set()
async function photo(media) {
  if (!media || typeof media !== 'object' || !media.filename) return ''
  const file = join(PHOTOS, media.filename)
  photos.add(media.filename)
  if (!existsSync(file) || statSync(file).size !== media.filesize) {
    const url = /^https?:/.test(media.url) ? media.url : `${CMS_URL}${media.url}`
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) {
      console.warn(`fetch-cms: photo ${media.filename} failed (HTTP ${res.status})`)
      return ''
    }
    mkdirSync(PHOTOS, { recursive: true })
    writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  }
  return `/images/cms/${media.filename}`
}

/** "2026-10-17T20:00:00.000Z" to crew time "2026-10-17T22:00". */
function local(iso) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  )
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

const json = (v) => `${JSON.stringify(v, null, 2)}\n`
const strip = ({ id: _id, createdAt: _c, updatedAt: _u, globalType: _g, ...rest }) => rest

/** Replace a content folder with one file per CMS document. An empty CMS collection keeps the repo's files. */
function writeFolder(name, docs) {
  if (!docs.length) return console.warn(`fetch-cms: no ${name} in the CMS yet, keeping src/content/${name}`)
  const dir = join(CONTENT, name)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const used = new Set()
  for (const { slug, doc } of docs) {
    let id = slug || 'stavka'
    for (let n = 2; used.has(id); n++) id = `${slug}-${n}`
    used.add(id)
    writeFileSync(join(dir, `${id}.json`), json(doc))
  }
}

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const events = []
for (const e of data.events) {
  events.push({
    slug: e.slug || slugify(e.title),
    doc: { title: e.title, date: local(e.date), place: e.place, kind: e.kind, description: e.description ?? '', image: await photo(e.image) },
  })
}
const products = []
for (const p of data.products) {
  products.push({
    slug: p.slug || slugify(p.name),
    doc: {
      name: p.name,
      price: p.price,
      category: p.category,
      order: p.order ?? 10,
      image: await photo(p.image),
      blurb: p.blurb ?? '',
      details: p.details ?? [],
      sizes: p.sizes ?? [],
    },
  })
}
const places = []
for (const p of data.places) {
  places.push({ slug: slugify(p.name), doc: { name: p.name, lon: p.lon, lat: p.lat, kind: p.kind, photo: await photo(p.photo) } })
}
const garage = []
for (const c of data.garage) {
  garage.push({
    slug: slugify(c.car),
    doc: {
      car: c.car,
      owner: c.owner ?? '',
      instagram: c.instagram ?? '',
      year: c.year ?? 0,
      hp: c.hp ?? 0,
      torque: c.torque ?? 0,
      drivetrain: c.drivetrain ?? 'rwd',
      note: c.note ?? '',
      image: await photo(c.image),
      crop: { x: c.imageX ?? 50, y: c.imageY ?? 50, zoom: c.imageZoom ?? 1 },
      order: c.order ?? 10,
    },
  })
}

writeFolder('events', events)
writeFolder('products', products)
writeFolder('places', places)
writeFolder('garage', garage)
// Globals that were never saved in the CMS come back without fields, so keep the repo's copy.
if (data.settings.site_url) writeFileSync(join(CONTENT, 'settings.json'), json(strip(data.settings)))
if (data.garagePage.title) writeFileSync(join(CONTENT, 'garage-page.json'), json(strip(data.garagePage)))

// Remove photos that the CMS no longer uses.
if (existsSync(PHOTOS)) for (const f of readdirSync(PHOTOS)) if (!photos.has(f)) rmSync(join(PHOTOS, f))

console.log(
  `fetch-cms: ${events.length} events, ${products.length} products, ${places.length} places, ${garage.length} cars, ${photos.size} photos from ${CMS_URL}`,
)
