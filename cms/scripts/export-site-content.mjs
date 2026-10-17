// Copy the site content (../src/content) into src/seed-data/content.json.
// The import button in the admin and "npm run seed" load the CMS from this file.
// Run it again only to refresh the starting data: npm run export-content
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE = fileURLToPath(new URL('../../src/content', import.meta.url))
const OUT = fileURLToPath(new URL('../src/seed-data/content.json', import.meta.url))

const read = (file) => JSON.parse(readFileSync(file, 'utf8'))
const folder = (name) =>
  readdirSync(join(SITE, name))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ id: f.replace(/\.json$/, ''), ...read(join(SITE, name, f)) }))

const content = {
  settings: read(join(SITE, 'settings.json')),
  garagePage: read(join(SITE, 'garage-page.json')),
  events: folder('events'),
  products: folder('products'),
  places: folder('places'),
  garage: folder('garage'),
}
writeFileSync(OUT, `${JSON.stringify(content, null, 2)}\n`)
console.log(`content.json: ${content.events.length} events, ${content.products.length} products, ${content.places.length} places, ${content.garage.length} cars`)
