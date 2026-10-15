import { PRODUCTS } from '~/lib/data'
import { useCart } from '~/lib/cart'

/** "Otključano" style toast after something lands in the cart. */
export function CartToast() {
  const { lastAdded } = useCart()
  if (!lastAdded) return null
  const p = PRODUCTS.find((x) => x.id === lastAdded.productId)
  if (!p) return null
  return (
    <div
      key={lastAdded.at}
      role="status"
      className="animate-toast-in fixed right-4 bottom-4 z-50 w-[280px] border-l-[6px] border-lime bg-ink/95 px-5 py-3.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,.8)] md:right-8 md:bottom-8"
    >
      <div className="text-sm font-bold tracking-[.12em] text-lime">DODANO U KOŠARICU</div>
      <div className="mt-0.5 text-2xl leading-none font-extrabold uppercase italic">
        {p.name}
        {lastAdded.size ? ` · ${lastAdded.size}` : ''}
      </div>
      <div className="mt-1 text-base text-soft">+{p.price} KM</div>
    </div>
  )
}
