import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createPortal } from 'react-dom'
import { useState, type CSSProperties } from 'react'
import { Header } from '~/components/Header'
import { Footer } from '~/components/Footer'
import { ProductPhoto } from '~/components/ProductPhoto'
import { PadPrompt } from '~/components/ui'
import { CheckoutModal } from '~/components/shop/CheckoutModal'
import { PRODUCTS, SHOP_FILTERS, type Product, type ShopFilter } from '~/lib/data'
import { useOverlay } from '~/lib/overlay'
import { useCart } from '~/lib/cart'

export const Route = createFileRoute('/shop')({
  head: () => ({
    meta: [
      { title: 'Shop · Midnight Crew' },
      { name: 'description', content: 'Majice, hoodice i naljepnice Midnight Crew ekipe iz Livna.' },
    ],
  }),
  component: ShopPage,
})

function ShopPage() {
  const [filter, setFilter] = useState<ShopFilter>('sve')
  const navigate = useNavigate()
  const products = PRODUCTS.filter((p) => filter === 'sve' || p.category === filter)
  const { openProduct } = useOverlay()

  return (
    <main className="min-h-screen overflow-x-clip bg-ink">
      <div className="relative">
        {/* Dim strip of the hero photo behind the header */}
        <div className="absolute inset-0 overflow-hidden">
          <img src="/images/hero-bg.jpg" alt="" className="size-full object-cover object-[50%_65%] opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 to-ink" />
        </div>
        <Header />
        <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-5 pt-8 pb-8 md:px-(--gutter) md:pt-14">
          <div>
            <div data-reveal="left" className="text-base font-bold tracking-[.12em] text-lime">
              MERCH EKIPE · {PRODUCTS.length} ARTIKLA
            </div>
            <h1 data-reveal="left" style={{ '--i': 1 } as CSSProperties} className="text-[72px] leading-[.85] font-extrabold uppercase italic md:text-[120px]">
              Shop
            </h1>
          </div>
          <p data-reveal="right" className="max-w-[420px] text-lg font-semibold text-soft md:text-xl">
            Naručiš ovdje, a plaćaš pouzećem kad paket stigne. Dostava u cijeloj BiH.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-5 pb-16 md:px-(--gutter) xl:grid-cols-[minmax(0,1fr)_380px]">
        <ul className="order-2 grid h-fit grid-cols-1 gap-4 md:grid-cols-2 xl:order-none">
          {products.map((p, i) => (
            <li key={p.id} data-reveal="" style={{ '--i': i } as CSSProperties}>
              <ProductCard product={p} onOpen={() => openProduct(p.id)} />
            </li>
          ))}
        </ul>

        {/* Cart and filters stay in view while scrolling */}
        <div className="order-1 flex h-fit flex-col gap-4 xl:sticky xl:top-6 xl:order-none">
          <CartPanel />
          <div data-reveal="right" style={{ '--i': 1 } as CSSProperties} className="bg-panel px-6 py-5">
            <div className="mb-3 text-sm font-bold tracking-[.12em] text-muted">KATEGORIJE</div>
            <div className="flex flex-wrap gap-2 text-lg font-extrabold uppercase italic md:text-xl" role="group" aria-label="Kategorije">
              {SHOP_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={f.key === filter}
                  className={`fh-wipe cursor-pointer px-4 py-2 uppercase italic ${f.key === filter ? '' : 'text-[#8e909b]'}`}
                >
                  <span aria-hidden="true" className="absolute inset-0 -z-20 -skew-x-[14deg] bg-panel-2" />
                  {f.label}
                  <span className="ml-1.5 text-base opacity-60">
                    {f.key === 'sve' ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === f.key).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden justify-end gap-3 md:px-(--gutter) pb-10 text-xl font-bold uppercase md:flex">
        <PadPrompt pad="b" onClick={() => navigate({ to: '/' })}>Natrag</PadPrompt>
        <PadPrompt pad="x" href="#kosarica">Košarica</PadPrompt>
      </div>

      <Footer />
    </main>
  )
}

function ProductCard({ product: p, onOpen }: { product: Product; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${p.name}, ${p.price} KM, otvori pojedinosti`}
      className="fh-hover group flex h-full w-full cursor-pointer flex-col bg-panel text-left"
    >
      <ProductPhoto product={p} />
      <div className="flex flex-1 flex-col gap-3 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[40px] leading-[.9] font-extrabold uppercase italic">{p.name}</h2>
          <span className="shrink-0 -skew-x-[14deg] bg-lime px-3.5 py-2 text-[22px] font-extrabold text-ink">{p.price} KM</span>
        </div>
        <p className="flex-1 text-lg leading-snug text-soft">{p.blurb}</p>
        <div className="flex items-center justify-between text-base font-bold tracking-[.08em] text-muted uppercase">
          <span>{p.sizes.length ? p.sizes.join(' · ') : 'Jedna veličina'}</span>
          <span className="text-lime transition-transform group-hover:translate-x-1">Pojedinosti →</span>
        </div>
      </div>
    </button>
  )
}

function CartPanel() {
  const { lines, count, total, setQty, clear } = useCart()
  const [checkout, setCheckout] = useState(false)

  return (
    <aside
      id="kosarica"
      aria-label="Košarica"
      data-reveal="right"
      className="scroll-mt-6 border-l-[6px] border-lime bg-panel px-6 py-5"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[40px] leading-none font-extrabold uppercase italic">Košarica</h2>
        <span className="text-lg font-bold text-muted">{count} kom</span>
      </div>

      {lines.length === 0 ? (
        <p className="mt-6 mb-2 text-lg text-soft">
          Prazno. Otvori artikl i stisni <span className="font-bold text-white">Dodaj u košaricu</span>.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-2">
          {lines.map((l) => {
            const p = PRODUCTS.find((x) => x.id === l.productId)!
            return (
              <li key={l.productId + l.size} className="animate-swap-in flex items-center gap-3 bg-ink/60 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xl leading-tight font-extrabold uppercase italic">
                    {p.name}
                    {l.size && <span className="text-lime"> · {l.size}</span>}
                  </div>
                  <div className="font-mono text-sm text-soft">{l.qty * p.price} KM</div>
                </div>
                <div className="flex items-center gap-1">
                  <QtyButton label={`Makni jedan, ${p.name}`} onClick={() => setQty(l.productId, l.size, l.qty - 1)}>
                    −
                  </QtyButton>
                  <span className="w-7 text-center font-mono text-lg">{l.qty}</span>
                  <QtyButton label={`Dodaj još jedan, ${p.name}`} onClick={() => setQty(l.productId, l.size, l.qty + 1)}>
                    +
                  </QtyButton>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
        <span className="text-base font-bold tracking-[.12em] text-muted">UKUPNO</span>
        <span className="font-mono text-[40px] leading-none">{total} KM</span>
      </div>

      <button
        type="button"
        disabled={lines.length === 0}
        onClick={() => setCheckout(true)}
        className="mt-4 w-full cursor-pointer bg-lime py-3.5 text-2xl font-extrabold text-ink uppercase italic transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Naruči
      </button>
      <p className="mt-2.5 text-[15px] leading-snug text-muted">
        Plaćaš pouzećem. Dostava samo u Bosnu i Hercegovinu.
      </p>
      {lines.length > 0 && (
        <button type="button" onClick={clear} className="mt-3 cursor-pointer text-sm font-bold tracking-[.08em] text-muted underline-offset-4 hover:text-white hover:underline">
          ISPRAZNI KOŠARICU
        </button>
      )}
      {checkout && createPortal(<CheckoutModal onClose={() => setCheckout(false)} />, document.body)}
    </aside>
  )
}

function QtyButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 cursor-pointer items-center justify-center bg-white/10 text-xl font-bold transition hover:bg-white hover:text-ink active:scale-90"
    >
      {children}
    </button>
  )
}
