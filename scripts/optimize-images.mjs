// Makes smaller AVIF and WebP copies of every photo in public/images (including
// CMS uploads) at a few widths, so phones don't download the full-size file.
// Output: public/images/_opt/... and src/lib/images.json (which widths exist
// for which image), read by the <Picture> component.
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import sharp from 'sharp'

const ROOT = new URL('../public/images/', import.meta.url).pathname
const OUT = join(ROOT, '_opt')
const WIDTHS = [480, 960, 1600, 2400]
const FORMATS = { avif: { quality: 55 }, webp: { quality: 76 } }

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (p === OUT) continue
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.(jpe?g|png|webp)$/i.test(name)) yield p
  }
}

const manifest = {}
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file)
  const base = rel.slice(0, -extname(rel).length)
  const { width = 0 } = await sharp(file).metadata()
  // Every listed width up to the original size, plus the original width if it is in between.
  const widths = WIDTHS.filter((w) => w <= width)
  if (width && !WIDTHS.includes(width) && width < WIDTHS.at(-1)) widths.push(width)
  if (!widths.length) continue
  const src = statSync(file).mtimeMs
  for (const w of widths) {
    for (const [fmt, opts] of Object.entries(FORMATS)) {
      const out = join(OUT, `${base}-${w}.${fmt}`)
      if (existsSync(out) && statSync(out).mtimeMs >= src) continue
      mkdirSync(dirname(out), { recursive: true })
      await sharp(file).resize({ width: w })[fmt](opts).toFile(out)
    }
  }
  manifest[`/images/${rel.split('\\').join('/')}`] = widths
}

writeFileSync(new URL('../src/lib/images.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n')
console.log(`optimize-images: ${Object.keys(manifest).length} images`)
