'use client'
import React, { useCallback, useEffect, useState } from 'react'

type Item = { name: string; qty: number; price: number; size?: string }
type Order = {
  id: number
  created_at: string
  status: string
  first_name: string
  last_name: string
  phone: string
  street: string
  city: string
  postal: string
  note: string
  items: Item[]
  total: number
}
type Request = { id: number; created_at: string; name: string; instagram: string; car: string; message: string }
type Data = { orders: Order[]; requests: Request[]; statuses: string[] }

/** "2026-10-17 20:05:00" (UTC from D1) in local time. */
const when = (utc: string) =>
  new Date(`${utc.replace(' ', 'T')}Z`).toLocaleString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function Orders() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    fetch('/api/shop-orders', { credentials: 'include' })
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
        setData(j)
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  async function setStatus(id: number, status: string) {
    const res = await fetch('/api/shop-orders', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (!res.ok) return setError('Status nije spremljen.')
    setData((d) => d && { ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status } : o)) })
  }

  const open = data?.orders.filter((o) => o.status === 'nova').length ?? 0

  return (
    <div className="mc-orders">
      <div className="mc-orders__head">
        <h1>Narudžbe</h1>
        {open > 0 && <span className="mc-orders__badge">{open} nove</span>}
        <button type="button" className="btn btn--style-secondary btn--size-small" onClick={load}>
          <span className="btn__content">Osvježi</span>
        </button>
      </div>
      {error && <p className="mc-orders__error">{error}</p>}
      {!data && !error && <p className="mc-muted">Učitavam…</p>}
      {data && (
        <>
          {data.orders.length ? (
            <div className="mc-orders__grid">
              {data.orders.map((o) => (
                <div key={o.id} className={`mc-order mc-order--${o.status}`}>
                  <div className="mc-order__row">
                    <b>#{o.id}</b>
                    <span className="mc-muted">{when(o.created_at)}</span>
                  </div>
                  <div className="mc-order__name">
                    {o.first_name} {o.last_name}
                  </div>
                  <a href={`tel:${o.phone}`}>{o.phone}</a>
                  <div>
                    {o.street}, {o.postal} {o.city}
                  </div>
                  <ul className="mc-order__items">
                    {o.items.map((i, n) => (
                      <li key={n}>
                        {i.qty}× {i.name}
                        {i.size ? ` (${i.size})` : ''} · {i.qty * i.price} KM
                      </li>
                    ))}
                  </ul>
                  {o.note && <p className="mc-muted">„{o.note}“</p>}
                  <div className="mc-order__row">
                    <b className="mc-order__total">{o.total} KM</b>
                    <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} aria-label={`Status narudžbe ${o.id}`}>
                      {data.statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mc-muted">Još nema narudžbi.</p>
          )}

          <h2 className="mc-orders__sub">Garaža: Tvoj auto? Javi se</h2>
          {data.requests.length ? (
            <div className="mc-orders__grid">
              {data.requests.map((r) => (
                <div key={r.id} className="mc-order">
                  <div className="mc-order__row">
                    <b>{r.car}</b>
                    <span className="mc-muted">{when(r.created_at)}</span>
                  </div>
                  <div>
                    {r.name}
                    {r.instagram && (
                      <>
                        {' · '}
                        <a href={`https://www.instagram.com/${r.instagram}/`} target="_blank" rel="noopener noreferrer">
                          @{r.instagram}
                        </a>
                      </>
                    )}
                  </div>
                  {r.message && <p className="mc-muted">{r.message}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="mc-muted">Još nema poruka.</p>
          )}
        </>
      )}
    </div>
  )
}
