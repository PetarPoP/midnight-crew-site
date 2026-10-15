import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

export type View = { s: number; x: number; y: number }
type Box = readonly [number, number, number, number]
/** Room to keep free around a framed box: [top, right, bottom, left] in px. */
export type Pad = readonly [number, number, number, number]

// Leaves space for the overlays (filters on top, zoom on the right, prompts below).
const DEFAULT_PAD: Pad = [120, 150, 130, 80]
const SMALL_PAD: Pad = [40, 40, 40, 40]

const MAX_S = 2.6
/** How quickly wheel/button zoom catches up with its target (ms, smaller = snappier). */
const EASE_MS = 90
/** How long a flung map keeps gliding (ms decay constant). */
const GLIDE_MS = 320
const FLY_MS = 850

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Drag / wheel / pinch pan-zoom for a world of size W×H shown in a viewport
 * element. Mouse and pen drag with one pointer; on touch screens narrower than
 * md a single finger scrolls the page and two fingers move the map.
 *
 * Motion runs in one requestAnimationFrame loop that writes the transform
 * straight onto the world element, so dragging and zooming never re-render
 * React. `view` (for the scale bar) is only refreshed a few times a second.
 */
export function usePanZoom(W: number, H: number, initial: Box) {
  const ref = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const size = useRef({ w: 860, h: 640 })
  const [first] = useState<View>(() => fit(initial, 860, 640, W, H, DEFAULT_PAD))
  const [view, setView] = useState<View>(first)
  const [moving, setMoving] = useState(false)
  const dragged = useRef(false)

  const cur = useRef<View>(first)
  const target = useRef<View>(first)
  const vel = useRef({ x: 0, y: 0 })
  const fly = useRef<{ from: View; to: View; t0: number } | null>(null)
  const raf = useRef(0)
  const lastFrame = useRef(0)
  const lastSync = useRef(0)
  const holding = useRef(false)
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

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

  const overlayRef = useRef<HTMLDivElement>(null)

  // The basemap layer is only ever moved by the compositor. Pins and the route
  // live in a screen-space overlay that is re-positioned here, so their
  // animations never force the (large) map layer to repaint.
  const write = (v: View) => {
    const el = worldRef.current
    if (el) el.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.s})`
    placeOverlay(overlayRef.current, v)
  }

  const tick = useCallback(
    (now: number) => {
      const dt = Math.min(64, now - (lastFrame.current || now - 16))
      lastFrame.current = now
      const c = cur.current
      let t = target.current

      if (fly.current) {
        const { from, to, t0 } = fly.current
        const p = Math.min(1, (now - t0) / FLY_MS)
        const e = easeInOut(p)
        // Interpolate scale in log space so zooming feels even.
        const s = from.s * (to.s / from.s) ** e
        const k = (s - from.s) / (to.s - from.s || 1)
        const lin = to.s === from.s ? e : k
        cur.current = { s, x: from.x + (to.x - from.x) * lin, y: from.y + (to.y - from.y) * lin }
        target.current = cur.current
        if (p >= 1) {
          fly.current = null
          cur.current = target.current = to
        }
      } else {
        // Glide after a fling.
        const v = vel.current
        if (!holding.current && (Math.abs(v.x) > 0.01 || Math.abs(v.y) > 0.01)) {
          const next = clamp({ ...t, x: t.x + v.x * dt, y: t.y + v.y * dt })
          if (next.x !== t.x + v.x * dt) v.x = 0
          if (next.y !== t.y + v.y * dt) v.y = 0
          const decay = Math.exp(-dt / GLIDE_MS)
          v.x *= decay
          v.y *= decay
          t = target.current = next
        }
        const a = 1 - Math.exp(-dt / EASE_MS)
        cur.current = {
          s: c.s + (t.s - c.s) * a,
          x: c.x + (t.x - c.x) * a,
          y: c.y + (t.y - c.y) * a,
        }
      }

      const n = cur.current
      const done =
        !fly.current &&
        Math.abs(vel.current.x) <= 0.01 &&
        Math.abs(vel.current.y) <= 0.01 &&
        Math.abs(n.s - t.s) < 0.0005 &&
        Math.abs(n.x - t.x) < 0.3 &&
        Math.abs(n.y - t.y) < 0.3
      if (done) cur.current = t
      write(cur.current)

      if (done || now - lastSync.current > 120) {
        lastSync.current = now
        setView(cur.current)
      }
      if (done) {
        raf.current = 0
        lastFrame.current = 0
        // Let the browser re-rasterise the map sharply once it has settled.
        clearTimeout(settleTimer.current)
        settleTimer.current = setTimeout(() => {
          if (!raf.current && worldRef.current) worldRef.current.style.willChange = 'auto'
        }, 180)
      } else {
        raf.current = requestAnimationFrame(tick)
      }
    },
    [clamp],
  )

  const kick = useCallback(() => {
    clearTimeout(settleTimer.current)
    if (worldRef.current) worldRef.current.style.willChange = 'transform'
    if (!raf.current) raf.current = requestAnimationFrame(tick)
  }, [tick])

  /** Move the target; `jump` skips easing (used while a finger is down). */
  const aim = useCallback(
    (v: View, jump = false) => {
      fly.current = null
      target.current = clamp(v)
      if (jump) cur.current = target.current
      kick()
    },
    [clamp, kick],
  )

  const zoomAt = useCallback(
    (factor: number, cx: number, cy: number) => {
      const v = target.current
      const s = Math.min(MAX_S, Math.max(minS(), v.s * factor))
      const k = s / v.s
      vel.current = { x: 0, y: 0 }
      aim({ s, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k })
    },
    [aim],
  )

  const flyTo = useCallback(
    (box: Box, pad: Pad = DEFAULT_PAD) => {
      const { w, h } = size.current
      vel.current = { x: 0, y: 0 }
      fly.current = { from: cur.current, to: clamp(fit(box, w, h, W, H, w < 640 ? SMALL_PAD : pad)), t0: performance.now() }
      kick()
    },
    [clamp, kick, W, H],
  )

  const zoomBy = useCallback((factor: number) => zoomAt(factor, size.current.w / 2, size.current.h / 2), [zoomAt])

  const pan = useCallback(
    (dx: number, dy: number) => {
      const v = target.current
      vel.current = { x: 0, y: 0 }
      aim({ ...v, x: v.x + dx, y: v.y + dy })
    },
    [aim],
  )

  // Track viewport size.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      size.current = { w: el.clientWidth, h: el.clientHeight }
      aim(fit(initial, el.clientWidth, el.clientHeight, W, H, el.clientWidth < 640 ? SMALL_PAD : DEFAULT_PAD), true)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf.current)
      raf.current = 0
      clearTimeout(settleTimer.current)
    }
  }, [])

  // Pointer + wheel handling.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const pts = new Map<number, { x: number; y: number }>()
    let last: { x: number; y: number; d: number; t: number } | null = null
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
      return { x, y, d, t: performance.now() }
    }

    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-map-ui]')) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      pts.set(e.pointerId, local(e))
      if (e.pointerType === 'touch' && twoFingerOnly() && pts.size < 2) return
      last = centroid()
      startPt = { x: last.x, y: last.y }
      dragged.current = false
      // Catch the map mid-glide.
      vel.current = { x: 0, y: 0 }
      fly.current = null
      target.current = cur.current
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
        holding.current = true
        setMoving(true)
        try {
          el.setPointerCapture(e.pointerId)
        } catch {}
      }
      const v = target.current
      const dx = c.x - last.x
      const dy = c.y - last.y
      let next: View = { s: v.s, x: v.x + dx, y: v.y + dy }
      if (pts.size > 1 && last.d > 0 && c.d > 0) {
        const s = Math.min(MAX_S, Math.max(minS(), v.s * (c.d / last.d)))
        const k = s / v.s
        next = { s, x: c.x - (c.x - next.x) * k, y: c.y - (c.y - next.y) * k }
      }
      // Smoothed release velocity in px/ms.
      const dt = Math.max(1, c.t - last.t)
      vel.current = {
        x: vel.current.x * 0.6 + (dx / dt) * 0.4,
        y: vel.current.y * 0.6 + (dy / dt) * 0.4,
      }
      target.current = clamp(next)
      cur.current = target.current
      kick()
      last = c
    }
    const up = (e: PointerEvent) => {
      if (!pts.delete(e.pointerId)) return
      last = pts.size ? centroid() : null
      if (!pts.size) {
        holding.current = false
        setMoving(false)
        // A pause before letting go means no fling.
        if (!dragged.current || performance.now() - (lastMove.t || 0) > 80) vel.current = { x: 0, y: 0 }
        const v = vel.current
        const speed = Math.hypot(v.x, v.y)
        if (speed > 2.5) {
          v.x *= 2.5 / speed
          v.y *= 2.5 / speed
        }
        kick()
      }
    }
    const lastMove = { t: 0 }
    const moveStamp = (e: PointerEvent) => {
      if (pts.has(e.pointerId)) lastMove.t = performance.now()
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      const p = local(e)
      // Pixel-mode trackpads send many small deltas, mouse wheels a few big ones.
      const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY
      zoomAt(Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0022)), p.x, p.y)
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
      zoomAt(1.8, p.x, p.y)
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
    window.addEventListener('pointermove', moveStamp)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('click', click, true)
    el.addEventListener('dblclick', dbl)
    return () => {
      el.removeEventListener('scroll', noScroll)
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointermove', moveStamp)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('click', click, true)
      el.removeEventListener('dblclick', dbl)
    }
  }, [clamp, kick, zoomAt])

  /** Style for the world element: only the first frame comes from React. */
  const [worldStyle] = useState(
    () =>
      ({
        transform: `translate3d(${first.x}px, ${first.y}px, 0) scale(${first.s})`,
        transformOrigin: '0 0',
      }) as CSSProperties,
  )

  /** Initial style for an overlay item at world point (wx, wy). */
  const at = useCallback((wx: number, wy: number) => ({ translate: `${wx * first.s + first.x}px ${wy * first.s + first.y}px` }), [first])
  /** Re-place the overlay after React re-renders it (call from a layout effect). */
  const sync = useCallback(() => placeOverlay(overlayRef.current, cur.current), [])

  return { ref, worldRef, overlayRef, worldStyle, view, moving, flyTo, zoomBy, pan, at, sync, first }
}

/**
 * Overlay items carry their world position in data attributes:
 * data-wx/data-wy (HTML pins), data-world-g (an SVG group drawn in world
 * coordinates), and data-world-r / data-world-sw (an SVG radius or stroke
 * width that stays the same on screen).
 */
function placeOverlay(root: HTMLElement | null, v: View) {
  if (!root) return
  for (const el of root.querySelectorAll<HTMLElement>('[data-wx]')) {
    el.style.translate = `${+el.dataset.wx! * v.s + v.x}px ${+el.dataset.wy! * v.s + v.y}px`
  }
  for (const g of root.querySelectorAll('[data-world-g]')) g.setAttribute('transform', `translate(${v.x} ${v.y}) scale(${v.s})`)
  for (const c of root.querySelectorAll('[data-world-r]')) c.setAttribute('r', String(+c.getAttribute('data-world-r')! / v.s))
  for (const c of root.querySelectorAll('[data-world-sw]')) c.setAttribute('stroke-width', String(+c.getAttribute('data-world-sw')! / v.s))
}

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
