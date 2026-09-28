'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { seriesColor } from '@/lib/palette'

/**
 * Dune Flow — smooth stacked area flow ("what made up the stream, and when
 * were the waves?"). Genre: Linear Insights "Issues by priority".
 *
 * Smoothing is a uniform cubic B-spline (basis, the d3 curveBasis
 * algorithm): the curve does NOT pass through the data points — that is the
 * point of the genre (dunes instead of spikes); the honest raw values live
 * in the tooltip. Layers are painted as cumulative areas top-down with
 * opaque fills — no seams between layers by construction. A B-spline is a
 * convex combination of its control points: boundaries never dip below the
 * baseline or cross each other, so no clamping is needed.
 * Interaction is the Linear genre: crosshair, tooltip with a date header and
 * series in stack order (composition, not sorted by value), a dot on the top
 * edge of the stack plus a dot on the baseline, dashed max line.
 *
 * Props:
 * - days: ISO 'YYYY-MM-DD' strings, one per stack column (min 4)
 * - series: stack order bottom-up; each { label, color?, values } — color
 *   falls back to the palette by series index; null values count as zero
 * - yLabel: accessible label for the chart
 */

export type DuneSeries = {
  label: string
  color?: string
  /** series order = stack order bottom-up; null counts as zero */
  values: Array<number | null>
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtDay(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? ''}`
}

function fmtDayYear(iso: string): string {
  const [year] = iso.split('-')
  return `${fmtDay(iso)} ${year}`
}

function fmtValue(value: number): string {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`
  if (value >= 10_000) return `${Math.round(value / 1_000)}K`
  return String(Math.round(value * 10) / 10)
}

const r2 = (v: number) => Math.round(v * 100) / 100

type Pt = { x: number; y: number }

/** Uniform cubic B-spline over control points — the d3 curveBasis algorithm. */
function basisPath(pts: Pt[]): string {
  const n = pts.length
  if (n === 0) return ''
  if (n === 1) return `M${r2(pts[0].x)},${r2(pts[0].y)}`
  if (n === 2) return `M${r2(pts[0].x)},${r2(pts[0].y)}L${r2(pts[1].x)},${r2(pts[1].y)}`
  const bez = (a: Pt, b: Pt, c: Pt) =>
    `C${r2((2 * a.x + b.x) / 3)},${r2((2 * a.y + b.y) / 3)},${r2((a.x + 2 * b.x) / 3)},${r2(
      (a.y + 2 * b.y) / 3
    )},${r2((a.x + 4 * b.x + c.x) / 6)},${r2((a.y + 4 * b.y + c.y) / 6)}`
  let d = `M${r2(pts[0].x)},${r2(pts[0].y)}L${r2((5 * pts[0].x + pts[1].x) / 6)},${r2(
    (5 * pts[0].y + pts[1].y) / 6
  )}`
  for (let i = 2; i < n; i++) d += bez(pts[i - 2], pts[i - 1], pts[i])
  d += bez(pts[n - 2], pts[n - 1], pts[n - 1])
  d += `L${r2(pts[n - 1].x)},${r2(pts[n - 1].y)}`
  return d
}

const W = 960
const H = 380
const PAD = { top: 22, right: 30, bottom: 40, left: 54 }

