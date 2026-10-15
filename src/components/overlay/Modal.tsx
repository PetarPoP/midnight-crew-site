import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Centred game-style dialog: dims and blurs the page, locks scrolling, closes
 * on Esc or a click outside, and gives the controller prompts inside it
 * priority (see useGameKeys).
 */
export function Modal({
  label,
  accent = 'var(--color-pink)',
  onClose,
  children,
  footer,
}: {
  label: string
  accent?: string
  onClose: () => void
  children: ReactNode
  footer: ReactNode
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    // Keep the page from shifting when the scrollbar disappears.
    const gap = window.innerWidth - html.clientWidth
    html.style.overflow = 'hidden'
    html.style.paddingRight = gap ? `${gap}px` : ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      html.style.overflow = prevOverflow
      html.style.paddingRight = ''
      prevFocus?.focus({ preventScroll: true })
    }
  }, [onClose])

  return (
    <div data-modal className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <button
        type="button"
        aria-label="Zatvori"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-[fade-in_.25s_ease-out] cursor-default bg-ink/75 backdrop-blur-md"
      />
      <div
        className="modal-in relative flex max-h-full w-full max-w-[980px] flex-col overflow-hidden bg-panel shadow-[0_0_0_4px_#fff,0_40px_80px_-20px_rgba(0,0,0,.9)] max-sm:h-full"
        style={{ borderTop: `6px solid ${accent}` }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Zatvori"
          className="absolute top-3 right-3 z-10 flex size-10 cursor-pointer items-center justify-center bg-ink/70 text-3xl leading-none transition hover:bg-white hover:text-ink"
        >
          ×
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/10 bg-panel px-5 py-3.5 text-lg font-bold uppercase md:px-7">
          {footer}
        </div>
      </div>
    </div>
  )
}

/** Shares a link with the system share sheet, or copies it. */
export function ShareButton({ path, title }: { path: string; title: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const onClick = async () => {
    const url = new URL(path, window.location.origin).toString()
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // cancelled: fall through to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      const el = ref.current
      if (el) {
        el.dataset.copied = ''
        setTimeout(() => delete el.dataset.copied, 1600)
      }
    } catch {
      window.prompt('Kopiraj link:', url)
    }
  }
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="group fh-wipe flex cursor-pointer items-center gap-2 px-3 py-1.5 font-extrabold uppercase italic"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
        <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
      </svg>
      <span className="group-data-copied:hidden">Podijeli</span>
      <span className="hidden text-lime group-data-copied:inline">Link kopiran</span>
    </button>
  )
}
