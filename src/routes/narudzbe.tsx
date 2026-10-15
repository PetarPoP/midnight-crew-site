import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { listOrders, setOrderStatus, STATUSES, type OrderRow } from '~/lib/orders'

export const Route = createFileRoute('/narudzbe')({
  head: () => ({ meta: [{ title: 'Narudžbe · Midnight Crew' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Orders,
})

function Orders() {
  const [key, setKey] = useState('')
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [msg, setMsg] = useState('')

  const load = async (k = key) => {
    setMsg('')
    try {
      const r = await listOrders({ data: { key: k } })
      if (r.ok) setOrders(r.orders)
      else setMsg('Pogrešna lozinka (ili ORDERS_KEY nije postavljen na Cloudflareu).')
    } catch {
      setMsg('Greška pri učitavanju.')
    }
  }
  const status = async (id: number, s: string) => {
    await setOrderStatus({ data: { key, id, status: s } })
    setOrders((o) => o && o.map((x) => (x.id === id ? { ...x, status: s } : x)))
  }

  return (
    <main className="min-h-screen bg-ink px-5 py-10 md:px-(--gutter)">
      <h1 className="text-[56px] leading-none font-extrabold uppercase italic">Narudžbe</h1>
      {orders === null ? (
        <form onSubmit={(e) => (e.preventDefault(), load())} className="mt-6 flex max-w-md gap-3">
          <input type="password" autoComplete="current-password" placeholder="Lozinka" value={key} onChange={(e) => setKey(e.target.value)} className="flex-1 border-b-[3px] border-white/20 bg-panel px-3 py-2.5 text-lg outline-none focus:border-lime" />
          <button className="cursor-pointer bg-lime px-5 font-extrabold text-ink uppercase italic">Uđi</button>
          {msg && <p className="basis-full text-stop">{msg}</p>}
        </form>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-soft">Još nema narudžbi.</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => (
            <li key={o.id} className="bg-panel p-5">
              <div className="flex items-baseline justify-between">
                <b className="text-2xl italic">#{o.id}</b>
                <span className="font-mono text-sm text-muted">{o.created_at} UTC</span>
              </div>
              <div className="mt-2 text-lg font-bold">{o.first_name} {o.last_name}</div>
              <a href={`tel:${o.phone}`} className="text-lime">{o.phone}</a>
              <div className="text-soft">{o.street}, {o.postal} {o.city}</div>
              <ul className="mt-3 text-soft">
                {o.items.map((i, n) => (
                  <li key={n}>{i.qty}× {i.name}{i.size ? ` (${i.size})` : ''} · {i.qty * i.price} KM</li>
                ))}
              </ul>
              {o.note && <p className="mt-2 text-muted italic">„{o.note}“</p>}
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="font-mono text-xl">{o.total} KM</span>
                <select value={o.status} onChange={(e) => status(o.id, e.target.value)} className="bg-ink px-2 py-1.5">
                  {STATUSES.map((s) => (<option key={s}>{s}</option>))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
