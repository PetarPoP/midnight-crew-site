import { memo } from 'react'
import { MAP, project } from '~/lib/mapData'

// Plain world-space stroke widths and no SVG filters: the basemap is painted
// once and then only moved by the compositor, which keeps pan/zoom smooth.

const GREEN = [
  [16.45, 43.85, 140, 50, -40], // Dinara
  [15.35, 44.55, 180, 45, -45], // Velebit
  [17.45, 43.62, 120, 60, -20], // Čvrsnica / Prenj
  [18.2, 43.72, 110, 55, 0], // Bjelašnica / Igman
  [17.65, 44.3, 120, 50, -10], // Vlašić
  [16.95, 45.0, 100, 40, 10], // Kozara
  [18.65, 43.3, 120, 60, -30], // Zelengora
  [16.2, 44.3, 110, 50, -30], // Plješevica
] as const

const LABELS = [
  { t: 'JADRANSKO MORE', lon: 15.62, lat: 43.42, rot: 35, size: 34, sea: true },
  { t: 'HRVATSKA', lon: 15.75, lat: 45.2, rot: 0, size: 30 },
  { t: 'BOSNA I HERCEGOVINA', lon: 17.6, lat: 44.33, rot: 0, size: 30 },
  { t: 'CRNA GORA', lon: 19.0, lat: 42.78, rot: 0, size: 24 },
  { t: 'SRBIJA', lon: 19.32, lat: 44.6, rot: 0, size: 24 },
]

// Towns drawn as plain map labels (the crew's destinations get pins instead).
export const TOWNS: [string, number, number][] = [
  ['Glamoč', 16.85, 44.05],
  ['Kupres', 17.28, 43.99],
  ['Šuica', 17.18, 43.83],
  ['Posušje', 17.33, 43.47],
  ['Sinj', 16.64, 43.7],
  ['Knin', 16.2, 44.04],
  ['Bugojno', 17.45, 44.06],
  ['Jajce', 17.27, 44.34],
  ['Drvar', 16.38, 44.37],
  ['Široki Brijeg', 17.59, 43.38],
  ['Makarska', 17.02, 43.3],
  ['Konjic', 17.96, 43.65],
  ['Zenica', 17.91, 44.2],
  ['Banja Luka', 17.19, 44.77],
  ['Bihać', 15.87, 44.81],
  ['Šibenik', 15.89, 43.73],
  ['Zadar', 15.23, 44.12],
  ['Ljubuški', 17.55, 43.2],
  ['Travnik', 17.67, 44.23],
]

/** The static basemap (sea, coast, terrain, roads, borders, labels). */
export const BaseMap = memo(function BaseMap() {
  const { W, H } = MAP
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 block" aria-hidden="true">
      <defs>
        <linearGradient id="mcSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#123d5c" />
          <stop offset="1" stopColor="#0c2c44" />
        </linearGradient>
        {/* Mountains: lit ridge plus a shadow side, like a hillshade */}
        <radialGradient id="mcHill">
          <stop offset="0" stopColor="#5a4b74" stopOpacity=".55" />
          <stop offset=".6" stopColor="#3a2f50" stopOpacity=".35" />
          <stop offset="1" stopColor="#3a2f50" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mcShade">
          <stop offset="0" stopColor="#07050b" stopOpacity=".7" />
          <stop offset="1" stopColor="#07050b" stopOpacity="0" />
        </radialGradient>
        <clipPath id="mcLand">
          <path d={MAP.land} />
        </clipPath>
      </defs>

      {/* Sea */}
      <rect width={W} height={H} fill="url(#mcSea)" />

      {/* Shallow water along the coast, then land */}
      <g fill="none" stroke="#1d5a80" strokeLinejoin="round">
        <path d={MAP.land} strokeWidth="30" strokeOpacity=".18" />
        <path d={MAP.land} strokeWidth="12" strokeOpacity=".3" />
      </g>
      <path d={MAP.land} fill="#1b1626" stroke="#2f5a78" strokeWidth="1.5" strokeLinejoin="round" />
      <g clipPath="url(#mcLand)">
        {GREEN.map(([lon, lat, rx, ry, rot]) => {
          const [x, y] = project(lon, lat)
          return (
            <g key={lon} transform={`rotate(${rot} ${x} ${y})`}>
              <ellipse cx={x + 24} cy={y + 30} rx={rx * 1.6} ry={ry * 1.8} fill="url(#mcShade)" />
              <ellipse cx={x} cy={y} rx={rx * 1.6} ry={ry * 1.8} fill="url(#mcHill)" />
            </g>
          )
        })}
      </g>

      {/* Water on land */}
      <path d={MAP.rivers} fill="none" stroke="#1d5a80" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d={MAP.lakes} fill="#0f3550" stroke="#1d5a80" strokeWidth="1.2" />

      {/* Grid */}
      <g stroke="#fff" strokeOpacity=".05" strokeWidth="1.2">
        {MAP.gridX.map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={H} />
        ))}
        {MAP.gridY.map((y) => (
          <line key={y} x1={0} y1={y} x2={W} y2={y} />
        ))}
      </g>
      <g
        fill="#e9e4f5"
        fillOpacity=".4"
        fontSize="22"
        fontWeight="700"
        fontFamily="Barlow Condensed, sans-serif"
        style={{ paintOrder: 'stroke', stroke: '#120e1a', strokeWidth: 4 }}
      >
        {MAP.gridX.map((x, i) => (
          <text key={x} x={x} y={30} textAnchor="middle">
            {String.fromCharCode(65 + i)}
          </text>
        ))}
        {MAP.gridY.map((y, i) => (
          <text key={y} x={12} y={y - 8}>
            {i + 1}
          </text>
        ))}
      </g>

      {/* Borders */}
      <path d={MAP.borders} fill="none" stroke="#5b5170" strokeOpacity=".9" strokeDasharray="10 7" strokeWidth="2" />

      {/* Roads: casing, then fill */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={MAP.roads} stroke="#c9c2d8" strokeOpacity=".75" strokeWidth="1.8" />
        <path d={MAP.motorways} stroke="#f2b632" strokeWidth="3" />
      </g>

      {/* Region labels */}
      <g fontFamily="Barlow Condensed, sans-serif" fontWeight="800" fontStyle="italic" textAnchor="middle" letterSpacing="10">
        {LABELS.map((l) => {
          const [x, y] = project(l.lon, l.lat)
          return (
            <text
              key={l.t}
              x={x}
              y={y}
              fontSize={l.size}
              transform={`rotate(${l.rot} ${x} ${y})`}
              fill={l.sea ? '#4f86a8' : '#e9e4f5'}
              fillOpacity={l.sea ? 0.7 : 0.28}
              style={{ paintOrder: 'stroke', stroke: '#120e1a', strokeWidth: 6, strokeOpacity: 0.6 }}
            >
              {l.t}
            </text>
          )
        })}
      </g>
    </svg>
  )
})
