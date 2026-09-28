'use client'

/**
 * DirectorTimelapse — plays a day of pipeline events (lib/feed.ts) in about a
 * minute: a clock, a scrolling belt of rows and three counters
 * (found / taken / served). Pauses on hover and with the stop button.
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react'

import { dedupe, isShown, type FeedEvent, type FeedSnapshot } from '@/lib/feed'
import { fmtWeekdayDate } from '@/lib/format'
import { siteConfig } from '@/site.config'

const INTL_LOCALE = siteConfig.locale

const AMBER = siteConfig.accent
const STEP_MS = 140
const VISIBLE = 28
const ROW_H = 34

export type TimelapseTheme = 'dark' | 'light'
const SKIN = {
  dark: {
    bg: '#000000',
    text: '#F0F0F0',
    mute: '#9A9AA2',
    faint: 'rgba(255,255,255,0.3)',
    body: '#C9C9CE',
    dimBody: 'rgba(255,255,255,0.45)',
    inn: '#6A6A72',
    reject: '#8A8A8E',
    take: '#C9C9CE',
    cook: '#F0F0F0',
    serve: AMBER,
    found: '#8C8C8A',
    taken: '#C9C9CE',
    foundBar: '#3A3A3E',
    takenBar: '#5A5A60',
  },
  light: {
    bg: '#F0F0F0',
    text: '#111111',
    mute: '#6E6E76',
    faint: 'rgba(17,17,17,0.35)',
    body: '#3A3A3C',
    dimBody: 'rgba(17,17,17,0.45)',
    inn: '#8A8A8E',
    reject: '#6E6E76',
    take: '#3A3A3C',
    cook: '#111111',
    serve: '#C25200',
    found: '#8A8A8E',
    taken: '#3A3A3C',
    foundBar: '#D9D9DE',
    takenBar: '#B8B8BE',
  },
} as const

const TZ_LABEL = siteConfig.timeZoneLabel
const TZ_NAME = siteConfig.timeZone

const kindStyle = (
  t: (typeof SKIN)[TimelapseTheme]
): Record<FeedEvent['kind'], { color: string; dim?: boolean }> => ({
  in: { color: t.inn, dim: true },
  reject: { color: t.reject, dim: true },
  take: { color: t.take },
  cook: { color: t.cook },
  serve: { color: t.serve },
})

function fmtClock(t: number) {
  return new Date(t).toLocaleTimeString(INTL_LOCALE, { timeZone: TZ_NAME })
}

function fmtEvt(t: number) {
  return new Date(t).toLocaleTimeString(INTL_LOCALE, {
    timeZone: TZ_NAME,
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** The last `limit` visible rows of a snapshot plus its counters (newest first). */
export function feedTail(
  snap: FeedSnapshot | null,
  limit = 12
): {
  events: FeedEvent[]
  counters: { found: number; taken: number; served: number }
  funnel: { found: number; taken: number; served: number; asOf: string } | null
  live: boolean
} {
  if (!snap) {
    return { events: [], counters: { found: 0, taken: 0, served: 0 }, funnel: null, live: false }
  }
  const clean = dedupe(snap.events).filter(isShown)
  const inc = { in: 0, take: 0, serve: 0 } as Record<string, number>
  for (const e of snap.events) if (e.kind in inc) inc[e.kind]++
  return {
    events: clean.slice(-limit).reverse(),
    counters: {
      found: snap.base.found + inc.in,
      taken: snap.base.taken + inc.take,
      served: snap.base.served + inc.serve,
    },
    funnel: snap.funnel ?? null,
    live: true,
  }
}

export type ServeMode = 'full' | 'mark' | 'counter' | 'flash'

