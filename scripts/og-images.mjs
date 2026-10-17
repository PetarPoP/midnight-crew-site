// Link-preview cards (1200×630) for the site, the shop, every event and every
// product, in the site's festival-menu style. WhatsApp, Instagram, Facebook,
// Viber and Telegram show these when someone shares a link.
// Output: public/og/*.jpg (the routes point og:image at them).
import { fileURLToPath } from 'node:url'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { createRequire } from 'node:module'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
const ROOT = fileURLToPath(new URL('../', import.meta.url))
const OUT = join(ROOT, 'public/og')
const W = 1200
const H = 630

const PINK = '#ff2fa8'
const LIME = '#eee21e'
const CYAN = '#22c3f0'
const INK = '#14101c'

const font = (file) => readFileSync(require.resolve(`@fontsource/barlow-condensed/files/${file}`))
// Croatian letters (č, ć, š, ž, đ) live in the latin-ext subset; it is listed
// first and plain Latin falls back to the latin subset.
const fonts = [
  ['BarlowExt', 'latin-ext'],
  ['Barlow', 'latin'],
].flatMap(([name, set]) => [
  { name, data: font(`barlow-condensed-${set}-700-normal.woff`), weight: 700, style: 'normal' },
  { name, data: font(`barlow-condensed-${set}-800-italic.woff`), weight: 800, style: 'italic' },
])

const readJson = (dir) =>
  readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ id: basename(f, '.json'), ...JSON.parse(readFileSync(join(ROOT, dir, f), 'utf8')) }))

/** Photo as a darkened 1200×630 JPEG data URI (the background of the card). */
async function photo(path) {
  const file = join(ROOT, 'public', path || '/images/hero-bg.jpg')
  const buf = await sharp(file).resize(W, H, { fit: 'cover', position: 'attention' }).modulate({ brightness: 0.9 }).jpeg({ quality: 82 }).toBuffer()
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

const h = (type, style, ...children) => ({ type, props: { style: { display: 'flex', ...style }, children: children.flat() } })
// The font has no arrow glyph, so "Livno → Buško jezero" gets a drawn arrow.
const ARROW = {
  type: 'svg',
  props: {
    width: 30,
    height: 30,
    viewBox: '0 0 24 24',
    style: { margin: '0 10px' },
    children: { type: 'path', props: { d: 'M5 12h14M13 6l6 6-6 6', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } },
  },
}
const withArrows = (s) => s.split(/\s*(?:→|->)\s*/).flatMap((part, i) => (i ? [ARROW, part] : [part]))
const img = (src, style) => ({ type: 'img', props: { src, width: W, height: H, style } })

function card({ bg, eyebrow, eyebrowColor = LIME, title, chips = [], accent = PINK }) {
  const size = title.length > 22 ? 92 : title.length > 14 ? 112 : 132
  return h(
    'div',
    { width: W, height: H, position: 'relative', background: INK, fontFamily: 'BarlowExt, Barlow', color: '#fff' },
    img(bg, { position: 'absolute', top: 0, left: 0, width: W, height: H, objectFit: 'cover' }),
    h('div', { position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundImage: 'linear-gradient(90deg, rgba(20,16,28,.95) 0%, rgba(20,16,28,.75) 50%, rgba(20,16,28,.2) 100%)' }),
    h(
      'div',
      { position: 'absolute', top: 56, left: 64, width: W - 128, height: H - 112, flexDirection: 'column', justifyContent: 'space-between' },
      // Logo
      h(
        'div',
        { alignItems: 'center', gap: 20 },
        h('div', { width: 76, height: 76, borderRadius: 38, background: PINK, alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 800, fontStyle: 'italic' }, 'MC'),
        h('div', { fontSize: 40, fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase' }, 'Midnight Crew'),
      ),
      // Title block
      h(
        'div',
        { flexDirection: 'column', gap: 18 },
        h('div', { fontSize: 30, fontWeight: 700, letterSpacing: 5, color: eyebrowColor, textTransform: 'uppercase' }, eyebrow),
        h('div', { fontSize: size, lineHeight: 0.9, fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase', maxWidth: 1000 }, title),
        h(
          'div',
          { gap: 14, marginTop: 10 },
          chips.map((c, i) =>
            h(
              'div',
              { alignItems: 'center', transform: 'skewX(-12deg)', background: i === 0 ? accent : 'rgba(20,16,28,.85)', color: i === 0 && accent !== PINK ? INK : '#fff', padding: '8px 22px', fontSize: 34, fontWeight: 700, textTransform: 'uppercase', border: i === 0 ? 'none' : '2px solid rgba(255,255,255,.35)' },
              withArrows(c),
            ),
          ),
        ),
      ),
    ),
  )
}

async function render(name, node) {
  const svg = await satori(node, { width: W, height: H, fonts })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()
  writeFileSync(join(OUT, `${name}.jpg`), await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer())
}

mkdirSync(OUT, { recursive: true })
const settings = JSON.parse(readFileSync(join(ROOT, 'src/content/settings.json'), 'utf8'))
const hero = await photo()
const WEEKDAYS = ['Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota']

await render('site', card({ bg: hero, eyebrow: 'Car meetovi · Livno', title: 'Midnight Crew', chips: ['Bez članarine', 'Bez drame'] }))
await render('shop', card({ bg: hero, eyebrow: 'Merch ekipe', eyebrowColor: CYAN, title: 'Shop', chips: ['Pouzećem po BiH'], accent: CYAN }))
await render('garaza', card({ bg: hero, eyebrow: 'Auti ekipe', title: 'Garaža', chips: [`${readJson('src/content/garage').length} auta`, 'Livno'] }))

const events = readJson('src/content/events')
for (const e of events) {
  const [, y, mo, d, hh = '00', mm = '00'] = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(e.date) ?? []
  const day = WEEKDAYS[new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay()]
  const idemo = e.kind === 'idemo'
  await render(
    `event-${e.id}`,
    card({
      bg: await photo(e.image),
      eyebrow: idemo ? 'Idemo na' : 'Naš meet',
      eyebrowColor: idemo ? CYAN : LIME,
      title: e.title,
      chips: [`${day} ${+d}.${+mo}. · ${hh}:${mm}`, e.place],
      accent: idemo ? CYAN : PINK,
    }),
  )
}

const products = readJson('src/content/products')
for (const p of products) {
  await render(
    `product-${p.id}`,
    card({ bg: await photo(p.image), eyebrow: 'Shop · Midnight Crew', eyebrowColor: CYAN, title: p.name, chips: [`${p.price} KM`, 'Pouzećem po BiH'], accent: CYAN }),
  )
}

console.log(`og-images: ${3 + events.length + products.length} cards${settings.site_url ? '' : ' (no site_url in settings)'}`)
