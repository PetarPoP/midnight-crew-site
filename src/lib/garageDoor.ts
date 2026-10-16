import { useRouter, useRouterState } from '@tanstack/react-router'
import { useCallback, useSyncExternalStore } from 'react'

/**
 * Garage door page transition: the door comes down, the garage loads behind
 * it, then the door goes up. Plays only when entering /garaza from another
 * page; moving around inside the garage (list ↔ car) navigates normally.
 */
export type DoorPhase = 'idle' | 'closing' | 'loading' | 'opening'

const CLOSE_MS = 900
const OPEN_MS = 1100
/** Shortest time the loading panel stays up, so it doesn't just flash. */
const MIN_LOADING_MS = 800
/** Longest wait for the first car photos before opening anyway. */
const IMAGE_TIMEOUT_MS = 2500
const REDUCED_MS = 250

let phase: DoorPhase = 'idle'
const subs = new Set<() => void>()
const setPhase = (p: DoorPhase) => {
  phase = p
  subs.forEach((f) => f())
}
const subscribe = (f: () => void) => {
  subs.add(f)
  return () => subs.delete(f)
}

export const useDoorPhase = () => useSyncExternalStore(subscribe, () => phase, () => 'idle' as DoorPhase)

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)))

/**
 * Resolves when the on-screen images inside [data-door-wait] (at most `max`)
 * have loaded or failed, or after a timeout. Lazy images further down never
 * start loading behind the door, so only the visible ones are awaited.
 */
async function imagesReady(max = 12) {
  await frame()
  const imgs = [...document.querySelectorAll<HTMLImageElement>('[data-door-wait] img')]
    .filter((img) => img.getBoundingClientRect().top < window.innerHeight)
    .slice(0, max)
  const each = imgs.map((img) =>
    img.complete ? null : new Promise((r) => {
      img.addEventListener('load', r, { once: true })
      img.addEventListener('error', r, { once: true })
    }),
  )
  await Promise.race([Promise.all(each), wait(IMAGE_TIMEOUT_MS)])
}

type GarageTarget = { carId?: string }

/** Returns a function that goes to the garage (or one car in it), with the door when coming from outside. */
export function useEnterGarage() {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const inGarage = pathname === '/garaza' || pathname.startsWith('/garaza/')

  return useCallback(
    async ({ carId }: GarageTarget = {}) => {
      const opts = carId ? ({ to: '/garaza/$carId', params: { carId } } as const) : ({ to: '/garaza' } as const)
      if (inGarage) return router.navigate(opts)
      if (phase !== 'idle') return

      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      setPhase('closing')
      const preload = router.preloadRoute(opts).catch(() => undefined)
      try {
        await wait(reduce ? REDUCED_MS : CLOSE_MS)
        setPhase('loading')
        const started = performance.now()
        // Jump to the top behind the closed door (the site scrolls smoothly by default).
        window.scrollTo({ top: 0, behavior: 'instant' })
        await preload
        await router.navigate(opts)
        await imagesReady()
        const left = MIN_LOADING_MS - (performance.now() - started)
        if (left > 0) await wait(left)
      } finally {
        setPhase('opening')
        await wait(reduce ? REDUCED_MS : OPEN_MS)
        setPhase('idle')
      }
    },
    [router, inGarage],
  )
}
