// Copies MapLibre's web worker into public/ so the browser can load it from
// /vendor/maplibre-gl-worker.mjs. The source map comment is dropped because
// the map file is not shipped (Wrangler rejects missing source maps).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const src = require.resolve('maplibre-gl/dist/maplibre-gl-worker.mjs')
const out = new URL('../public/vendor/', import.meta.url)
mkdirSync(out, { recursive: true })
writeFileSync(new URL('maplibre-gl-worker.mjs', out), readFileSync(src, 'utf8').replace(/\n\/\/# sourceMappingURL=.*\s*$/, '\n'))
