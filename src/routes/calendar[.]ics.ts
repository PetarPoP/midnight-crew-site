import { createFileRoute } from '@tanstack/react-router'
import { buildIcs } from '~/lib/ics'

// Subscribable calendar feed: every meet, kept up to date by the calendar app.
export const Route = createFileRoute('/calendar.ics')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildIcs(), {
          headers: { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'public, max-age=3600' },
        }),
    },
  },
})
