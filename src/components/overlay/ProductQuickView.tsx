import { Link } from '@tanstack/react-router'
import type { Product } from '~/lib/data'
import { ProductPhoto } from '../ProductPhoto'
import { BuyBox } from '../shop/BuyBox'
import { PadPrompt } from '../ui'
import { Modal, ShareButton } from './Modal'

/** Product details in a centred dialog, opened from any product card. */
export function ProductQuickView({ product: p, onClose }: { product: Product; onClose: () => void }) {
  return (
    <Modal
      label={p.name}
      onClose={onClose}
      footer={
        <>
          <div className="flex items-center gap-2">
            <Link
              to="/shop/$productId"
              params={{ productId: p.id }}
              search={{}}
              className="fh-wipe px-3 py-1.5 font-extrabold italic"
            >
              Cijela stranica →
            </Link>
            <ShareButton path={`/shop/${p.id}`} title={`${p.name} · Midnight Crew`} />
          </div>
          <PadPrompt pad="b" onClick={onClose}>
            Zatvori
          </PadPrompt>
        </>
      }
    >
      <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="bg-panel-2 md:self-stretch">
          <ProductPhoto product={p} className="md:aspect-auto md:h-full md:min-h-[420px]" />
        </div>
        <div className="flex flex-col gap-5 px-5 pt-6 pb-6 md:px-7 md:pt-8">
          <div>
            <div className="text-sm font-bold tracking-[.14em] text-lime">BRZI PREGLED · {p.category === 'odjeca' ? 'ODJEĆA' : 'DODACI'}</div>
            <div className="mt-2 flex items-start justify-between gap-4 pr-10">
              <h2 className="text-[52px] leading-[.85] font-extrabold uppercase italic">{p.name}</h2>
            </div>
            <span className="mt-3 inline-block -skew-x-[14deg] bg-lime px-3.5 py-1.5 text-[26px] font-extrabold text-ink">{p.price} KM</span>
          </div>
          <p className="text-lg leading-snug text-soft">{p.blurb}</p>
          {p.details.length > 0 && (
            <ul className="flex flex-col gap-1.5 text-lg font-semibold">
              {p.details.map((d) => (
                <li key={d} className="flex items-center gap-2.5">
                  <span className="hex h-3.5 w-3 shrink-0 bg-pink" />
                  {d}
                </li>
              ))}
            </ul>
          )}
          <BuyBox product={p} padKey />
        </div>
      </div>
    </Modal>
  )
}
