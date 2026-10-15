import { useEffect, useState } from 'react'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Countdown to a local date-time ("2026-10-17T22:00"). Returns placeholders
 * until mounted so the server render and the first client render match.
 */
export function useCountdown(iso: string) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (now === null) return { d: '--', h: '--', m: '--', s: '--' }

  const total = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000))
  return {
    d: pad(Math.floor(total / 86400)),
    h: pad(Math.floor((total % 86400) / 3600)),
    m: pad(Math.floor((total % 3600) / 60)),
    s: pad(total % 60),
  }
}
