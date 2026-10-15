import { createServerFn } from '@tanstack/react-start'
import { orderTotal, normalizePhone, validateOrder, type OrderInput } from './checkout'
import { productById } from './data'

const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function clean(d: OrderInput): OrderInput {
  return {
    firstName: s(d.firstName, 40), lastName: s(d.lastName, 40), phone: s(d.phone, 24), street: s(d.street, 80), city: s(d.city, 50),
    postal: s(d.postal, 8), country: s(d.country, 3), note: s(d.note, 300), website: s(d.website, 50),
    items: Array.isArray(d.items) ? d.items.slice(0, 20).map((i) => ({ id: s(i?.id, 80), size: i?.size == null ? null : s(i.size, 10), qty: Number(i?.qty) })) : [],
  }
}

export const placeOrder = createServerFn({ method: 'POST' }).validator((d: OrderInput) => clean(d)).handler(async ({ data }) => {
  if (data.website) return { id: 0 } // honeypot: pretend it worked
  const errors = validateOrder(data)
  if (Object.keys(errors).length) return { errors }

  const { getDb } = await import('./server/db')
  const { db, env } = await getDb()
  const phone = normalizePhone(data.phone)
  const recent = await db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE phone = ? AND created_at > datetime('now', '-1 hour')`).bind(phone).first<{ n: number }>()
  if ((recent?.n ?? 0) >= 3) return { errors: { items: 'Previše narudžbi u kratkom roku. Pokušaj kasnije.' } as Record<string, string> }

  const items = data.items.map((i) => {
    const p = productById(i.id)!
    return { id: i.id, name: p.name, size: i.size, qty: i.qty, price: p.price }
  })
  const total = orderTotal(data.items)
  const r = await db
    .prepare('INSERT INTO orders (first_name, last_name, phone, street, city, postal, country, note, items, total) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(data.firstName, data.lastName, phone, data.street, data.city, data.postal, data.country, data.note, JSON.stringify(items), total)
    .run()
  const id = r.meta.last_row_id

  if (env.NOTIFY_WEBHOOK) {
    const text = `🛒 Nova narudžba #${id}: ${data.firstName} ${data.lastName}, ${phone}, ${data.street}, ${data.postal} ${data.city}\n${items.map((i) => `${i.qty}× ${i.name}${i.size ? ` (${i.size})` : ''}`).join(', ')} = ${total} KM (pouzećem)`
    try {
      await fetch(env.NOTIFY_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: text, text }), signal: AbortSignal.timeout(4000) })
    } catch {}
  }
  return { id }
})

export type OrderRow = {
  id: number; created_at: string; status: string; first_name: string; last_name: string; phone: string
  street: string; city: string; postal: string; note: string; total: number
  items: { name: string; size: string | null; qty: number; price: number }[]
}

async function authed(key: string) {
  const { env } = await import('cloudflare:workers')
  const want = env.ORDERS_KEY
  if (!want || typeof key !== 'string') return false
  const enc = new TextEncoder()
  const [a, b] = [enc.encode(key), enc.encode(want)]
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export const listOrders = createServerFn({ method: 'POST' }).validator((d: { key: string }) => ({ key: s(d.key, 200) })).handler(async ({ data }) => {
  if (!(await authed(data.key))) return { ok: false as const }
  const { getDb } = await import('./server/db')
  const { db } = await getDb()
  const rows = (await db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 200').all<Record<string, string | number>>()).results
  const orders: OrderRow[] = rows.map((r) => ({ ...(r as unknown as OrderRow), items: JSON.parse(String(r.items)) }))
  return { ok: true as const, orders }
})

const STATUSES = ['nova', 'potvrđena', 'poslana', 'završena', 'otkazana']
export const setOrderStatus = createServerFn({ method: 'POST' }).validator((d: { key: string; id: number; status: string }) => ({ key: s(d.key, 200), id: Number(d.id), status: s(d.status, 20) })).handler(async ({ data }) => {
  if (!(await authed(data.key)) || !STATUSES.includes(data.status)) return { ok: false }
  const { getDb } = await import('./server/db')
  const { db } = await getDb()
  await db.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(data.status, data.id).run()
  return { ok: true }
})
export { STATUSES }
