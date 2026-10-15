// The slice of the Cloudflare runtime the app uses (bindings from wrangler.jsonc,
// plus optional secrets set in the Cloudflare dashboard).
interface D1Result<T = unknown> {
  results: T[]
  meta: { last_row_id: number; changes: number }
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<D1Result<T>>
  run(): Promise<D1Result>
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>
}

declare module 'cloudflare:workers' {
  export const env: {
    DB: D1Database
    /** Password for /narudzbe. */
    ORDERS_KEY?: string
    /** Optional Discord/Slack-style webhook that gets a message for every order. */
    NOTIFY_WEBHOOK?: string
  }
}
