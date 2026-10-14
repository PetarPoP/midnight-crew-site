import type { ReactNode } from 'react'

/** Round controller-style button glyph (A / B / X). */
export function PadButton({ letter, className = '' }: { letter: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-[30px] shrink-0 items-center justify-center rounded-full text-base not-italic ${className}`}
    >
      {letter}
    </span>
  )
}

/** Keyboard hint chip (Q / E). */
export function KeyHint({ children, onClick, label }: { children: ReactNode; onClick?: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-md bg-white/20 text-sm font-bold not-italic transition hover:bg-white/30"
    >
      {children}
    </button>
  )
}

/** Image credit, shown small in a corner like the design's photo slots. */
export function Credit({ name, href, className = '' }: { name: string; href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded bg-black/40 px-1.5 py-0.5 font-sans text-[10px] text-white/70 hover:text-white ${className}`}
    >
      Photo by {name} on Unsplash
    </a>
  )
}

/** Big italic section title row with a right-aligned meta line. */
export function SectionHead({ title, meta, id }: { title: string; meta: ReactNode; id?: string }) {
  return (
    <div id={id} className="flex scroll-mt-4 flex-wrap items-end justify-between gap-x-6 gap-y-2 px-5 pb-6 pt-10 md:px-12 md:pt-[34px]">
      <h2 className="text-[52px] leading-[.85] font-extrabold uppercase italic md:text-[72px]">{title}</h2>
      <div className="text-base font-bold tracking-[.08em] text-muted md:text-lg">{meta}</div>
    </div>
  )
}
