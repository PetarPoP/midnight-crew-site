import { ArrowLeft, ArrowRight, Camera, X } from 'lucide-react'
import { Link, createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Header } from '~/components/Header'
import { Footer } from '~/components/Footer'
import { CarImage, Showroom, Stat } from '~/components/GarageSection'
import { Picture } from '~/components/Picture'
import { PadPrompt } from '~/components/ui'
import { DRIVE_LABEL, GARAGE, carById } from '~/lib/data'
import { ogMeta } from '~/lib/og'

export const Route = createFileRoute('/garaza_/$carId')({
  loader: ({ params }) => {
    const car = carById(params.carId)
    if (!car) throw notFound()
    return car
  },
  head: ({ loaderData: c }) => ({
    meta: c
      ? [
          { title: `${c.car} · Garaža · Midnight Crew` },
          { name: 'description', content: c.note || `${c.car} (${c.year}), vlasnik ${c.owner}. ${c.hp} KS, ${c.torque} Nm.` },
          ...ogMeta({ title: `${c.car} · ${c.owner} · Midnight Crew`, description: c.note || `${c.hp} KS · ${c.torque} Nm`, card: 'site', path: `/garaza/${c.id}` }),
        ]
      : [],
  }),
  component: CarPage,
  notFoundComponent: () => (
    <main className="min-h-screen bg-ink">
      <Header />
      <div className="px-5 py-20 md:px-(--gutter)">
        <h1 className="text-6xl font-extrabold uppercase italic">Nema tog auta</h1>
        <Link to="/garaza" className="fh-wipe mt-6 inline-flex items-center gap-2 px-3 py-1.5 text-xl font-extrabold uppercase italic">
          <ArrowLeft size={20} strokeWidth={3} aria-hidden="true" /> Natrag u garažu
        </Link>
      </div>
    </main>
  ),
})

