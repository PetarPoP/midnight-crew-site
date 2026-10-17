import { useNavigate, useRouterState } from '@tanstack/react-router'
import { GARAGE_PAGE } from '~/lib/data'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from 'react'

/**
 * Garage-door transition into and out of /garaza: the door drops shut (600ms),
 * stays closed while the page changes behind it (~250ms), then rolls up (800ms).
 * Leaving the garage through any link on it plays the door too.
 * The overlay lives in the root layout so it stays mounted through navigation.
 */
type Phase = 'idle' | 'down' | 'hold' | 'up'

const DOWN_MS = 600
const HOLD_MS = 250
const UP_MS = 800

const Ctx = createContext<{ enter: (to?: string) => void }>({ enter: () => {} })

export const useGarageDoor = () => useContext(Ctx)

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function GarageDoorProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [phase, setPhase] = useState<Phase>('idle')
  const busy = useRef(false)

  const enter = useCallback(
    async (to = '/garaza') => {
      if (busy.current) return
      // Plays even with the OS "reduce motion" setting: Windows turns that on whenever its animation effects are off.
      if (!GARAGE_PAGE.door_animation) {
        navigate({ href: to })
        return
      }
      busy.current = true
      setPhase('down')
      await wait(DOWN_MS)
      setPhase('hold')
      // Change page while the door is shut; keep it shut at least HOLD_MS.
      await Promise.all([navigate({ href: to }), wait(HOLD_MS)])
      const hash = to.split('#')[1]
      const target = hash ? document.getElementById(hash) : null
      if (target) target.scrollIntoView({ block: 'start' })
      else window.scrollTo(0, 0)
      setPhase('up')
      await wait(UP_MS)
      setPhase('idle')
      busy.current = false
    },
    [navigate],
  )

  // On the garage page, links to other pages close the door first. Capture phase runs before the router's own link handler.
  useEffect(() => {
    if (pathname !== '/garaza') return
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin || url.pathname === '/garaza') return
      e.preventDefault()
      e.stopPropagation()
      enter(url.pathname + url.search + url.hash)
    }
    window.addEventListener('click', onClick, true)
    return () => window.removeEventListener('click', onClick, true)
  }, [pathname, enter])

  return (
    <Ctx.Provider value={{ enter }}>
      {children}
      {phase !== 'idle' && <GarageDoorOverlay phase={phase} />}
    </Ctx.Provider>
  )
}

function GarageDoorOverlay({ phase }: { phase: Exclude<Phase, 'idle'> }) {
  return (
    <div aria-hidden="true" className="pointer-events-auto fixed inset-0 z-50 overflow-hidden">
      <div className={`garage-door garage-door-${phase} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="mb-4 font-mono text-sm tracking-[.3em] text-lime uppercase md:mb-6 md:text-base">{GARAGE_PAGE.door_label}</div>
        <div className="text-[84px] leading-[.9] font-extrabold uppercase italic [text-shadow:0_8px_0_#000] md:text-[150px]">{GARAGE_PAGE.title}</div>
        {/* Bottom rail and handle */}
        <div className="absolute inset-x-0 bottom-0 h-[14px] bg-white" />
        <div className="absolute bottom-[26px] left-1/2 h-[10px] w-[90px] -translate-x-1/2 bg-lime shadow-[0_0_18px_var(--color-lime),0_0_40px_color-mix(in_oklab,var(--color-lime)_50%,transparent)]" />
      </div>
    </div>
  )
}

/** A link to the garage page that plays the door transition. */
export function GarageLink({ onClick, children, ...a }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  const { enter } = useGarageDoor()
  return (
    <a
      href="/garaza"
      {...a}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        enter()
      }}
    >
      {children}
    </a>
  )
}
