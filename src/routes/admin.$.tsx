import { createFileRoute } from '@tanstack/react-router'

// The CMS is its own Worker (cms/ in this repository). /admin on the site leads there.
const CMS_ADMIN = 'https://midnight-crew-cms.pop-sites.workers.dev/admin'

export const Route = createFileRoute('/admin/$')({
  server: {
    handlers: {
      GET: () => new Response(null, { status: 302, headers: { location: CMS_ADMIN } }),
    },
  },
})
