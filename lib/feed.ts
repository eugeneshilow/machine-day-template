import type { Feed } from './data'

/** Timelapse event with a numeric timestamp (ms). */
export type FeedEvent = {
  t: number
  kind: 'in' | 'reject' | 'take' | 'cook' | 'serve'
  head: string
  detail: string
  href?: string
}

/** What the timelapse plays: counters start at `base`, then every event ticks them. */
export type FeedSnapshot = {
  base: { found: number; taken: number; served: number }
  funnel?: { found: number; taken: number; served: number; asOf: string }
  events: FeedEvent[]
  intake?: Array<{ t: number; n: number }>
  day?: string
}

/** Rows with an empty head or text are counted but not drawn. */
export function isShown(e: FeedEvent): boolean {
  return e.head !== '' && e.detail !== ''
}

/** Drops repeated visible rows (same kind, head and text). */
export function dedupe(evts: FeedEvent[]): FeedEvent[] {
  const seen = new Set<string>()
  const out: FeedEvent[] = []
  for (const e of evts) {
    if (!isShown(e)) {
      out.push(e)
      continue
    }
    const k = `${e.kind}:${e.head}:${e.detail}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(e)
  }
  return out
}

/** Converts the JSON feed (ISO timestamps) into the snapshot the timelapse plays. */
export function toSnapshot(feed: Feed): FeedSnapshot {
  return {
    base: { found: 0, taken: 0, served: 0 },
    funnel: feed.funnel,
    events: dedupe(
      feed.events
        .map((e) => ({ ...e, t: Date.parse(e.t) }))
        .filter((e) => Number.isFinite(e.t))
        .sort((a, b) => a.t - b.t)
    ),
    intake: feed.intake?.map((x) => ({ t: Date.parse(x.t), n: x.n })),
    day: feed.day,
  }
}
