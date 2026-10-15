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

/** The static basemap (sea, coast, terrain, roads, borders, labels). */
export const BaseMap = memo(function BaseMap() {
  const { W, H } = MAP
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 block" aria-hidden="true">
      <defs>
        <linearGradient id="mcSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fd3ec" />
          <stop offset="1" stopColor="#4f9fcc" />
        </linearGradient>
        <pattern id="mcWave" width="36" height="24" patternUnits="userSpaceOnUse">
          <path d="M0,12 Q9,3 18,12 T36,12" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="2" />
        </pattern>
        <radialGradient id="mcGreen">
          <stop offset="0" stopColor="#aebf86" stopOpacity=".75" />
          <stop offset=".55" stopColor="#aebf86" stopOpacity=".45" />
          <stop offset="1" stopColor="#aebf86" stopOpacity="0" />
        </radialGradient>
        <clipPath id="mcLand">
          <path d={MAP.land} />
        </clipPath>
      </defs>

      {/* Sea */}
      <rect width={W} height={H} fill="url(#mcSea)" />
      <rect width={W} height={H} fill="url(#mcWave)" />

      {/* Shallow water along the coast, then land */}
      <g fill="none" stroke="#bfeaf7" strokeLinejoin="round">
        <path d={MAP.land} strokeWidth="44" strokeOpacity=".22" />
        <path d={MAP.land} strokeWidth="26" strokeOpacity=".3" />
        <path d={MAP.land} strokeWidth="12" strokeOpacity=".45" />
      </g>
      <path d={MAP.land} fill="#efe6c6" stroke="#b9ab84" strokeWidth="2" strokeLinejoin="round" />
      <g clipPath="url(#mcLand)">
        {GREEN.map(([lon, lat, rx, ry, rot]) => {
          const [x, y] = project(lon, lat)
          return (
            <ellipse key={lon} cx={x} cy={y} rx={rx * 1.6} ry={ry * 1.8} transform={`rotate(${rot} ${x} ${y})`} fill="url(#mcGreen)" />
          )
        })}
      </g>

      {/* Water on land */}
      <path d={MAP.rivers} fill="none" stroke="#7cc4e4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d={MAP.lakes} fill="#7cc4e4" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" />

      {/* Grid */}
      <g stroke="#fff" strokeOpacity=".28" strokeWidth="1.2">
        {MAP.gridX.map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={H} />
        ))}
        {MAP.gridY.map((y) => (
          <line key={y} x1={0} y1={y} x2={W} y2={y} />
        ))}
      </g>
      <g
        fill="#fff"
        fillOpacity=".85"
        fontSize="22"
        fontWeight="700"
        fontFamily="Barlow Condensed, sans-serif"
        style={{ paintOrder: 'stroke', stroke: '#2a6b94', strokeWidth: 4 }}
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
      <path d={MAP.borders} fill="none" stroke="#8d7f63" strokeOpacity=".8" strokeDasharray="10 7" strokeWidth="2" />

      {/* Roads: casing, then fill */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={MAP.roads} stroke="#8d7f63" strokeOpacity=".75" strokeWidth="4" />
        <path d={MAP.motorways} stroke="#9a6a1a" strokeWidth="6" />
        <path d={MAP.roads} stroke="#fffaf0" strokeWidth="2.4" />
        <path d={MAP.motorways} stroke="#ffc83a" strokeWidth="3.6" />
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
              fill={l.sea ? '#fff' : '#6e6340'}
              fillOpacity={l.sea ? 0.95 : 0.7}
              style={{
                paintOrder: 'stroke',
                stroke: l.sea ? '#2f7aa6' : '#fff',
                strokeWidth: 8,
                strokeOpacity: 0.55,
              }}
            >
              {l.t}
            </text>
          )
        })}
      </g>
    </svg>
  )
})
