import { Link, createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { Footer } from '~/components/Footer'
import { Header } from '~/components/Header'
import { ProductPhoto } from '~/components/ProductPhoto'
import { BuyBox } from '~/components/shop/BuyBox'
import { PadPrompt } from '~/components/ui'
import { PRODUCTS, SITE_URL, productById } from '~/lib/data'
import { useCart } from '~/lib/cart'

export const Route = createFileRoute('/shop_/$productId')({
  loader: ({ params }) => {
    const product = productById(params.productId)
    if (!product) throw notFound()
    return product
  },
  // Link previews (Instagram, WhatsApp, Messenger...) show the product.
  head: ({ loaderData: p }) => ({
    meta: p
      ? [
          { title: `${p.name} · Shop · Midnight Crew` },
          { name: 'description', content: p.blurb },
          { property: 'og:title', content: `${p.name} · ${p.price} KM · Midnight Crew` },
          { property: 'og:description', content: p.blurb },
          { property: 'og:image', content: SITE_URL + (p.image || '/images/hero-bg.jpg') },
          { property: 'og:url', content: `${SITE_URL}/shop/${p.id}` },
        ]
      : [],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <main className="min-h-screen bg-ink">
      <Header />
      <div className="px-5 py-20 md:px-12">
        <h1 className="text-6xl font-extrabold uppercase italic">Nema tog artikla</h1>
        <Link to="/shop" className="fh-wipe mt-6 inline-block px-3 py-1.5 text-xl font-extrabold uppercase italic">
          ← Natrag u shop
        </Link>
      </div>
    </main>
  ),
})

function ProductPage() {
  const p = Route.useLoaderData()
  const navigate = useNavigate()
  const { count, total } = useCart()
  const others = PRODUCTS.filter((x) => x.id !== p.id)

  return (
    <main className="min-h-screen overflow-x-clip bg-ink">
      <Header />

      <nav aria-label="Putanja" className="px-5 pt-4 text-base font-bold tracking-[.08em] text-muted uppercase md:px-12">
        <Link to="/shop" className="hover:text-white">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">{p.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 px-5 pt-6 pb-16 md:px-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div data-reveal="left" className="-skew-x-3 self-start overflow-hidden bg-panel shadow-[0_0_0_4px_#fff]">
          <div className="skew-x-3 scale-[1.04]">
            <ProductPhoto product={p} />
          </div>
        </div>

        <div data-reveal="right" className="flex flex-col gap-5">
          <div className="text-base font-bold tracking-[.12em] text-lime">
            {p.category === 'odjeca' ? 'ODJEĆA' : 'DODACI'} · MIDNIGHT CREW
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-[72px] leading-[.85] font-extrabold uppercase italic md:text-[96px]">{p.name}</h1>
            <span className="-skew-x-[14deg] bg-lime px-4 py-2 text-[30px] font-extrabold text-ink">{p.price} KM</span>
          </div>
          <p className="text-xl leading-snug text-soft">{p.blurb}</p>
          <ul className="flex flex-col gap-2 text-xl font-semibold">
            {p.details.map((d) => (
              <li key={d} className="flex items-center gap-3">
                <span className="hex h-4 w-3.5 shrink-0 bg-pink" />
                {d}
              </li>
            ))}
          </ul>
          <div className="border-l-[6px] border-pink bg-panel px-5 py-5">
            <BuyBox product={p} padKey />
          </div>
          <Link
            to="/shop"
            hash="kosarica"
            className="fh-hover flex items-center justify-between bg-panel px-5 py-4 text-xl font-bold"
          >
            <span>
              <span className="text-lime">KOŠ</span> {count} kom · {total} KM
            </span>
            <span className="font-extrabold uppercase italic">Na košaricu →</span>
          </Link>
        </div>
      </div>

      <section aria-label="Još iz shopa" className="px-5 pb-16 md:px-12">
        <h2 data-reveal="left" className="mb-5 text-[44px] leading-none font-extrabold uppercase italic">
          Još iz shopa
        </h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {others.map((o, i) => (
            <li key={o.id} data-reveal="" style={{ '--i': i } as CSSProperties}>
              <Link to="." search={(s) => ({ ...s, p: o.id })} resetScroll={false} className="fh-hover group flex items-center gap-5 bg-panel pr-5">
                <div className="w-40 shrink-0">
                  <ProductPhoto product={o} />
                </div>
                <span className="flex-1 text-[32px] font-extrabold uppercase italic">{o.name}</span>
                <span className="-skew-x-[14deg] bg-lime px-3 py-1.5 text-xl font-extrabold text-ink">{o.price} KM</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="hidden justify-end gap-3 px-12 pb-10 text-xl font-bold uppercase md:flex">
        <PadPrompt pad="b" onClick={() => navigate({ to: '/shop' })}>Natrag</PadPrompt>
        <PadPrompt pad="x" to="/shop" hash="kosarica">Košarica</PadPrompt>
      </div>

      <Footer />
    </main>
  )
}
