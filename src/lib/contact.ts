import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

export type JoinInput = { name: string; instagram: string; car: string; message: string; website?: string }

const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** "Tvoj auto? Javi se": saved in D1 and sent to the crew's mail (and Telegram, if set up). */
export const sendJoin = createServerFn({ method: 'POST' })
  .validator((d: JoinInput) => ({ name: s(d.name, 60), instagram: s(d.instagram, 40).replace(/^@/, ''), car: s(d.car, 80), message: s(d.message, 600), website: s(d.website, 20) }))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true } // honeypot
    if (data.name.length < 2 || data.car.length < 2 || !/^[\w.]{0,30}$/.test(data.instagram)) return { ok: false, error: 'Upiši ime, auto i ispravan Instagram.' }

    const { getDb, sha256 } = await import('./server/db')
    const { db, env } = await getDb()
    const ip = await sha256(getRequestHeader('cf-connecting-ip') ?? 'unknown')
    await db.prepare(`CREATE TABLE IF NOT EXISTS join_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL DEFAULT (datetime('now')), ip_hash TEXT NOT NULL, name TEXT, instagram TEXT, car TEXT, message TEXT)`).run()
    const n = await db.prepare(`SELECT COUNT(*) AS n FROM join_requests WHERE ip_hash = ? AND created_at > datetime('now','-1 hour')`).bind(ip).first<{ n: number }>()
    if ((n?.n ?? 0) >= 3) return { ok: false, error: 'Previše poruka, pokušaj kasnije.' }
    await db.prepare('INSERT INTO join_requests (ip_hash, name, instagram, car, message) VALUES (?,?,?,?,?)').bind(ip, data.name, data.instagram, data.car, data.message).run()

    const text = `🚗 Novi auto za garažu\nIme: ${data.name}\nInstagram: ${data.instagram ? '@' + data.instagram : '-'}\nAuto: ${data.car}\n${data.message ? `Poruka: ${data.message}` : ''}`.trim()
    const post = (url: string, init: RequestInit) => fetch(url, { method: 'POST', signal: AbortSignal.timeout(5000), ...init }).catch(() => undefined)
    const json = { 'content-type': 'application/json' }
    await Promise.all([
      env.RESEND_API_KEY && env.MAIL_TO
        ? post('https://api.resend.com/emails', {
            headers: { ...json, authorization: `Bearer ${env.RESEND_API_KEY}` },
            body: JSON.stringify({ from: env.MAIL_FROM || 'Midnight Crew <onboarding@resend.dev>', to: [env.MAIL_TO], subject: `Garaža: ${data.car} (${data.name})`, text }),
          })
        : undefined,
      env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID
        ? post(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { headers: json, body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }) })
        : undefined,
    ])
    return { ok: true }
  })
