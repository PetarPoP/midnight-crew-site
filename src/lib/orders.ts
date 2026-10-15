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

  const text = `🛒 Nova narudžba #${id}\n${data.firstName} ${data.lastName}, ${phone}\n${data.street}, ${data.postal} ${data.city}\n${items.map((i) => `${i.qty}× ${i.name}${i.size ? ` (${i.size})` : ''}`).join(', ')}\nUkupno ${total} KM (pouzećem)${data.note ? `\nNapomena: ${data.note}` : ''}`
  const post = (url: string, body: unknown) =>
    fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(4000) }).catch(() => {})
  await Promise.all([
    env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID
      ? post(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { chat_id: env.TELEGRAM_CHAT_ID, text })
      : undefined,
    env.NOTIFY_WEBHOOK ? post(env.NOTIFY_WEBHOOK, { content: text, text }) : undefined,
  ])
  return { id }
})
