import { createFileRoute } from '@tanstack/react-router'

// Orders and garage requests for the panel in /admin. Every request must carry
// the ADMIN_KEY secret in the x-admin-key header.
const STATUSES = ['nova', 'potvrđena', 'poslana', 'završena', 'otkazana']

async function authed(request: Request) {
  const { env } = await import('cloudflare:workers')
  const want = env.ADMIN_KEY
  const key = request.headers.get('x-admin-key') ?? ''
  if (!want || !key) return false
  const enc = new TextEncoder()
  const [a, b] = [enc.encode(key), enc.encode(want)]
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

export const Route = createFileRoute('/api/orders')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await authed(request))) return json({ error: 'Pogrešan ključ.' }, 401)
        const { getDb } = await import('~/lib/server/db')
        const { db } = await getDb()
        const orders = (await db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 200').all<Record<string, unknown>>()).results.map((r) => ({
          ...r,
          items: JSON.parse(String(r.items)),
        }))
        let requests: unknown[] = []
        try {
          requests = (await db.prepare('SELECT id, created_at, name, instagram, car, message FROM join_requests ORDER BY id DESC LIMIT 100').all()).results
        } catch {} // table appears with the first garage request
        return json({ orders, requests, statuses: STATUSES })
      },
      POST: async ({ request }) => {
        if (!(await authed(request))) return json({ error: 'Pogrešan ključ.' }, 401)
        const body = (await request.json().catch(() => ({}))) as { id?: unknown; status?: unknown }
        const id = Number(body.id)
        const status = String(body.status ?? '')
        if (!Number.isInteger(id) || !STATUSES.includes(status)) return json({ error: 'Neispravan zahtjev.' }, 400)
        const { getDb } = await import('~/lib/server/db')
        const { db } = await getDb()
        await db.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, id).run()
        return json({ ok: true })
      },
    },
  },
})
