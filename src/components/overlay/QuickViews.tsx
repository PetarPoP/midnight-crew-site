import { useSearch } from '@tanstack/react-router'
import { eventById, productById } from '~/lib/data'
import { useOverlay } from '~/lib/overlay'
import { EventQuickView } from './EventQuickView'
import { ProductQuickView } from './ProductQuickView'

/** Renders whichever quick view the URL asks for (?p= or ?e=). */
export function QuickViews() {
  const { p, e } = useSearch({ from: '__root__' })
  const { close } = useOverlay()
  const product = p ? productById(p) : undefined
  const event = e ? eventById(e) : undefined
  if (product) return <ProductQuickView key={product.id} product={product} onClose={close} />
  if (event) return <EventQuickView key={event.id} event={event} onClose={close} />
  return null
}
