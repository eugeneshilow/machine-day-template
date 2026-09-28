import type { DuneSeries } from '@/components/charts/dune-flow'

import type { Activity } from './data'
import { ZONES, ZONE_COLORS, ZONE_LABELS } from './zones'

/** The series behind the hero chart and the counters under it. */
export type Pulse = {
  days: string[]
  series: DuneSeries[]
  total: number
  lastDay: string
  lastTotal: number
  lastIsYesterday: boolean
}

/** `YYYY-MM-DD` of a moment in the given time zone. */
export function dayKey(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(ms))
}

/**
 * Builds the chart series from daily activity. Days that are not closed yet
 * (today and later, in the activity time zone) are left out of the chart but
 * still counted in the total. Returns null when there are fewer than 4 days.
 */
export function buildPulse(activity: Activity, nowMs: number): Pulse | null {
  const rows = activity.days
  if (rows.length < 4) return null
  const totalOf = (r: (typeof rows)[number]) => ZONES.reduce((sum, z) => sum + (r[z] ?? 0), 0)
  const total = rows.reduce((sum, r) => sum + totalOf(r), 0)
  const today = dayKey(nowMs, activity.timeZone)
  const yesterday = dayKey(nowMs - 24 * 3600 * 1000, activity.timeZone)
  const closed = rows.filter((r) => r.day < today)
  const last = closed[closed.length - 1]
  if (closed.length < 4 || !last) return null
  return {
    days: closed.map((r) => r.day),
    series: ZONES.map((z) => ({
      label: ZONE_LABELS[z],
      color: ZONE_COLORS[z],
      values: closed.map((r) => r[z] ?? 0),
    })),
    total,
    lastDay: last.day,
    lastTotal: totalOf(last),
    lastIsYesterday: last.day === yesterday,
  }
}
