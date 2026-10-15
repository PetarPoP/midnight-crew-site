import { useCallback, useEffect, useRef, useState } from 'react'

export type View = { s: number; x: number; y: number }
type Box = readonly [number, number, number, number]
/** Room to keep free around a framed box: [top, right, bottom, left] in px. */
export type Pad = readonly [number, number, number, number]

// Leaves space for the overlays (filters on top, zoom on the right, prompts below).
const DEFAULT_PAD: Pad = [120, 150, 130, 80]

const MAX_S = 2.6

/**
 * Drag / wheel / pinch pan-zoom for a world of size W×H shown in a viewport
 * element. Mouse and pen drag with one pointer; on touch screens narrower than
 * md a single finger scrolls the page and two fingers move the map.
 */
export function usePanZoom(W: number, H: number, initial: Box) {
  const ref = useRef<HTMLDivElement>(null)
  const size = useRef({ w: 860, h: 640 })
  const [view, setView] = useState<View>(() => fit(initial, 860, 640, W, H, DEFAULT_PAD))
  const viewRef = useRef(view)
  const [animating, setAnimating] = useState(false)
  const [moving, setMoving] = useState(false)
  const dragged = useRef(false)
  const animTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const minS = () => Math.max(size.current.w / W, size.current.h / H)

  const clamp = useCallback(
    (v: View): View => {
      const { w, h } = size.current
      const s = Math.min(MAX_S, Math.max(minS(), v.s))
      return {
        s,
        x: Math.min(0, Math.max(w - W * s, v.x)),
        y: Math.min(0, Math.max(h - H * s, v.y)),
      }
    },
    [W, H],
  )

  const apply = useCallback(
    (v: View, animate = false) => {
      const next = clamp(v)
      viewRef.current = next
      setView(next)
      if (animate) {
        setAnimating(true)
        clearTimeout(animTimer.current)
        animTimer.current = setTimeout(() => setAnimating(false), 750)
      }
    },
    [clamp],
  )

  const zoomAt = useCallback(
    (factor: number, cx: number, cy: number, animate = false) => {
      const v = viewRef.current
      const s = Math.min(MAX_S, Math.max(minS(), v.s * factor))
      const k = s / v.s
      apply({ s, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }, animate)
    },
    [apply],
  )

  const flyTo = useCallback(
    (box: Box, pad: Pad = DEFAULT_PAD) => {
      apply(fit(box, size.current.w, size.current.h, W, H, size.current.w < 640 ? SMALL_PAD : pad), true)
    },
    [apply, W, H],
  )

  const zoomBy = useCallback(
    (factor: number) => zoomAt(factor, size.current.w / 2, size.current.h / 2, true),
    [zoomAt],
  )

  // Track viewport size.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      size.current = { w: el.clientWidth, h: el.clientHeight }
      apply(fit(initial, el.clientWidth, el.clientHeight, W, H, small(el) ? SMALL_PAD : DEFAULT_PAD))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Pointer + wheel handling.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const pts = new Map<number, { x: number; y: number }>()
    let last: { x: number; y: number; d: number } | null = null
    let startPt = { x: 0, y: 0 }
    const twoFingerOnly = () => !matchMedia('(min-width: 768px)').matches

    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const centroid = () => {
      const a = [...pts.values()]
      const x = a.reduce((s, p) => s + p.x, 0) / a.length
      const y = a.reduce((s, p) => s + p.y, 0) / a.length
      const d = a.length > 1 ? Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) : 0
      return { x, y, d }
    }

    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-map-ui]')) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      pts.set(e.pointerId, local(e))
      if (e.pointerType === 'touch' && twoFingerOnly() && pts.size < 2) return
      last = centroid()
      startPt = { x: last.x, y: last.y }
      dragged.current = false
    }
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return
      pts.set(e.pointerId, local(e))
      if (e.pointerType === 'touch' && twoFingerOnly() && pts.size < 2) return
      const c = centroid()
      if (!last) {
        last = c
        return
      }
      if (!dragged.current && Math.hypot(c.x - startPt.x, c.y - startPt.y) < 5 && pts.size < 2) return
      if (!dragged.current) {
        dragged.current = true
        setMoving(true)
        try {
          el.setPointerCapture(e.pointerId)
        } catch {}
      }
      const v = viewRef.current
      let next: View = { s: v.s, x: v.x + c.x - last.x, y: v.y + c.y - last.y }
      if (pts.size > 1 && last.d > 0 && c.d > 0) {
        const s = Math.min(MAX_S, Math.max(minS(), v.s * (c.d / last.d)))
        const k = s / v.s
        next = { s, x: c.x - (c.x - next.x) * k, y: c.y - (c.y - next.y) * k }
      }
      apply(next)
      last = c
    }
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId)
      last = pts.size ? centroid() : null
      if (!pts.size) setMoving(false)
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      const p = local(e)
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), p.x, p.y)
    }
    // A drag must not also count as a click on a pin.
    const click = (e: MouseEvent) => {
      if (dragged.current) {
        e.stopPropagation()
        e.preventDefault()
        dragged.current = false
      }
    }
    const dbl = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-map-ui], button')) return
      const p = local(e)
      zoomAt(1.8, p.x, p.y, true)
    }

    // Focus or scrollIntoView can scroll an overflow:hidden box; keep it pinned.
    const noScroll = () => {
      if (el.scrollTop || el.scrollLeft) {
        el.scrollTop = 0
        el.scrollLeft = 0
      }
    }

    el.addEventListener('scroll', noScroll)
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('click', click, true)
    el.addEventListener('dblclick', dbl)
    return () => {
      el.removeEventListener('scroll', noScroll)
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('click', click, true)
      el.removeEventListener('dblclick', dbl)
    }
  }, [apply, zoomAt])

  const pan = useCallback(
    (dx: number, dy: number) => {
      const v = viewRef.current
      apply({ ...v, x: v.x + dx, y: v.y + dy }, true)
    },
    [apply],
  )

  return { ref, view, animating, moving, flyTo, zoomBy, pan }
}

const SMALL_PAD: Pad = [40, 40, 40, 40]
const small = (el: HTMLElement) => el.clientWidth < 640

/** View that fits a world-space box into a w×h viewport with padding. */
function fit(box: Box, w: number, h: number, W: number, H: number, pad: Pad): View {
  const [pt, pr, pb, pl] = pad
  const [x0, y0, x1, y1] = box
  const bw = Math.max(1, x1 - x0)
  const bh = Math.max(1, y1 - y0)
  const minS = Math.max(w / W, h / H)
  const s = Math.min(MAX_S, Math.max(minS, Math.min((w - pl - pr) / bw, (h - pt - pb) / bh)))
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  // Centre the box inside the padded area.
  const x = Math.min(0, Math.max(w - W * s, pl + (w - pl - pr) / 2 - cx * s))
  const y = Math.min(0, Math.max(h - H * s, pt + (h - pt - pb) / 2 - cy * s))
  return { s, x, y }
}
