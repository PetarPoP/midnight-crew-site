import type { StyleSpecification } from 'maplibre-gl'

// OpenStreetMap vector tiles (OpenFreeMap, OpenMapTiles schema) + AWS terrain,
// drawn in a dark, game-like style. No API key needed.
const TILES = 'https://tiles.openfreemap.org/planet'
const DEM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

export const MAP_STYLE = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    osm: { type: 'vector', url: TILES },
    dem: { type: 'raster-dem', tiles: [DEM], tileSize: 256, maxzoom: 14, encoding: 'terrarium' },
  },
  sky: { 'sky-color': '#1a1426', 'horizon-color': '#3a1d3f', 'fog-color': '#140f1e', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.4 },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#1b1626' } },
    { id: 'hills', type: 'hillshade', source: 'dem', paint: { 'hillshade-shadow-color': '#07050b', 'hillshade-highlight-color': '#5a4b74', 'hillshade-accent-color': '#2b2140', 'hillshade-exaggeration': 0.6 } },
    { id: 'wood', type: 'fill', source: 'osm', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest', 'grass']]], paint: { 'fill-color': '#22303a', 'fill-opacity': 0.45 } },
    { id: 'urban', type: 'fill', source: 'osm', 'source-layer': 'landuse', filter: ['in', ['get', 'class'], ['literal', ['residential', 'industrial', 'commercial']]], paint: { 'fill-color': '#2c2438', 'fill-opacity': 0.8 } },
    { id: 'water', type: 'fill', source: 'osm', 'source-layer': 'water', paint: { 'fill-color': '#0f3550' } },
    { id: 'river', type: 'line', source: 'osm', 'source-layer': 'waterway', paint: { 'line-color': '#1d5a80', 'line-width': 1.2 } },
    { id: 'minor', type: 'line', source: 'osm', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', ['minor', 'tertiary', 'secondary', 'service']]], paint: { 'line-color': '#5b5170', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.4, 14, 2] } },
    { id: 'major', type: 'line', source: 'osm', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', ['primary', 'trunk']]], paint: { 'line-color': '#c9c2d8', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.8, 14, 4] } },
    { id: 'motorway', type: 'line', source: 'osm', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'motorway'], paint: { 'line-color': '#f2b632', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 14, 5] } },
    { id: 'buildings', type: 'fill-extrusion', source: 'osm', 'source-layer': 'building', minzoom: 13, paint: { 'fill-extrusion-color': '#3a3050', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6], 'fill-extrusion-opacity': 0.9 } },
    { id: 'towns', type: 'symbol', source: 'osm', 'source-layer': 'place', filter: ['in', ['get', 'class'], ['literal', ['city', 'town', 'village']]], layout: { 'text-field': ['upcase', ['get', 'name']], 'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-letter-spacing': 0.12 }, paint: { 'text-color': '#e9e4f5', 'text-halo-color': '#120e1a', 'text-halo-width': 1.5 } },
  ],
} as unknown as StyleSpecification

/** Loads MapLibre in the browser (kept out of the server bundle) with its worker from /vendor. */
export async function loadMaplibre() {
  if (import.meta.env.SSR) throw new Error('MapLibre runs in the browser only')
  const [mod] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')])
  const maplibregl = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod
  maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs')
  return maplibregl
}
