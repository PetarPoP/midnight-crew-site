import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type CSSProperties } from 'react'
import { Header } from '~/components/Header'
import { Footer } from '~/components/Footer'
import { ProductPhoto } from '~/components/ProductPhoto'
import { PadPrompt } from '~/components/ui'
import { INSTAGRAM_URL, PRODUCTS, SHOP_FILTERS, type Product, type ShopFilter } from '~/lib/data'
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

const ORDER_DM = 'https://ig.me/m/midnight_crew_livno'

function ShopPage() {
  const [filter, setFilter] = useState<ShopFilter>('sve')
  const navigate = useNavigate()
  const products = PRODUCTS.filter((p) => filter === 'sve' || p.category === filter)

  return (
    <main className="min-h-screen overflow-x-clip bg-ink">
      <div className="relative">
        {/* Dim strip of the hero photo behind the header */}
        <div className="absolute inset-0 overflow-hidden">
          <img src="/images/hero-bg.jpg" alt="" className="size-full object-cover object-[50%_65%] opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 to-ink" />
        </div>
        <Header />
        <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-5 pt-8 pb-8 md:px-12 md:pt-14">
          <div>
            <div data-reveal="left" className="text-base font-bold tracking-[.12em] text-lime">
              MERCH EKIPE · {PRODUCTS.length} ARTIKLA
            </div>
            <h1 data-reveal="left" style={{ '--i': 1 } as CSSProperties} className="text-[72px] leading-[.85] font-extrabold uppercase italic md:text-[120px]">
              Shop
            </h1>
          </div>
          <p data-reveal="right" className="max-w-[420px] text-lg font-semibold text-soft md:text-xl">
            Naručiš ovdje, platiš i pokupiš na sljedećem meetu. Bez dostave, bez drame.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-5 pb-16 md:px-12 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <div className="mb-5 flex gap-2 text-lg font-extrabold uppercase italic md:text-xl" role="group" aria-label="Kategorije">
            {SHOP_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={f.key === filter}
                className={`fh-wipe cursor-pointer px-4 py-2 uppercase italic ${f.key === filter ? '' : 'text-[#8e909b]'}`}
              >
                <span aria-hidden="true" className="absolute inset-0 -z-20 -skew-x-[14deg] bg-panel" />
                {f.label}
              </button>
            ))}
          </div>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {products.map((p, i) => (
              <li key={p.id} data-reveal="" style={{ '--i': i } as CSSProperties}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </div>

        <CartPanel />
      </div>

      <div className="hidden justify-end gap-7 px-12 pb-10 text-xl font-bold uppercase md:flex">
        <PadPrompt pad="b" onClick={() => navigate({ to: '/' })}>Natrag</PadPrompt>
        <PadPrompt pad="x" href="#kosarica">Košarica</PadPrompt>
      </div>

      <Footer />
    </main>
  )
}

function ProductCard({ product: p }: { product: Product }) {
  const { add } = useCart()
  const [size, setSize] = useState<string | null>(p.sizes.length ? (p.sizes.includes('M') ? 'M' : p.sizes[0]) : null)
  const [justAdded, setJustAdded] = useState(false)

  const onAdd = () => {
    add(p.id, size)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <article id={p.id} className="fh-hover group flex h-full scroll-mt-6 flex-col bg-panel" tabIndex={-1}>
      <ProductPhoto product={p} />
      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[40px] leading-[.9] font-extrabold uppercase italic">{p.name}</h2>
          <span className="shrink-0 -skew-x-[14deg] bg-lime px-3.5 py-2 text-[22px] font-extrabold text-ink">{p.price} KM</span>
        </div>
        <p className="flex-1 text-lg leading-snug text-soft">{p.blurb}</p>

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
          className={`flex cursor-pointer items-center justify-center gap-2.5 py-3 text-2xl font-extrabold uppercase italic transition-[background-color,scale] active:scale-95 ${
            justAdded ? 'bg-go text-ink' : 'bg-pink text-white hover:brightness-110'
          }`}
        >
          {justAdded ? 'Dodano ✓' : `Dodaj${size ? ` · ${size}` : ''}`}
        </button>
      </div>
    </article>
  )
}

function CartPanel() {
  const { lines, count, total, setQty, clear } = useCart()
  const [copied, setCopied] = useState(false)

  const orderText = [
    'Bok! Narudžba za Midnight Crew shop:',
    ...lines.map((l) => {
      const p = PRODUCTS.find((x) => x.id === l.productId)!
      return `- ${l.qty}× ${p.name}${l.size ? ` (${l.size})` : ''} = ${l.qty * p.price} KM`
    }),
    `Ukupno: ${total} KM`,
  ].join('\n')

  const order = async () => {
    try {
      await navigator.clipboard.writeText(orderText)
      setCopied(true)
    } catch {}
    window.open(ORDER_DM, '_blank', 'noopener')
  }

  return (
    <aside
      id="kosarica"
      aria-label="Košarica"
      data-reveal="right"
      className="h-fit scroll-mt-6 border-l-[6px] border-lime bg-panel px-6 py-5 xl:sticky xl:top-6"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[40px] leading-none font-extrabold uppercase italic">Košarica</h2>
        <span className="text-lg font-bold text-muted">{count} kom</span>
      </div>

      {lines.length === 0 ? (
        <p className="mt-6 mb-2 text-lg text-soft">
          Prazno. Odaberi nešto lijevo pa stisni <span className="font-bold text-white">Dodaj</span>.
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
        onClick={order}
        className="mt-4 w-full cursor-pointer bg-lime py-3.5 text-2xl font-extrabold text-ink uppercase italic transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Naruči preko Instagrama
      </button>
      <p className="mt-2.5 text-[15px] leading-snug text-muted">
        {copied
          ? 'Narudžba je kopirana. Zalijepi je u poruku na Instagramu.'
          : 'Kopiramo popis narudžbe i otvaramo poruku na Instagramu. Plaćaš i preuzimaš na meetu.'}
      </p>
      {lines.length > 0 && (
        <button type="button" onClick={clear} className="mt-3 cursor-pointer text-sm font-bold tracking-[.08em] text-muted underline-offset-4 hover:text-white hover:underline">
          ISPRAZNI KOŠARICU
        </button>
      )}
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="sr-only">
        Instagram profil
      </a>
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
