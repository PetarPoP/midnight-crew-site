import { useEffect } from 'react'

export function isTyping(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return true
  const t = e.target as HTMLElement | null
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
}

/** Briefly plays the press animation on a prompt. */
export function flashPressed(el: Element) {
  el.removeAttribute('data-pressed')
  void (el as HTMLElement).offsetWidth
  el.setAttribute('data-pressed', '')
  setTimeout(() => el.removeAttribute('data-pressed'), 500)
}

/**
 * A / B / X on the keyboard press the matching on-screen controller prompt
 * ([data-pad="a"] etc.). When several are on screen, the one closest to the
 * middle of the viewport wins, so the map's prompts take over while the map
 * is in view.
 */
export function useGameKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.repeat) return
      const key = e.key.toLowerCase()
      if (!['a', 'b', 'x'].includes(key)) return

      const mid = window.innerHeight / 2
      let best: HTMLElement | null = null
      let bestDist = Infinity
      // An open dialog owns the prompts.
      const modal = document.querySelector('[data-modal]')
      const scope = modal ?? document
      scope.querySelectorAll<HTMLElement>(`[data-pad="${key}"]`).forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || (!modal && (r.bottom < 0 || r.top > window.innerHeight))) return
        const d = Math.abs(r.top + r.height / 2 - mid)
        if (d < bestDist) {
          bestDist = d
          best = el
        }
      })
      if (!best) return
      e.preventDefault()
      flashPressed(best)
      ;(best as HTMLElement).click()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
