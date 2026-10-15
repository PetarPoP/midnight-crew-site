import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PRODUCTS } from './data'

export type CartLine = { productId: string; size: string | null; qty: number }

type CartValue = {
  lines: CartLine[]
  count: number
  total: number
  add: (productId: string, size: string | null) => void
  setQty: (productId: string, size: string | null, qty: number) => void
  clear: () => void
  lastAdded: { productId: string; size: string | null; at: number } | null
}

const CartContext = createContext<CartValue | null>(null)
const STORAGE_KEY = 'mc-cart'

const sameLine = (l: CartLine, id: string, size: string | null) => l.productId === id && l.size === size

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [loaded, setLoaded] = useState(false)
  const [lastAdded, setLastAdded] = useState<CartValue['lastAdded']>(null)

  useEffect(() => {
    if (!lastAdded) return
    const id = setTimeout(() => setLastAdded(null), 2200)
    return () => clearTimeout(id)
  }, [lastAdded])

  // Restore after mount so the server render and first client render match.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setLines(JSON.parse(raw))
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {}
  }, [lines, loaded])

  const add = useCallback((productId: string, size: string | null) => {
    setLastAdded({ productId, size, at: Date.now() })
    setLines((ls) =>
      ls.some((l) => sameLine(l, productId, size))
        ? ls.map((l) => (sameLine(l, productId, size) ? { ...l, qty: l.qty + 1 } : l))
        : [...ls, { productId, size, qty: 1 }],
    )
  }, [])

  const setQty = useCallback((productId: string, size: string | null, qty: number) => {
    setLines((ls) =>
      qty <= 0
        ? ls.filter((l) => !sameLine(l, productId, size))
        : ls.map((l) => (sameLine(l, productId, size) ? { ...l, qty } : l)),
    )
  }, [])

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((a, l) => a + l.qty, 0)
    const total = lines.reduce((a, l) => a + l.qty * (PRODUCTS.find((p) => p.id === l.productId)?.price ?? 0), 0)
    return { lines, count, total, add, setQty, clear: () => setLines([]), lastAdded }
  }, [lines, add, setQty, lastAdded])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
