import { Camera, Search } from 'lucide-react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { createPortal } from 'react-dom'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Header } from '~/components/Header'
import { Footer } from '~/components/Footer'
import { JoinModal } from '~/components/JoinModal'
import { Picture } from '~/components/Picture'
import { PadPrompt } from '~/components/ui'
import { DRIVE_LABEL, GARAGE, crewLevel, type Car } from '~/lib/data'
import { ogMeta } from '~/lib/og'

/** Cars shown at first and added by each "Učitaj još". */
const PAGE = 24
const ACCENTS = ['var(--color-pink)', 'var(--color-lime)', 'var(--color-cyan)', 'var(--color-road)']

const DRIVES = [
  { key: undefined, label: 'Svi' },
  { key: 'rwd', label: 'Zadnji pogon' },
  { key: 'fwd', label: 'Prednji pogon' },
  { key: 'awd', label: '4×4' },
] as const

const SORTS = {
  red: { label: 'Po redu', cmp: () => 0 },
  snaga: { label: 'Najjači', cmp: (a: Car, b: Car) => b.hp - a.hp },
  fotke: { label: 'Najviše fotki', cmp: (a: Car, b: Car) => b.photos.length - a.photos.length },
  abc: { label: 'A–Ž', cmp: (a: Car, b: Car) => a.car.localeCompare(b.car, 'hr') },
} as const
type SortKey = keyof typeof SORTS

type GarageSearch = { q?: string; pogon?: Car['drivetrain']; sort?: Exclude<SortKey, 'red'> }

export const Route = createFileRoute('/garaza')({
  validateSearch: (s: Record<string, unknown>): GarageSearch => ({
    q: typeof s.q === 'string' && s.q.trim() ? s.q : undefined,
    pogon: s.pogon === 'rwd' || s.pogon === 'fwd' || s.pogon === 'awd' ? s.pogon : undefined,
    sort: s.sort === 'snaga' || s.sort === 'fotke' || s.sort === 'abc' ? s.sort : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Garaža · Midnight Crew' },
      { name: 'description', content: `Svi auti Midnight Crew ekipe iz Livna: ${GARAGE.length} auta, snaga, pogon i fotke.` },
      ...ogMeta({ title: 'Garaža · Midnight Crew', description: 'Svi auti Midnight Crew ekipe iz Livna.', card: 'site', path: '/garaza' }),
    ],
  }),
  component: GaragePage,
})

/** Lower case without diacritics, so "zeljko" finds "Željko". */
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')

