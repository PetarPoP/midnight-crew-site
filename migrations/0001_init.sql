-- "Dolazim" RSVPs and shop orders. Already applied to the production database;
-- the app also runs the same statements (IF NOT EXISTS) on first use.
CREATE TABLE IF NOT EXISTS rsvps (
  event_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, client_id)
);
CREATE INDEX IF NOT EXISTS rsvps_ip ON rsvps (event_id, ip_hash);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'nova',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  postal TEXT NOT NULL,
  country TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL,
  total INTEGER NOT NULL
);
