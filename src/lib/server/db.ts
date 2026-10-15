// Server-only helpers. Imported only from inside server function handlers.
let schemaReady: Promise<void> | undefined

/** The D1 database, with the tables created if this is the first call. */
export async function getDb() {
  const { env } = await import('cloudflare:workers')
  const db = env.DB
  schemaReady ??= db
    .batch([
      db.prepare(
        `CREATE TABLE IF NOT EXISTS rsvps (event_id TEXT NOT NULL, client_id TEXT NOT NULL, ip_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (event_id, client_id))`,
      ),
      db.prepare(`CREATE INDEX IF NOT EXISTS rsvps_ip ON rsvps (event_id, ip_hash)`),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL DEFAULT (datetime('now')), status TEXT NOT NULL DEFAULT 'nova', first_name TEXT NOT NULL, last_name TEXT NOT NULL, phone TEXT NOT NULL, street TEXT NOT NULL, city TEXT NOT NULL, postal TEXT NOT NULL, country TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', items TEXT NOT NULL, total INTEGER NOT NULL)`,
      ),
    ])
    .then(() => undefined)
  await schemaReady
  return { db, env }
}

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