function buildRow(
  e: FeedEvent,
  t: (typeof SKIN)[TimelapseTheme],
  serveMode: ServeMode = 'full',
  live = false,
  compact = false
): HTMLElement {
  const st = { ...kindStyle(t)[e.kind] }
  const serveTextColor =
    e.kind === 'serve' && serveMode !== 'full'
      ? serveMode === 'counter'
        ? t.cook
        : t.serve
      : st.color
  const row = document.createElement(e.href ? 'a' : 'div')
  row.className = 'flex items-baseline gap-3.5'
  if (row instanceof HTMLAnchorElement) {
    row.href = e.href as string
    row.target = '_blank'
    row.rel = 'noopener'
    row.className += ' group pointer-events-auto'
  }
  row.style.height = `${ROW_H}px`
  row.style.contain = 'layout paint style'
  const time = document.createElement('span')
  time.className = 'shrink-0 tabular-nums text-[14px] tabular-nums min-[1500px]:text-[16px]'
  time.style.color = t.faint
  time.textContent = fmtEvt(e.t)
  const head = document.createElement('span')
  head.className = 'shrink-0 tabular-nums text-[14px] font-bold min-[1500px]:text-[16px]'
  head.style.color = e.kind === 'serve' ? serveTextColor : st.color
  head.textContent = e.head
  const detail = document.createElement('span')
  detail.className = 'truncate text-[14px] min-[1500px]:text-[16px]'
  let arrow: SVGSVGElement | null = null
  if (e.href) {
    detail.className +=
      ' font-bold underline decoration-1 decoration-white/35 underline-offset-4 transition-colors group-hover:decoration-white'
    detail.style.color = e.kind === 'serve' && serveMode !== 'full' ? t.cook : st.color
    arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    arrow.setAttribute('viewBox', '0 0 24 24')
    arrow.setAttribute('aria-hidden', 'true')
    arrow.setAttribute(
      'class',
      'h-[0.95em] w-[0.95em] shrink-0 translate-y-[0.12em] text-white/55 transition-colors group-hover:text-white'
    )
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M7 17L17 7M9 7h8v8')
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', 'currentColor')
    path.setAttribute('stroke-width', '2.6')
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('stroke-linejoin', 'round')
    arrow.append(path)
  } else {
    detail.style.color = st.dim ? t.dimBody : t.body
  }
  detail.textContent = e.detail
  if (compact) {
    row.className += ' text-[13px]'
  }
  row.append(time, head, detail)
  if (arrow) row.append(arrow)
  if (serveMode === 'flash' && e.kind === 'serve' && live) {
    head.style.color = t.serve
    detail.style.color = t.serve
    head.style.transition = 'color 2.5s ease'
    detail.style.transition = 'color 2.5s ease'
    setTimeout(() => {
      head.style.color = t.serve
      detail.style.color = t.cook
    }, 1800)
  }
  return row
}

function FlipNumber({ value, color }: { value: number; color: string }) {
  const str = value.toLocaleString(INTL_LOCALE)
  return (
    <div
      className="flex tabular-nums text-[52px] font-bold leading-none tracking-tight tabular-nums min-[1500px]:text-[68px] [perspective:500px]"
      style={{ color }}
    >
      {[...str].map((ch, i) => (
        <span key={`slot-${str.length}-${i}`} className="relative inline-block">
          <span key={ch} className="dtl-flip inline-block" style={{ transformOrigin: '50% 15%' }}>
            {ch}
          </span>
        </span>
      ))}
    </div>
  )
}

function Counter({
  value,
  label,
  color,
  labelColor,
  bar,
  frac,
}: {
  value: number
  label: string
  color: string
  labelColor: string
  bar: string
  frac: number
}) {
  return (
    <div className="w-full">
      <FlipNumber value={value} color={color} />
      <div
        className="mt-2 whitespace-nowrap text-[14px] min-[1500px]:text-[16px]"
        style={{ color: labelColor }}
      >
        {label}
      </div>
      <div
        className="mt-3 h-2 rounded-full"
        style={{ width: `${Math.max(frac * 100, 2)}%`, background: bar }}
      />
    </div>
  )
}

