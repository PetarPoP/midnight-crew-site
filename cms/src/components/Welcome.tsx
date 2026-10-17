'use client'
import React, { useEffect, useState } from 'react'

const SITE = 'https://midnight-crew-site.pop-sites.workers.dev'

/**
 * Top of the dashboard: a link to the site, and while the CMS is still empty,
 * a button that loads the current site content (events, shop, places, garage, texts).
 */
export default function Welcome() {
  const [empty, setEmpty] = useState(false)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all(['events', 'garage', 'products'].map((c) => fetch(`/api/${c}?limit=1&depth=0`, { credentials: 'include' }).then((r) => r.json())))
      .then((all) => setEmpty(all.every((r) => !r.totalDocs)))
      .catch(() => {})
  }, [])

  async function run() {
    setState('busy')
    try {
      const res = await fetch('/api/import-site', { method: 'POST', credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setMsg(json.done.length ? `Uvezeno: ${json.done.length} stavki.` : 'Sve je već uvezeno.')
      setState('done')
      setTimeout(() => location.reload(), 1200)
    } catch (e) {
      setMsg(String((e as Error).message || e))
      setState('error')
    }
  }

  return (
    <div className="mc-welcome">
      <div>
        <div className="mc-welcome__eyebrow">Midnight Crew · CMS</div>
        <p className="mc-welcome__text">
          Spremljena promjena se pojavi na stranici za 2 do 4 minute (stranica se sama ponovno napravi).
        </p>
      </div>
      <div className="mc-welcome__actions">
        {empty && (
          <button type="button" className="btn btn--style-primary btn--size-medium" disabled={state === 'busy'} onClick={run}>
            <span className="btn__content">{state === 'busy' ? 'Uvozim…' : 'Uvezi sadržaj sa stranice'}</span>
          </button>
        )}
        <a className="btn btn--style-secondary btn--size-medium" href={SITE} target="_blank" rel="noopener noreferrer">
          <span className="btn__content">Otvori stranicu ↗</span>
        </a>
      </div>
      {msg && <p className={`mc-welcome__msg mc-welcome__msg--${state}`}>{msg}</p>}
    </div>
  )
}
