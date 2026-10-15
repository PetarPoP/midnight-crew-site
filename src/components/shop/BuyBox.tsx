import { Check } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '~/lib/data'
import { useCart } from '~/lib/cart'
import { PadButton } from '../ui'

/** Size picker + add-to-cart button, shared by the quick view and the product page. */
export function BuyBox({ product: p, padKey = false }: { product: Product; padKey?: boolean }) {
  const { add } = useCart()
  const [size, setSize] = useState<string | null>(p.sizes.length ? (p.sizes.includes('M') ? 'M' : p.sizes[0]) : null)
  const [justAdded, setJustAdded] = useState(false)

  const onAdd = () => {
    add(p.id, size)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <div className="flex flex-col gap-4">
      {p.sizes.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-bold tracking-[.12em] text-muted">VELIČINA</div>
          <div className="flex gap-2" role="radiogroup" aria-label={`Veličina, ${p.name}`}>
            {p.sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={s === size}
                aria-pressed={s === size}
                onClick={() => setSize(s)}
                className={`fh-wipe min-w-12 cursor-pointer px-3 py-1.5 text-xl font-extrabold italic ${s === size ? '' : 'text-soft'}`}
              >
                <span aria-hidden="true" className="absolute inset-0 -z-20 -skew-x-[14deg] bg-panel-2" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onAdd}
        {...(padKey ? { 'data-pad': 'a' } : {})}
        className={`pad-prompt flex cursor-pointer items-center justify-center gap-3 py-3 text-2xl font-extrabold uppercase italic transition-[background-color,scale] active:scale-95 ${
          justAdded ? 'bg-go text-ink' : 'bg-pink text-white hover:brightness-110'
        }`}
      >
        {padKey && !justAdded && <PadButton letter="A" className="bg-go text-white" />}
        {justAdded ? (
          <>
            Dodano <Check size={24} strokeWidth={3.5} aria-hidden="true" />
          </>
        ) : (
          `Dodaj u košaricu${size ? ` · ${size}` : ''}`
        )}
      </button>
    </div>
  )
}
