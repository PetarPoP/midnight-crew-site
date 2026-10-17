import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '~/components/Hero'
import { MapSection } from '~/components/MapSection'
import { GarageStrip } from '~/components/GarageStrip'
import { EventsSection } from '~/components/EventsSection'
import { ShopSection } from '~/components/ShopSection'
import { Footer } from '~/components/Footer'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main className="overflow-x-clip bg-ink">
      <Hero />
      <MapSection />
      <GarageStrip />
      <EventsSection />
      <ShopSection />
      <Footer />
    </main>
  )
}
