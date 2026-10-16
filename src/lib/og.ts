import { SITE_URL } from './data'

/**
 * Link-preview tags (WhatsApp, Instagram, Facebook, Viber, Telegram).
 * `card` is a picture made by scripts/og-images.mjs: "site", "shop",
 * "event-<id>" or "product-<id>".
 */
export function ogMeta({ title, description, card, path = '/' }: { title: string; description: string; card: string; path?: string }) {
  const image = `${SITE_URL}/og/${card}.jpg`
  return [
    { property: 'og:site_name', content: 'Midnight Crew' },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'hr_HR' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: SITE_URL + path },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: title },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ]
}
