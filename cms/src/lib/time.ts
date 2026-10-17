/** The crew's time zone. The site shows every event time in it. */
export const TIME_ZONE = 'Europe/Sarajevo'

/** Offset of TIME_ZONE from UTC at the given moment, in ms. */
function offset(t: number) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(t)
      .map((x) => [x.type, x.value]),
  )
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(t / 60_000) * 60_000
}

/** "2026-10-17T22:00" in local crew time to an ISO date in UTC. */
export function localToIso(local: string) {
  const [, y, mo, d, h = '00', mi = '00'] = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(local) ?? []
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi)
  return new Date(guess - offset(guess - offset(guess))).toISOString()
}
