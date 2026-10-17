import type { ReactNode } from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800.css'
import '@fontsource/barlow-condensed/800-italic.css'
import '@fontsource/share-tech-mono/400.css'
import appCss from '~/styles.css?url'
import { CartProvider } from '~/lib/cart'
import { useGameKeys } from '~/lib/useGameKeys'
import { RevealObserver } from '~/components/RevealObserver'
import { CartToast } from '~/components/CartToast'
import { GarageDoorProvider } from '~/components/GarageDoor'
import { QuickViews } from '~/components/overlay/QuickViews'
import { eventById, productById } from '~/lib/data'
import { ogMeta } from '~/lib/og'

const DESCRIPTION = 'Midnight Crew iz Livna: car meetovi, noćni cruiseovi i ekipa. Bez članarine, bez drame.'

type OverlaySearch = { p?: string; e?: string }

export const Route = createRootRoute({
  // ?p=<product> / ?e=<event> open a quick view on top of any page.
  validateSearch: (s: Record<string, unknown>): OverlaySearch => ({
    p: typeof s.p === 'string' && productById(s.p) ? s.p : undefined,
    e: typeof s.e === 'string' && eventById(s.e) ? s.e : undefined,
  }),
  head: ({ match }) => ({
    meta: [
      ...shareMeta(match.search),
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Midnight Crew · Livno' },
      {
        name: 'description',
        content: DESCRIPTION,
      },
      { name: 'theme-color', content: '#14101c' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
    // Flag JS before first paint so scroll-reveal elements start hidden
    // (without JS the page simply shows everything).
    scripts: [
      {
        children:
          "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('reveal-ready')",
      },
    ],
  }),
  component: RootComponent,
})

/** Link-preview tags; a shared event (?e=) or product (?p=) link previews that item. */
function shareMeta(search: OverlaySearch) {
  const ev = search.e ? eventById(search.e) : undefined
  if (ev) {
    return ogMeta({
      title: `${ev.title} · ${ev.weekday} ${ev.date} ${ev.time}`,
      description: `${ev.place.replace(/\s*->\s*/g, ' → ')}. ${ev.description}`.trim(),
      card: `event-${ev.id}`,
      path: `/?e=${ev.id}`,
    })
  }
  const p = search.p ? productById(search.p) : undefined
  if (p) {
    return ogMeta({ title: `${p.name} · ${p.price} KM · Midnight Crew`, description: p.blurb, card: `product-${p.id}`, path: `/shop/${p.id}` })
  }
  return ogMeta({ title: 'Midnight Crew · Livno', description: DESCRIPTION, card: 'site' })
}

function RootComponent() {
  useGameKeys()
  return (
    <RootDocument>
      <CartProvider>
        <GarageDoorProvider>
          <Outlet />
          <QuickViews />
          <CartToast />
        </GarageDoorProvider>
      </CartProvider>
      <RevealObserver />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="hr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
