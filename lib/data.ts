/**
 * Data contract of the page — plug your own numbers in here.
 *
 * The template ships with a static snapshot in `data/*.json` (a real day of
 * the vibecoding.tech build, captured from the live page). `getMachineData()`
 * is the ONLY place the page reads data from, so to go live you replace its
 * body and keep the return type:
 *
 *   - git log:  run `git log --since=... --numstat` in CI, bucket each commit
 *               into a zone by file path, write `activity` and `commits`.
 *   - GitHub:   GET /repos/{owner}/{repo}/commits (+ /commits/{sha} for stats),
 *               or the GraphQL `history` connection.
 *   - pipeline: any job that emits "found / taken / served" events can fill
 *               `feed` (the 24-hour timelapse under the hero).
 *
 * `app/page.tsx` calls this function on the server; with `revalidate` set
 * there, the page re-reads your source on a schedule (ISR). Nothing here runs
 * in the browser, so API tokens stay on the server.
 */

import activityJson from '@/data/activity.json'
import commitsJson from '@/data/commits.json'
import feedJson from '@/data/feed.json'
import statsJson from '@/data/stats.json'

/** Work zones. Every commit belongs to exactly one zone (by the paths it touches). */
export const ZONES = ['docs', 'journal', 'front', 'back', 'admin', 'ci'] as const
export type ZoneKey = (typeof ZONES)[number]

/** One calendar day of activity: commits per zone. `day` is `YYYY-MM-DD`. */
export type ActivityDay = { day: string } & Record<ZoneKey, number>

export type Activity = {
  /** IANA time zone the days were bucketed in (also used to format times on the page). */
  timeZone: string
  /** Oldest first. Only closed days — today's partial count belongs in `stats.commitsLast24h`. */
  days: ActivityDay[]
}

/** A commit for the live terminal. Newest first. */
export type Commit = {
  sha: string
  /** ISO timestamp */
  at: string
  zone: ZoneKey
  subject: string
  additions: number
  deletions: number
}

/** One event of the 24-hour pipeline timelapse. */
export type FeedEvent = {
  /** ISO timestamp */
  t: string
  /** in = item arrived, reject = filtered out, take = picked, cook = drafted, serve = published */
  kind: 'in' | 'reject' | 'take' | 'cook' | 'serve'
  /** Short label shown before the text, e.g. "served to the site". Empty = counted but not shown. */
  head: string
  detail: string
  /** Optional link for published items. */
  href?: string
}

export type Feed = {
  /** The day the snapshot describes (`YYYY-MM-DD`). */
  day: string
  /** All-time totals of the pipeline funnel. */
  funnel: { found: number; taken: number; served: number; asOf: string }
  /** Oldest first. */
  events: FeedEvent[]
  /** Arrivals per 10 minutes, oldest first. Optional. */
  intake?: Array<{ t: string; n: number }>
}

export type Stats = {
  capturedAt: string
  /** Commits in the last 24 hours (shown when the last closed day is not yesterday). */
  commitsLast24h: number
  /** Public pages of your site ("more than N pages"). `null` hides the number. */
  sitePages: number | null
  /** Starting value of the audience quality rating (0..1). */
  qualityRatings: { count: number; median: number }
  /** Machine costs, USD. */
  machineCosts: {
    asOf: string
    subscriptionsUsdPerMonth: number
    paidDuringBuildUsd: number
    apiEquivalentUsd: number
  }
}

export type MachineData = {
  activity: Activity
  commits: Commit[]
  feed: Feed | null
  stats: Stats
}

/**
 * Replace the body with your own source (see the header comment).
 * Keep it server-only: import this from Server Components, not from 'use client' files.
 */
export async function getMachineData(): Promise<MachineData> {
  return {
    activity: activityJson as Activity,
    commits: commitsJson as Commit[],
    feed: feedJson as Feed,
    stats: statsJson as Stats,
  }
}
