import type { Endpoint } from 'payload'

// Shop orders and "Tvoj auto? Javi se" messages. The site writes them into its own
// D1 database (midnight-crew). The CMS reads that database through the ORDERS binding,
// so they show up in the admin under "Narudžbe" without a second copy.

/** The part of the D1 API that this file uses. */
export type OrdersDb = {
  prepare(sql: string): {
    all<T>(): Promise<{ results: T[] }>
    bind(...values: unknown[]): { run(): Promise<unknown> }
  }
}

export const STATUSES = ['nova', 'potvrđena', 'poslana', 'završena', 'otkazana']

const forbidden = () => Response.json({ error: 'Prijavi se.' }, { status: 401 })

/** Read rows, or none when the table does not exist yet (no order so far). */
async function rows(db: () => OrdersDb | undefined, sql: string) {
  try {
    return (await db()!.prepare(sql).all<Record<string, unknown>>()).results
  } catch {
    return []
  }
}

/** The admin API for the orders page. db() gives the ORDERS binding. */
export const orderEndpoints = (db: () => OrdersDb | undefined): Endpoint[] => [
  {
    path: '/shop-orders',
    method: 'get',
    handler: async (req) => {
      if (!req.user) return forbidden()
      if (!db()) return Response.json({ error: 'ORDERS baza nije spojena.' }, { status: 500 })
      const orders = (await rows(db, 'SELECT * FROM orders ORDER BY id DESC LIMIT 300')).map((r) => ({
        ...r,
        items: JSON.parse(String(r.items || '[]')),
      }))
      const requests = await rows(db, 'SELECT id, created_at, name, instagram, car, message FROM join_requests ORDER BY id DESC LIMIT 200')
      return Response.json({ orders, requests, statuses: STATUSES })
    },
  },
  {
    path: '/shop-orders',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return forbidden()
      const body = (await req.json?.()) as { id?: number; status?: string }
      if (!Number.isInteger(body?.id) || !STATUSES.includes(String(body?.status))) {
        return Response.json({ error: 'Neispravan zahtjev.' }, { status: 400 })
      }
      await db()!.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(body.status, body.id).run()
      return Response.json({ ok: true })
    },
  },
]