function CarPage() {
  const car = Route.useLoaderData()
  const navigate = useNavigate()
  const [open, setOpen] = useState<number | null>(null)
  const i = GARAGE.findIndex((c) => c.id === car.id)
  const prev = GARAGE[(i - 1 + GARAGE.length) % GARAGE.length]
  const next = GARAGE[(i + 1) % GARAGE.length]

  return (
    <main className="min-h-screen overflow-x-clip bg-ink">
      <Header />

      <nav aria-label="Putanja" className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 text-base font-bold tracking-[.08em] text-muted uppercase md:px-(--gutter)">
        <div>
          <Link to="/garaza" className="hover:text-white">
            Garaža
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">{car.car}</span>
        </div>
        <span className="font-mono">
          AUTO {i + 1} / {GARAGE.length}
        </span>
      </nav>

      {/* Showroom stage, same look as the garage on the home page */}
      <div className="px-5 pt-6 pb-12 md:px-(--gutter)">
        <div className="md:px-10 md:py-6">
          <div className="garage-tilt relative overflow-hidden bg-[#161220] shadow-[0_0_0_4px_#fff,14px_14px_0_var(--color-pink)]">
            <div className="garage-untilt relative grid min-h-[560px] grid-rows-[auto_1fr_auto] md:min-h-[620px]">
              <Showroom year={car.year} />
              <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 md:px-8 md:pt-7">
                <div>
                  <div className="flex items-center gap-3 text-sm font-bold tracking-[.14em] text-lime">
                    <span>{car.year}</span>
                    <span className="h-3 w-px bg-white/30" />
                    <span>{DRIVE_LABEL[car.drivetrain]} pogon</span>
                  </div>
                  <h1 className="mt-1 max-w-[18ch] text-[44px] leading-[.88] font-extrabold uppercase italic md:text-[80px]">{car.car}</h1>
                  <div className="mt-2 inline-block -skew-x-12 bg-white px-3 py-0.5 text-xl font-extrabold text-ink uppercase italic">
                    <span className="inline-block skew-x-12">{car.owner}</span>
                  </div>
                </div>
                {car.instagram && (
                  <div className="text-xl font-bold uppercase">
                    <PadPrompt pad="a" href={`https://www.instagram.com/${car.instagram}/`}>
                      @{car.instagram}
                    </PadPrompt>
                  </div>
                )}
              </div>
              <div className="relative flex items-center justify-center px-4 py-6 md:px-16">
                <div className="relative z-[1] w-full max-w-[900px] animate-[car-in_.5s_cubic-bezier(.2,.9,.2,1)_both]">
                  <div aria-hidden="true" className="garage-shadow absolute top-full left-[2%] -z-[1] w-[96%] -translate-y-[62%]" />
                  <CarImage car={car} />
                  <div aria-hidden="true" className="garage-reflection pointer-events-none absolute inset-x-0 top-full">
                    <CarImage car={car} />
                  </div>
                </div>
              </div>
              <div className="relative grid gap-6 px-5 pb-5 md:grid-cols-[minmax(0,420px)_1fr] md:items-end md:px-8 md:pb-7">
                <div className="grid -skew-x-6 gap-2.5 bg-ink/70 px-5 py-4">
                  <div className="grid skew-x-6 gap-2.5">
                    <Stat label="Snaga" value={`${car.hp} KS`} ratio={car.hp / 600} />
                    <Stat label="Moment" value={`${car.torque} Nm`} ratio={car.torque / 700} />
                    <Stat label="Pogon" value={DRIVE_LABEL[car.drivetrain]} ratio={car.drivetrain === 'awd' ? 1 : car.drivetrain === 'rwd' ? 0.66 : 0.4} />
                  </div>
                </div>
                {car.note && <p className="max-w-[44ch] text-base leading-snug text-soft md:justify-self-end md:text-right">{car.note}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      <section aria-labelledby="fotke" className="px-5 pb-14 md:px-(--gutter)">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-white/12 pb-3">
          <h2 id="fotke" className="text-[52px] leading-[.85] font-extrabold uppercase italic md:text-[64px]">
            Fotke
          </h2>
          <span className="font-mono text-base text-muted">
            {car.photos.length ? `${car.photos.length} FOTKI · KLIKNI ZA POVEĆANJE` : 'JOŠ NEMA FOTKI'}
          </span>
        </div>
        {car.photos.length === 0 ? (
          <div className="flex items-center gap-3 bg-panel px-5 py-8 text-lg text-soft">
            <Camera size={24} strokeWidth={2} aria-hidden="true" className="shrink-0 text-muted" />
            Fotke ovog auta stižu uskoro.
          </div>
        ) : (
          <ul className="grid auto-rows-[200px] grid-flow-dense grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
            {car.photos.map((src, k) => (
              <li key={src + k} className={k % 7 === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}>
                <button
                  type="button"
                  onClick={() => setOpen(k)}
                  aria-label={`Otvori fotku ${k + 1} od ${car.photos.length}`}
                  className="group block size-full cursor-pointer overflow-hidden bg-panel transition-shadow hover:shadow-[0_0_0_3px_#fff] focus-visible:shadow-[0_0_0_3px_#fff] focus-visible:outline-none"
                >
                  <Picture
                    src={src}
                    sizes={k % 7 === 0 ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 640px) 25vw, 100vw'}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Previous / next car */}
      {GARAGE.length > 1 && (
        <nav aria-label="Drugi auti" className="grid grid-cols-1 gap-3.5 px-5 pb-12 sm:grid-cols-2 md:px-(--gutter)">
          <Link to="/garaza/$carId" params={{ carId: prev.id }} className="fh-hover flex flex-col gap-1 bg-panel px-5 py-4 text-white no-underline">
            <span className="flex items-center gap-1.5 text-sm font-bold tracking-[.14em] text-muted uppercase">
              <ArrowLeft size={14} strokeWidth={3} aria-hidden="true" /> Prethodni auto
            </span>
            <span className="text-[28px] leading-none font-extrabold uppercase italic">{prev.car}</span>
          </Link>
          <Link
            to="/garaza/$carId"
            params={{ carId: next.id }}
            className="fh-hover flex flex-col items-end gap-1 bg-panel px-5 py-4 text-right text-white no-underline"
          >
            <span className="flex items-center gap-1.5 text-sm font-bold tracking-[.14em] text-muted uppercase">
              Sljedeći auto <ArrowRight size={14} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="text-[28px] leading-none font-extrabold uppercase italic">{next.car}</span>
          </Link>
        </nav>
      )}

      <div className="hidden justify-end gap-3 pb-10 text-xl font-bold uppercase md:flex md:px-(--gutter)">
        <PadPrompt pad="b" onClick={() => navigate({ to: '/garaza' })}>
          Natrag
        </PadPrompt>
      </div>

      <Footer />
      {open !== null &&
        createPortal(<Lightbox photos={car.photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />, document.body)}
    </main>
  )
}

/** Full-screen photo viewer: ← / → or the buttons change photo, Esc or a click outside closes it. */
function Lightbox({ photos, index, onIndex, onClose }: { photos: string[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const n = photos.length
  const go = useCallback((d: number) => onIndex((index + d + n) % n), [index, n, onIndex])
  const swipe = useRef<number | null>(null)

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevOverflow
      prevFocus?.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  const btn =
    'flex size-12 shrink-0 cursor-pointer items-center justify-center border-2 border-white/40 bg-ink/80 text-white transition hover:bg-white hover:text-ink md:size-14'

  return (
    <div data-modal="" role="dialog" aria-modal="true" aria-label={`Fotka ${index + 1} od ${n}`} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4">
      <button type="button" tabIndex={-1} aria-label="Zatvori" onClick={onClose} className="absolute inset-0 animate-[fade-in_.2s_ease-out] cursor-default bg-[#0a080e]/95" />
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Zatvori" className={`${btn} absolute top-4 right-4 z-10`}>
        <X size={24} strokeWidth={3} aria-hidden="true" />
      </button>
      <div
        className="relative flex w-full max-w-[1400px] items-center justify-center gap-3 md:gap-5"
        onPointerDown={(e) => (swipe.current = e.clientX)}
        onPointerUp={(e) => {
          const s = swipe.current
          swipe.current = null
          if (s !== null && Math.abs(e.clientX - s) > 40) go(e.clientX < s ? 1 : -1)
        }}
      >
        {n > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="Prethodna fotka" className={`${btn} hidden sm:flex`}>
            <ArrowLeft size={24} strokeWidth={3} aria-hidden="true" />
          </button>
        )}
        <Picture
          key={photos[index]}
          src={photos[index]}
          sizes="100vw"
          alt={`Fotka ${index + 1} od ${n}`}
          draggable={false}
          className="modal-in max-h-[78vh] max-w-full min-w-0 object-contain shadow-[0_0_0_4px_#fff] select-none"
        />
        {n > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="Sljedeća fotka" className={`${btn} hidden sm:flex`}>
            <ArrowRight size={24} strokeWidth={3} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="relative font-mono text-lg text-soft">
        {index + 1} / {n}
      </div>
    </div>
  )
}
