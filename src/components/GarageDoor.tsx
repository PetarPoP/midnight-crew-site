import { GARAGE } from '~/lib/data'
import { useDoorPhase } from '~/lib/garageDoor'

/** The roller door drawn over the page during the garage transition (see lib/garageDoor). */
export function GarageDoor() {
  const phase = useDoorPhase()
  if (phase === 'idle') return null
  const n = GARAGE.length

  return (
    <div data-phase={phase} className="garage-door fixed inset-0 z-[29]">
      <div aria-hidden="true" className="garage-door-stencil">
        Midnight
        <br />
        Crew
      </div>
      <div
        role="status"
        className="garage-door-load absolute top-[58%] left-1/2 flex w-[min(520px,calc(100%-40px))] -translate-x-1/2 flex-col gap-3.5 border-2 border-white/12 bg-ink/90 px-6 py-5"
      >
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-2xl font-extrabold uppercase italic md:text-[30px]">Učitavanje garaže</span>
          <span className="font-mono text-base text-muted">
            {n} {n === 1 ? 'AUTO' : 'AUTA'}
          </span>
        </div>
        <div aria-hidden="true" className="h-2.5 -skew-x-[20deg] overflow-hidden bg-white/15">
          <span className="garage-door-bar block h-full bg-lime" />
        </div>
        <p className="text-lg text-soft">
          <span className="font-bold text-lime">SAVJET:</span> klikni auto za sve njegove fotke.
        </p>
      </div>
      <div aria-hidden="true" className="garage-door-handle" />
      <div aria-hidden="true" className="garage-door-rail" />
      <div aria-hidden="true" className="garage-door-glow" />
    </div>
  )
}
