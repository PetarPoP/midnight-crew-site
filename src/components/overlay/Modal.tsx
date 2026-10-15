import { Ellipsis, Share2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

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
    <div data-modal className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <button
        type="button"
        aria-label="Zatvori"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-[fade-in_.25s_ease-out] cursor-default bg-ink/75 backdrop-blur-md"
      />
      <div
        className="modal-in relative flex max-h-[92dvh] w-full max-w-[820px] flex-col overflow-hidden bg-panel shadow-[0_0_0_4px_#fff,0_40px_80px_-20px_rgba(0,0,0,.9)] sm:max-h-[min(88vh,760px)]"
        style={{ borderTop: `6px solid ${accent}` }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Zatvori"
          className="absolute top-3 right-3 z-10 flex size-10 cursor-pointer items-center justify-center bg-ink/70 text-3xl leading-none transition hover:bg-white hover:text-ink"
        >
          <X size={24} strokeWidth={3} aria-hidden="true" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        <div className="relative flex items-center justify-between gap-x-4 border-t border-white/10 bg-panel px-4 py-3 text-lg font-bold uppercase md:px-7">
          {footer}
        </div>
      </div>
    </div>
  )
}

/** Shares a link with the system share sheet, or copies it. */
export function ShareButton({ path, title, className }: { path: string; title: string; className?: string }) {
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
      className={`group ${className ?? 'fh-wipe flex cursor-pointer items-center gap-2 px-3 py-1.5 font-extrabold uppercase italic'}`}
    >
      <Share2 size={20} strokeWidth={2.5} aria-hidden="true" className="shrink-0" />
      <span className="group-data-copied:hidden">Podijeli</span>
      <span className="hidden text-lime group-data-copied:inline">Link kopiran</span>
    </button>
  )
}

/** "Više" button in a dialog footer: secondary actions in a small pop-up menu. */
export function MoreMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', off)
    return () => window.removeEventListener('pointerdown', off)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className="fh-wipe flex cursor-pointer items-center gap-2 px-3 py-1.5 font-extrabold uppercase italic"
      >
        Više <Ellipsis size={22} strokeWidth={3} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          onClick={(e) => (e.target as HTMLElement).closest('a,button') && setTimeout(() => setOpen(false), 50)}
          className="animate-swap-in absolute bottom-full left-0 mb-2 flex w-[240px] flex-col divide-y divide-white/10 bg-ink shadow-[0_0_0_2px_#fff,0_20px_40px_-10px_rgba(0,0,0,.9)]"
        >
          {children}
        </div>
      )}
    </div>
  )
}

/** One row of the "Više" menu: icon on the left, label, same size for every row. */
export const MENU_ITEM =
  'flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-lg font-extrabold text-white uppercase italic no-underline transition-colors hover:bg-white hover:text-ink focus-visible:bg-white focus-visible:text-ink focus-visible:outline-none'
