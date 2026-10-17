import { Link, createFileRoute } from '@tanstack/react-router'
import { Camera, Plus, Search } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Footer } from '~/components/Footer'
import { Header } from '~/components/Header'
import { JoinModal } from '~/components/JoinModal'
import { Picture } from '~/components/Picture'
import { GARAGE, GARAGE_PAGE as T, crewLevel, type Car } from '~/lib/data'
import { ogMeta } from '~/lib/og'

export const Route = createFileRoute('/garaza')({
  head: () => ({
    meta: [
      { title: `${T.title} · Midnight Crew` },
      { name: 'description', content: T.description },
      ...ogMeta({ title: `${T.title} · Midnight Crew`, description: T.description, card: 'garaza', path: '/garaza' }),
    ],
  }),
  component: GaragePage,
})

/** How far each box door hangs down (20–70%), fixed per box so it doesn't jump around. */
const doorHeight = (i: number) => `${20 + ((i * 37 + 11) % 51)}%`

const igUrl = (handle: string) => `https://www.instagram.com/${handle}/`

function GaragePage() {
  const [q, setQ] = useState('')
  const [az, setAz] = useState(false)
  const [join, setJoin] = useState(false)
  // On touch screens the first tap lifts a door, the second opens Instagram.
  const [open, setOpen] = useState<string | null>(null)
  const lvl = crewLevel()
  const n = GARAGE.length

  const boxes = useMemo(() => GARAGE.map((car, i) => ({ car, no: i + 1 })), [])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^@/, '')
    const list = s ? boxes.filter(({ car }) => car.car.toLowerCase().includes(s) || car.instagram.toLowerCase().includes(s)) : boxes
    return az ? [...list].sort((a, b) => a.car.car.localeCompare(b.car.car, 'hr')) : list
  }, [boxes, q, az])

  return (
    <main className="min-h-screen overflow-x-clip bg-ink">
      <Header />

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 px-5 pt-6 pb-7 md:px-(--gutter) md:pt-8">
        <div data-reveal="left">
          <Link to="/" className="font-mono text-sm tracking-[.08em] text-lime uppercase hover:underline md:text-base">
            ← Natrag · {n} {n === 1 ? 'auto' : 'auta'} · Crew LVL {lvl.level}
          </Link>
          <h1 className="mt-1 text-[52px] leading-[.85] font-extrabold uppercase italic md:text-[72px]">{T.title}</h1>
        </div>

        <div data-reveal="right" className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <label className="relative flex h-11 w-full items-center bg-panel md:h-9 md:w-[280px]">
            <Search size={16} strokeWidth={2.5} aria-hidden="true" className="absolute left-3 text-muted" />
            <span className="sr-only">Traži auto ili Instagram</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={T.search_placeholder}
              className="size-full bg-transparent pr-3 pl-9 font-mono text-base text-white outline-none placeholder:text-muted/70 focus-visible:shadow-[inset_0_-3px_0_var(--color-lime)] md:text-sm"
            />
          </label>
          {[
            { label: 'Sve', on: !az, onClick: () => setAz(false) },
            { label: 'A–Z', on: az, onClick: () => setAz(true) },
          ].map((c) => (
            <button
              key={c.label}
              type="button"
              aria-pressed={c.on}
              onClick={c.onClick}
              className={`h-11 -skew-x-[14deg] cursor-pointer px-4 text-lg font-extrabold uppercase italic transition-colors md:h-9 ${
                c.on ? 'bg-white text-ink' : 'bg-panel text-muted hover:text-white'
              }`}
            >
              <span className="inline-block skew-x-[14deg]">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[10px] px-5 pb-20 md:grid-cols-3 md:gap-[18px] md:px-(--gutter) xl:grid-cols-4">
        {shown.map(({ car, no }, i) => (
          <Box key={car.id} car={car} no={no} index={i} open={open === car.id} onOpen={() => setOpen(car.id)} />
        ))}

        {shown.length === 0 && (
          <div className="col-span-full py-10 text-center text-xl font-bold text-muted">{T.empty} '{q.trim()}'</div>
        )}

        {/* Join tile */}
        <button
          type="button"
          onClick={() => setJoin(true)}
          data-reveal=""
          style={{ '--i': Math.min(shown.length, 8) } as CSSProperties}
          className="group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-white/25 text-center transition-colors hover:border-lime hover:bg-white/5 focus-visible:border-lime focus-visible:outline-none"
        >
          <Plus size={30} strokeWidth={3} aria-hidden="true" className="text-lime transition-transform group-hover:rotate-90" />
          <span className="text-xl font-extrabold uppercase italic md:text-2xl">{T.join_title}</span>
          <span className="text-base font-bold text-muted group-hover:text-white">{T.join_text}</span>
        </button>
      </div>

      <Footer />
      {join && createPortal(<JoinModal onClose={() => setJoin(false)} />, document.body)}
    </main>
  )
}

/** One car's "box": a garage bay whose door lifts to show the car. */
function Box({ car, no, index, open, onOpen }: { car: Car; no: number; index: number; open: boolean; onOpen: () => void }) {
  const [touch, setTouch] = useState(false)
  const label = car.instagram ? `${car.car}, @${car.instagram}` : car.car
  const style = { '--i': Math.min(index, 8), '--door': doorHeight(no - 1) } as CSSProperties

  const inner = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(180deg,#0b0910,#2a1f3a)] shadow-[0_0_0_3px_#fff]">
        <div className="absolute inset-x-[6%] bottom-[4%] h-3/4">
          {car.image ? (
            <Picture
              src={car.image}
              alt=""
              sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
              loading={index < 6 ? 'eager' : 'lazy'}
              draggable={false}
              className="size-full object-contain object-bottom drop-shadow-[0_14px_14px_rgba(0,0,0,.6)]"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1.5 text-muted">
              <Camera size={28} strokeWidth={2} aria-hidden="true" />
              <span className="text-sm font-bold uppercase md:text-base">{T.no_photo}</span>
            </div>
          )}
        </div>
        {/* Box door */}
        <div aria-hidden="true" className="box-door absolute inset-x-0 top-0">
          <div className="absolute bottom-[6px] left-1/2 h-1 w-[26px] -translate-x-1/2 bg-lime shadow-[0_0_8px_var(--color-lime)]" />
        </div>
        <div className="absolute top-2 left-2 bg-black/70 px-[5px] py-px font-mono text-[10px] tracking-[.08em] text-lime">
          BOX {String(no).padStart(2, '0')}
        </div>
      </div>
      <div className="mt-2.5 truncate text-[17px] leading-tight font-extrabold uppercase italic md:text-[22px]">{car.car}</div>
      {car.instagram ? (
        <div className="truncate font-mono text-xs text-lime md:text-sm">@{car.instagram}</div>
      ) : (
        <div className="truncate font-mono text-xs text-muted md:text-sm">{T.no_instagram}</div>
      )}
    </>
  )

  const cls = 'box group block min-w-0 outline-none [&:focus-visible>div:first-child]:shadow-[0_0_0_3px_var(--color-lime)]'

  if (!car.instagram) {
    return (
      <div
        tabIndex={0}
        aria-label={label}
        data-reveal=""
        data-open={open || undefined}
        style={style}
        className={cls}
        onClick={onOpen}
      >
        {inner}
      </div>
    )
  }

  return (
    <a
      href={igUrl(car.instagram)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      data-reveal=""
      data-open={open || undefined}
      style={style}
      className={cls}
      onPointerDown={(e) => setTouch(e.pointerType === 'touch')}
      onClick={(e) => {
        if (touch && !open) {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      {inner}
    </a>
  )
}
