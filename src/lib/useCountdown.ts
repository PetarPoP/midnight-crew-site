import { useEffect, useState } from 'react'

const pad = (n: number) => String(n).padStart(2, '0')

/** Next Saturday at 22:00 local time (the weekly meet). */
function nextMeet(now: Date) {
  const next = new Date(now)
  next.setHours(22, 0, 0, 0)
  next.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7))
  if (next <= now) next.setDate(next.getDate() + 7)
  return next
}

/**
 * Countdown to the next weekly meet. Returns placeholders until mounted so the
 * server render and the first client render match.
 */
export function useCountdown() {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (now === null) return { d: '--', h: '--', m: '--', s: '--', label: '' }

  const current = new Date(now)
  const next = nextMeet(current)
  const total = Math.floor((next.getTime() - now) / 1000)
  return {
    d: pad(Math.floor(total / 86400)),
    h: pad(Math.floor((total % 86400) / 3600)),
    m: pad(Math.floor((total % 3600) / 60)),
    s: pad(total % 60),
    label: `${next.getDate()}.${next.getMonth() + 1}.`,
  }
}
