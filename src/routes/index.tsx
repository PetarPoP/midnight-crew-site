import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Hero } from '~/components/Hero'
import { MapSection } from '~/components/MapSection'
import { EventsSection } from '~/components/EventsSection'
import { ShopSection } from '~/components/ShopSection'
import { Footer } from '~/components/Footer'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [cart, setCart] = useState(0)

  return (
    <main className="overflow-x-clip bg-ink">
      <Hero cart={cart} />
      <MapSection />
      <EventsSection />
      <ShopSection onAdd={() => setCart((c) => c + 1)} />
      <Footer />
    </main>
  )
}
