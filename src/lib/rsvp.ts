import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { useSyncExternalStore } from 'react'
import { eventById } from './data'
import { localToUtc } from './ics'

const CID = /^[a-z0-9-]{16,64}$/i
const MAX_PER_IP = 10

/** RSVP is open as soon as an event has a date and a place, until 6 h after it starts. */
export function rsvpOpen(e: { iso: string; place: string }, now = Date.now()) {
  return !!e.iso && !!e.place.trim() && localToUtc(e.iso) + 6 * 3600e3 > now
}

export const getRsvps = createServerFn({ method: 'GET' }).validator((d: { ids: string[] }) => ({ ids: d.ids.filter((x) => typeof x === 'string').slice(0, 50) })).handler(async ({ data }) => {
  const { getDb } = await import('./server/db')
  const { db } = await getDb()
  const counts: Record<string, number> = {}
  for (const id of data.ids) {
    const r = await db.prepare('SELECT COUNT(*) AS n FROM rsvps WHERE event_id = ?').bind(id).first<{ n: number }>()
    counts[id] = r?.n ?? 0
  }
  return counts
})

export const setRsvp = createServerFn({ method: 'POST' })
  .validator((d: { id: string; cid: string; going: boolean }) => {
    if (typeof d.id !== 'string' || typeof d.cid !== 'string' || !CID.test(d.cid)) throw new Error('Neispravan zahtjev.')
    return { id: d.id, cid: d.cid, going: !!d.going }
  })
  .handler(async ({ data }) => {
    const e = eventById(data.id)
    if (!e || !rsvpOpen(e)) throw new Error('Za ovaj događaj se više ne može javiti dolazak.')
    const { getDb, sha256 } = await import('./server/db')
    const { db } = await getDb()
    if (data.going) {
      const ip = await sha256(getRequestHeader('cf-connecting-ip') ?? 'unknown')
      const used = await db.prepare('SELECT COUNT(*) AS n FROM rsvps WHERE event_id = ? AND ip_hash = ?').bind(e.id, ip).first<{ n: number }>()
      if ((used?.n ?? 0) >= MAX_PER_IP) throw new Error('Previše prijava s ove mreže.')
      await db.prepare('INSERT OR IGNORE INTO rsvps (event_id, client_id, ip_hash) VALUES (?, ?, ?)').bind(e.id, data.cid, ip).run()
    } else {
      await db.prepare('DELETE FROM rsvps WHERE event_id = ? AND client_id = ?').bind(e.id, data.cid).run()
    }
    const r = await db.prepare('SELECT COUNT(*) AS n FROM rsvps WHERE event_id = ?').bind(e.id).first<{ n: number }>()
    return { count: r?.n ?? 0 }
  })

// ---- client store -------------------------------------------------------

type State = { counts: Record<string, number>; going: string[] }
let state: State = { counts: {}, going: [] }
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())
const set = (s: State) => ((state = s), emit())

function cid() {
  try {
    let v = localStorage.getItem('mc-cid')
    if (!v || !CID.test(v)) {
      v = crypto.randomUUID()
      localStorage.setItem('mc-cid', v)
    }
    return v
  } catch {
    return (cid.mem ??= crypto.randomUUID())
  }
}
cid.mem = undefined as string | undefined

function loadGoing(): string[] {
  try {
    return JSON.parse(localStorage.getItem('mc-going') ?? '[]')
  } catch {
    return []
  }
}

let loaded = false
export async function loadRsvps(ids: string[]) {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  set({ ...state, going: loadGoing() })
  try {
    const counts = await getRsvps({ data: { ids } })
    set({ ...state, counts })
  } catch {}
}

export async function toggleRsvp(id: string) {
  const going = !state.going.includes(id)
  const prev = state
  const next = going ? [...state.going, id] : state.going.filter((x) => x !== id)
  set({ going: next, counts: { ...state.counts, [id]: Math.max(0, (state.counts[id] ?? 0) + (going ? 1 : -1)) } })
  try {
    localStorage.setItem('mc-going', JSON.stringify(next))
  } catch {}
  try {
    const r = await setRsvp({ data: { id, cid: cid(), going } })
    set({ ...state, counts: { ...state.counts, [id]: r.count } })
    return null
  } catch (err) {
    set(prev)
    try {
      localStorage.setItem('mc-going', JSON.stringify(prev.going))
    } catch {}
    return err instanceof Error ? err.message : 'Nešto je pošlo po zlu.'
  }
}

export function useRsvp(id: string) {
  const s = useSyncExternalStore((f) => (subs.add(f), () => void subs.delete(f)), () => state, () => state)
  return { count: s.counts[id] ?? 0, going: s.going.includes(id) }
}
