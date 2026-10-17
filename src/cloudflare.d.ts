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
    /** Optional Discord/Slack-style webhook that gets a message for every order. */
    NOTIFY_WEBHOOK?: string
    /** Telegram bot token (from @BotFather) and the chat id that gets order messages. */
    TELEGRAM_BOT_TOKEN?: string
    TELEGRAM_CHAT_ID?: string
    /** Resend (resend.com) API key, the mail that receives garage requests, and an optional sender. */
    RESEND_API_KEY?: string
    MAIL_TO?: string
    MAIL_FROM?: string
  }
}
