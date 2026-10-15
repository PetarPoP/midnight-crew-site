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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Midnight Crew · Livno' },
      {
        name: 'description',
        content: 'Midnight Crew iz Livna: car meetovi, noćni cruiseovi i ekipa. Bez članarine, bez drame.',
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

function RootComponent() {
  useGameKeys()
  return (
    <RootDocument>
      <CartProvider>
        <Outlet />
        <CartToast />
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
