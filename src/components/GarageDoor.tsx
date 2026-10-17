import { useNavigate } from '@tanstack/react-router'
import { createContext, useCallback, useContext, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from 'react'

/**
 * Garage-door transition into /garaza: the door drops shut (1000ms), stays
 * closed while the page changes behind it (~500ms), then rolls up (1300ms).
 * The overlay lives in the root layout so it stays mounted through navigation.
 */
type Phase = 'idle' | 'down' | 'hold' | 'up'

const DOWN_MS = 1000
const HOLD_MS = 500
const UP_MS = 1300

const Ctx = createContext<{ enter: (to?: string) => void }>({ enter: () => {} })

export const useGarageDoor = () => useContext(Ctx)

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function GarageDoorProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('idle')
  const busy = useRef(false)

  const enter = useCallback(
    async (to = '/garaza') => {
      if (busy.current) return
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        navigate({ to })
        return
      }
      busy.current = true
      setPhase('down')
      await wait(DOWN_MS)
      setPhase('hold')
      // Change page while the door is shut; keep it shut at least HOLD_MS.
      await Promise.all([navigate({ to }), wait(HOLD_MS)])
      window.scrollTo(0, 0)
      setPhase('up')
      await wait(UP_MS)
      setPhase('idle')
      busy.current = false
    },
    [navigate],
  )

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
        <div className="mb-4 font-mono text-sm tracking-[.3em] text-lime md:mb-6 md:text-base">MIDNIGHT CREW · BOX</div>
        <div className="text-[84px] leading-[.9] font-extrabold uppercase italic [text-shadow:0_8px_0_#000] md:text-[150px]">Garaža</div>
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