export function DuneAreaChart({
  days: daysLive,
  series: seriesLive,
  yLabel,
  chrome = 'full',
  height,
  stretch = false,
  entrance = 'wipe',
  onPenProgress,
  penColor = '#FF7A1A',
  dataEndX: dataEndXLive = 1,
  penHoverLabel,
}: {
  days: string[]
  series: DuneSeries[]
  yLabel?: string
  chrome?: 'full' | 'bare'
  height?: number
  stretch?: boolean
  entrance?: 'wipe' | 'pen'
  onPenProgress?: (t: number) => void
  penColor?: string
  dataEndX?: number
  penHoverLabel?: string
}) {
  const bare = chrome === 'bare'
  const pen = bare && entrance === 'pen'
  const pad = bare ? { top: 6, right: 0, bottom: 0, left: 0 } : PAD
  const vh = height ?? H
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [entered, setEntered] = useState(false)
  const crestRef = useRef<SVGPathElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const dotElRef = useRef<HTMLDivElement>(null)
  const dateElRef = useRef<HTMLDivElement>(null)
  const [penDone, setPenDone] = useState(false)
  const penIdxRef = useRef<number>(Infinity)
  const startSnap = useMemo(
    () => ({ days: daysLive, series: seriesLive, dataEndX: dataEndXLive }),
    [entered]
  )
  const penRunning = pen && entered && !penDone
  const days = penRunning ? startSnap.days : daysLive
  const series = penRunning ? startSnap.series : seriesLive
  const dataEndX = penRunning ? startSnap.dataEndX : dataEndXLive

  useEffect(() => {
    const node = wrapRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setEntered(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setEntered(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  const placePenAtEnd = () => {
    const crest = crestRef.current
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!crest || !rect) return
    const pt = crest.getPointAtLength(crest.getTotalLength())
    const sx2 = (pt.x / W) * rect.width
    const sy2 = (pt.y / vh) * rect.height
    if (shadeRef.current) shadeRef.current.style.transform = `translate3d(${sx2 + 2}px, 0, 0)`
    if (dotElRef.current)
      dotElRef.current.style.transform = `translate3d(${sx2 - 7}px, ${sy2 - 7}px, 0)`
  }
  useEffect(() => {
    if (!penDone) return
    placePenAtEnd()
    window.addEventListener('resize', placePenAtEnd, { passive: true })
    return () => window.removeEventListener('resize', placePenAtEnd)
  }, [penDone, days, series, dataEndX])

  useEffect(() => {
    if (!pen || !entered) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const crest = crestRef.current
    if (!crest) return
    const len = crest.getTotalLength()
    const D = 2300
    const delay = 300
    let raf = 0
    let rect = wrapRef.current?.getBoundingClientRect()
    const onResize = () => {
      rect = wrapRef.current?.getBoundingClientRect()
    }
    window.addEventListener('resize', onResize, { passive: true })
    const t0 = performance.now()
    const frame = (now: number) => {
      const raw = Math.min(1, Math.max(0, (now - t0 - delay) / D))
      if (raw >= 1 || reduce) {
        penIdxRef.current = Infinity
        setPenDone(true)
        placePenAtEnd()
        onPenProgress?.(1)
        return
      }
      const t = raw * raw
      const pt = crest.getPointAtLength(len * t)
      const sx2 = rect ? (pt.x / W) * rect.width : pt.x
      const sy2 = rect ? (pt.y / vh) * rect.height : pt.y
      if (shadeRef.current) shadeRef.current.style.transform = `translate3d(${sx2 + 2}px, 0, 0)`
      if (dotElRef.current)
        dotElRef.current.style.transform = `translate3d(${sx2 - 7}px, ${sy2 - 7}px, 0)`
      if (dateElRef.current && rect) {
        const n = days.length
        const idx = Math.round((pt.x / W) * (n - 1))
        const iso = days[Math.min(n - 1, Math.max(0, idx))]
        const [, m, d] = iso.split('-')
        dateElRef.current.textContent = `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''}`
        const tx = Math.min(rect.width - 64, Math.max(64, sx2))
        dateElRef.current.style.transform = `translate3d(${tx}px, ${Math.max(4, sy2 - 40)}px, 0)`
      }
      penIdxRef.current = Math.round((pt.x / W) * (days.length - 1))
      onPenProgress?.(t)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const kick = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(frame)
    }
    document.addEventListener('visibilitychange', kick)
    const doneTimer = window.setTimeout(kick, delay + D + 250)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(doneTimer)
      document.removeEventListener('visibilitychange', kick)
      window.removeEventListener('resize', onResize)
    }
  }, [pen, entered])

  const geometry = useMemo(() => {
    const n = days.length
    const plotW = W - pad.left - pad.right
    const plotH = vh - pad.top - pad.bottom
    // Cumulative stack boundaries: boundaries[k][i] = sum of series 0..k-1 on day i
    const boundaries: number[][] = [Array.from({ length: n }, () => 0)]
    for (const s of series) {
      const prev = boundaries[boundaries.length - 1]
      boundaries.push(prev.map((b, i) => b + (s.values[i] ?? 0)))
    }
    const totals = boundaries[boundaries.length - 1]
    const rawMax = Math.max(...totals, 1)
    // Clean ticks: 1-2-2.5-5 × 10^k step targeting 4-5 divisions, top is a multiple of the step
    const stepMag = 10 ** Math.floor(Math.log10(rawMax / 4))
    const yStep =
      [1, 2, 2.5, 5, 10].map((m) => m * stepMag).find((m) => m * 5 >= rawMax) ?? rawMax / 4
    const yMax = yStep * Math.ceil(rawMax / yStep)
    const yTicks = Array.from({ length: Math.round(yMax / yStep) + 1 }, (_, i) => i * yStep)
    const sx = (index: number) =>
      pad.left + (index / Math.max(n - 1, 1)) * plotW * (pen ? dataEndX : 1)
    const sy = (value: number) => pad.top + (1 - value / yMax) * plotH
    // Layers — cumulative areas down to the baseline, painted top-down:
    // opaque fills tessellate without seams; the visible band of series k
    // sits between boundaries k and k+1
    const layers = series
      .map((s, k) => {
        const top = boundaries[k + 1].map((v, i) => ({ x: sx(i), y: sy(v) }))
        const d = `${basisPath(top)}L${r2(sx(n - 1))},${r2(sy(0))}L${r2(sx(0))},${r2(sy(0))}Z`
        return { d, color: s.color ?? seriesColor(k), label: s.label }
      })
      .reverse()
    // At data point i the B-spline passes through (v[i-1]+4v[i]+v[i+1])/6 —
    // on a uniform grid that is exactly x=sx(i): the hover dot sits on the curve
    const smoothedTotal = (i: number) =>
      i === 0 || i === n - 1 ? totals[i] : (totals[i - 1] + 4 * totals[i] + totals[i + 1]) / 6
    const crestPath = basisPath(totals.map((v, i) => ({ x: sx(i), y: sy(v) })))
    let ghostPath = ''
    if (pen && dataEndX < 1 && n > 6) {
      const endX = W * dataEndX
      const dayW = endX / Math.max(n - 1, 1)
      const futureDays = Math.min(n - 1, Math.ceil((W - endX) / dayW) + 2)
      const pts: Pt[] = []
      const todayV = totals[n - 1] ?? 0
      for (let i = 0; i < futureDays; i++) {
        const echoV = totals[n - futureDays + i] ?? 0
        const w2 = futureDays > 1 ? i / (futureDays - 1) : 1
        pts.push({ x: endX + i * dayW, y: sy(todayV * (1 - w2) + echoV * w2) })
      }
      if (pts.length > 1) {
        const lastX = pts[pts.length - 1].x
        ghostPath = `${basisPath(pts)}L${r2(lastX)},${r2(sy(0))}L${r2(endX)},${r2(sy(0))}Z`
      }
    }
    return { plotW, plotH, yMax, yTicks, sx, sy, layers, smoothedTotal, crestPath, ghostPath }
  }, [days.length, series, bare, vh, pen, dataEndX]) // eslint-disable-line react-hooks/exhaustive-deps -- pad derived from bare

  if (days.length < 4 || !series.length) return null
  const { plotW, plotH, yMax, yTicks, sx, sy, layers, smoothedTotal, crestPath, ghostPath } =
    geometry

  const xTickEvery = Math.max(1, Math.round(days.length / 6))
  const xTicks = days
    .map((day, index) => ({ day, index }))
    .filter(({ index }) => index % xTickEvery === 0 && index <= days.length - 2)

  const pointerToIndex = (clientX: number): number | null => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return null
    const xInSvg = ((clientX - rect.left) / rect.width) * W
    const ratio = (xInSvg - pad.left) / (plotW * (pen ? dataEndX : 1))
    if (ratio < -0.03 || ratio > 1.03) return null
    const index = Math.round(Math.min(1, Math.max(0, ratio)) * (days.length - 1))
    if (pen && !penDone && index > penIdxRef.current) return null
    return index
  }

  // Tooltip: series in stack order (composition), raw values, not smoothed
  const hoverRows =
    hover === null
      ? []
      : series.map((s, k) => ({
          label: s.label,
          color: s.color ?? seriesColor(k),
          value: s.values[hover],
        }))
  const hoverLeftPct = hover === null ? 0 : (sx(hover) / W) * 100
  const tooltipOnLeft = hover !== null && hover > days.length * 0.62

  return (
    <div
      ref={wrapRef}
      className={`${entered && !pen ? 'vda-enter' : ''} ${stretch ? 'h-full' : ''}`}
    >
      <div
        className={stretch ? 'relative h-full' : 'relative'}
        onPointerMove={(event) => setHover(pointerToIndex(event.clientX))}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${vh}`}
          preserveAspectRatio={stretch ? 'none' : 'xMidYMid meet'}
          className={stretch ? 'h-full w-full' : 'w-full'}
          role="img"
          aria-label={yLabel}
        >
          {bare
            ? null
            : yTicks.map((tick) =>
                tick === 0 ? null : (
                  <g key={tick}>
                    <line
                      x1={pad.left}
                      y1={sy(tick)}
                      x2={W - pad.right}
                      y2={sy(tick)}
                      stroke={tick === yMax ? 'var(--vz-axis,#C9C9C9)' : 'var(--vz-track,#F0EFED)'}
                      strokeWidth="1"
                      strokeDasharray={tick === yMax ? '5 4' : '2 4'}
                    />
                    <text
                      x={PAD.left - 10}
                      y={sy(tick) + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="var(--vz-muted,#8A8A8A)"
                    >
                      {fmtValue(tick)}
                    </text>
                  </g>
                )
              )}
          {bare ? null : (
            <text
              x={pad.left - 10}
              y={sy(0) + 4}
              textAnchor="end"
              fontSize="12"
              fill="var(--vz-muted,#8A8A8A)"
            >
              0
            </text>
          )}
          {bare
            ? null
            : xTicks.map(({ day, index }) => (
                <text
                  key={day}
                  x={sx(index)}
                  y={vh - pad.bottom + 24}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--vz-muted,#8A8A8A)"
                >
                  {fmtDay(day)}
                </text>
              ))}
          {pen ? (
            <>
              <g>
                {layers.map((l) => (
                  <path key={l.label} d={l.d} fill={l.color} />
                ))}
              </g>
              <path ref={crestRef} d={crestPath} fill="none" stroke="none" />
              {ghostPath ? (
                <path
                  d={ghostPath}
                  fill="#98989E"
                  className={penDone ? 'vda-ghost-in' : ''}
                  style={{ opacity: penDone ? 0.16 : 0 }}
                />
              ) : null}
            </>
          ) : (
            <g className="vda-flow">
              {layers.map((l) => (
                <path key={l.label} d={l.d} fill={l.color} />
              ))}
            </g>
          )}
          {bare ? null : (
            <line
              x1={pad.left}
              y1={sy(0)}
              x2={W - pad.right}
              y2={sy(0)}
              stroke="var(--vz-axis,#D9D9D9)"
              strokeWidth="1"
            />
          )}
          {hover !== null ? (
            <g>
              <line
                x1={sx(hover)}
                y1={pad.top}
                x2={sx(hover)}
                y2={pad.top + plotH}
                stroke="var(--vz-axis,#C9C9C9)"
                strokeWidth="1"
              />
              <circle
                cx={sx(hover)}
                cy={sy(smoothedTotal(hover))}
                r={4.5}
                fill="var(--vz-ring,#FFFFFF)"
                stroke="var(--vz-ink,#111111)"
                strokeWidth="1.5"
              />
              <circle
                cx={sx(hover)}
                cy={sy(0)}
                r={3.5}
                fill="var(--vz-ring,#FFFFFF)"
                stroke="var(--vz-ink,#111111)"
                strokeWidth="1.5"
              />
            </g>
          ) : null}
        </svg>

        {pen ? (
          <>
            <div
              ref={shadeRef}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-full"
              style={{
                background: '#000000',
                transform: 'translate3d(0,0,0)',
                opacity: penDone ? 0 : 1,
                transition: 'opacity 0.5s',
              }}
            />
            {dataEndX < 1 ? (
              <span
                aria-hidden
                className="vda-cursor-blink absolute bottom-[6px] right-[8px] font-mono text-[15px] font-bold"
                style={{
                  color: penColor,
                  opacity: penDone ? 1 : 0,
                  transition: 'opacity 0.7s',
                }}
              >
                ▍
              </span>
            ) : null}
            <div
              ref={dateElRef}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 font-mono text-[15px] font-semibold tracking-tight text-white/95"
              style={{
                textShadow: '0 1px 10px rgba(0,0,0,0.85)',
                opacity: penDone ? 0 : 1,
                transition: 'opacity 0.5s',
                transform: 'translate3d(-100px,0,0)',
              }}
            />
            <div
              ref={dotElRef}
              className={`group absolute left-0 top-0 h-3.5 w-3.5 ${penDone ? 'pointer-events-auto cursor-default' : 'pointer-events-none'}`}
              style={{ transform: 'translate3d(-100px,-100px,0)' }}
              onPointerMove={(e) => {
                e.stopPropagation()
                setHover(null)
              }}
            >
              {penDone && penHoverLabel ? (
                <span
                  className="pointer-events-none absolute bottom-full right-0 mb-2.5 hidden whitespace-nowrap rounded-full border border-white/15 px-3 py-1.5 font-mono text-[12.5px] text-white/90 backdrop-blur-[20px] group-hover:block"
                  style={{ background: 'rgba(42, 42, 45, 0.72)' }}
                >
                  {penHoverLabel}
                </span>
              ) : null}
              <span
                className={penDone ? 'vda-live-ping absolute inset-0 rounded-full' : 'hidden'}
                style={{ background: penColor, opacity: 0.6 }}
              />
              <span
                className="absolute inset-0 rounded-full transition-transform duration-200 group-hover:scale-[1.45]"
                style={{
                  background: penColor,
                  border: '1.5px solid #000000',
                  boxShadow: penDone ? 'none' : `0 0 12px ${penColor}`,
                }}
              />
            </div>
          </>
        ) : null}

        {hover !== null ? (
          <div
            className="pointer-events-none absolute top-6 z-10 min-w-[210px] rounded-[10px] border border-[var(--vz-frame,#E3E3E3)] bg-[var(--vz-surface,#FFFFFF)] px-3.5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.10)]"
            style={
              tooltipOnLeft
                ? { right: `${100 - hoverLeftPct}%`, marginRight: 14 }
                : { left: `${hoverLeftPct}%`, marginLeft: 14 }
            }
          >
            <p className="flex items-baseline justify-between gap-4 pb-1 text-[13px] font-semibold text-[var(--vz-ink,#111111)]">
              <span>{fmtDayYear(days[hover])}</span>
              <span className="tabular-nums">
                {fmtValue(hoverRows.reduce((a, r) => a + (r.value ?? 0), 0))}
              </span>
            </p>
            {hoverRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-5 py-[3px] text-[12.5px]"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-[11px] w-[11px] rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="text-[var(--vz-text2,#3D3D3D)]">{row.label}</span>
                </span>
                <span className="font-semibold tabular-nums text-[var(--vz-ink,#111111)]">
                  {row.value === null ? '—' : fmtValue(row.value)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className={bare ? 'hidden' : 'mt-4 flex flex-wrap justify-center gap-x-7 gap-y-2'}>
        {series.map((s, k) => (
          <p key={s.label} className="flex items-center gap-2 text-[13px]">
            <span
              className="inline-block h-[10px] w-[10px] rounded-full"
              style={{ backgroundColor: s.color ?? seriesColor(k) }}
            />
            <span className="font-medium text-[var(--vz-text3,#5C5C5C)]">{s.label}</span>
          </p>
        ))}
      </div>

      <style>{`
        .vda-ghost-in {
          animation: vda-ghost-wipe 1s cubic-bezier(0, 0, 0.2, 1) both;
        }
        @keyframes vda-ghost-wipe {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        @media (prefers-reduced-motion: reduce) { .vda-ghost-in { animation: none; } }
        .vda-cursor-blink { animation: vda-blink 1.1s steps(1) infinite; }
        @keyframes vda-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .vda-cursor-blink { animation: none; } }
        .vda-live-ping {
          animation: vda-ping 1.7s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes vda-ping { 0% { transform: scale(1); opacity: 0.7; } 80%, 100% { transform: scale(3.4); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .vda-ghost-in {
          animation: vda-ghost-wipe 1s cubic-bezier(0, 0, 0.2, 1) both;
        }
        @keyframes vda-ghost-wipe {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        @media (prefers-reduced-motion: reduce) { .vda-ghost-in { animation: none; } }
        .vda-cursor-blink { animation: vda-blink 1.1s steps(1) infinite; }
        @keyframes vda-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .vda-cursor-blink { animation: none; } }
        .vda-live-ping { animation: none; opacity: 0; }
        }
        .vda-flow { opacity: 1; }
        .vda-enter .vda-flow {
          opacity: 0;
          clip-path: inset(0 100% 0 0);
          transform: translateX(-14px);
          animation: vda-sweep 1200ms cubic-bezier(0.4, 0, 0.2, 1) 150ms forwards;
        }
        @keyframes vda-sweep {
          20% { opacity: 1; }
          to { opacity: 1; clip-path: inset(0 -2% 0 0); transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vda-enter .vda-flow { animation: none; opacity: 1; clip-path: none; transform: none; }
        }
      `}</style>
    </div>
  )
}
