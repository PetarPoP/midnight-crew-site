import { ArrowRight } from 'lucide-react'
import { GARAGE } from '~/lib/data'
import { GarageLink } from './GarageDoor'

/** Landing-page entry to the garage page (the cars themselves live on /garaza). */
export function GarageStrip() {
  const n = GARAGE.length
  return (
    <section id="garaza" aria-label="Garaža" className="scroll-mt-24 px-5 py-12 md:px-(--gutter) md:py-16">
      <div
        data-reveal=""
        className="-skew-x-6 bg-panel shadow-[0_0_0_3px_#fff,8px_8px_0_var(--color-pink)]"
      >
        <div className="flex skew-x-6 flex-col items-start gap-5 px-7 py-7 md:flex-row md:items-center md:justify-between md:px-10 md:py-8">
          <div>
            <div className="font-mono text-base tracking-[.08em] text-lime md:text-lg">
              {n} {n === 1 ? 'AUTO' : 'AUTA'} EKIPE
            </div>
            <h2 className="mt-1 text-5xl leading-[.9] font-extrabold uppercase italic">Garaža</h2>
          </div>
          <GarageLink className="group flex shrink-0 -skew-x-[14deg] items-center gap-2.5 bg-white px-6 py-3 text-xl font-extrabold text-ink uppercase italic transition-colors hover:bg-lime focus-visible:bg-lime focus-visible:outline-none">
            <span className="flex skew-x-[14deg] items-center gap-2.5">
              Uđi u garažu
              <ArrowRight size={22} strokeWidth={3} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
            </span>
          </GarageLink>
        </div>
      </div>
    </section>
  )
}