export const DirectorTimelapse = memo(function DirectorTimelapse({
  running,
  theme = 'dark',
  onDayTotals,
  accent,
  serveMode = 'full',
  initial = null,
}: {
  running: boolean
  initial?: FeedSnapshot | null
  theme?: TimelapseTheme
  onDayTotals?: (t: { found: number; taken: number; served: number }) => void
  accent?: string
  serveMode?: ServeMode
}) {
  const skin = useMemo(
    () =>
      accent
        ? ({ ...SKIN[theme], serve: accent } as unknown as (typeof SKIN)[TimelapseTheme])
        : SKIN[theme],
    [theme, accent]
  )
  const scenario = initial ?? null
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hoverTimerRef = useRef<number | null>(null)
  const HOVER_INTENT_MS = 250
  const disarmHover = () => {
    if (hoverTimerRef.current != null) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setHovered(false)
  }
  const onBeltMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(hover: hover)').matches) return
    if (e.movementX === 0 && e.movementY === 0) return
    if (hovered || hoverTimerRef.current != null) return
    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null
      setHovered(true)
    }, HOVER_INTENT_MS)
  }
  useEffect(() => {
    const reset = () => disarmHover()
    window.addEventListener('scroll', reset, { passive: true })
    window.addEventListener('wheel', reset, { passive: true })
    return () => {
      window.removeEventListener('scroll', reset)
      window.removeEventListener('wheel', reset)
      if (hoverTimerRef.current != null) window.clearTimeout(hoverTimerRef.current)
    }
  }, [])
  const halted = paused || hovered
  const snap = useMemo(() => {
    return scenario ?? { base: { found: 0, taken: 0, served: 0 }, events: [] }
  }, [scenario])
  const belt = useMemo(() => snap.events.filter(isShown), [snap])
  const tallyIndex = useMemo(() => {
    const all = [...snap.events].sort((a, b) => a.t - b.t)
    const ts = all.map((e) => e.t)
    const cum = { in: [0], take: [0], serve: [0] }
    for (const e of all) {
      cum.in.push(cum.in[cum.in.length - 1] + (e.kind === 'in' ? 1 : 0))
      cum.take.push(cum.take[cum.take.length - 1] + (e.kind === 'take' ? 1 : 0))
      cum.serve.push(cum.serve[cum.serve.length - 1] + (e.kind === 'serve' ? 1 : 0))
    }
    return { ts, cum }
  }, [snap])
  const [tally, setTally] = useState({ found: 0, taken: 0, served: 0 })
  const tallyIdxRef = useRef(-1)
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 759px)')
    setMobile(mq.matches)
    const on = () => setMobile(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  const clockRef = useRef<HTMLDivElement>(null)
  const beltRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const WARM_EVENTS = 24
  const shownRef = useRef(-1)
  const epochRef = useRef<number | null>(null)
  const pausedAtRef = useRef<number | null>(null)
  const lastBuiltRef = useRef(-1)

  const span = useMemo(() => {
    const t0 = belt[0]?.t ?? 0
    const t1 = belt[belt.length - 1]?.t ?? 1
    return { t0, t1, len: Math.max(t1 - t0, 1) }
  }, [belt])

  useEffect(() => {
    shownRef.current = -1
    lastBuiltRef.current = -1
    tallyIdxRef.current = -1
    const tot = { found: 0, taken: 0, served: 0 }
    for (const e of snap.events) {
      if (e.kind === 'in') tot.found++
      else if (e.kind === 'take') tot.taken++
      else if (e.kind === 'serve') tot.served++
    }
    const intakeLast = snap.intake?.[snap.intake.length - 1]?.n
    if (intakeLast !== undefined) tot.found = intakeLast
    onDayTotals?.({
      found: snap.base.found + tot.found,
      taken: snap.base.taken + tot.taken,
      served: snap.base.served + tot.served,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap])

  useEffect(() => {
    const now = performance.now()
    if (halted) {
      pausedAtRef.current = now
    } else if (pausedAtRef.current != null && epochRef.current != null) {
      epochRef.current += now - pausedAtRef.current
      pausedAtRef.current = null
    }
  }, [halted])

  const rebuildBelt = (upto: number) => {
    const beltEl = beltRef.current
    if (!beltEl) return
    const n = belt.length
    if (!n) return
    beltEl.replaceChildren()
    const from = Math.max(0, upto - VISIBLE)
    for (let i = upto - 1; i >= from; i--) {
      const evt = belt[((i % n) + n) % n]
      if (evt) beltEl.append(buildRow(evt, skin, serveMode, false, mobile))
    }
  }
  useEffect(() => {
    const warm = Math.max(shownRef.current, Math.min(WARM_EVENTS, belt.length))
    rebuildBelt(warm)
    lastBuiltRef.current = warm

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, belt, theme, accent, serveMode, mobile])

  useEffect(() => {
    if (!running) return
    let raf = 0
    const n = belt.length
    if (!n) return
    const root = rootRef.current
    const warm = Math.min(WARM_EVENTS, n)
    const stepMs = mobile ? 280 : STEP_MS
    if (epochRef.current == null) epochRef.current = performance.now() - warm * stepMs
    const tick = () => {
      const nowReal = performance.now()
      const now = halted && pausedAtRef.current != null ? pausedAtRef.current : nowReal
      const stepsF = Math.max(0, now - (epochRef.current ?? now)) / stepMs
      const shownNow = Math.floor(stepsF)
      const frac = Math.min(stepsF - shownNow, 1)
      const beltEl = beltRef.current
      if (beltEl) {
        const built = lastBuiltRef.current
        if (built < 0 || shownNow < built || shownNow - built > 3) {
          rebuildBelt(shownNow)
        } else {
          for (let i = built; i < shownNow; i++) {
            const evt = belt[((i % n) + n) % n]
            if (evt) beltEl.prepend(buildRow(evt, skin, serveMode, true, mobile))
          }
          while (beltEl.children.length > VISIBLE + 6) beltEl.removeChild(beltEl.lastChild as Node)
        }
        lastBuiltRef.current = shownNow
        beltEl.style.transform = `translateY(${(frac - 1) * ROW_H}px)`
      }
      shownRef.current = shownNow
      const dayIdx = shownNow % n
      if (dayIdx !== tallyIdxRef.current) {
        tallyIdxRef.current = dayIdx
        const tClock =
          dayIdx === 0 ? -Infinity : dayIdx >= n - 1 ? Infinity : (belt[dayIdx - 1]?.t ?? span.t0)
        let lo = 0
        let hi = tallyIndex.ts.length
        while (lo < hi) {
          const mid = (lo + hi) >> 1
          if (tallyIndex.ts[mid] <= tClock) lo = mid + 1
          else hi = mid
        }
        const c = {
          in: tallyIndex.cum.in[lo],
          take: tallyIndex.cum.take[lo],
          serve: tallyIndex.cum.serve[lo],
        }
        let intake: number | null = null
        if (snap.intake?.length) {
          intake = 0
          for (const m of snap.intake) {
            if (m.t > tClock) break
            intake = m.n
          }
        }
        const nextTally = {
          found: snap.base.found + (intake ?? c.in),
          taken: snap.base.taken + c.take,
          served: snap.base.served + c.serve,
        }
        setTally((prev) =>
          prev.found === nextTally.found &&
          prev.taken === nextTally.taken &&
          prev.served === nextTally.served
            ? prev
            : nextTally
        )
      }
      const DAY_MS = 24 * 3600 * 1000
      const cur = belt[(((dayIdx - 1) % n) + n) % n]?.t ?? span.t0
      let next = belt[dayIdx % n]?.t ?? span.t1
      if (dayIdx === 0) next += DAY_MS
      else if (next < cur) next = cur
      if (clockRef.current) clockRef.current.textContent = fmtClock(cur + (next - cur) * frac)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      if (root) root.style.opacity = '1'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, halted, snap, belt, tallyIndex, span, skin, mobile])

  const { found, taken, served } = tally
  const max = Math.max(found, 1)
  const dateLabel = `${fmtWeekdayDate(span.t1, TZ_NAME)} · ${TZ_LABEL}`

  const transport = (
    <button
      type="button"
      onClick={() => setPaused((v) => !v)}
      aria-label={paused ? 'Resume timelapse' : 'Stop timelapse'}
      aria-pressed={paused}
      className="pointer-events-auto group/tr inline-flex shrink-0 items-center gap-3 rounded-full outline-none transition-colors hover:[color:var(--tr-text)] focus-visible:ring-2 focus-visible:ring-white/40"
      style={{ color: paused ? skin.text : skin.mute, ['--tr-text' as string]: skin.text }}
    >
      <span className="hidden tabular-nums text-[14px] min-[760px]:inline">
        {paused ? 'play' : 'stop'}
      </span>
      <span
        className="grid h-11 w-11 place-items-center rounded-full border transition-colors min-[760px]:h-14 min-[760px]:w-14"
        style={{
          borderColor: paused ? skin.text : 'color-mix(in srgb, currentColor 35%, transparent)',
          background: paused ? skin.text : 'transparent',
          color: paused ? skin.bg : 'currentColor',
        }}
      >
        {paused ? (
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="ml-[2px] h-[18px] w-[18px] min-[760px]:h-[22px] min-[760px]:w-[22px]"
          >
            <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="h-[18px] w-[18px] min-[760px]:h-[22px] min-[760px]:w-[22px]"
          >
            <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
            <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
          </svg>
        )}
      </span>
    </button>
  )

  return (
    <div
      ref={rootRef}
      className="isolate absolute inset-0 flex flex-col overflow-hidden pt-12 antialiased [--tl-pb:24px] min-[1500px]:pt-14 min-[1500px]:[--tl-pb:32px]"
      style={{
        paddingBottom: 'calc(var(--tl-pb) + var(--sticky-cta-h, 0px))',
        color: skin.text,
        background: skin.bg,
        transition: 'background 0.6s cubic-bezier(0.4, 0, 0.6, 1), color 0.6s',
      }}
    >
      <style>{`
        @keyframes dtl-flip { from { transform: rotateX(-90deg); opacity: 0.35; } to { transform: rotateX(0); opacity: 1; } }
        .dtl-flip { animation: dtl-flip 0.2s cubic-bezier(0.3, 0.7, 0.4, 1); backface-visibility: hidden; }
        @media (prefers-reduced-motion: reduce) { .dtl-flip { animation: none; } }
      `}</style>

      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] grow flex-col px-5 min-[760px]:px-6 min-[1500px]:px-0">
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 min-[760px]:grid-cols-[minmax(0,1fr)_auto] min-[760px]:items-start min-[760px]:gap-y-2">
          <h2 className="max-w-[720px] text-[34px] font-bold leading-[1.05] tracking-tight min-[760px]:col-start-1 min-[760px]:row-start-1 min-[760px]:text-[52px]">
            See for yourself: the machine&apos;s last 24 hours
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-[760px]:col-start-2 min-[760px]:row-span-2 min-[760px]:row-start-1 min-[760px]:items-start min-[760px]:justify-self-end min-[760px]:gap-x-5">
            <div
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-[760px]:block min-[760px]:text-right"
              suppressHydrationWarning
            >
              <div
                ref={clockRef}
                className="tabular-nums text-[24px] font-bold leading-none tracking-tight min-[760px]:text-[38px] min-[1500px]:text-[48px]"
              >
                {fmtClock(span.t0)}
              </div>
              <div
                className="tabular-nums text-[13px] min-[760px]:mt-1.5"
                style={{ color: skin.mute }}
              >
                {dateLabel}
              </div>
            </div>
          </div>
          <p className="mt-1 max-w-[720px] text-[15px] leading-relaxed text-white/60 min-[760px]:col-start-1 min-[760px]:row-start-2 min-[1100px]:text-[17px]">
            <span className="font-bold text-white">Pipeline events are real</span>, time is
            compressed: a day plays out in a minute.
          </p>
        </div>

        <div className="mt-6 flex min-h-0 grow flex-col">
          <div
            className="relative min-h-0 grow overflow-hidden"
            style={{ contain: 'layout paint style' }}
            onMouseMove={onBeltMouseMove}
            onMouseLeave={disarmHover}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10"
              style={{ background: `linear-gradient(to bottom, ${skin.bg}, transparent)` }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24"
              style={{ background: `linear-gradient(to top, ${skin.bg}, transparent)` }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
              style={{ background: `linear-gradient(to left, ${skin.bg}, transparent)` }}
            />
            <div ref={beltRef} style={{ willChange: 'transform' }} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-x-4 pb-1 tabular-nums min-[760px]:hidden">
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <span className="text-[17px] font-bold" style={{ color: skin.found }}>
                {found}{' '}
                <span className="text-[12px] font-normal" style={{ color: skin.mute }}>
                  found
                </span>
              </span>
              <span className="text-[17px] font-bold" style={{ color: skin.taken }}>
                {taken}{' '}
                <span className="text-[12px] font-normal" style={{ color: skin.mute }}>
                  took
                </span>
              </span>
              <span className="text-[17px] font-bold" style={{ color: skin.serve }}>
                {served}{' '}
                <span className="text-[12px] font-normal" style={{ color: skin.mute }}>
                  served
                </span>
              </span>
            </div>
            {transport}
          </div>
          <div className="mt-6 hidden flex-wrap items-end justify-between gap-x-10 gap-y-5 pb-1 min-[760px]:flex">
            <div className="flex grow flex-wrap items-end gap-x-10 gap-y-5">
              <div className="w-[280px] min-[1500px]:w-[320px]">
                <Counter
                  value={found}
                  label="machine found — stories since midnight"
                  color={skin.found}
                  labelColor={skin.mute}
                  bar={skin.foundBar}
                  frac={found / max}
                />
              </div>
              <div className="w-[280px] min-[1500px]:w-[320px]">
                <Counter
                  value={taken}
                  label="editor took — into work"
                  color={skin.taken}
                  labelColor={skin.mute}
                  bar={skin.takenBar}
                  frac={taken / max}
                />
              </div>
              <div className="w-[280px] min-[1500px]:w-[320px]">
                <Counter
                  value={served}
                  label="served — stories on the site"
                  color={skin.serve}
                  labelColor={skin.mute}
                  bar={skin.serve}
                  frac={served / max}
                />
              </div>
            </div>
            <div className="self-end pb-1">{transport}</div>
          </div>
        </div>
      </div>
    </div>
  )
})
