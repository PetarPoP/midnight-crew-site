import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { Product } from '~/lib/data'
import { ProductPhoto } from '../ProductPhoto'
import { PadPrompt } from '../ui'
import { BuyBox } from './BuyBox'

/** Game-style side panel with product details, opened from a shop card. */
export function QuickView({ product: p, onClose }: { product: Product; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus()
    }
  }, [onClose])

  return (
    <div data-modal className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={p.name}>
      <button
        type="button"
        aria-label="Zatvori"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-[fade-in_.25s_ease-out] cursor-default bg-ink/70 backdrop-blur-sm"
      />
      <div className="relative flex h-full w-full max-w-[520px] animate-[panel-in_.35s_cubic-bezier(.2,.9,.2,1)] flex-col overflow-y-auto border-l-[6px] border-pink bg-panel">
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="text-sm font-bold tracking-[.12em] text-lime">BRZI PREGLED</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Zatvori"
            className="flex size-10 cursor-pointer items-center justify-center text-3xl leading-none transition hover:bg-white hover:text-ink"
          >
            ×
          </button>
        </div>
        <div className="px-6 pt-3">
          <ProductPhoto product={p} />
        </div>
        <div className="flex flex-1 flex-col gap-5 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[48px] leading-[.85] font-extrabold uppercase italic">{p.name}</h2>
            <span className="shrink-0 -skew-x-[14deg] bg-lime px-3.5 py-2 text-[24px] font-extrabold text-ink">{p.price} KM</span>
          </div>
          <p className="text-lg leading-snug text-soft">{p.blurb}</p>
          <ul className="flex flex-col gap-1.5 text-lg font-semibold">
            {p.details.map((d) => (
              <li key={d} className="flex items-center gap-2.5">
                <span className="hex h-3.5 w-3 shrink-0 bg-pink" />
                {d}
              </li>
            ))}
          </ul>
          <BuyBox product={p} padKey />
        </div>
        <div className="sticky bottom-0 flex items-center justify-between gap-6 border-t border-white/10 bg-panel px-6 py-4 text-lg font-bold uppercase">
          <Link
            to="/shop/$productId"
            params={{ productId: p.id }}
            className="fh-wipe px-3 py-1.5 font-extrabold italic"
          >
            Cijela stranica →
          </Link>
          <PadPrompt pad="b" onClick={onClose}>Zatvori</PadPrompt>
        </div>
      </div>
    </div>
  )
}
