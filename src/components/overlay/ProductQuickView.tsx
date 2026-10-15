import { Link } from '@tanstack/react-router'
import type { Product } from '~/lib/data'
import { ProductPhoto } from '../ProductPhoto'
import { BuyBox } from '../shop/BuyBox'
import { PadPrompt } from '../ui'
import { Modal, MoreMenu, ShareButton } from './Modal'

/** Product details in a centred dialog, opened from any product card. */
export function ProductQuickView({ product: p, onClose }: { product: Product; onClose: () => void }) {
  return (
    <Modal
      label={p.name}
      onClose={onClose}
      footer={
        <>
          <MoreMenu>
            <Link
              to="/shop/$productId"
              params={{ productId: p.id }}
              search={{}}
              className="fh-wipe px-3 py-1.5 font-extrabold italic"
            >
              Cijela stranica →
            </Link>
            <ShareButton path={`/shop/${p.id}`} title={`${p.name} · Midnight Crew`} />
          </MoreMenu>
          <PadPrompt pad="b" onClick={onClose}>
            Zatvori
          </PadPrompt>
        </>
      }
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="bg-panel-2">
          <ProductPhoto product={p} className="aspect-[2/1] md:aspect-auto md:h-full md:min-h-[360px]" />
        </div>
        <div className="flex flex-col gap-4 px-5 pt-5 pb-5 md:px-7 md:pt-7">
          <div className="pr-10">
            <div className="text-sm font-bold tracking-[.14em] text-lime">{p.category === 'odjeca' ? 'ODJEĆA' : 'DODACI'}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 className="text-[40px] leading-[.85] font-extrabold uppercase italic md:text-[48px]">{p.name}</h2>
              <span className="inline-block -skew-x-[14deg] bg-lime px-3 py-1 text-[22px] font-extrabold text-ink">{p.price} KM</span>
            </div>
          </div>
          <p className="text-lg leading-snug text-soft">{p.blurb}</p>
          <BuyBox product={p} padKey />
          {p.details.length > 0 && (
            <details className="group border-t border-white/10 pt-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold tracking-[.12em] text-muted uppercase hover:text-white">
                Detalji
                <span aria-hidden="true" className="text-lg transition-transform group-open:rotate-45">+</span>
              </summary>
              <ul className="mt-3 flex flex-col gap-1.5 text-base font-semibold">
                {p.details.map((d) => (
                  <li key={d} className="flex items-center gap-2.5">
                    <span className="hex h-3 w-2.5 shrink-0 bg-pink" />
                    {d}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </Modal>
  )
}
