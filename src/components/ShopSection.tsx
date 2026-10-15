import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { PRODUCTS } from '~/lib/data'
import { ProductPhoto } from './ProductPhoto'
import { SectionHead } from './ui'

/** Shop teaser on the home page; each card opens a quick view in place. */
export function ShopSection() {
  return (
    <section aria-label="Shop">
      <SectionHead
        id="shop"
        title="Shop"
        meta={
          <Link to="/shop" className="fh-wipe inline-flex items-center gap-1.5 px-3 py-1 text-white">
            OTVORI SHOP <ArrowRight size={18} strokeWidth={3} aria-hidden="true" />
          </Link>
        }
      />
      <ul className="grid grid-cols-1 gap-3 px-5 pb-16 md:grid-cols-3 md:px-(--gutter)">
        {PRODUCTS.map((p, i) => (
          <li key={p.id} data-reveal="" style={{ '--i': i } as CSSProperties}>
            <Link to="." search={(s) => ({ ...s, p: p.id })} resetScroll={false} className="fh-hover group block h-full bg-panel">
              <ProductPhoto product={p} />
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-[32px] font-extrabold uppercase italic">{p.name}</span>
                <span className="-skew-x-[14deg] bg-lime px-3.5 py-2 text-[22px] font-extrabold text-ink transition-transform group-hover:scale-110">
                  {p.price} KM
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
