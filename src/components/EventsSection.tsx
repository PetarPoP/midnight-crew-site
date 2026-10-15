import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { KIND_COLOR, upcomingEvents } from '~/lib/data'
import { SectionHead } from './ui'

export function EventsSection() {
  const events = upcomingEvents()
  return (
    <section aria-label="Događaji">
      <SectionHead id="dogadaji" title="Događaji" meta={`${events.length} DOSTUPNO`} />
      <ol className="grid grid-cols-1 gap-3 px-5 pb-20 sm:grid-cols-2 md:px-12 lg:grid-cols-3 xl:grid-cols-5">
        {events.map((e, i) => (
          <li key={e.id} data-reveal="" style={{ '--i': i } as CSSProperties}>
            {/* Opens the event's quick view in place (?e=<id>) */}
            <Link
              to="."
              search={(s) => ({ ...s, e: e.id })}
              resetScroll={false}
              className="fh-hover group block h-full -skew-x-6 border-t-[6px] bg-panel transition-colors hover:bg-[#2b2339]"
              style={{ borderTopColor: KIND_COLOR[e.k] }}
            >
              <div className="flex min-h-[220px] skew-x-6 flex-col gap-3 px-[22px] py-5">
                <div className="flex justify-between text-base font-bold text-muted">
                  <span>{e.tag}</span>
                  <time dateTime={e.iso}>
                    {e.weekday} {e.date}
                  </time>
                </div>
                <h3 className="flex-1 text-[32px] leading-[.92] font-extrabold uppercase italic">{e.title}</h3>
                <div className="flex items-end justify-between gap-3 text-lg font-semibold">
                  <span>
                    {e.place} · {e.time}
                  </span>
                  <span
                    className="shrink-0 text-sm font-bold tracking-[.12em] opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:opacity-100"
                    style={{ color: KIND_COLOR[e.k] }}
                  >
                    DETALJI →
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
