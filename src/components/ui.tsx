import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { flashPressed } from '~/lib/useGameKeys'

const PAD_COLOR = { a: 'bg-go', b: 'bg-stop', x: 'bg-cyan' } as const
type Pad = keyof typeof PAD_COLOR

/** Round controller-style button glyph (A / B / X). */
export function PadButton({ letter, className = '' }: { letter: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pad-glyph flex size-[30px] shrink-0 items-center justify-center rounded-full text-base not-italic ${className}`}
    >
      {letter}
    </span>
  )
}

type PromptBase = { pad: Pad; children: ReactNode; className?: string; glyphClassName?: string }

/**
 * A controller prompt ("A Odaberi"). Works on click and on the matching
 * keyboard key (see useGameKeys). Renders a router Link, an external/hash
 * anchor, or a button depending on the props.
 */
export function PadPrompt(
  props: PromptBase &
    ({ to: ComponentProps<typeof Link>['to']; hash?: string } | { href: string } | { onClick: () => void }),
) {
  const { pad, children, className = '', glyphClassName = '' } = props
  const cls = `pad-prompt flex cursor-pointer items-center gap-2 uppercase no-underline ${className}`
  const inner = (
    <>
      <PadButton letter={pad.toUpperCase()} className={`${PAD_COLOR[pad]} ${pad === 'x' ? 'text-ink' : ''} ${glyphClassName}`} />
      {children}
    </>
  )
  const press = (e: React.MouseEvent<HTMLElement>) => flashPressed(e.currentTarget)
  const title = `Tipka ${pad.toUpperCase()}`

  if ('to' in props)
    return (
      <Link to={props.to} hash={props.hash} data-pad={pad} title={title} className={cls} onClick={press}>
        {inner}
      </Link>
    )
  if ('href' in props)
    return (
      <a
        href={props.href}
        data-pad={pad}
        title={title}
        className={cls}
        onClick={press}
        {...(props.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    )
  return (
    <button
      type="button"
      data-pad={pad}
      title={title}
      className={cls}
      onClick={(e) => {
        press(e)
        props.onClick()
      }}
    >
      {inner}
    </button>
  )
}

/** Keyboard hint chip (Q / E). */
export function KeyHint({ children, onClick, label, className = '' }: { children: ReactNode; onClick?: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        flashPressed(e.currentTarget)
        onClick?.()
      }}
      aria-label={label}
      className={`flex h-7 w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-md bg-white/20 text-sm font-bold not-italic transition hover:bg-white/35 data-[pressed]:scale-90 ${className}`}
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
    <div id={id} className="flex scroll-mt-4 flex-wrap items-end justify-between gap-x-6 gap-y-2 px-5 pb-6 pt-10 md:px-(--gutter) md:pt-[34px]">
      <h2 data-reveal="left" className="text-[52px] leading-[.85] font-extrabold uppercase italic md:text-[72px]">
        {title}
      </h2>
      <div data-reveal="right" className="text-base font-bold tracking-[.08em] text-muted md:text-lg">
        {meta}
      </div>
    </div>
  )
}

/** A place name from the CMS; "A → B" (or "A -> B") is shown with an arrow icon. */
export function Place({ name }: { name: string }) {
  const parts = name.split(/\s*(?:→|->)\s*/)
  if (parts.length < 2) return <>{name}</>
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <ArrowRight size="0.9em" strokeWidth={3} aria-label="do" className="mx-1 inline-block align-[-0.1em]" />}
          {p}
        </span>
      ))}
    </>
  )
}