function GaragePage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/garaza' })
  const [query, setQuery] = useState(search.q ?? '')
  const [limit, setLimit] = useState(PAGE)
  const [join, setJoin] = useState(false)
  const lvl = crewLevel()
  const photos = GARAGE.reduce((a, c) => a + c.photos.length, 0)

  // Typing updates the URL after a short pause, so the filter survives "back" from a car.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim() || undefined
      if (q !== search.q) navigate({ search: (s) => ({ ...s, q }), replace: true })
    }, 250)
    return () => clearTimeout(t)
  }, [query, search.q, navigate])

  const cars = useMemo(() => {
    const q = fold(search.q ?? '')
    return GARAGE.filter(
      (c) =>
        (!search.pogon || c.drivetrain === search.pogon) &&
        (!q || fold(`${c.car} ${c.owner} ${c.instagram} ${c.year}`).includes(q)),
    ).sort(SORTS[search.sort ?? 'red'].cmp)
  }, [search.q, search.pogon, search.sort])

  // A new filter starts from the first page again.
  useEffect(() => setLimit(PAGE), [search.q, search.pogon, search.sort])

  const shown = cars.slice(0, limit)

  return (
    <main className="min-h-screen overflow-x-clip bg-ink">
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <Picture src="/images/hero-bg.jpg" sizes="100vw" alt="" className="size-full object-cover object-[50%_65%] opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 to-ink" />
        </div>
        <Header />
        <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-5 pt-8 pb-8 md:px-(--gutter) md:pt-14">
          <div>
            <div className="text-base font-bold tracking-[.12em] text-lime">
              {GARAGE.length} {GARAGE.length === 1 ? 'AUTO' : 'AUTA'} · {photos} FOTKI · CREW LVL {lvl.level}
            </div>
            <h1 className="text-[72px] leading-[.85] font-extrabold uppercase italic md:text-[120px]">Garaža</h1>
          </div>
          <button
            type="button"
            onClick={() => setJoin(true)}
            className="cursor-pointer border-2 border-dashed border-white/35 px-5 py-3 text-xl font-extrabold uppercase italic transition-colors hover:border-white hover:bg-white hover:text-ink"
          >
            Tvoj auto? Javi se
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 pb-16 md:px-(--gutter)">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div role="group" aria-label="Pogon" className="flex flex-wrap gap-2 text-lg font-extrabold uppercase italic">
            {DRIVES.map((d) => (
              <button
                key={d.label}
                type="button"
                aria-pressed={search.pogon === d.key}
                onClick={() => navigate({ search: (s) => ({ ...s, pogon: d.key }), replace: true })}
                className={`fh-wipe cursor-pointer px-4 py-2 uppercase italic ${search.pogon === d.key ? '' : 'text-soft'}`}
              >
                <span aria-hidden="true" className="absolute inset-0 -z-20 -skew-x-[14deg] bg-panel" />
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-12 w-full items-center gap-2.5 border-2 border-white/15 bg-panel px-3.5 focus-within:border-lime sm:w-[300px]">
              <Search size={18} strokeWidth={2.5} className="shrink-0 text-muted" aria-hidden="true" />
              <span className="sr-only">Traži</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Traži auto ili člana"
                className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none placeholder:text-muted"
              />
            </label>
            <label className="flex items-center gap-2 text-base font-bold tracking-[.08em] text-muted uppercase">
              Poredaj
              <select
                value={search.sort ?? 'red'}
                onChange={(e) => {
                  const v = e.target.value as SortKey
                  navigate({ search: (s) => ({ ...s, sort: v === 'red' ? undefined : v }), replace: true })
                }}
                className="h-12 cursor-pointer border-2 border-white/15 bg-panel px-3 text-lg font-semibold text-white normal-case"
              >
                {Object.entries(SORTS).map(([k, s]) => (
                  <option key={k} value={k}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div aria-live="polite" className="font-mono text-base text-muted">
          PRIKAZANO {shown.length} OD {cars.length}
        </div>

        {cars.length === 0 ? (
          <p className="py-10 text-xl text-soft">Nema auta za ovu pretragu.</p>
        ) : (
          <ul data-door-wait="" className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5">
            {shown.map((c, i) => (
              <li key={c.id}>
                <CarCard car={c} accent={ACCENTS[i % ACCENTS.length]} />
              </li>
            ))}
          </ul>
        )}

        {shown.length < cars.length && (
          <div className="flex flex-col items-center gap-3 pt-4">
            <div aria-hidden="true" className="h-2 w-[min(420px,100%)] -skew-x-[20deg] bg-white/12">
              <div className="h-full bg-pink" style={{ width: `${(shown.length / cars.length) * 100}%` }} />
            </div>
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE)}
              className="cursor-pointer -skew-x-[8deg] bg-white px-7 py-3.5 text-2xl font-extrabold text-ink uppercase italic shadow-[6px_6px_0_var(--color-pink)] transition hover:-translate-y-0.5 active:translate-y-0"
            >
              Učitaj još {Math.min(PAGE, cars.length - shown.length)}
            </button>
          </div>
        )}
      </div>

      <div className="hidden justify-end gap-3 pb-10 text-xl font-bold uppercase md:flex md:px-(--gutter)">
        <PadPrompt pad="b" onClick={() => navigate({ to: '/', hash: 'garaza' })}>
          Natrag
        </PadPrompt>
      </div>

      <Footer />
      {join && createPortal(<JoinModal onClose={() => setJoin(false)} />, document.body)}
    </main>
  )
}

function CarCard({ car: c, accent }: { car: Car; accent: string }) {
  return (
    <Link
      to="/garaza/$carId"
      params={{ carId: c.id }}
      className="fh-hover flex h-full flex-col bg-panel text-white no-underline"
      style={{ boxShadow: `inset 0 -4px 0 ${accent}` } as CSSProperties}
    >
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#2c2538_0%,#2a2238_58%,#17121f_59%,#201a2b_100%)]">
        {c.image ? (
          <Picture
            src={c.image}
            sizes="(min-width: 768px) 360px, 90vw"
            alt={`${c.car}, ${c.owner}`}
            loading="lazy"
            draggable={false}
            className="w-[84%] object-contain drop-shadow-[0_16px_14px_rgba(0,0,0,.6)]"
          />
        ) : (
          <div role="img" aria-label="Fotka auta još nije dodana" className="flex flex-col items-center gap-2 text-muted">
            <Camera size={36} strokeWidth={1.5} aria-hidden="true" />
            <span className="text-sm font-bold tracking-[.12em] uppercase">Fotka uskoro</span>
          </div>
        )}
        <span className="absolute top-2.5 left-2.5 bg-ink px-2 py-0.5 text-[15px] font-extrabold tracking-[.06em] text-lime italic">{c.year}</span>
        {c.photos.length > 0 && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-ink/85 px-2 py-1 font-mono text-sm text-soft">
            <Camera size={14} strokeWidth={2.5} aria-hidden="true" />
            {c.photos.length}
            <span className="sr-only">fotki</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pt-3.5 pb-4">
        <h2 className="text-[28px] leading-[.95] font-extrabold uppercase italic">{c.car}</h2>
        <div>
          <span className="inline-block -skew-x-12 bg-white px-2.5 text-[17px] font-extrabold text-ink uppercase italic">
            <span className="inline-block skew-x-12">{c.owner}</span>
          </span>
        </div>
        <div className="mt-auto flex gap-4 border-t border-white/10 pt-2.5 font-mono text-[15px] text-muted">
          <span>{c.hp} KS</span>
          <span>{c.torque} Nm</span>
          <span>{DRIVE_LABEL[c.drivetrain]}</span>
        </div>
      </div>
    </Link>
  )
}
