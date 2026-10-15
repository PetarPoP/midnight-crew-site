import { useEffect, useRef, useState } from 'react'

/** Animates a number from its previous value to `target` (ease-out). */
export function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target)
  const from = useRef(target)

  useEffect(() => {
    const start = performance.now()
    const startValue = from.current
    let raf = 0
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = Math.round(startValue + (target - startValue) * eased)
      setValue(v)
      from.current = v
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
