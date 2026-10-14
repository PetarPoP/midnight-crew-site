import { useEffect, useRef, useState } from 'react'
import { PRODUCTS } from '~/lib/data'

export function ShopSection({ onAdd }: { onAdd: () => void }) {
  const [added, setAdded] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const add = (id: string) => {
    onAdd()
    setAdded(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(null), 1400)
  }

  return (
    <section id="shop" aria-label="Shop" className="scroll-mt-4">
      <ul className="grid grid-cols-1 gap-3 px-5 pb-16 md:grid-cols-3 md:px-12">
        {PRODUCTS.map((p) => (
          <li key={p.id} className="overflow-hidden bg-panel">
            <div className="aspect-[16/11] bg-panel-2 p-px">
              {/* Product photo goes here */}
              <div className="flex size-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-white/25 font-sans text-[13px] text-white/60">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
                </svg>
                {p.placeholder}
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[32px] font-extrabold uppercase italic">{p.name}</span>
              <button
                type="button"
                onClick={() => add(p.id)}
                aria-label={`Dodaj ${p.name} u košaricu, ${p.price} KM`}
                className="cursor-pointer -skew-x-[14deg] bg-lime px-3.5 py-2 text-[22px] font-extrabold text-ink transition hover:brightness-110 active:scale-95"
              >
                {added === p.id ? 'Dodano ✓' : `${p.price} KM`}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
