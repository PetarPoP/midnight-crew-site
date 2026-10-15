import { EVENTS, SITE_URL, type CrewEvent } from './data'

const TZ = 'Europe/Sarajevo'

/** Offset of Europe/Sarajevo from UTC (ms) at a given instant. */
function offsetMs(utc: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utc))
  const g = (t: string) => +parts.find((p) => p.type === t)!.value
  return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - utc
}

/** "2026-10-17T22:00" (local, Sarajevo) -> UTC epoch ms. */
export function localToUtc(iso: string) {
  const [d, t] = iso.split('T')
  const [y, mo, da] = d.split('-').map(Number)
  const [h, mi] = t.split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, da, h, mi)
  return guess - offsetMs(guess - offsetMs(guess))
}

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
function fold(line: string) {
  const out: string[] = []
  let rest = line
  while (rest.length > 73) {
    out.push(rest.slice(0, 73))
    rest = ' ' + rest.slice(73)
  }
  out.push(rest)
  return out.join('\r\n')
}

function vevent(e: CrewEvent) {
  const start = localToUtc(e.iso)
  const url = `${SITE_URL}/?e=${e.id}`
  return [
    'BEGIN:VEVENT',
    `UID:${e.id}@midnight-crew`,
    `DTSTAMP:${stamp(start)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(start + 3 * 3600e3)}`,
    `SUMMARY:${esc(`${e.title} · Midnight Crew`)}`,
    `LOCATION:${esc(e.place)}`,
    `DESCRIPTION:${esc(`${e.description ? e.description + '\n' : ''}${url}`)}`,
    `URL:${url}`,
    'END:VEVENT',
  ]
}

/** An iCalendar document with the given events (default: all of them). */
export function buildIcs(events: CrewEvent[] = EVENTS) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Midnight Crew//Meetovi//HR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Midnight Crew meetovi', 'REFRESH-INTERVAL;VALUE=DURATION:PT12H', ...events.flatMap(vevent), 'END:VCALENDAR']
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** Downloads one event as an .ics file (works with Apple, Google and Outlook calendars). */
export function downloadIcs(e: CrewEvent) {
  const blob = new Blob([buildIcs([e])], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${e.id}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
