// Types of the Cloudflare bindings. Keep this file in line with wrangler.jsonc.
declare namespace Cloudflare {
  interface Env {
    D1: D1Database
    /** Database of the site (orders, garage messages, RSVPs). */
    ORDERS: D1Database
    R2: R2Bucket
    ASSETS: Fetcher
    PAYLOAD_SECRET: string
    FRONTEND_URL?: string
    REBUILD_WEBHOOK_URL?: string
    REBUILD_WEBHOOK_TOKEN?: string
    SEED_ADMIN_EMAIL?: string
    SEED_ADMIN_PASSWORD?: string
  }
}
interface CloudflareEnv extends Cloudflare.Env {}
