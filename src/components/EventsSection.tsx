import type { CSSProperties } from 'react'
import { EVENTS, KIND_COLOR } from '~/lib/data'
import { SectionHead } from './ui'

export function EventsSection() {
  return (
    <section aria-label="Događaji">
      <SectionHead id="dogadaji" title="Događaji" meta={`${EVENTS.length} DOSTUPNO`} />
      <ol className="grid grid-cols-1 gap-3 px-5 pb-20 sm:grid-cols-2 md:px-12 lg:grid-cols-3 xl:grid-cols-5">
        {EVENTS.map((e, i) => (
          <li key={e.date + e.title} data-reveal="" style={{ '--i': i } as CSSProperties}>
            <div
              tabIndex={0}
              className="fh-hover h-full -skew-x-6 border-t-[6px] bg-panel transition-colors hover:bg-[#2b2339]"
              style={{ borderTopColor: KIND_COLOR.nas }}
            >
              <div className="flex min-h-[220px] skew-x-6 flex-col gap-3 px-[22px] py-5">
                <div className="flex justify-between text-base font-bold text-muted">
                  <span>{e.tag}</span>
                  <time>{e.date}</time>
                </div>
                <h3 className="flex-1 text-[32px] leading-[.92] font-extrabold uppercase italic">{e.title}</h3>
                <div className="text-lg font-semibold">
                  {e.place} · {e.time}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
