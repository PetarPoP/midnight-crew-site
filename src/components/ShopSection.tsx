import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { PRODUCTS } from '~/lib/data'
import { ProductPhoto } from './ProductPhoto'
import { SectionHead } from './ui'

/** Shop teaser on the home page; each card opens the full shop. */
export function ShopSection() {
  return (
    <section aria-label="Shop">
      <SectionHead
        id="shop"
        title="Shop"
        meta={
          <Link to="/shop" className="fh-wipe inline-block px-3 py-1 text-white">
            OTVORI SHOP →
          </Link>
        }
      />
      <ul className="grid grid-cols-1 gap-3 px-5 pb-16 md:grid-cols-3 md:px-12">
        {PRODUCTS.map((p, i) => (
          <li key={p.id} data-reveal="" style={{ '--i': i } as CSSProperties}>
            <Link to="/shop" search={{ p: p.id }} className="fh-hover group block h-full bg-panel">
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
