'use client'

/**
 * Machine Day — the scroll story, top to bottom:
 *
 *   #live        hero headline, commit dunes (DuneAreaChart), live terminal (AfterDune)
 *   statement    "Agentic development. A machine day in one minute." + 24h timelapse (DuneStatement)
 *   #map         repository map in three readings, clickable region dives (MapScrolly)
 *   #operator    the human in the loop (photo + bio from site.config.ts)
 *   #axiom       price / speed / quality (OvertureScene), speed duel (SpeedTact)
 *   #selection   what the machine throws out (FunnelTact / CullScene)
 *   #summary     the new rule: pick all three (TriangleCloseScene)
 *   #footnotes   methodology (content/footnotes.ts)
 *
 * Numbers come in as props from app/page.tsx (lib/data.ts); story texts that
 * are not brand-level live inline here and in content/*.
 */

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { DuneAreaChart, type DuneSeries, fmtDay } from '@/components/charts/dune-flow'
import { RevealHost } from '@/components/site/reveal'
import { DECISIONS_BASE, DECISIONS_SERIES, DECISIONS_SREZ } from '@/content/decisions'
import {
  BACKEND_CRONS,
  BACKEND_TIERS,
  BIZ_STORIES,
  BIZ_TIERS,
  ADMIN_ATLAS,
  ADMIN_LAW,
  ADMIN_TOTAL,
  AGENTS_STEPS,
  CI_FACTS,
  DECISIONS_TOP,
  DECISIONS_TOTAL,
  DOCS_FILE,
  DOCS_TOP,
  JOURNAL_ENTRY,
  BUSINESS_REGIONS,
  MAP_DIVE,
  SCREEN_WORLDS,
  VIBE_LIT,
  type DiveCluster,
} from '@/content/map'
import { FOOTNOTES } from '@/content/footnotes'
import { SPEED_TASKS } from '@/content/speed'
import { TEAM_USD_PER_MONTH } from '@/content/team'
import type { Commit, Feed, Stats } from '@/lib/data'
import { toSnapshot, type FeedSnapshot } from '@/lib/feed'
import { fmtUsd, fmtUsdShort } from '@/lib/format'
import { CHAMPAGNE_GRADIENT } from '@/lib/palette'
import type { Pulse } from '@/lib/pulse'
import { squarify } from '@/lib/treemap'
import { ZONE_COLORS, zoneLabel } from '@/lib/zones'
import { siteConfig } from '@/site.config'

import { DirectorTimelapse, feedTail } from './director-timelapse'
import { MachineProvider, useMachine } from './machine-context'
import { RoleChip, razWord } from './role-chip'
import { SceneSheet } from './scene-sheet'

const INTL_LOCALE = siteConfig.locale

const DAY_MS = 24 * 3600 * 1000

/** Seconds per commit over the activity window (first day to the end of the last day). */
function secPerCommit(total: number, startDay: string | null, endDay: string | null): number {
  if (!startDay || !endDay || total <= 0) return 3600
  const span = Date.parse(`${endDay}T00:00:00Z`) + DAY_MS - Date.parse(`${startDay}T00:00:00Z`)
  return Math.max(1, Math.round(span / 1000 / total))
}

/** "July 1" / "July 1, 2026" for a `YYYY-MM-DD` day. */
function fmtStartDay(day: string | null, withYear = false): string {
  if (!day) return 'the start'
  return new Date(`${day}T12:00:00Z`).toLocaleDateString(INTL_LOCALE, {
    month: 'long',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
    timeZone: 'UTC',
  })
}

/** Machine pace: a commit every N minutes; the next one "due" in M minutes. */
function tempoOf(secPer: number): { everyMin: number; nextMin: number } {
  const everyMin = Math.max(1, Math.round(secPer / 60))
  const nowSec = Math.floor(Date.now() / 1000)
  const nextMin = Math.floor((secPer - (nowSec % secPer)) / 60)
  return { everyMin, nextMin }
}

const AMBER = siteConfig.accent

const fmtInt = (n: number | undefined) => (n === undefined ? '—' : n.toLocaleString(INTL_LOCALE))

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

const fmtDur = (d: number) => {
  if (d < 90) return `${Math.round(d)} ${plural(Math.round(d), 'day', 'days', 'days')}`
  if (d < 365) return `≈${Math.round(d / 30.44)} mo`
  const y = d / 365
  return `≈${y.toLocaleString(INTL_LOCALE, { maximumFractionDigits: 1 })} ${y >= 4.5 ? 'years' : 'years'}`
}

const DEFAULT_CREW = 12
const defaultTimeMult = () => {
  const c = SYNC_H_DEFAULT / 40
  const eff = Math.max(1 - c * (DEFAULT_CREW - 1), 0.05)
  return (
    (EXEC_MULT_DEFAULT *
      (8 / FOCUS_H_DEFAULT) *
      (100 / FLOW_EFF_DEFAULT) *
      (WORKDAYS_YEAR / Math.max(WORKDAYS_YEAR - ABS_DAYS_DEFAULT, 60))) /
    eff
  )
}

function HeroCounter({ target, ms = 2100 }: { target: number; ms?: number }) {
  const value = useCountUp(target, ms)
  return <>{value.toLocaleString(INTL_LOCALE)}</>
}

function useCountUp(target: number, ms = 1400) {
  const [v, setV] = useState(0)
  const fromRef = useRef(0)
  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      const value = Math.round(from + (target - from) * eased)
      fromRef.current = value
      setV(value)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

const STATEMENT = 'Agentic development.'
const BASE_Y = 330

function DuneStatement({
  ether = null,
  pages = null,
}: {
  ether?: FeedSnapshot | null
  pages?: number | null
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const pRef = useRef(0)
  const [coarse, setCoarse] = useState({ active: false, masked: false })
  const [reduced, setReduced] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const scrRef = useRef<{ w: number; h: number; dpr: number; offX: number; offY: number }>({
    w: 0,
    h: 0,
    dpr: 1,
    offX: 0,
    offY: 0,
  })
  const fillGRef = useRef<SVGGElement>(null)
  const fillTextRef = useRef<SVGTextElement>(null)
  const outroWrapRef = useRef<HTMLDivElement>(null)
  const punchRef = useRef<HTMLDivElement>(null)
  const copy1Ref = useRef<HTMLParagraphElement>(null)
  const factRef = useRef<HTMLDivElement>(null)
  const para2Ref = useRef<HTMLParagraphElement>(null)
  const geomRef = useRef<{
    pxPerVb: number
    fontSize: number
    reduced: boolean
    anchor: { x: number; y: number; s0: number } | null
  }>({ pxPerVb: 1.25, fontSize: 88, reduced: false, anchor: null })
  const geomStem = useRef({ w: 0, h: 0 })
  const fontFamRef = useRef<string>('')
  const lastDrawnPRef = useRef(-1)
  const etherWrapRef = useRef<HTMLDivElement>(null)
  const mobRef = useRef(false)
  const [mobLayout, setMobLayout] = useState(false)
  const [mobStage, setMobStage] = useState(0)
  useEffect(() => {
    if (!mobLayout) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const total = r.height - window.innerHeight
        const q = Math.min(1, Math.max(0, -r.top / Math.max(total, 1)))
        const next = q >= 0.82 ? 4 : q >= 0.62 ? 3 : q >= 0.44 ? 2 : q >= 0.12 ? 1 : 0
        setMobStage((prev) => (prev === next ? prev : next))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [mobLayout])
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 759px)')
    setMobLayout(mq.matches)
    const on = () => setMobLayout(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  const [timelapseOn, setTimelapseOn] = useState(false)
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const io = new IntersectionObserver(([e]) => setTimelapseOn(e.isIntersecting), {
      threshold: 0.05,
    })
    io.observe(wrap)
    return () => io.disconnect()
  }, [mobLayout])
  const [visW, setVisW] = useState(1067)
  const [pxPerVb, setPxPerVb] = useState(1.25)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onMq = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onMq)
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const total = r.height - window.innerHeight
        pRef.current = Math.min(1, Math.max(0, -r.top / Math.max(total, 1)))
        const stage = stageRef.current
        const cw = stage?.clientWidth || window.innerWidth
        const ch = stage?.clientHeight || window.innerHeight
        mobRef.current = cw < 760
        if (mobRef.current && !stageRef.current) return
        const ar = cw / Math.max(ch, 1)
        const nextVisW = ar >= 1220 / 640 ? 1220 : 640 * ar
        const ppv = Math.max(cw / 1220, ch / 640)
        setVisW((prev) => (Math.abs(prev - nextVisW) < 0.5 ? prev : nextVisW))
        setPxPerVb((prev) => (Math.abs(prev - ppv) < 0.001 ? prev : ppv))
        const dprC = Math.min(window.devicePixelRatio || 1, 2)
        const s = scrRef.current
        if (s.w !== cw || s.h !== ch || s.dpr !== dprC) {
          scrRef.current = {
            w: cw,
            h: ch,
            dpr: dprC,
            offX: (1220 * ppv - cw) / 2,
            offY: (640 * ppv - ch) / 2,
          }
          const c = canvasRef.current
          if (c) {
            c.width = Math.round(cw * dprC)
            c.height = Math.round(ch * dprC)
          }
        }
        applyFrame()
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      mq.removeEventListener?.('change', onMq)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  const DEAD = 0.05
  const applyFrame = (force = false) => {
    const g = geomRef.current
    const p = g.reduced ? 1 : pRef.current
    if (!force && Math.abs(p - lastDrawnPRef.current) < 0.0004) return
    lastDrawnPRef.current = p
    const q = Math.min(1, Math.max(0, (p - DEAD) / (1 - DEAD)))
    if (etherWrapRef.current) {
      const pre = Math.min(1, DEAD > 0 ? p / DEAD : 1)
      etherWrapRef.current.style.transform = `scale(${1 - 0.02 * pre})`
    }
    const t = Math.min(1, q / 0.25)
    if (etherWrapRef.current) {
      const pre = Math.min(1, DEAD > 0 ? p / DEAD : 1)
      const dive = 0.03 * pre + 0.11 * Math.min(1, t / 0.35)
      etherWrapRef.current.style.transform = `scale(${1 - dive})`
    }
    const fillP = Math.min(1, Math.max(0, (q - 0.25) / 0.05))
    const outroH2 = Math.min(1, Math.max(0, (q - 0.3) / 0.05))
    const outroCopy = Math.min(1, Math.max(0, (q - 0.4) / 0.1))
    const outroCopyOut = Math.min(1, Math.max(0, (q - 0.7) / 0.1))
    const outroFact = Math.min(1, Math.max(0, (q - 0.8) / 0.1))
    const outroPara2 = Math.min(1, Math.max(0, (q - 0.9) / 0.1))
    const outroShift = outroCopy * 140 + outroPara2 * 80
    const shiftVb = g.pxPerVb > 0 ? outroShift / g.pxPerVb : 0
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    const s0v = g.anchor?.s0 ?? 14
    const scale = Math.pow(s0v, 1 - ease)
    const axv = g.anchor?.x ?? 610
    const ayv = g.anchor?.y ?? BASE_Y - 30
    const tf = `translate(0 ${-shiftVb}) translate(${axv} ${ayv}) scale(${scale}) translate(${-axv} ${-ayv})`
    fillGRef.current?.setAttribute('transform', tf)
    const on = g.reduced || t > 0
    const c = canvasRef.current
    const scr = scrRef.current
    const ctx = c && scr.w > 0 ? c.getContext('2d') : null
    if (c && ctx) {
      c.style.opacity = on ? '1' : '0'
      const k = scr.dpr
      const wantW = Math.round(scr.w * k)
      const wantH = Math.round(scr.h * k)
      if (c.width !== wantW || c.height !== wantH) {
        c.width = wantW
        c.height = wantH
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#000000'
      if (!g.anchor) ctx.globalAlpha = Math.min(1, t * 2.5)
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.globalAlpha = 1
      const ppv = g.pxPerVb
      ctx.setTransform(k * ppv, 0, 0, k * ppv, -scr.offX * k, -scr.offY * k)
      ctx.translate(0, -shiftVb)
      ctx.translate(axv, ayv)
      ctx.scale(scale, scale)
      ctx.translate(-axv, -ayv)
      if (!fontFamRef.current)
        fontFamRef.current = window.getComputedStyle(document.body).fontFamily
      ctx.font = `700 ${g.fontSize}px ${fontFamRef.current}`
      try {
        ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          `${-0.025 * g.fontSize}px`
      } catch {
        // older browsers without canvas letterSpacing: a couple of px off is fine
      }
      ctx.textAlign = 'center'
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = '#000'
      ctx.fillText(STATEMENT, 610, BASE_Y)
      if (g.anchor && t < 0.6) {
        const hw = geomStem.current.w
        const hh = geomStem.current.h
        if (hw > 0.01) ctx.fillRect(axv - hw, ayv - hh, hw * 2, hh * 2)
      }
      const strokeOp = ease * (1 - fillP)
      if (strokeOp > 0.01) {
        ctx.globalCompositeOperation = 'source-atop'
        ctx.strokeStyle = `rgba(255,255,255,${0.35 * strokeOp})`
        ctx.lineWidth = ((0.8 + ease * 0.8) * 2) / (ppv * scale)
        ctx.strokeText(STATEMENT, 610, BASE_Y)
      }
    }
    if (fillTextRef.current) fillTextRef.current.style.opacity = String(fillP)
    if (outroWrapRef.current) {
      outroWrapRef.current.style.opacity = on ? '1' : '0'
      outroWrapRef.current.style.transform = `translateY(${-outroShift}px)`
    }
    if (punchRef.current) {
      punchRef.current.style.opacity = String(outroH2)
      punchRef.current.style.transform = `translateY(${(1 - outroH2) * 10}px)`
    }
    if (copy1Ref.current) copy1Ref.current.style.opacity = String(outroCopy * (1 - outroCopyOut))
    if (factRef.current) factRef.current.style.opacity = String(outroFact)
    if (para2Ref.current) para2Ref.current.style.opacity = String(outroPara2)
    const nextActive = g.reduced || q > 0
    const nextMasked = t > 0.02
    setCoarse((prev) =>
      prev.active === nextActive && prev.masked === nextMasked
        ? prev
        : { active: nextActive, masked: nextMasked }
    )
  }
  // Gradient of the big statement: champagne to copper (lib/palette.ts).
  const FILL_STOPS: Array<[number, string]> = [
    [0, CHAMPAGNE_GRADIENT[0]],
    [0.35, CHAMPAGNE_GRADIENT[1]],
    [0.7, CHAMPAGNE_GRADIENT[2]],
    [1, CHAMPAGNE_GRADIENT[3]],
  ]
  // Timelapse accent: undefined = site accent; 'mark' = only the published rows are colored.
  const etherAccent: string | undefined = undefined
  const etherMode = 'mark' as const
  const gradText = {
    backgroundImage: `linear-gradient(90deg, ${FILL_STOPS.map(([o, c]) => `${c} ${o * 100}%`).join(', ')})`,
    WebkitBackgroundClip: 'text' as const,
    backgroundClip: 'text' as const,
    color: 'transparent',
  }
  const [dayTotals, setDayTotals] = useState<{
    found: number
    taken: number
    served: number
  } | null>(null)
  const fontSize = Math.min(80 / pxPerVb, (visW * 0.94) / 11.4)
  const [anchor, setAnchor] = useState<{
    x: number
    y: number
    s0: number
    hw: number
    hh: number
  } | null>(null)
  useEffect(() => {
    if (!fontSize) return
    let cancelled = false
    const run = () => {
      if (cancelled) return
      computeAnchor()
    }
    document.fonts.ready.then(run)
    function computeAnchor() {
      const K = Math.max(1, Math.round(118 / Math.max(fontSize, 1)))
      const canvas = document.createElement('canvas')
      canvas.width = 1220 * K
      canvas.height = 640 * K
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      const family = getComputedStyle(document.body).fontFamily
      ctx.font = `700 ${fontSize * K}px ${family}`
      try {
        ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          `${-0.025 * fontSize * K}px`
      } catch {
        // older browsers without canvas letterSpacing: a couple of px off is fine
      }
      ctx.textAlign = 'center'
      ctx.fillStyle = '#fff'
      ctx.fillText(STATEMENT, 610 * K, BASE_Y * K)
      const img = ctx.getImageData(0, 0, 1220 * K, 640 * K).data
      const filled = (x: number, y: number) =>
        x >= 0 && x < 1220 * K && y >= 0 && y < 640 * K && img[(y * 1220 * K + x) * 4 + 3] > 128
      const runs = (x: number, y: number) => {
        let wx = 0
        while (wx < 40 * K && filled(x - wx - 1, y) && filled(x + wx + 1, y)) wx++
        let wy = 0
        while (wy < 44 * K && filled(x, y - wy - 1) && filled(x, y + wy + 1)) wy++
        return { wx, wy }
      }
      const rectFilled = (x: number, y: number, wx: number, wy: number) => {
        for (let j = -wy; j <= wy; j += 2)
          for (let i = -wx; i <= wx; i += 2) if (!filled(x + i, y + j)) return false
        return true
      }
      const ERODE = 3
      let best: {
        x: number
        y: number
        s: number
        score: number
        wx: number
        wy: number
      } | null = null
      // search the whole word for the thickest stroke to zoom into
      const windows: Array<[number, number]> = [[40 * K, 1180 * K]]
      for (const [wx0, wx1] of windows) {
        for (let y = (BASE_Y - 84) * K; y <= (BASE_Y + 6) * K; y += 3) {
          for (
            let x = Math.max(40 * K, Math.floor(wx0));
            x <= Math.min(1180 * K, Math.ceil(wx1));
            x += 3
          ) {
            if (!filled(x, y)) continue
            const { wx, wy } = runs(x, y)
            const ex = wx - ERODE
            const ey = wy - ERODE
            if (ex < 4 || ey < 4) continue
            if (!rectFilled(x, y, wx, wy)) continue
            const s = Math.max((610 * K) / ex, (320 * K) / ey)
            const score = -s * 2 - Math.hypot(x - 610 * K, y - (BASE_Y - 30) * K)
            if (!best || score > best.score) best = { x, y, s, score, wx, wy }
          }
        }
        if (best) break
      }
      const hit = best as {
        x: number
        y: number
        s: number
        score: number
        wx: number
        wy: number
      } | null
      if (!hit) return
      const s0 = Math.min(300, Math.max(24, hit.s * 1.3))
      setAnchor({
        x: hit.x / K,
        y: hit.y / K,
        s0,
        hw: Math.max(1, hit.wx - 2) / K,
        hh: Math.max(1, hit.wy - 2) / K,
      })
    }
    return () => {
      cancelled = true
    }
  }, [fontSize])
  const stemW = anchor?.hw ?? 0
  const stemH = anchor?.hh ?? 0
  useEffect(() => {
    geomRef.current = { pxPerVb, fontSize, reduced, anchor }
    geomStem.current = { w: stemW, h: stemH }
    applyFrame(true)
  }, [pxPerVb, fontSize, reduced, anchor, coarse.active, stemW, stemH])
  useEffect(() => {
    let dead = false
    document.fonts?.ready?.then(() => {
      if (!dead) applyFrame(true)
    })
    return () => {
      dead = true
    }
  }, [])
  if (mobLayout) {
    const EASE = 'cubic-bezier(0.645, 0.045, 0.355, 1)'
    const fadeUp = (on: boolean, delayMs = 0) => ({
      opacity: on ? 1 : 0,
      transform: on ? 'none' : 'translateY(14px)',
      transition: `opacity 0.8s ${EASE} ${delayMs}ms, transform 0.8s ${EASE} ${delayMs}ms`,
    })
    const focusIn = (on: boolean, delayMs = 0) => ({
      opacity: on ? 1 : 0,
      transform: on ? 'none' : 'scale(0.94)',
      filter: on ? 'blur(0px)' : 'blur(14px)',
      transition: `opacity 1s ${EASE} ${delayMs}ms, transform 1s ${EASE} ${delayMs}ms, filter 1s ${EASE} ${delayMs}ms`,
    })
    return (
      <div ref={wrapRef} id="perehod" className="relative h-[340vh]" aria-label={STATEMENT}>
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              pointerEvents: mobStage >= 1 ? 'none' : 'auto',
              opacity: mobStage >= 1 ? 0 : 1,
              transform: mobStage >= 1 ? 'scale(0.95)' : 'none',
              filter: mobStage >= 1 ? 'blur(10px)' : 'none',
              transition: `opacity 0.9s ${EASE}, transform 0.9s ${EASE}, filter 0.9s ${EASE}`,
            }}
          >
            <DirectorTimelapse
              running={timelapseOn && !reduced && mobStage < 2}
              initial={ether}
              theme="dark"
              onDayTotals={setDayTotals}
              accent={etherAccent}
              serveMode={etherMode}
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0 bg-[#000000]"
            style={{
              opacity: mobStage >= 1 ? 1 : 0,
              transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.6, 1)',
            }}
            aria-hidden
          />
          <div
            className="absolute inset-x-0 top-[38svh] px-5 text-center"
            style={{
              transform: `translateY(${mobStage >= 4 ? -190 : mobStage >= 2 ? -120 : 0}px)`,
              transition: `transform 0.9s ${EASE}`,
            }}
          >
            <h2
              className="mx-auto max-w-[640px] text-[34px] font-bold leading-[1.05] tracking-tight"
              style={{ ...gradText, ...focusIn(mobStage >= 1, 350) }}
            >
              {STATEMENT}
            </h2>
            <div
              className="mx-auto mt-3 max-w-[640px] text-[28px] font-bold leading-[1.1] tracking-tight"
              style={{ ...gradText, ...focusIn(mobStage >= 1, 650) }}
            >
              A machine day in one minute.
            </div>
            <div className="mt-12 grid">
              <p
                className="col-start-1 row-start-1 mx-auto max-w-[840px] self-center text-[17px] font-bold leading-[1.2]"
                style={{ color: '#86868B', ...fadeUp(mobStage === 2) }}
              >
                This is the real pipeline over yesterday: the machine found, the editor picked, the
                stories went out to the site.{' '}
                <span className="text-white">Time is compressed. The work is real.</span>
              </p>
              <div
                className="col-start-1 row-start-1 mx-auto max-w-[600px] self-center text-[22px] font-bold leading-[1.125]"
                style={{ ...gradText, ...fadeUp(mobStage >= 3) }}
              >
                Yesterday the machine found {fmtInt(dayTotals?.found)}{' '}
                {plural(dayTotals?.found ?? 0, 'story', 'stories', 'stories')}, and the site{' '}
                {plural(dayTotals?.served ?? 0, 'got', 'got', 'got')}
                {'\u00A0'}
                {fmtInt(dayTotals?.served)}.
              </div>
            </div>
            <p
              className="mx-auto mt-10 max-w-[840px] text-[17px] font-bold leading-[1.2]"
              style={{ color: '#86868B', ...fadeUp(mobStage >= 4) }}
            >
              Between “found” and “on the site” stands an editor: most of the raw material goes to
              the trash, and every rejection has a recorded reason.{' '}
              <span className="text-white">
                {pages ? (
                  <>That is how this entire site was built: more than {fmtInt(pages)} pages.</>
                ) : (
                  'That is how this entire site was built.'
                )}
              </span>
            </p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div ref={wrapRef} id="perehod" className="relative h-[560vh]" aria-label={STATEMENT}>
      <div
        ref={stageRef}
        className="sticky top-0 h-screen overflow-hidden pb-[var(--sticky-cta-h,0px)]"
      >
        <div
          ref={etherWrapRef}
          className="absolute inset-0"
          style={{ pointerEvents: coarse.masked ? 'none' : 'auto' }}
        >
          <DirectorTimelapse
            running={timelapseOn && !reduced}
            initial={ether}
            theme="dark"
            onDayTotals={setDayTotals}
            accent={etherAccent}
            serveMode={etherMode}
          />
        </div>
        {coarse.active ? (
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ opacity: 0, transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.6, 1)' }}
            aria-hidden
          />
        ) : null}
        {coarse.active ? (
          <svg
            viewBox="0 0 1220 640"
            preserveAspectRatio="xMidYMid slice"
            className="pointer-events-none absolute inset-0 h-full w-full"
            role="img"
          >
            <defs>
              <linearGradient id="stmt-fill" x1="0" y1="0" x2="1" y2="0">
                {FILL_STOPS.map(([off, col]) => (
                  <stop key={off} offset={off} stopColor={col} />
                ))}
              </linearGradient>
            </defs>
            <g ref={fillGRef}>
              <g>
                <text
                  ref={fillTextRef}
                  x="610"
                  y={BASE_Y}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight="700"
                  letterSpacing="-0.025em"
                  fill="url(#stmt-fill)"
                  style={{ fontFamily: 'inherit', opacity: 0 }}
                >
                  {STATEMENT}
                </text>
              </g>
            </g>
          </svg>
        ) : null}
        <div
          ref={outroWrapRef}
          className="pointer-events-none absolute inset-x-0 top-[54%] z-10 px-5 text-center"
          style={{ opacity: 0 }}
        >
          <div
            ref={punchRef}
            className="mx-auto mt-2.5 max-w-[1200px] text-[34px] font-bold leading-[1.05] tracking-tight min-[760px]:text-[52px]"
            style={{ opacity: 0, ...gradText }}
          >
            A machine day in one minute.
          </div>
          <div className="mt-[60px] grid">
            <p
              className="col-start-1 row-start-1 mx-auto max-w-[840px] self-center text-[17px] font-bold leading-[1.2] min-[760px]:text-[21px]"
              ref={copy1Ref}
              style={{ opacity: 0, color: '#86868B' }}
            >
              This is the real pipeline over yesterday: the machine found, the editor picked, the
              stories went out to the site.{' '}
              <span className="text-white">Time is compressed. The work is real.</span>
            </p>
            <div
              ref={factRef}
              className="col-start-1 row-start-1 mx-auto max-w-[600px] self-center text-[22px] font-bold leading-[1.125] min-[760px]:text-[32px]"
              style={{ opacity: 0, ...gradText }}
            >
              Yesterday the machine found {fmtInt(dayTotals?.found)}{' '}
              {plural(dayTotals?.found ?? 0, 'story', 'stories', 'stories')}, and the site{' '}
              {plural(dayTotals?.served ?? 0, 'got', 'got', 'got')} {fmtInt(dayTotals?.served)}.
            </div>
          </div>
          <p
            className="mx-auto mt-[60px] max-w-[840px] text-[17px] font-bold leading-[1.2] min-[760px]:text-[21px]"
            ref={para2Ref}
            style={{ opacity: 0, color: '#86868B' }}
          >
            Between “found” and “on the site” stands an editor: most of the raw material goes to the
            trash, and every rejection has a recorded reason.{' '}
            <span className="text-white">
              {pages ? (
                <>That is how this entire site was built: more than {fmtInt(pages)} pages.</>
              ) : (
                'That is how this entire site was built.'
              )}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

function PageProgress() {
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = 0
      const el = barRef.current
      if (!el) return
      const doc = document.documentElement
      const total = doc.scrollHeight - window.innerHeight
      const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0
      el.style.transform = `scaleX(${p})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div
      ref={barRef}
      aria-hidden
      className="fixed inset-x-0 top-0 z-[210] h-[2px] origin-left"
      style={{ background: AMBER, transform: 'scaleX(0)' }}
    />
  )
}

function useTerminalRows(count = 5): Array<[string, string, string, string]> {
  const { commits } = useMachine()
  return useMemo(
    () =>
      commits
        .filter((c) => c.subject)
        .slice(0, 16)
        .map((c): [string, string, string, string] => {
          const at = new Date(c.at)
          const t = `${at.toLocaleDateString(INTL_LOCALE, {
            day: '2-digit',
            month: '2-digit',
            timeZone: siteConfig.timeZone,
          })} ${at.toLocaleTimeString(INTL_LOCALE, {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: siteConfig.timeZone,
          })}`
          const churn = `+${c.additions}${c.deletions ? `/−${c.deletions}` : ''}`
          return [t, c.zone, c.subject, churn]
        })
        .reverse()
        .slice(-count),
    [commits, count]
  )
}

function Terminal({
  fade = '#000000',
  size = 'default',
  count = 5,
}: {
  fade?: string
  size?: 'default' | 'compact' | 'window'
  count?: number
}) {
  const rows = useTerminalRows(count)
  const compact = size === 'compact'
  const win = size === 'window'
  // reduced-motion
  return (
    <div
      className={
        win
          ? 'relative overflow-hidden text-[12px] leading-[1.45]'
          : compact
            ? 'relative overflow-hidden text-[11.5px] leading-[1.5] min-[760px]:text-[12px]'
            : 'relative overflow-hidden text-[11.5px] leading-[1.9] min-[760px]:text-[12.5px]'
      }
      style={{ fontFamily: 'var(--font-jbmono), ui-monospace, SFMono-Regular, monospace' }}
    >
      <style>{`
        @keyframes term-cursor { 0%, 54% { opacity: 1; } 55%, 100% { opacity: 0; } }
        .term-cursor { animation: term-cursor 1.1s step-end infinite; }
        @media (prefers-reduced-motion: reduce) { .term-cursor { animation: none; } }
      `}</style>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8"
        style={{ background: `linear-gradient(to bottom, ${fade}, transparent)` }}
      />
      {rows.map(([t, kind, subj, churn], i) => (
        <div
          key={`${i}-${t}-${subj}`}
          className={`overflow-hidden whitespace-nowrap ${
            i === rows.length - 1
              ? compact
                ? 'text-white/70'
                : 'text-white/90'
              : win
                ? 'text-white/70'
                : compact
                  ? 'text-white/35'
                  : 'text-white/45'
          } ${
            win && i < rows.length - 7
              ? 'hidden min-[1110px]:block'
              : i === 0
                ? 'hidden min-[760px]:block'
                : ''
          }`}
          style={
            win && rows.length > 1
              ? { opacity: 1 - ((rows.length - 1 - i) * 0.65) / (rows.length - 1) }
              : undefined
          }
        >
          <span
            style={
              i === rows.length - 1
                ? { color: compact ? 'rgba(255,255,255,0.7)' : win ? '#28C840' : AMBER }
                : { color: compact ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.4)' }
            }
          >
            {t}
          </span>
          <span className="text-white/30"> · </span>
          {zoneLabel(kind)}
          <span className="text-white/30"> · </span>
          {subj}
          {churn ? <span className="text-white/30"> · {churn}</span> : null}
        </div>
      ))}
      <div aria-hidden>
        <span style={{ color: win ? '#28C840' : 'rgba(255,255,255,0.35)' }}>❯</span>{' '}
        <span className="term-cursor font-bold" style={{ color: win ? '#FFFFFF' : AMBER }}>
          _
        </span>
      </div>
    </div>
  )
}

function TerminalSplitWindow({
  total,
  days,
  last,
  lastWord,
  everyMin,
  nextMin,
}: {
  total: number
  days: number
  last: number
  lastWord: string
  everyMin: number
  nextMin: number
}) {
  const { startDay } = useMachine()
  const mono = { fontFamily: 'var(--font-jbmono), ui-monospace, SFMono-Regular, monospace' }
  return (
    <div
      className="overflow-hidden rounded-[14px] border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      style={{ background: '#222222' }}
    >
      <div className="relative flex h-9 items-center border-b border-white/10 px-3.5">
        <span className="pointer-events-none absolute inset-x-0 text-center text-[13px] font-medium leading-[19px] text-white/60">
          live
        </span>
      </div>
      <div className="grid min-[1110px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-[1110px]:min-h-0">
          <div
            className="flex flex-col px-4 pb-3 pt-3 text-[12px] leading-[1.45] text-white/85 min-[1110px]:absolute min-[1110px]:inset-0"
            style={mono}
          >
            <div className="whitespace-nowrap text-white/45">
              # git log · {NUMBER_RU.format(total)} commits over {days}{' '}
              {plural(days, 'day', 'days', 'days')} · next one in ~{nextMin} min
            </div>
            <div className="relative mt-2 flex min-h-0 grow flex-col justify-end overflow-hidden">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-10 min-[1110px]:block"
                style={{ background: 'linear-gradient(to bottom, #222222, transparent)' }}
              />
              <div className="shrink-0">
                <Terminal fade="transparent" size="window" count={14} />
              </div>
            </div>
          </div>
        </div>
        <div
          className="border-t border-white/10 px-4 pb-4 pt-3 text-[12px] leading-[1.45] text-white/85 min-[1110px]:border-l min-[1110px]:border-t-0"
          style={mono}
        >
          <div className="whitespace-nowrap text-white/45"># watch · machine</div>
          <div className="mt-3 grid grid-cols-3 gap-4 min-[1110px]:grid-cols-1 min-[1110px]:gap-4">
            <div>
              <div
                className="tabular-nums text-[28px] font-bold leading-none min-[760px]:text-[34px]"
                style={{ color: AMBER }}
              >
                <HeroCounter target={total} />
              </div>
              <div className="mt-1.5 text-white/45">
                commits over {days} {plural(days, 'day', 'days', 'days')}
              </div>
            </div>
            <div>
              <div className="tabular-nums text-[28px] font-bold leading-none text-white min-[760px]:text-[34px]">
                {last}
              </div>
              <div className="mt-1.5 text-white/45">commits {lastWord}</div>
            </div>
            <div>
              <div className="tabular-nums text-[28px] font-bold leading-none text-white min-[760px]:text-[34px]">
                ~{everyMin} min
              </div>
              <div className="mt-1.5 text-white/45">
                between commits since {fmtStartDay(startDay, true)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AfterDune({
  total,
  days,
  last,
  lastWord,
}: {
  total: number
  days: number
  last: number
  lastWord: string
}) {
  const { startDay, endDay } = useMachine()
  const secPer = secPerCommit(total, startDay, endDay)
  const everyMin = Math.max(1, Math.round(secPer / 60))
  // "next one in N min" depends on the clock: computed after mount so the
  // server HTML and the first client render match.
  const [nextMin, setNextMin] = useState(everyMin)
  useEffect(() => {
    const tick = () => setNextMin(tempoOf(secPer).nextMin)
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [secPer])
  return (
    <section className="relative px-5 pb-16 pt-16 min-[760px]:px-0 min-[760px]:pb-28 min-[760px]:pt-24">
      <Col>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums text-[12px] text-white/50">
          <span className="inline-flex items-center gap-2 font-bold text-white">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ background: '#30D158' }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: '#30D158' }}
              />
            </span>
            live
          </span>
        </div>
        <H2 className="mt-4">The machine keeps working while you read</H2>
        <div className="mt-4">
          <LiveLine total={total} />
        </div>
      </Col>
      <div className="mt-10">
        <TerminalSplitWindow
          total={total}
          days={days}
          last={last}
          lastWord={lastWord}
          everyMin={everyMin}
          nextMin={nextMin}
        />
      </div>
    </section>
  )
}

function LiveLine({ total }: { total: number }) {
  const { startDay, endDay } = useMachine()
  const [sec, setSec] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  const secPer = secPerCommit(total, startDay, endDay)
  const everyMin = Math.max(1, Math.round(secPer / 60))
  const next = secPer - (sec % secPer)
  const nmm = Math.floor(next / 60)
  return (
    <p className="tabular-nums text-[14px] text-white/60 min-[760px]:text-[15px]">
      you have been on this page{' '}
      <span className="text-white">
        {mm}:{ss}
      </span>{' '}
      · machine pace since {fmtStartDay(startDay)}: a commit every{' '}
      <span className="text-white">~{everyMin} min</span> · next one at this pace in{' '}
      <span className="text-white">~{nmm} min</span>
    </p>
  )
}

const REGION_COLORS: Record<string, string> = {
  docs: ZONE_COLORS.docs,
  journal: ZONE_COLORS.journal,
  front: ZONE_COLORS.front,
  back: ZONE_COLORS.back,
  admin: ZONE_COLORS.admin,
  'CI/CD': ZONE_COLORS.ci,
}
const MAP_REGIONS: Array<{ id: string; n: number; sub: string; darkText?: boolean }> = [
  { id: 'docs', n: 1678, sub: 'the specs the machine runs on' },
  { id: 'journal', n: 1010, sub: 'records of decisions and reviews', darkText: true },
  { id: 'front', n: 711, sub: 'public pages' },
  { id: 'back', n: 524, sub: 'pipeline and database', darkText: true },
  { id: 'admin', n: 185, sub: 'mission control' },
  { id: 'CI/CD', n: 68, sub: 'our own build factory' },
]

const MAP_W = 240
const MAP_H = 100

function mapCells(regions: typeof MAP_REGIONS) {
  return squarify(
    regions.map((r) => ({ id: r.id, value: r.n })),
    0,
    0,
    MAP_W,
    MAP_H
  )
}

const MAP_STORIES: Record<string, string> = {
  docs: 'Canons and specs: writing rules, design patterns, pipeline diagrams. The machine writes the rule down first, then executes it.',
  journal: 'journal.md in every zone: reviews, decisions with reasons, rejected branches.',
  front: 'Public pages: the homepage, the AI map, the atlas, this very page.',
  back: 'Pipeline and database: cron ticks, webhooks, event sourcing - our own hardware.',
  admin: 'Mission control: the screens a human watches the machine from.',
  'CI/CD': "The machine's plumbing and its own build factory: CI/CD on our own hardware.",
}

const MAP_TEASERS: Record<string, string> = {
  docs: 'top living canons · open file',
  journal: '1,268 decisions · journal page',
  front: '328 screens · brand atlas grid',
  back: 'hardware and runtime · cron schedule',
  admin: 'glass law · atlas of screens',
  'CI/CD': 'your own CI for $0',
}

function MachineMap({
  regions = MAP_REGIONS,
  onSelect,
  dimmed = false,
  litIds = null,
  hoverReveal = false,
  entryFx = [],
  fxTick = 0,
  cellsOverride,
}: {
  regions?: Array<{
    id: string
    n: number
    sub: string
    darkText?: boolean
    color?: string
    stroke?: string
  }>
  onSelect?: (id: string) => void
  dimmed?: boolean
  litIds?: string[] | null
  hoverReveal?: boolean
  entryFx?: string[]
  cellsOverride?: Array<{ id: string; x: number; y: number; w: number; h: number }>
  fxTick?: number
}) {
  const cells = cellsOverride ?? mapCells(regions)
  const byId = new Map(regions.map((r) => [r.id, r]))
  const Tag = onSelect ? 'button' : 'div'
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [boxH, setBoxH] = useState(0)
  const [boxW, setBoxW] = useState(0)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const upd = () => {
      setBoxH(el.clientHeight)
      setBoxW(el.clientWidth)
    }
    upd()
    const ro = new ResizeObserver(upd)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div
      ref={boxRef}
      className="relative w-full"
      style={{
        aspectRatio: '240 / 100',
        maxHeight: 'var(--map-max-h, none)',
        padding: 2,
        opacity: dimmed ? 0.25 : 1,
        transition: 'opacity 500ms cubic-bezier(0.25,0.1,0.25,1)',
      }}
    >
      {cells.map((cell, i) => {
        const r = byId.get(cell.id)
        if (!r) return null
        const unlit = litIds !== null && !litIds.includes(r.id)
        const tilePx = boxH > 0 ? (cell.h / MAP_H) * boxH - 4 : 0
        const hideSub = tilePx > 0 && tilePx < 64
        const tileWpx = boxW > 0 ? (cell.w / MAP_W) * boxW - 4 : 0
        const tight = tileWpx > 0 && tileWpx < 100
        const numOnly = (tilePx > 0 && tilePx < 40) || (tileWpx > 0 && tileWpx < 48)
        return (
          <div
            key={`${cell.id}-${fxTick}`}
            className="absolute"
            style={{
              left: `${(cell.x / MAP_W) * 100}%`,
              top: `${(cell.y / MAP_H) * 100}%`,
              width: `${(cell.w / MAP_W) * 100}%`,
              height: `${(cell.h / MAP_H) * 100}%`,
              padding: 2,
              animation:
                fxTick && entryFx.length
                  ? entryFx
                      .filter((f) => f !== 'tileshine')
                      .map((f) =>
                        f === 'cascade'
                          ? `map-tile-flash 0.55s cubic-bezier(0.25,0.1,0.25,1) ${i * 70}ms 1 both`
                          : f === 'shake'
                            ? `map-tile-shake 0.42s ease ${i * 45}ms 1 both`
                            : `map-tile-breath 0.6s ease ${i * 60}ms 1 both`
                      )
                      .join(', ') || undefined
                  : undefined,
            }}
          >
            <Tag
              type={onSelect ? 'button' : undefined}
              onClick={onSelect ? () => onSelect(r.id) : undefined}
              title={`${zoneLabel(r.id)} — ${r.n.toLocaleString(INTL_LOCALE)} commits`}
              className={`group relative flex h-full w-full flex-col overflow-hidden rounded text-left ${numOnly ? 'justify-center p-1' : tight ? 'justify-between p-1.5' : 'justify-between p-2 min-[760px]:p-3'} ${onSelect ? 'cursor-pointer transition-[filter] duration-300 hover:brightness-110' : ''}`}
              style={{
                backgroundColor: r.color ?? REGION_COLORS[r.id],
                color: r.darkText ? '#000000' : '#FFFFFF',
                opacity: unlit ? 0.13 : 1,
                boxShadow: r.stroke ? `inset 0 0 0 1px ${r.stroke}` : undefined,
                transition:
                  'opacity 600ms cubic-bezier(0.25,0.1,0.25,1), background-color 500ms cubic-bezier(0.25,0.1,0.25,1), color 500ms',
              }}
            >
              {numOnly ? null : (
                <div className="min-w-0">
                  <div
                    className={`truncate font-bold leading-tight ${tight ? 'text-[11px]' : 'text-[13px] min-[760px]:text-[17px]'}`}
                  >
                    {zoneLabel(r.id)}
                  </div>
                  {hideSub || tight ? null : (
                    <div className="truncate text-[11px] leading-tight opacity-75 min-[760px]:text-[12.5px]">
                      {r.sub}
                    </div>
                  )}
                </div>
              )}
              <div
                className={`tabular-nums font-bold leading-none ${numOnly || tight ? 'text-[13px]' : 'text-[13px] min-[760px]:text-[19px]'}`}
              >
                {r.n.toLocaleString(INTL_LOCALE)}
              </div>
              {fxTick && entryFx.includes('tileshine') ? (
                <span
                  className="pointer-events-none absolute inset-y-0 w-[45%] overflow-hidden"
                  aria-hidden
                >
                  <span
                    className="map-tile-shine absolute inset-0"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                </span>
              ) : null}
              {hoverReveal && onSelect && MAP_TEASERS[r.id] ? (
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 truncate px-2 pb-2 pt-1 tabular-nums text-[11px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 min-[760px]:px-3 min-[760px]:pb-3 min-[760px]:text-[12px]"
                  style={{ backgroundColor: r.color ?? REGION_COLORS[r.id] }}
                >
                  open — {MAP_TEASERS[r.id]}
                </span>
              ) : null}
            </Tag>
          </div>
        )
      })}
    </div>
  )
}

const shade = (dark: boolean, a: number) => (dark ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`)

function DiveDocs({ dark }: { dark: boolean }) {
  const max = DOCS_TOP[0]?.n ?? 1
  return (
    <div className="flex h-full flex-col">
      <p className="tabular-nums text-[11px] opacity-60">
        the canon breathes through replacement: top files by number of edits since July 2
      </p>
      <div className="mt-2 flex min-h-0 grow gap-5">
        <div className="flex min-w-0 grow flex-col justify-between gap-1">
          {DOCS_TOP.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 tabular-nums text-[11px] min-[760px]:text-[12.5px]"
            >
              <span className="w-[52%] truncate min-[900px]:w-[56%]">{f.label}</span>
              <span
                className="relative h-[10px] grow overflow-hidden rounded-sm"
                style={{ backgroundColor: shade(dark, 0.12) }}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-sm"
                  style={{ width: `${(f.n / max) * 100}%`, backgroundColor: shade(dark, 0.38) }}
                />
              </span>
              <span className="w-9 text-right font-bold">{f.n}</span>
            </div>
          ))}
        </div>
        <div
          className="hidden w-[46%] shrink-0 flex-col overflow-hidden rounded-md min-[900px]:flex"
          style={{ backgroundColor: shade(dark, 0.1) }}
        >
          <div
            className="flex items-baseline gap-2 px-3 py-1.5 tabular-nums text-[10.5px]"
            style={{ backgroundColor: shade(dark, 0.12) }}
          >
            <span className="truncate font-bold" title={DOCS_FILE.path}>
              {DOCS_FILE.path}
            </span>
            <span className="shrink-0 opacity-70">
              · {DOCS_FILE.edits} edits · in full, as in git
            </span>
          </div>
          <pre
            className="min-h-0 grow overflow-y-auto whitespace-pre-wrap px-3 py-2 tabular-nums text-[10.5px] leading-[1.55] min-[1100px]:text-[11px]"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: `${shade(dark, 0.35)} transparent`,
            }}
          >
            {DOCS_FILE.text}
          </pre>
        </div>
      </div>
      <p className="mt-2 tabular-nums text-[11px] opacity-60">
        an edit to the canon without code breaks CI — docs here are executed, not stored
      </p>
    </div>
  )
}

function DiveJournal({ dark }: { dark: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 grow gap-5">
        <div className="flex min-w-0 grow flex-col">
          <div className="text-[26px] font-bold leading-none min-[760px]:text-[34px]">
            {DECISIONS_TOTAL.toLocaleString(INTL_LOCALE)} decisions
          </div>
          <p className="mt-1 tabular-nums text-[11px] opacity-60">
            each one is a ⚖️ entry: what we decided · what we rejected · why. Where decisions happen
            most often:
          </p>
          <div className="mt-2 flex min-h-0 grow flex-col justify-between gap-1">
            {DECISIONS_TOP.map((z) => (
              <div
                key={z.label}
                className="flex items-center gap-2 tabular-nums text-[11px] min-[760px]:text-[12px]"
              >
                <span className="w-[62%] truncate">{z.label}</span>
                <span
                  className="relative h-[10px] grow overflow-hidden rounded-sm"
                  style={{ backgroundColor: shade(dark, 0.12) }}
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-sm"
                    style={{
                      width: `${(z.n / (DECISIONS_TOP[0]?.n ?? 1)) * 100}%`,
                      backgroundColor: shade(dark, 0.38),
                    }}
                  />
                </span>
                <span className="w-9 text-right font-bold">{z.n}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          className="hidden w-[46%] shrink-0 flex-col overflow-hidden rounded-md min-[900px]:flex"
          style={{ backgroundColor: shade(dark, 0.1) }}
        >
          <div
            className="flex items-baseline gap-2 px-3 py-1.5 tabular-nums text-[10.5px]"
            style={{ backgroundColor: shade(dark, 0.12) }}
          >
            <span className="truncate font-bold" title={JOURNAL_ENTRY.path}>
              {JOURNAL_ENTRY.path}
            </span>
            <span className="shrink-0 opacity-70">· the entry this map was built from</span>
          </div>
          <div
            className="min-h-0 grow overflow-y-auto px-3 py-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: `${shade(dark, 0.35)} transparent` }}
          >
            <div className="tabular-nums text-[11px] font-bold">
              ⚖️ {JOURNAL_ENTRY.slug} · {JOURNAL_ENTRY.date} · {JOURNAL_ENTRY.model}
            </div>
            <div className="mt-0.5 text-[13px] font-bold leading-snug">{JOURNAL_ENTRY.title}</div>
            <div className="mt-2 tabular-nums text-[10.5px] font-bold opacity-70">Decision.</div>
            <p className="text-[11.5px] leading-relaxed">{JOURNAL_ENTRY.decision}</p>
            <div className="mt-2 tabular-nums text-[10.5px] font-bold opacity-70">Rejected.</div>
            <p className="text-[11.5px] leading-relaxed">{JOURNAL_ENTRY.rejected}</p>
            <div className="mt-2 tabular-nums text-[10.5px] font-bold opacity-70">
              Owner&apos;s words.
            </div>
            <p
              className="rounded px-2 py-1.5 text-[11.5px] italic leading-relaxed"
              style={{ backgroundColor: shade(dark, 0.08) }}
            >
              «{JOURNAL_ENTRY.ownerWords}»
            </p>
          </div>
        </div>
      </div>
      <p className="mt-2 tabular-nums text-[11px] opacity-60">
        a decision can be reopened — but you will have to argue with the recorded reason
      </p>
    </div>
  )
}

function DiveFrontend({
  dark,
  gridOn,
  onGrid,
}: {
  dark: boolean
  gridOn: boolean
  onGrid: (on: boolean) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <p className="tabular-nums text-[11px] opacity-60">
        328 screens from git: the age of each is read from its first commit
      </p>
      <div className="mt-2 flex min-h-0 grow flex-col justify-center gap-3">
        {SCREEN_WORLDS.map((w) => (
          <div key={w.id}>
            <div className="flex items-baseline gap-2 tabular-nums text-[11px] min-[760px]:text-[12px]">
              <span className="font-bold">{w.label}</span>
              <span className="opacity-70">{w.n}</span>
              {w.id === 'poly' ? <span className="opacity-70">· You are here — /open</span> : null}
            </div>
            <div className="mt-1 flex flex-wrap gap-[3px]">
              {Array.from({ length: w.n }, (_, i) => (
                <span
                  key={i}
                  className="h-[5px] w-[5px] rounded-[1px]"
                  style={{
                    backgroundColor:
                      w.id === 'poly' && i === w.n - 1
                        ? dark
                          ? '#000000'
                          : '#FFFFFF'
                        : shade(dark, 0.32),
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onGrid(!gridOn)}
        aria-pressed={gridOn}
        className="mt-2 self-start rounded-full px-4 py-2 tabular-nums text-[12px] font-bold transition-opacity hover:opacity-80"
        style={
          gridOn
            ? { backgroundColor: '#F0F0F0', color: '#111111' }
            : { backgroundColor: shade(dark, 0.16) }
        }
      >
        {gridOn
          ? '⌖ brand atlas grid · on — goes off with the section'
          : '⌖ brand atlas grid — blueprint of the whole page'}
      </button>
    </div>
  )
}

function DiveBackend({ dark }: { dark: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 grow gap-5">
        <div className="flex min-w-0 grow flex-col gap-4">
          {BACKEND_TIERS.map((tier) => (
            <div key={tier.t}>
              <div className="tabular-nums text-[11px] font-bold min-[760px]:text-[12.5px]">
                {tier.t}
              </div>
              <p className="mt-0.5 text-[12px] leading-snug opacity-80 min-[760px]:text-[13px]">
                {tier.body}
              </p>
            </div>
          ))}
        </div>
        <div
          className="hidden w-[40%] shrink-0 flex-col overflow-hidden rounded-md min-[900px]:flex"
          style={{ backgroundColor: shade(dark, 0.1) }}
        >
          <div
            className="px-3 py-1.5 tabular-nums text-[10.5px] font-bold"
            style={{ backgroundColor: shade(dark, 0.12) }}
          >
            machine schedule · launchd on its own nodes
          </div>
          <div className="flex min-h-0 grow flex-col gap-2.5 px-3 py-2.5">
            {BACKEND_CRONS.map((c) => (
              <div key={c.name} className="flex items-baseline gap-2 tabular-nums text-[11px]">
                <span className="truncate">{c.name}</span>
                <span
                  className="grow border-b border-dotted opacity-40"
                  style={{ borderColor: 'currentcolor' }}
                />
                <span className="shrink-0 font-bold">{c.every}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 tabular-nums text-[11px] opacity-60">
        the machine runs without a human: crons fire on their own, watchdogs heal on their own
      </p>
    </div>
  )
}

function DiveAdmin({ dark }: { dark: boolean }) {
  const max = ADMIN_ATLAS[0]?.n ?? 1
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 grow gap-5">
        <div className="flex min-w-0 grow flex-col gap-4">
          {ADMIN_LAW.map((f) => (
            <div key={f.t}>
              <div className="tabular-nums text-[11px] font-bold min-[760px]:text-[12.5px]">
                {f.t}
              </div>
              <p className="mt-0.5 text-[12px] leading-snug opacity-80 min-[760px]:text-[13px]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
        <div
          className="hidden w-[46%] shrink-0 flex-col overflow-hidden rounded-md min-[900px]:flex"
          style={{ backgroundColor: shade(dark, 0.1) }}
        >
          <div
            className="px-3 py-1.5 tabular-nums text-[10.5px] font-bold"
            style={{ backgroundColor: shade(dark, 0.12) }}
          >
            atlas of glass · {ADMIN_TOTAL} mission control screens · snapshot 26.08
          </div>
          <div className="flex min-h-0 grow flex-col gap-2.5 px-3 py-2.5">
            {ADMIN_ATLAS.map((z) => (
              <div key={z.label} className="flex items-center gap-2 tabular-nums text-[11px]">
                <span className="w-[62%] truncate">{z.label}</span>
                <span
                  className="relative h-[9px] grow overflow-hidden rounded-sm"
                  style={{ backgroundColor: shade(dark, 0.14) }}
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-sm"
                    style={{ width: `${(z.n / max) * 100}%`, backgroundColor: shade(dark, 0.42) }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right font-bold">{z.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 tabular-nums text-[11px] opacity-60">
        glass is not a dashboard for the sake of a dashboard: without it a loop is not allowed into
        production
      </p>
    </div>
  )
}

function DiveMisc({ dark }: { dark: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 grow gap-5">
        <div className="flex min-w-0 grow flex-col gap-4">
          {CI_FACTS.map((f) => (
            <div key={f.t}>
              <div className="tabular-nums text-[11px] font-bold min-[760px]:text-[12.5px]">
                {f.t}
              </div>
              <p className="mt-0.5 text-[12px] leading-snug opacity-80 min-[760px]:text-[13px]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
        <div
          className="hidden w-[40%] shrink-0 flex-col overflow-hidden rounded-md min-[900px]:flex"
          style={{ backgroundColor: shade(dark, 0.1) }}
        >
          <div
            className="px-3 py-1.5 tabular-nums text-[10.5px] font-bold"
            style={{ backgroundColor: shade(dark, 0.12) }}
          >
            how code moves · 11 steps — as in the machine&apos;s AGENTS.md
          </div>
          <div className="flex min-h-0 grow flex-col gap-1.5 px-3 py-2.5">
            {AGENTS_STEPS.map((st) => (
              <div key={st.n} className="flex items-baseline gap-2 tabular-nums text-[11px]">
                <span className="w-5 shrink-0 text-right opacity-50">{st.n}</span>
                <span className="shrink-0 font-bold">{st.step}</span>
                <span className="truncate opacity-70">{st.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 tabular-nums text-[11px] opacity-60">
        the region on the map is small — but it is the one that assembles everything else
      </p>
    </div>
  )
}

function DiveBody({
  zoneId,
  dark,
  gridOn,
  onGrid,
}: {
  zoneId: string
  dark: boolean
  gridOn: boolean
  onGrid: (on: boolean) => void
}) {
  if (zoneId === 'docs') return <DiveDocs dark={dark} />
  if (zoneId === 'journal') return <DiveJournal dark={dark} />
  if (zoneId === 'front') return <DiveFrontend dark={dark} gridOn={gridOn} onGrid={onGrid} />
  if (zoneId === 'back') return <DiveBackend dark={dark} />
  if (zoneId === 'admin') return <DiveAdmin dark={dark} />
  return <DiveMisc dark={dark} />
}

function MapDive({
  gridOn,
  onGrid,
  litIds = null,
  interactive = true,
  hoverReveal = false,
  peekTick = 0,
  entryFx = [],
  fxTick = 0,
  regions = MAP_REGIONS,
  stories = MAP_STORIES,
  unit = 'of the machine',
  getTotal,
  body,
  gridZone = 'front',
  cellsOverride,
}: {
  gridOn: boolean
  onGrid: (on: boolean) => void
  litIds?: string[] | null
  interactive?: boolean
  hoverReveal?: boolean
  peekTick?: number
  entryFx?: string[]
  fxTick?: number
  regions?: Array<{
    id: string
    n: number
    sub: string
    darkText?: boolean
    color?: string
    stroke?: string
  }>
  stories?: Record<string, string>
  unit?: string
  getTotal?: (id: string) => number
  body?: (zoneId: string, dark: boolean) => React.ReactNode
  gridZone?: string | null
  cellsOverride?: Array<{ id: string; x: number; y: number; w: number; h: number }>
}) {
  const [dive, setDive] = useState<string | null>(null)
  const [full, setFull] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cells = useMemo(() => cellsOverride ?? mapCells(regions), [regions, cellsOverride])
  const totalAll = regions.reduce((s, r) => s + r.n, 0)
  const region = dive ? regions.find((r) => r.id === dive) : null
  const cell = dive ? cells.find((c) => c.id === dive) : null

  const open = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setDive(id)
    if (gridZone && id === gridZone) onGrid(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setFull(true)))
  }
  const close = () => {
    setFull(false)
    closeTimer.current = setTimeout(() => setDive(null), 560)
  }
  const switchTo = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setDive(id)
    if (gridZone && id === gridZone) onGrid(true)
    setFull(true)
  }

  useEffect(() => {
    if (!peekTick) return
    open('docs')
    const t = setTimeout(() => close(), 1100)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peekTick])

  useEffect(() => {
    if (!interactive && dive) close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive])

  useEffect(() => {
    if (dive !== 'front' && gridOn) onGrid(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dive])

  useEffect(() => {
    if (!dive) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dive])

  const zoneTotal = dive ? (getTotal ? getTotal(dive) : (MAP_DIVE[dive]?.total ?? null)) : null

  const panelRect =
    full || !cell
      ? { left: '0%', top: '0%', width: '100%', height: '100%' }
      : {
          left: `${(cell.x / MAP_W) * 100}%`,
          top: `${(cell.y / MAP_H) * 100}%`,
          width: `${(cell.w / MAP_W) * 100}%`,
          height: `${(cell.h / MAP_H) * 100}%`,
        }

  return (
    <div className="relative">
      <MachineMap
        regions={regions}
        cellsOverride={cellsOverride}
        onSelect={interactive ? open : undefined}
        dimmed={dive !== null}
        litIds={litIds}
        hoverReveal={hoverReveal && interactive}
        entryFx={entryFx}
        fxTick={fxTick}
      />
      {dive && region && zoneTotal !== null && (
        <div
          className="absolute overflow-hidden rounded"
          style={{
            ...panelRect,
            backgroundColor: region.color ?? REGION_COLORS[region.id],
            color: region.darkText ? '#000000' : '#FFFFFF',
            transition:
              'left 550ms cubic-bezier(0.25,0.1,0.25,1), top 550ms cubic-bezier(0.25,0.1,0.25,1), width 550ms cubic-bezier(0.25,0.1,0.25,1), height 550ms cubic-bezier(0.25,0.1,0.25,1), background-color 350ms',
            zIndex: 2,
          }}
        >
          <button
            type="button"
            onClick={close}
            aria-label="close region"
            className="group absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center min-[760px]:right-3 min-[760px]:top-3"
            style={{ opacity: full ? 1 : 0, transition: 'opacity 300ms 250ms' }}
          >
            <span
              className="text-[22px] font-light leading-none opacity-55 transition-[opacity,transform] duration-300 group-hover:rotate-90 group-hover:opacity-100"
              aria-hidden
            >
              ✕
            </span>
          </button>
          <div
            className="flex h-full w-full flex-col p-3 min-[760px]:p-5"
            style={{
              opacity: full ? 1 : 0,
              transition: full ? 'opacity 300ms 250ms' : 'opacity 150ms',
            }}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pr-9">
              <button
                type="button"
                onClick={close}
                className="rounded-full px-3 py-1 tabular-nums text-[12px] transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: region.darkText ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.18)',
                }}
              >
                back to the whole machine
              </button>
              <span className="text-[19px] font-bold leading-none min-[760px]:text-[24px]">
                {zoneLabel(region.id)}
              </span>
              <span className="tabular-nums text-[12px] opacity-70">
                {zoneTotal.toLocaleString(INTL_LOCALE)} commits ·{' '}
                {Math.round((zoneTotal / totalAll) * 100)}% {unit}
              </span>
            </div>
            <p className="mt-1.5 hidden max-w-[720px] text-[13px] leading-snug opacity-75 min-[760px]:block">
              {stories[region.id]}
            </p>
            <div className="relative mt-3 min-h-0 grow overflow-hidden">
              {body ? (
                body(region.id, !!region.darkText)
              ) : (
                <DiveBody
                  zoneId={region.id}
                  dark={!!region.darkText}
                  gridOn={gridOn}
                  onGrid={onGrid}
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="tabular-nums text-[11px] opacity-60">regions:</span>
              {regions.map((r) => {
                const pressed = r.id === dive
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={pressed}
                    onClick={pressed ? undefined : () => switchTo(r.id)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 tabular-nums text-[11px] ${pressed ? 'font-bold' : 'transition-opacity hover:opacity-80'}`}
                    style={{
                      backgroundColor: region.darkText
                        ? `rgba(0,0,0,${pressed ? 0.3 : 0.14})`
                        : `rgba(255,255,255,${pressed ? 0.36 : 0.18})`,
                      boxShadow: pressed
                        ? `inset 0 0 0 1.5px ${region.darkText ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.75)'}`
                        : 'none',
                      cursor: pressed ? 'default' : 'pointer',
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: r.color ?? REGION_COLORS[r.id] ?? 'rgba(255,255,255,0.5)',
                        border: `1px solid ${region.darkText ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)'}`,
                      }}
                      aria-hidden
                    />
                    {zoneLabel(r.id)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniBars({ items, dark }: { items: DiveCluster[]; dark: boolean }) {
  const max = items[0]?.n ?? 1
  return (
    <div className="flex min-h-0 grow flex-col gap-2 px-3 py-2.5">
      {items.map((f) => (
        <div key={f.label} className="flex items-center gap-2 tabular-nums text-[11px]">
          <span className="w-[58%] truncate">{f.label}</span>
          <span
            className="relative h-[9px] grow overflow-hidden rounded-sm"
            style={{ backgroundColor: shade(dark, 0.12) }}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-sm"
              style={{ width: `${(f.n / max) * 100}%`, backgroundColor: shade(dark, 0.4) }}
            />
          </span>
          <span className="w-9 shrink-0 text-right font-bold">{f.n}</span>
        </div>
      ))}
    </div>
  )
}

function BizFeedTail() {
  const { feed } = useMachine()
  const tail = useMemo(() => feedTail(feed, 7), [feed])
  if (tail.events.length === 0) return null
  return (
    <div className="flex min-h-0 grow flex-col gap-1.5 px-3 py-2.5">
      {tail.events.map((e, i) => (
        <div key={i} className="flex items-baseline gap-2 tabular-nums text-[10.5px]">
          <span className="opacity-60">
            {new Date(e.t).toLocaleTimeString(INTL_LOCALE, {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: siteConfig.timeZone,
            })}
          </span>
          <span className="shrink-0 font-bold">{e.head}</span>
          <span className="truncate opacity-70">{e.detail}</span>
        </div>
      ))}
      <div className="mt-auto tabular-nums text-[10.5px] opacity-60">
        {tail.live ? 'live store · no speed-up' : 'feed snapshot · the store is asleep'}
      </div>
    </div>
  )
}

function BizBody({ zoneId, dark }: { zoneId: string; dark: boolean }) {
  const tiers = BIZ_TIERS[zoneId] ?? []
  const win =
    zoneId === 'dev' ? (
      <>
        <div
          className="px-3 py-1.5 tabular-nums text-[10.5px] font-bold"
          style={{ backgroundColor: shade(dark, 0.12) }}
        >
          the previous map · six regions of code and rules
        </div>
        <div className="min-h-0 grow p-2" style={{ '--map-max-h': '100%' } as CSSProperties}>
          <MachineMap />
        </div>
      </>
    ) : zoneId === 'strategy' ? (
      <>
        <div
          className="px-3 py-1.5 tabular-nums text-[10.5px] font-bold"
          style={{ backgroundColor: shade(dark, 0.12) }}
        >
          top living canons · edits since July 2
        </div>
        <MiniBars items={DOCS_TOP} dark={dark} />
      </>
    ) : zoneId === 'ops' ? (
      <>
        <div
          className="px-3 py-1.5 tabular-nums text-[10.5px] font-bold"
          style={{ backgroundColor: shade(dark, 0.12) }}
        >
          {DECISIONS_TOTAL.toLocaleString(INTL_LOCALE)} decisions · where decisions happen most
          often
        </div>
        <MiniBars items={DECISIONS_TOP} dark={dark} />
      </>
    ) : zoneId === 'marketing' ? (
      <>
        <div
          className="px-3 py-1.5 tabular-nums text-[10.5px] font-bold"
          style={{ backgroundColor: shade(dark, 0.12) }}
        >
          tail of the feed · the same store that feeds the timelapse
        </div>
        <BizFeedTail />
      </>
    ) : null
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 grow flex-col gap-5 min-[900px]:flex-row">
        <div className="flex min-w-0 grow flex-col gap-4">
          {tiers.map((tier) => (
            <div key={tier.t}>
              <div className="tabular-nums text-[11px] font-bold min-[760px]:text-[12.5px]">
                {tier.t}
              </div>
              <p className="mt-0.5 max-w-[640px] text-[12px] leading-snug opacity-80 min-[760px]:text-[13px]">
                {tier.body}
              </p>
            </div>
          ))}
        </div>
        {win ? (
          <div
            className="flex w-full shrink-0 flex-col overflow-hidden rounded-md min-[900px]:w-[44%]"
            style={{ backgroundColor: shade(dark, 0.1) }}
          >
            {win}
          </div>
        ) : null}
      </div>
    </div>
  )
}
const RELEASES_PER_DAY = 27

const IDEA_P50_MIN = 25
const OPER_FX = {
  filter: 'contrast(1.08) saturate(0.82) brightness(0.94)',
  overlay: 'radial-gradient(ellipse 120% 100% at 50% 38%, rgba(0,0,0,0) 62%, rgba(0,0,0,.38) 100%)',
}

const EXEC_MULT_DEFAULT = 2
const FOCUS_H_DEFAULT = 4
const SYNC_H_DEFAULT = 1
const FLOW_EFF_DEFAULT = 50
const ABS_DAYS_DEFAULT = 42
const WORKDAYS_YEAR = 247

function DeliveryDots() {
  const W = 1000
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [s, setS] = useState(1)
  useEffect(() => {
    const calc = () => {
      const w = boxRef.current?.clientWidth ?? 0
      setS(w > 0 ? Math.max(1, Math.round((W / w) * 100) / 100) : 1)
    }
    calc()
    window.addEventListener('resize', calc, { passive: true })
    return () => window.removeEventListener('resize', calc)
  }, [])
  const narrow = s >= 1.6
  const fsHead = Math.round(12 * s)
  const fsAxis = Math.round(11 * s)
  const H = 210 + (fsHead - 12) + (fsAxis - 11)
  const PAD_T = 30 + (fsHead - 12)
  const PAD_B = 26 + (fsAxis - 11)
  const LOG_MIN = Math.log(2 / 60)
  const LOG_MAX = Math.log(52)
  const x = (h: number) =>
    ((Math.log(Math.min(Math.max(h, 2 / 60), 52)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * W
  const y = (i: number) => PAD_T + (((i * 613) % 97) / 97) * (H - PAD_T - PAD_B)
  const median = SPEED_TASKS[Math.floor(SPEED_TASKS.length / 2)]!.h
  const underHour = Math.round(
    (SPEED_TASKS.filter((t) => t.h <= 1).length / SPEED_TASKS.length) * 100
  )
  const hero = SPEED_TASKS.find((t) => t.pr === 1803)
  const fmtH = (h: number) =>
    h < 1
      ? `${Math.round(h * 60)} min`
      : h < 24
        ? `${(+h.toFixed(1)).toLocaleString(INTL_LOCALE)} h`
        : `${(+(h / 24).toFixed(1)).toLocaleString(INTL_LOCALE)} d`
  const ticks: [number, string][] = narrow
    ? [
        [15 / 60, '15 min'],
        [1, '1 hour'],
        [24, '1 day'],
      ]
    : [
        [5 / 60, '5 min'],
        [15 / 60, '15 min'],
        [1, '1 hour'],
        [6, '6 h'],
        [24, '1 day'],
        [48, 'two'],
      ]
  return (
    <div className="mt-8" ref={boxRef}>
      <div className="tabular-nums text-[12px] text-white/45">
        each dot is a task: from a chat reply to production
        {narrow ? ` · ${underHour}% within an hour` : ''}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`Delivery time of ${SPEED_TASKS.length} tasks from reply to production: median ${fmtH(median)}, ${underHour}% within an hour`}
      >
        {narrow ? null : (
          <text
            x={8}
            y={PAD_T - 2}
            fill="rgba(255,255,255,0.45)"
            fontSize={fsHead}
            fontFamily="inherit"
          >
            {underHour}% of tasks — within an hour
          </text>
        )}
        <line
          x1={0}
          y1={H - PAD_B}
          x2={W}
          y2={H - PAD_B}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />
        {ticks.map(([h, label], ti) => (
          <g key={label}>
            <line
              x1={x(h)}
              y1={H - PAD_B}
              x2={x(h)}
              y2={H - PAD_B + 4}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
            />
            <text
              x={x(h)}
              y={H - PAD_B + 6 + Math.round(fsAxis * 0.8)}
              textAnchor={ti === ticks.length - 1 ? 'end' : 'middle'}
              fill="rgba(255,255,255,0.35)"
              fontSize={fsAxis}
              fontFamily="inherit"
            >
              {label}
            </text>
          </g>
        ))}
        {SPEED_TASKS.map((t, i) =>
          t.pr === 1803 ? null : (
            <circle key={t.pr} cx={x(t.h)} cy={y(i)} r={4} fill="rgba(255,255,255,0.4)">
              <title>{`PR #${t.pr} · ${fmtH(t.h)}`}</title>
            </circle>
          )
        )}
        <line
          x1={x(median)}
          y1={PAD_T - 14}
          x2={x(median)}
          y2={H - PAD_B}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={2}
        />
        <text
          x={x(median) + 8}
          y={PAD_T - 2}
          fill="rgba(255,255,255,0.7)"
          fontSize={fsHead}
          fontWeight={700}
          fontFamily="inherit"
        >
          median {fmtH(median)}
        </text>
        {hero ? (
          <g>
            <circle
              cx={x(hero.h)}
              cy={H - PAD_B - 22}
              r={6}
              fill="#F0F0F0"
              stroke="#000000"
              strokeWidth={2}
            >
              <title>{`PR #${hero.pr} · ${fmtH(hero.h)}`}</title>
            </circle>
          </g>
        ) : null}
      </svg>
      {hero ? (
        <div className="mt-2 flex items-center gap-2 tabular-nums text-[11.5px] text-white/45">
          <span className="inline-block h-[9px] w-[9px] rounded-full border-2 border-black bg-[#F0F0F0]" />
          operator avatar — {fmtH(hero.h)} from reply to production
        </div>
      ) : null}
    </div>
  )
}

function SpeedTact({
  days,
  crew,
  onTime,
}: {
  days: string[]
  crew: number
  onTime?: (t: { teamDays: number; D: number }) => void
}) {
  const [execMult, setExecMult] = useState(EXEC_MULT_DEFAULT)
  const [focusH, setFocusH] = useState(FOCUS_H_DEFAULT)
  const [syncH, setSyncH] = useState(SYNC_H_DEFAULT)
  const [flowEff, setFlowEff] = useState(FLOW_EFF_DEFAULT)
  const [absDays, setAbsDays] = useState(ABS_DAYS_DEFAULT)
  const D = Math.max(days.length, 1)
  const c = syncH / 40
  const eff = (n: number) => Math.max(1 - c * (n - 1), 0.05)
  const mFocus = 8 / focusH
  const mFlow = 100 / flowEff
  const mAbs = WORKDAYS_YEAR / Math.max(WORKDAYS_YEAR - absDays, 60)
  const teamDaysOf = (n: number) => (D * execMult * mFocus * mFlow * mAbs) / eff(n)
  const teamDays = Math.round(teamDaysOf(crew))
  const isTuned =
    execMult !== EXEC_MULT_DEFAULT ||
    focusH !== FOCUS_H_DEFAULT ||
    syncH !== SYNC_H_DEFAULT ||
    flowEff !== FLOW_EFF_DEFAULT ||
    absDays !== ABS_DAYS_DEFAULT
  const resetTuning = () => {
    setExecMult(EXEC_MULT_DEFAULT)
    setFocusH(FOCUS_H_DEFAULT)
    setSyncH(SYNC_H_DEFAULT)
    setFlowEff(FLOW_EFF_DEFAULT)
    setAbsDays(ABS_DAYS_DEFAULT)
  }
  const multT = Math.max(Math.round(teamDays / D), 1)
  useEffect(() => {
    onTime?.({ teamDays, D })
  }, [teamDays, D, onTime])
  return (
    <section id="skorost" className="px-5 pb-4 pt-36 min-[760px]:px-0">
      <Col>
        <p className="max-w-[720px] text-[21px] leading-[1.4] text-white/45">
          Okay, cheaper. <span className="font-bold text-white">And faster?</span>
        </p>
      </Col>

      <ChaseScene
        machineDays={D}
        teamDays={teamDays}
        crew={crew}
        multT={multT}
        knobs={[
          {
            key: 'exec',
            label: `execution — ×${execMult.toLocaleString(INTL_LOCALE)} of net time`,
            min: 1,
            max: 10,
            step: 0.5,
            value: execMult,
            mul: execMult,
            set: setExecMult,
          },
          {
            key: 'focus',
            label: `focus — ${focusH.toLocaleString(INTL_LOCALE)} h out of 8`,
            min: 1,
            max: 8,
            step: 0.5,
            value: focusH,
            mul: mFocus,
            set: setFocusH,
          },
          {
            key: 'sync',
            label: `coordination — ${syncH.toLocaleString(INTL_LOCALE)} h/week per colleague`,
            min: 0.25,
            max: 3,
            step: 0.25,
            value: syncH,
            mul: 1 / eff(crew),
            set: setSyncH,
          },
          {
            key: 'flow',
            label: `in flow — ${flowEff}% of the time`,
            min: 10,
            max: 100,
            step: 5,
            value: flowEff,
            mul: mFlow,
            set: setFlowEff,
          },
          {
            key: 'abs',
            label: `absences — ${absDays} d out of ${WORKDAYS_YEAR}`,
            min: 0,
            max: 60,
            step: 2,
            value: absDays,
            mul: mAbs,
            set: setAbsDays,
          },
        ]}
        isTuned={isTuned}
        onReset={resetTuning}
      />

      <Col>
        <p className="mt-24 max-w-[720px] text-[21px] leading-[1.4] text-white/45">
          Okay, faster.{' '}
          <span className="font-bold text-white">But isn&apos;t it all neuroslop?</span>
        </p>
      </Col>
    </section>
  )
}

const REJECTED_QUOTES: Array<{ slug: string; text: string }> = [
  {
    slug: 'open-minto-canvas',
    text: 'Rejected: a second CTA path (“do it yourself, for free”) — it blurs the single target action',
  },
  {
    slug: 'open-method-frame',
    text: 'Rejected: page count as a showcase argument — “quantity can be generated in a day”',
  },
  {
    slug: 'two-motors',
    text: 'Rejected: “reader clicks” in the loop wording — that link is not automatic yet, and only what is honest goes public',
  },
]

function DecisionsLedger() {
  const series = DECISIONS_SERIES
  const total = series[series.length - 1]![1]
  const first = series[0]![1]
  const W = 640
  const H = 110
  const min = DECISIONS_BASE
  const max = total
  const x = (i: number) => (i / (series.length - 1)) * W
  const y = (v: number) => H - 8 - ((v - min) / Math.max(max - min, 1)) * (H - 16)
  const pts = series.map(([, v], i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  return (
    <div className="mt-8 border-t border-white/10 pt-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums text-[12px]">
        <span className="text-white/45">own ideas · decision log — our own court</span>
        <span className="grow" />
        <span className="text-white/35">docs:decisions · snapshot {DECISIONS_SREZ}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <div className="flex items-baseline gap-2.5">
          <span className="tabular-nums text-[26px] font-bold leading-none tracking-tight">
            {total.toLocaleString(INTL_LOCALE)}
          </span>
          <span className="text-[13px] text-[#9A9AA2]">decisions recorded, each with a reason</span>
        </div>
        <span className="tabular-nums text-[13px] text-white/45">
          ×{Math.round((total / Math.max(first, 1)) * 10) / 10} over the build · before the build —{' '}
          {DECISIONS_BASE}
        </span>
      </div>
      <div className="relative mt-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Cumulative total of decisions: from ${first} at the start of the build to ${total}`}
        >
          <line x1={0} y1={H - 8} x2={W} y2={H - 8} stroke="rgba(255,255,255,0.12)" />
          <polyline
            points={pts.join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth={2}
          />
          <circle cx={W} cy={y(total)} r={4} fill={AMBER} />
        </svg>
        <div
          className="pointer-events-none absolute right-3 tabular-nums text-[12px] font-bold"
          style={{ top: 0, color: AMBER }}
        >
          {total.toLocaleString(INTL_LOCALE)}
        </div>
      </div>
      <div className="flex justify-between tabular-nums text-[11px] text-white/35">
        <span>July 1 · start of the build</span>
        <span>snapshot {DECISIONS_SREZ}</span>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        {REJECTED_QUOTES.map((q) => (
          <div key={q.slug} className="flex items-baseline gap-2.5 tabular-nums text-[12.5px]">
            <span className="w-4 shrink-0 text-white/40">⚖️</span>
            <span className="truncate text-white/70">{q.text}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 max-w-[720px] text-[13px] leading-relaxed text-white/45">
        A contested decision is recorded with a “Rejected” field, and what was rejected does not
        come back: a rule is born from refusal, slop dies by classes, not one by one.
      </p>
    </div>
  )
}

function CullScene({
  found,
  served,
  sheet,
}: {
  found: number
  served: number
  sheet?: React.ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [p, setP] = useState(0)
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onMq = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onMq)
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const total = r.height - window.innerHeight
        setP(Math.min(1, Math.max(0, -r.top / Math.max(total, 1))))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      mq.removeEventListener?.('change', onMq)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  const [cvSize, setCvSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      setCvSize({ w: canvas.clientWidth, h: canvas.clientHeight })
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])
  const rank = useMemo(() => {
    if (found <= 0) return null
    const idx = new Uint32Array(found)
    for (let i = 0; i < found; i++) idx[i] = i
    let s = 41
    const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
    for (let i = found - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      const t = idx[i]
      idx[i] = idx[j]
      idx[j] = t
    }
    const r = new Uint32Array(found)
    for (let i = 0; i < found; i++) r[idx[i]] = i
    return r
  }, [found])
  const pe = reduced ? 1 : p
  const killTotal = Math.max(found - served, 0)
  const t = Math.min(1, Math.max(0, (pe - 0.06) / 0.72))
  const ease = t * t * (3 - 2 * t)
  const killed = Math.round(ease * killTotal)
  const alive = found - killed
  const settled = pe > 0.8
  const pct = found > 0 ? Math.round((served / found) * 100) : 0
  const pct100 = 100
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !rank) return
    const w = cvSize.w
    const h = cvSize.h
    if (!w || !h) return
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr)
    if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const cols = Math.max(Math.ceil(Math.sqrt((found * w) / Math.max(h, 1))), 1)
    const cellW = w / cols
    const cellH = h / Math.ceil(found / cols)
    const size = Math.max(Math.min(cellW, cellH) * 0.34, 1)
    const lit = Math.min(1, Math.max(0, (pe - 0.8) / 0.2))
    const passes: Array<[string, (r: number) => boolean]> = [
      [`rgba(255,255,255,${0.05 - lit * 0.02})`, (r) => r < killed],
      ['rgba(255,255,255,0.26)', (r) => r >= killed && r < killTotal],
      [`rgba(255,255,255,${0.3 + lit * 0.62})`, (r) => r >= killTotal],
    ]
    for (const [fill, test] of passes) {
      ctx.fillStyle = fill
      for (let i = 0; i < found; i++) {
        if (!test(rank[i])) continue
        const x = (i % cols) * cellW + cellW / 2
        const y = Math.floor(i / cols) * cellH + cellH / 2
        ctx.fillRect(x - size / 2, y - size / 2, size, size)
      }
    }
  }, [pe, killed, killTotal, found, rank, cvSize])
  if (found <= 0 || served <= 0) return null
  return (
    <div
      ref={wrapRef}
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen"
      style={{ height: '240vh' }}
    >
      <div className="sticky top-0 h-screen overflow-hidden pb-[var(--sticky-cta-h,0px)]">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 px-5 pt-[11vh] text-center">
          <div
            className="tabular-nums text-[17px] font-bold"
            style={{
              color: AMBER,
              opacity: 0.55 + Math.min(1, Math.max(0, (pe - 0.02) / 0.1)) * 0.45,
            }}
          >
            quality
          </div>
          <h3
            id="tally-quality-head"
            className="mt-3 text-[34px] font-bold leading-[1.05] tracking-tight [text-wrap:balance] min-[760px]:text-[52px]"
            style={{ opacity: 0.55 + Math.min(1, Math.max(0, (pe - 0.02) / 0.1)) * 0.45 }}
          >
            The machine throws out {settled && found > 0 ? `${pct100 - pct}%` : '…'}
            {settled ? <Fn n={4} /> : null}
          </h3>
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          <div className="tabular-nums text-[15px] text-white/55">
            all the machine&apos;s raw material over the build — a dot ={'\u00A0'}one unit
          </div>
          <div
            className="mt-3 tabular-nums text-[64px] font-bold leading-none tracking-tight min-[760px]:text-[104px]"
            style={{
              color: settled ? AMBER : 'rgba(255,255,255,0.95)',
              transition: 'color 400ms ease',
            }}
          >
            {alive.toLocaleString(INTL_LOCALE)}
          </div>
          <div className="mt-3 tabular-nums text-[15px] text-white/55">
            {settled
              ? `served to the site — ${pct}% of the raw material`
              : 'everything that did not pass the editor goes dark'}
          </div>
        </div>
        {sheet ? (
          <div
            className="absolute inset-x-0 bottom-[max(6vh,calc(var(--sticky-cta-h,0px)+16px))] z-10 flex justify-center px-5"
            style={{
              opacity: settled ? 1 : 0,
              pointerEvents: settled ? 'auto' : 'none',
              transition: 'opacity 400ms ease',
            }}
          >
            {sheet}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ChaseScene({
  machineDays,
  teamDays,
  crew,
  multT,
  knobs,
  isTuned,
  onReset,
}: {
  machineDays: number
  teamDays: number
  crew: number
  multT: number
  knobs: Array<{
    key: string
    label: string
    min: number
    max: number
    step: number
    value: number
    mul: number
    set: (v: number) => void
  }>
  isTuned: boolean
  onReset: () => void
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [p, setP] = useState(0)
  const [reduced, setReduced] = useState(false)
  const [slot, setSlot] = useState<'none' | 'proof' | 'pult'>('none')
  const headRef = useRef<HTMLDivElement | null>(null)
  const [proofTop, setProofTop] = useState(0)
  useEffect(() => {
    const calc = () => setProofTop(headRef.current ? headRef.current.offsetHeight + 16 : 0)
    calc()
    window.addEventListener('resize', calc, { passive: true })
    return () => window.removeEventListener('resize', calc)
  }, [slot])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onMq = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onMq)
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const total = r.height - window.innerHeight
        setP(Math.min(1, Math.max(0, -r.top / Math.max(total, 1))))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      mq.removeEventListener?.('change', onMq)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  const pe = reduced ? 1 : p
  const interactive = pe > 0.5
  const headIn = Math.min(1, Math.max(0, (pe - 0.02) / 0.1))
  const t = Math.min(1, Math.max(0, (pe - 0.24) / 0.62))
  const ease = t * t * (3 - 2 * t)
  const dayNow = Math.round(ease * machineDays)
  const machineFrac = machineDays > 0 ? dayNow / machineDays : 0
  const teamFrac = teamDays > 0 ? dayNow / teamDays : 0
  const settled = pe > 0.88
  const tracksIn = reduced ? 1 : Math.min(1, Math.max(0, (pe - 0.13) / 0.06))
  const tracksIn2 = reduced ? 1 : Math.min(1, Math.max(0, (pe - 0.16) / 0.06))
  const dayIn = reduced ? 1 : Math.min(1, Math.max(0, (pe - 0.2) / 0.04))
  const leftYears = (teamDays - machineDays) / 365
  const fmtYears =
    leftYears >= 1
      ? `≈${leftYears.toLocaleString(INTL_LOCALE, { maximumFractionDigits: 1 })} ${leftYears >= 4.5 ? 'years' : 'years'}`
      : `≈${Math.round((teamDays - machineDays) / 30.44)} mo`
  const pultCard = (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h4 className="text-[20px] font-bold leading-[1.3] tracking-tight min-[760px]:text-[23px]">
          The same work — with a team of {crew}
        </h4>
        <RoleChip kind="diy" />
        <span className="grow" />
        <button
          type="button"
          aria-label="close the console"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-[12px] text-white/60 transition-colors hover:border-white/40 hover:text-white"
          onClick={() => setSlot('none')}
        >
          ✕
        </button>
      </div>
      <div className="mt-4 grid gap-x-12 gap-y-3 min-[760px]:grid-cols-2">
        {knobs.map((k) => (
          <div
            key={k.key}
            className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 min-[760px]:flex-nowrap"
          >
            <span className="w-full min-w-0 truncate tabular-nums text-[12.5px] text-white/60 min-[760px]:w-auto min-[760px]:grow">
              {k.label}
            </span>
            <input
              type="range"
              min={k.min}
              max={k.max}
              step={k.step}
              value={k.value}
              onChange={(e) => k.set(Number(e.target.value))}
              className="min-w-0 flex-1 accent-white/80 min-[760px]:w-[150px] min-[760px]:flex-none"
              aria-label={k.label}
            />
            <span className="w-[46px] shrink-0 text-right tabular-nums text-[12px] font-bold text-white/85">
              <span className="tune-num">
                ×{k.mul.toLocaleString(INTL_LOCALE, { maximumFractionDigits: 1 })}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-white/10 pt-3 tabular-nums text-[12px]">
        <span className="text-white/50">
          {machineDays} d ×{' '}
          {knobs
            .map((k) => k.mul.toLocaleString(INTL_LOCALE, { maximumFractionDigits: 1 }))
            .join(' × ')}{' '}
          ≈ <span className="tune-num">{teamDays.toLocaleString(INTL_LOCALE)} d</span>
        </span>
        {isTuned ? (
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/60 transition-colors hover:border-white/40 hover:text-white"
          >
            reset
          </button>
        ) : null}
      </div>
    </>
  )
  if (machineDays <= 0 || teamDays <= machineDays) return null
  return (
    <div ref={wrapRef} className="relative -mx-5 min-[760px]:mx-0" style={{ height: '240vh' }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden px-5 pb-[var(--sticky-cta-h,0px)]">
        <div ref={headRef} className="pt-[11vh] text-center">
          <div
            className="tabular-nums text-[17px] font-bold"
            style={{
              color: AMBER,
              opacity: 0.25 + headIn * 0.75,
            }}
          >
            speed
          </div>
          <h3
            className="mt-3 text-[34px] font-bold leading-[1.05] tracking-tight [text-wrap:balance] min-[760px]:text-[52px]"
            style={{ opacity: 0.25 + headIn * 0.75 }}
          >
            Faster by{' '}
            <span className="whitespace-nowrap">
              <span className="tune-num">
                {multT} {razWord(multT)}
              </span>
              <Fn n={6} />
            </span>
          </h3>
        </div>
        {slot !== 'none' ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-start justify-center px-5 pb-[4vh]"
            style={{ top: proofTop }}
          >
            <div className="vc-slot-in pointer-events-auto max-h-full w-full max-w-[1200px] overflow-y-auto rounded-[18px] border border-[#26262B] bg-[#161618] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.5)] min-[760px]:p-6">
              {slot === 'proof' ? (
                <div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h4 className="text-[20px] font-bold leading-[1.3] tracking-tight min-[760px]:text-[23px]">
                      An idea in the morning — in production minutes later
                      <Fn n={6} />
                    </h4>
                    <RoleChip kind="fact" />
                    <span className="grow" />
                    <button
                      type="button"
                      aria-label="collapse the proof"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-[12px] text-white/60 transition-colors hover:border-white/40 hover:text-white"
                      onClick={() => setSlot('none')}
                    >
                      ✕
                    </button>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#C9C9CE] min-[760px]:text-[15px]">
                    No backlog, no sprints, no release trains: a line in chat — and the agent drives
                    it to production.
                  </p>
                  <DeliveryDots />
                  <div className="mt-4 flex flex-wrap items-baseline gap-x-10 gap-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[26px] font-bold leading-none tracking-tight">
                        {IDEA_P50_MIN} min
                      </span>
                      <span className="text-[13px] text-[#9A9AA2]">
                        median: from idea in chat to production
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[26px] font-bold leading-none tracking-tight">
                        ~{RELEASES_PER_DAY}
                      </span>
                      <span className="text-[13px] text-[#9A9AA2]">
                        releases to production per day
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                pultCard
              )}
            </div>
          </div>
        ) : null}
        <div className="mx-auto flex w-full max-w-[1200px] grow flex-col justify-center pb-[14vh]">
          <style>{`@keyframes vc-slot-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.vc-slot-in{animation:vc-slot-in 320ms ease-out both}@keyframes vc-slot-down{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}.vc-slot-down{animation:vc-slot-down 320ms ease-out both}@media (prefers-reduced-motion: reduce){@keyframes vc-slot-in{from{opacity:0}to{opacity:1}}@keyframes vc-slot-down{from{opacity:0}to{opacity:1}}}`}</style>
          <div
            className="text-center tabular-nums text-[40px] font-bold leading-none text-white/90 min-[760px]:text-[56px]"
            style={{ opacity: dayIn }}
          >
            day {dayNow}
          </div>
          <div
            className="relative mt-14"
            style={{ opacity: tracksIn, transform: `translateY(${(1 - tracksIn) * 10}px)` }}
          >
            <button
              type="button"
              disabled={!interactive}
              onClick={() => setSlot((s) => (s === 'proof' ? 'none' : 'proof'))}
              className={`block w-full text-left ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-baseline justify-between tabular-nums text-[14px] min-[760px]:text-[15px]">
                <span className="text-white/80">machine · human approves</span>
                <span className="font-bold text-white/90">
                  {machineFrac >= 1
                    ? `${machineDays} days — the whole build in production`
                    : dayNow >= 1
                      ? `day ${dayNow}`
                      : ''}
                </span>
              </div>
              <div
                className={`mt-2 h-[46px] w-full overflow-hidden rounded-[10px] bg-white/[.05] transition-colors min-[760px]:h-[54px] ${
                  slot === 'proof' ? 'bg-white/[.09]' : 'hover:bg-white/[.08]'
                }`}
              >
                <div
                  className="h-full"
                  style={{ width: `${machineFrac * 100}%`, background: AMBER }}
                />
              </div>
            </button>
            <div
              className="mt-2 tabular-nums text-[14px] text-white/55"
              style={{ opacity: settled ? 1 : 0, transition: 'opacity 400ms ease' }}
            >
              fact from git — tap the track: how the machine does it
            </div>
          </div>
          <div
            className="relative mt-8"
            style={{ opacity: tracksIn2, transform: `translateY(${(1 - tracksIn2) * 10}px)` }}
          >
            <button
              type="button"
              disabled={!interactive}
              onClick={() => setSlot((s) => (s === 'pult' ? 'none' : 'pult'))}
              className={`block w-full text-left ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-baseline justify-between tabular-nums text-[14px] min-[760px]:text-[15px]">
                <span className="text-white/80">a team of {crew} — the same work</span>
                <span className="tune-num font-bold text-white/90">
                  {(teamFrac * 100).toLocaleString(INTL_LOCALE, { maximumFractionDigits: 1 })}% of
                  the way
                </span>
              </div>
              <div className="mt-2 rounded-[14px] border border-dashed border-white/35 p-1.5">
                <div
                  className={`h-[46px] w-full overflow-hidden rounded-[10px] bg-white/[.05] transition-colors min-[760px]:h-[54px] ${
                    slot === 'pult' ? 'bg-white/[.09]' : 'hover:bg-white/[.08]'
                  }`}
                >
                  <div
                    className="h-full bg-white/40"
                    style={{ width: `${Math.max(teamFrac * 100, dayNow > 0 ? 0.4 : 0)}%` }}
                  />
                </div>
              </div>
            </button>
            <div
              className="mt-2 flex items-baseline justify-between tabular-nums text-[14px] text-white/55"
              style={{ opacity: settled ? 1 : 0, transition: 'opacity 400ms ease' }}
            >
              <span>hypothesis — tap the track: recalculate for your own team</span>
              <span>
                finish — in <span className="tune-num">{fmtYears}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EulerRings({
  draw,
  pains,
  utopia,
  core = 0,
  idKey,
  labelScale = 1,
  spread = 1,
  className,
}: {
  draw: [number, number, number]
  pains: number
  utopia: number
  core?: number
  idKey: string
  labelScale?: number
  spread?: number
  className?: string
}) {
  const R = 112
  const CX = 210
  const CY = 200
  const BASE: Array<{ cx: number; cy: number; word: string; lx: number; ly: number }> = [
    { cx: 136, cy: 242, word: 'price', lx: 100, ly: 272 },
    { cx: 284, cy: 242, word: 'speed', lx: 320, ly: 272 },
    { cx: 210, cy: 116, word: 'quality', lx: 210, ly: 76 },
  ]
  const RINGS = BASE.map((r) => {
    const cx = CX + (r.cx - CX) * spread
    const cy = CY + (r.cy - CY) * spread
    return { cx, cy, word: r.word, lx: cx + (r.lx - r.cx), ly: cy + (r.ly - r.cy) }
  })
  const zoneTop = RINGS[0]!.cy - Math.sqrt(R * R - (CX - RINGS[0]!.cx) ** 2)
  const zoneBottom = RINGS[2]!.cy + R
  const zc = (zoneTop + zoneBottom) / 2
  const PAINS: Array<[number, number, string]> = [
    [156, 169, 'slow'],
    [264, 169, 'expensive'],
    [210, 262, 'bad'],
  ]
  return (
    <svg
      viewBox="0 0 420 390"
      className={className}
      role="img"
      aria-label="Three circles: price, speed, quality. Any two of them overlap into slow, expensive or bad; all three at once is what the old world called utopia"
    >
      <defs>
        <clipPath id={`er-${idKey}-0`}>
          <circle cx={RINGS[0]!.cx} cy={RINGS[0]!.cy} r={R} />
        </clipPath>
        <clipPath id={`er-${idKey}-1`}>
          <circle cx={RINGS[1]!.cx} cy={RINGS[1]!.cy} r={R} />
        </clipPath>
      </defs>
      {core > 0 ? (
        <g clipPath={`url(#er-${idKey}-0)`}>
          <g clipPath={`url(#er-${idKey}-1)`}>
            <circle cx={RINGS[2]!.cx} cy={RINGS[2]!.cy} r={R} fill={AMBER} opacity={core} />
          </g>
        </g>
      ) : null}
      {RINGS.map((ring, i) => (
        <g key={ring.word}>
          <circle
            cx={ring.cx}
            cy={ring.cy}
            r={R}
            pathLength={100}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={1.25}
            strokeDasharray={100}
            strokeDashoffset={100 * (1 - draw[i]!)}
            transform={`rotate(-90 ${ring.cx} ${ring.cy})`}
          />
          <text
            x={ring.lx}
            y={ring.ly}
            textAnchor="middle"
            fill={AMBER}
            fontSize={14 * labelScale}
            opacity={draw[i]}
            className="tabular-nums"
          >
            {ring.word}
          </text>
        </g>
      ))}
      {PAINS.map(([x, y, word]) => (
        <text
          key={word}
          x={x}
          y={y}
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize={12 * labelScale}
          opacity={pains}
          className="tabular-nums"
        >
          {word}
        </text>
      ))}
      <text
        x={CX}
        y={zc + 10}
        textAnchor="middle"
        fill="rgba(255,255,255,0.6)"
        fontSize={13 * labelScale}
        opacity={utopia}
        className="tabular-nums"
      >
        utopia
      </text>
    </svg>
  )
}

function OvertureScene() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [p, setP] = useState(0)
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onMq = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onMq)
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const total = r.height - window.innerHeight
        setP(Math.min(1, Math.max(0, -r.top / Math.max(total, 1))))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      mq.removeEventListener?.('change', onMq)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  const pe = reduced ? 1 : p
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
  const ax1 = clamp01((pe - 0.02) / 0.1)
  const ax2 = clamp01((pe - 0.14) / 0.1)
  const ring = (i: number) => clamp01((pe - (0.28 + i * 0.14)) / 0.12)
  const pains = clamp01((pe - 0.7) / 0.1)
  const utopia = clamp01((pe - 0.84) / 0.1)
  return (
    <div ref={wrapRef} className="relative -mx-5 min-[760px]:mx-0" style={{ height: '260vh' }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden px-5 text-center pb-[var(--sticky-cta-h,0px)]">
        <div className="pt-[15vh]">
          <div
            className="text-[34px] font-bold leading-[1.05] tracking-tight min-[760px]:text-[52px]"
            style={{ opacity: 0.55 + ax1 * 0.45 }}
          >
            Price. Speed. Quality.
          </div>
          <div
            className="mt-5 text-[19px] font-bold leading-[1.2] tracking-tight text-white/85 min-[760px]:text-[28px]"
            style={{ opacity: ax2, transform: `translateY(${(1 - ax2) * 10}px)` }}
          >
            The old rule of development: pick any two
            <Fn n={3} />
          </div>
        </div>
        <div className="flex min-h-0 grow items-center justify-center pb-[8vh]">
          <EulerRings
            draw={[ring(0), ring(1), ring(2)]}
            pains={pains}
            utopia={utopia}
            idKey="ov"
            className="max-h-full w-[min(84vw,52vh,520px)]"
          />
        </div>
      </div>
    </div>
  )
}

function TriangleCloseScene({
  teamUsd,
  machineUsdMonth,
  teamDays,
  D,
}: {
  teamUsd: number
  machineUsdMonth: number
  teamDays: number
  D: number
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [p, setP] = useState(0)
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onMq = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onMq)
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const total = r.height - window.innerHeight
        setP(Math.min(1, Math.max(0, -r.top / Math.max(total, 1))))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      mq.removeEventListener?.('change', onMq)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  const [mobileFlow, setMobileFlow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 759px)')
    setMobileFlow(mq.matches)
    const on = () => setMobileFlow(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  const pe = reduced || mobileFlow ? 1 : p
  const teamTotal = (teamDays / 30.44) * teamUsd
  const machineTotal = (D / 30.44) * machineUsdMonth
  const multTotal = machineTotal > 0 ? Math.max(Math.round(teamTotal / machineTotal), 1) : 1
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
  const ansIn = clamp01((pe - 0.02) / 0.08)
  const fordIn = clamp01((pe - 0.1) / 0.08)
  const row = (i: number) => clamp01((pe - (0.18 + i * 0.1)) / 0.08)
  const rowKey = clamp01((pe - 0.5) / 0.12)
  const diagIn = clamp01((pe - 0.66) / 0.12)
  const coreIn = clamp01((pe - 0.8) / 0.12)
  if (multTotal <= 1) return null
  return (
    <div
      ref={wrapRef}
      id="final"
      className="relative -mx-5 min-[760px]:mx-0"
      style={mobileFlow ? undefined : { height: '320vh' }}
    >
      <div
        className={
          mobileFlow
            ? 'overflow-visible'
            : 'sticky top-0 h-screen overflow-hidden pb-[var(--sticky-cta-h,0px)]'
        }
      >
        <div className="flex h-full w-full flex-col justify-start px-5 pb-[6vh] pt-[7vh] min-[760px]:px-0 min-[1100px]:justify-center min-[1100px]:pb-0 min-[1100px]:pt-0">
          <div
            className="text-[34px] font-bold leading-[1.05] tracking-tight [text-wrap:balance] min-[760px]:text-[52px]"
            style={{ opacity: ansIn, transform: `translateY(${(1 - ansIn) * 10}px)` }}
          >
            The new rule of development: pick all three.
          </div>
          <p
            className="mt-5 max-w-[640px] text-[17px] leading-relaxed text-white/55"
            style={{ opacity: fordIn }}
          >
            In 1913 Ford&apos;s assembly line closed the triangle for the automobile.{' '}
            <span className="font-bold text-white">In 2026 agentic development closes it.</span>
          </p>
          <div className="min-[1100px]:flex min-[1100px]:items-center">
            <div
              className="w-full min-w-0 max-w-[820px] min-[1100px]:shrink-0"
              style={{ opacity: 0.25 + Math.max(row(0), 0) * 0.75 }}
            >
              <FinalTriangle
                teamUsd={teamUsd}
                machineUsdMonth={machineUsdMonth}
                teamDays={teamDays}
                D={D}
                rowsIn={[row(0), row(1), row(2), rowKey]}
              />
            </div>
            <div className="min-[1100px]:flex min-[1100px]:grow min-[1100px]:items-center min-[1100px]:justify-center">
              <EulerRings
                draw={[diagIn, diagIn, diagIn]}
                pains={0}
                utopia={0}
                core={coreIn}
                idKey="fin"
                spread={0.82}
                className="mx-auto mt-16 w-[min(70vw,340px)] min-[1100px]:mx-0 min-[1100px]:mt-0 min-[1100px]:w-[360px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FunnelTact() {
  const { feed } = useMachine()
  const tail = useMemo(() => {
    const t = feedTail(feed, 60)
    const rejects = t.events.filter((e) => e.kind === 'reject' && e.detail).slice(0, 4)
    return { counters: t.counters, funnel: t.funnel, rejects, live: t.live }
  }, [feed])
  const { found, served } = tail.funnel ?? tail.counters
  return (
    <section id="selection" className="px-5 pb-4 pt-24 min-[760px]:px-0">
      <CullScene
        found={found}
        served={served}
        sheet={
          <SceneSheet
            label="How the selection works"
            kicker="quality"
            title="Between raw material and production stands an editor"
          >
            <p className="max-w-[720px] text-[15px] leading-relaxed text-[#C9C9CE]">
              Slop is noise nobody filtered out. Here an editor stands between “found it” and “on
              the site”: every rejection has a recorded reason.
            </p>
            {tail.rejects.length ? (
              <div className="mt-8 border-t border-white/10 pt-5">
                <div className="tabular-nums text-[12px] text-white/45">
                  third-party raw material · recent rejections - reasons as they are, from the store
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {tail.rejects.map((e, i) => (
                    <div key={i} className="flex items-baseline gap-2.5 tabular-nums text-[12.5px]">
                      <span className="w-4 shrink-0 text-white/40">✕</span>
                      <span className="truncate text-white/70">{e.detail}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 max-w-[720px] text-[13px] leading-relaxed text-white/45">
                  The feed is a close-up of one surface; every other one lives by the same
                  selection: the AI map, the handbook, social media, the benchmark.
                </p>
              </div>
            ) : null}
            <DecisionsLedger />
            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="max-w-[720px] text-[15px] font-bold leading-relaxed text-white">
                This is a snapshot of today — the worst version of the machine there will ever be.
              </p>
              <div className="mt-4 grid gap-4 min-[760px]:grid-cols-2">
                <div>
                  <div className="tabular-nums text-[12px] text-white/45">
                    01 · model generations
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#C9C9CE]">
                    Selection, writing and editing are done by models — every new turn of flagships
                    lifts all the stages at once, with no rebuilding of the pipeline.
                  </p>
                </div>
                <div>
                  <div className="tabular-nums text-[12px] text-white/45">02 · feedback loop</div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#C9C9CE]">
                    Market signals and the owner&apos;s decisions become the standards of selection,
                    and whatever breaks is fixed by the self-healing watchdog.
                  </p>
                </div>
              </div>
              <p className="mt-4 max-w-[720px] text-[14px] leading-relaxed text-[#C9C9CE]">
                The page you are reading right now is not the one that was here a week ago.
              </p>
            </div>
          </SceneSheet>
        }
      />
      <Col>
        <p className="mt-16 max-w-[720px] text-[21px] leading-[1.4] text-white/45">
          Slop or not — judge for yourself.{' '}
          <span className="font-bold text-white">
            This page was built entirely by agents: from a line in chat to production.
          </span>
        </p>
      </Col>
    </section>
  )
}

function LensRail({ p, onPick }: { p: number; onPick: (i: number) => void }) {
  const labels = ['agentic development', 'vibecoding', 'the whole company']
  return (
    <div className="flex w-[240px] items-center gap-2">
      {labels.map((label, i) => {
        const fill = Math.max(0, Math.min(1, p * 3 - i))
        return (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => onPick(i)}
            className="group flex-1 cursor-pointer py-2"
          >
            <span className="relative block h-[4px] overflow-hidden rounded-full bg-white/[.14] transition-colors group-hover:bg-white/[.25]">
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${fill * 100}%`,
                  background: '#F0F0F0',
                  boxShadow: fill > 0 && fill < 1 ? '0 0 10px rgba(255,255,255,0.45)' : 'none',
                }}
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}

const LENSES = [
  {
    h2: 'This is agentic development. The whole map.',
    desc: (
      <>
        Each rectangle is a region of the repository; the area is counted from commits since July 2,
        2026.{' '}
        <span className="font-bold text-white">
          A human writes the rules and keeps the final word; the agents execute
        </span>
        , and every commit stays in git. Click a region: it has its own story inside.
      </>
    ),
  },
  {
    h2: 'And this is vibecoding. Two regions out of six.',
    desc: (
      <>
        What people usually call vibecoding lives in two regions: the frontend with the public pages
        and the backend with the pipeline and the database.{' '}
        <span className="font-bold text-white">Less than a third of the machine.</span>
      </>
    ),
  },
  {
    h2: 'And it is not only code. It is the whole company.',
    desc: (
      <>
        The same commits, a second coloring. All of {siteConfig.name} is run by the same machine of
        agents: strategy, product, marketing and operations are described in specs. There is more
        documentation here than code — 387 thousand lines of specs against 391 thousand lines of
        code, and{' '}
        <span className="font-bold text-white">the code only executes what is written</span>. A
        setup like this is called a Spec-Driven Company.
      </>
    ),
  },
]

const BIZ_PALETTES: Record<string, { colors: string[]; dark: boolean[]; stroke?: string }> = {
  paper: {
    colors: ['#F0F0F0', '#DEDEE2', '#CCCCD2', '#BABAC2', '#A8A8B2'],
    dark: [true, true, true, true, true],
  },
  blueprint: {
    colors: ['#111114', '#131317', '#15151A', '#17171D', '#191920'],
    dark: [false, false, false, false, false],
    stroke: 'rgba(240,240,240,0.38)',
  },
  steel: {
    colors: ['#7E97AA', '#6E869B', '#5E758C', '#4E647D', '#3E536E'],
    dark: [false, false, false, false, false],
  },
  gray: {
    colors: ['#E4E4E6', '#C2C2C8', '#A0A0A8', '#7E7E88', '#5C5C68'],
    dark: [true, true, true, false, false],
  },
  pergament: {
    colors: ['#F2EBDC', '#E6DCC8', '#DACDB4', '#CEBEA0', '#C2AF8C'],
    dark: [true, true, true, true, true],
  },
  cobalt: {
    colors: ['#2E5B9E', '#28508D', '#22457C', '#1C3A6B', '#16305A'],
    dark: [false, false, false, false, false],
    stroke: 'rgba(240,245,255,0.35)',
  },
  sand: {
    colors: ['#F0E6D2', '#E6D8BC', '#DCCAA6', '#D2BC90', '#C8AE7A'],
    dark: [true, true, true, true, true],
  },
  champagne: {
    colors: ['#F0DDB4', '#E8C878', '#D8A45C', '#C57E45', '#A65B38'],
    dark: [true, true, true, false, false],
  },
  cream: {
    colors: ['#F8F4EA', '#F0E9DA', '#E8DECA', '#E0D3BA', '#D8C8AA'],
    dark: [true, true, true, true, true],
  },
  clay: {
    colors: ['#EADFD2', '#DECBB6', '#D2B79A', '#C6A37E', '#BA8F62'],
    dark: [true, true, true, true, true],
  },
  linen: {
    colors: ['#EEEAE0', '#E0DACC', '#D2CAB8', '#C4BAA4', '#B6AA90'],
    dark: [true, true, true, true, true],
  },
  graphite: {
    colors: ['#1E1E22', '#1C1C20', '#1A1A1E', '#18181C', '#16161A'],
    dark: [false, false, false, false, false],
    stroke: 'rgba(255,122,26,0.55)',
  },
  matte: {
    colors: ['#E2D3B2', '#D4D4D8', '#F5EFE2', '#DEC4B8', '#C6CCBA'],
    dark: [true, true, true, true, true],
  },
}

const BIZ_VISUAL_ORDER = ['dev', 'strategy', 'product', 'marketing', 'ops']

const BIZ_CELLS = (() => {
  const total = BUSINESS_REGIONS.reduce((sum, r) => sum + r.n, 0)
  const n = (id: string) => BUSINESS_REGIONS.find((r) => r.id === id)?.n ?? 0
  const wOf = (v: number) => (MAP_W * v) / total
  const w1 = wOf(n('dev'))
  const w2 = wOf(n('strategy'))
  const w3 = wOf(n('product') + n('marketing'))
  const w4 = wOf(n('ops'))
  const hProd = (MAP_H * n('product')) / (n('product') + n('marketing'))
  return [
    { id: 'dev', x: 0, y: 0, w: w1, h: MAP_H },
    { id: 'strategy', x: w1, y: 0, w: w2, h: MAP_H },
    { id: 'product', x: w1 + w2, y: 0, w: w3, h: hProd },
    { id: 'marketing', x: w1 + w2, y: hProd, w: w3, h: MAP_H - hProd },
    { id: 'ops', x: w1 + w2 + w3, y: 0, w: w4, h: MAP_H },
  ]
})()

function bizWithPalette(pal: string) {
  const set = BIZ_PALETTES[pal]
  if (!set) return BUSINESS_REGIONS
  return BUSINESS_REGIONS.map((r) => {
    const rank = BIZ_VISUAL_ORDER.indexOf(r.id)
    return { ...r, color: set.colors[rank], darkText: set.dark[rank], stroke: set.stroke }
  })
}

function MapBars({
  regions,
  stories = MAP_STORIES,
  litIds = null,
  getTotal,
  body,
  expand = 'inline',
}: {
  regions: Array<{
    id: string
    n: number
    sub: string
    darkText?: boolean
    color?: string
  }>
  stories?: Record<string, string>
  litIds?: string[] | null
  getTotal?: (id: string) => number
  body?: (zoneId: string, dark: boolean) => React.ReactNode
  expand?: 'inline' | 'none'
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const total = regions.reduce((s, r) => s + r.n, 0)
  return (
    <div className="flex flex-col gap-1.5">
      {regions.map((r, idx) => {
        const dim = litIds ? !litIds.includes(r.id) : false
        const h = Math.max(52, Math.round((r.n / Math.max(total, 1)) * 560))
        const ink = r.darkText ? '#111111' : '#FFFFFF'
        if (expand === 'inline' && openId === r.id) {
          const zoneTotal = getTotal?.(r.id) ?? MAP_DIVE[r.id]?.total ?? r.n
          return (
            <div
              key={r.id}
              className="vc-slot-in rounded-xl p-4"
              style={{
                background: r.color ?? REGION_COLORS[r.id],
                color: r.darkText ? '#000000' : '#FFFFFF',
              }}
            >
              <div className="flex items-center gap-x-3">
                <span className="text-[17px] font-bold leading-none">{zoneLabel(r.id)}</span>
                <span className="tabular-nums text-[12px] opacity-70">
                  {zoneTotal.toLocaleString(INTL_LOCALE)} commits
                </span>
                <span className="grow" />
                <button
                  type="button"
                  aria-label="close region"
                  onClick={() => setOpenId(null)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px]"
                  style={{
                    backgroundColor: r.darkText ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.18)',
                  }}
                >
                  ✕
                </button>
              </div>
              {stories[r.id] ? (
                <p className="mt-2 text-[13px] leading-snug opacity-80">{stories[r.id]}</p>
              ) : null}
              <div className="mt-3">
                {body ? (
                  body(r.id, !!r.darkText)
                ) : (
                  <DiveBody zoneId={r.id} dark={!!r.darkText} gridOn={false} onGrid={() => {}} />
                )}
              </div>
            </div>
          )
        }
        return (
          <button
            key={r.id}
            type="button"
            disabled={expand === 'none'}
            onClick={() => setOpenId((cur) => (cur === r.id ? null : r.id))}
            className={`relative w-full overflow-hidden rounded-xl px-4 text-left transition-opacity ${
              expand === 'inline' ? 'bar-shimmer' : 'cursor-default'
            }`}
            style={{
              height: h,
              background: r.color ?? REGION_COLORS[r.id],
              opacity: dim ? 0.22 : 1,
              ['--shim-delay' as string]: `${0.4 + idx * 0.35}s`,
            }}
          >
            <div className="flex h-full items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold" style={{ color: ink }}>
                  {zoneLabel(r.id)}
                </div>
                {h >= 64 ? (
                  <div className="truncate text-[12px]" style={{ color: ink, opacity: 0.72 }}>
                    {r.sub}
                  </div>
                ) : null}
              </div>
              <div className="shrink-0 tabular-nums text-[15px] font-bold" style={{ color: ink }}>
                {r.n.toLocaleString(INTL_LOCALE)}
              </div>
            </div>
          </button>
        )
      })}
      <style>{`@keyframes vc-slot-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.vc-slot-in{animation:vc-slot-in 320ms ease-out both}@keyframes bar-shim{0%{transform:translateX(-160%)}45%{transform:translateX(160%)}100%{transform:translateX(160%)}}.bar-shimmer::after{content:'';position:absolute;inset:0;pointer-events:none;transform:translateX(-160%);background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,0.28) 50%,transparent 58%);animation:bar-shim 4.2s ease-in-out var(--shim-delay,0s) infinite}@media (prefers-reduced-motion: reduce){.bar-shimmer::after{animation:none}@keyframes vc-slot-in{from{opacity:0}to{opacity:1}}}`}</style>
    </div>
  )
}

function MapScrolly({ gridOn, onGrid }: { gridOn: boolean; onGrid: (on: boolean) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)')
    const upd = () => setMobile(mq.matches)
    upd()
    mq.addEventListener?.('change', upd)
    return () => mq.removeEventListener?.('change', upd)
  }, [])
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const total = r.height - window.innerHeight
        setP(Math.min(1, Math.max(0, -r.top / Math.max(total, 1))))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  const lens = p < 1 / 3 ? 0 : p < 2 / 3 ? 1 : 2
  const lit = lens === 1 ? VIBE_LIT : null

  const AFF_DEFAULT: Record<string, boolean> = {}
  const [aff, setAff] = useState<Record<string, boolean>>(AFF_DEFAULT)
  useEffect(() => {
    if (window.matchMedia('(min-width: 760px)').matches) setAff((c) => ({ ...c, shake: true }))
  }, [])
  const [peekTick, setPeekTick] = useState(0)
  const peekDoneRef = useRef(false)
  useEffect(() => {
    if (lens === 0 && aff.peek && !peekDoneRef.current) {
      peekDoneRef.current = true
      setPeekTick((t) => t + 1)
    }
    if (lens !== 0) peekDoneRef.current = false
  }, [lens, aff.peek])
  const LENS_CENTERS = [1 / 6, 3 / 6, 5 / 6]
  const glideRaf = useRef<number | null>(null)
  const cancelGlide = () => {
    if (glideRaf.current) cancelAnimationFrame(glideRaf.current)
    glideRaf.current = null
  }
  const glideTo = (targetP: number) => {
    const el = wrapRef.current
    if (!el) return
    cancelGlide()
    const rect = el.getBoundingClientRect()
    const total = rect.height - window.innerHeight
    const targetY = rect.top + window.scrollY + total * targetP
    const startY = window.scrollY
    const dist = targetY - startY
    if (Math.abs(dist) < 2) return
    const dur = 380
    const t0 = performance.now()
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      window.scrollTo(0, startY + dist * ease(k))
      glideRaf.current = k < 1 ? requestAnimationFrame(step) : null
    }
    glideRaf.current = requestAnimationFrame(step)
  }
  useEffect(() => {
    const abort = () => cancelGlide()
    window.addEventListener('wheel', abort, { passive: true })
    window.addEventListener('touchstart', abort, { passive: true })
    window.addEventListener('keydown', abort)
    return () => {
      window.removeEventListener('wheel', abort)
      window.removeEventListener('touchstart', abort)
      window.removeEventListener('keydown', abort)
      cancelGlide()
    }
  }, [])
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!aff.magnet) return
    const onScroll = () => {
      if (glideRaf.current) return
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const total = r.height - window.innerHeight
        const pp = -r.top / Math.max(total, 1)
        if (pp <= 0.03 || pp >= 0.97) return
        const target = LENS_CENTERS.reduce((acc, c) =>
          Math.abs(c - pp) < Math.abs(acc - pp) ? c : acc
        )
        if (Math.abs(target - pp) > 0.015) glideTo(target)
      }, 150)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aff.magnet])

  const [chip, setChip] = useState<{ x: number; y: number } | null>(null)
  const [fxTick, setFxTick] = useState(0)
  const prevLensRef = useRef(-1)
  useEffect(() => {
    if (prevLensRef.current !== lens && p > 0.005 && p < 0.995) setFxTick((t) => t + 1)
    prevLensRef.current = lens
  }, [lens, p])
  const ENTRY_KEYS = ['cascade', 'shake', 'breath', 'tileshine'] as const
  const entryFx = ENTRY_KEYS.filter((k) => aff[k])
  const bizRegions = bizWithPalette('champagne')

  const renderHeader = (i: number) => (
    <div
      className="col-start-1 row-start-1"
      style={{
        opacity: lens === i ? 1 : 0,
        transition: 'opacity var(--lensfade, 450ms) cubic-bezier(0.25,0.1,0.25,1)',
        pointerEvents: lens === i ? 'auto' : 'none',
      }}
    >
      <H2>
        {LENSES[i].h2}
        {i === 0 ? <Fn n={1} /> : null}
      </H2>
      <p className="mt-3 max-w-[720px] text-[15px] leading-relaxed text-white/60 min-[1100px]:text-[17px]">
        {LENSES[i].desc}
      </p>
    </div>
  )

  if (mobile) {
    return (
      <section id="map" className="px-5 pb-4 pt-20">
        {LENSES.map((l, i) => (
          <div key={l.h2} className={i > 0 ? 'mt-16' : ''}>
            <H2>{l.h2}</H2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/60">{l.desc}</p>
            <div className="mt-6">
              {i === 0 ? <MapBars regions={MAP_REGIONS} expand="inline" /> : null}
              {i === 1 ? <MapBars regions={MAP_REGIONS} litIds={VIBE_LIT} expand="none" /> : null}
              {i === 2 ? (
                <MapBars
                  regions={bizRegions}
                  stories={BIZ_STORIES}
                  getTotal={(id) => bizRegions.find((r) => r.id === id)?.n ?? 0}
                  body={(id, dark) => <BizBody zoneId={id} dark={dark} />}
                />
              ) : null}
            </div>
          </div>
        ))}
      </section>
    )
  }

  return (
    <section id="map" ref={wrapRef} className="relative" style={{ height: '380vh' }}>
      <div
        className="sticky top-0 flex h-screen flex-col justify-center px-5 min-[760px]:px-0 pb-[var(--sticky-cta-h,0px)]"
        style={{ ['--lensfade' as string]: aff.snapfast ? '260ms' : '450ms' }}
      >
        <Col>
          <div className="grid">
            {renderHeader(0)}
            {renderHeader(1)}
            {renderHeader(2)}
          </div>
        </Col>
        <div className="mt-4 w-full" style={{ ['--map-max-h' as string]: 'calc(100vh - 380px)' }}>
          <div className="mb-3 flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            <LensRail p={p} onPick={(i) => glideTo(LENS_CENTERS[i])} />
          </div>
          <div
            className="relative"
            onMouseMove={
              aff.cursor && lens === 0
                ? (e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    setChip({ x: e.clientX - r.left, y: e.clientY - r.top })
                  }
                : undefined
            }
            onMouseLeave={() => setChip(null)}
          >
            {aff.shimmer ? (
              <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded">
                <div className="map-shimmer absolute inset-y-0 w-[30%]" />
              </div>
            ) : null}
            {aff.shimmerEnter && fxTick ? (
              <div
                key={`shonce-${fxTick}`}
                className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded"
              >
                <div className="map-shimmer-once absolute inset-y-0 w-[30%]" />
              </div>
            ) : null}
            {aff.cursor && lens === 0 && chip ? (
              <div
                className="pointer-events-none absolute z-20 flex items-center gap-1 rounded-full px-2.5 py-1 tabular-nums text-[11px] font-bold"
                style={{
                  left: chip.x + 16,
                  top: chip.y + 14,
                  backgroundColor: '#F0F0F0',
                  color: '#111111',
                }}
              >
                ＋ open
              </div>
            ) : null}
            <div
              style={{
                opacity: lens < 2 ? 1 : 0,
                transition: 'opacity var(--lensfade, 500ms) cubic-bezier(0.25,0.1,0.25,1)',
                pointerEvents: lens < 2 ? 'auto' : 'none',
              }}
            >
              <MapDive
                gridOn={gridOn}
                onGrid={onGrid}
                litIds={lit}
                interactive={lens === 0}
                hoverReveal={!!aff.hover}
                peekTick={peekTick}
                entryFx={lens === 1 ? [] : entryFx}
                fxTick={fxTick}
              />
            </div>
            <div
              data-biz-layer
              className="absolute inset-0"
              style={{
                opacity: lens === 2 ? 1 : 0,
                transition: 'opacity var(--lensfade, 500ms) cubic-bezier(0.25,0.1,0.25,1)',
                pointerEvents: lens === 2 ? 'auto' : 'none',
              }}
            >
              <MapDive
                gridOn={false}
                onGrid={() => {}}
                interactive={lens === 2}
                regions={bizRegions}
                cellsOverride={BIZ_CELLS}
                stories={BIZ_STORIES}
                unit="company"
                getTotal={(id) => bizRegions.find((r) => r.id === id)?.n ?? 0}
                body={(id, dark) => <BizBody zoneId={id} dark={dark} />}
                gridZone={null}
                entryFx={entryFx}
                fxTick={fxTick}
              />
            </div>
          </div>
        </div>
        <Col>
          <div className="grid">
            {LENSES.map((l, i) => (
              <div
                key={l.h2}
                className="col-start-1 row-start-1"
                style={{
                  opacity: lens === i ? 1 : 0,
                  transition: 'opacity var(--lensfade, 450ms)',
                  pointerEvents: 'none',
                }}
              ></div>
            ))}
          </div>
        </Col>
      </div>
    </section>
  )
}

function FinalTriangle({
  teamUsd,
  machineUsdMonth,
  teamDays,
  D,
  rowsIn = [1, 1, 1, 1],
}: {
  teamUsd: number
  machineUsdMonth: number
  teamDays: number
  D: number
  rowsIn?: [number, number, number, number]
}) {
  const multMoney = machineUsdMonth > 0 ? Math.max(Math.round(teamUsd / machineUsdMonth), 1) : 1
  const multTime = D > 0 ? Math.max(Math.round(teamDays / D), 1) : 1
  const teamTotal = (teamDays / 30.44) * teamUsd
  const machineTotal = (D / 30.44) * machineUsdMonth
  const multTotal = machineTotal > 0 ? Math.max(Math.round(teamTotal / machineTotal), 1) : 1
  // Audience rating: starts from the snapshot in data/stats.json. To collect
  // real ratings, send `dial` from commitDial() to your own endpoint and
  // put the returned median into `hall`.
  const { stats } = useMachine()
  const hall: { median: number | null; count: number } = stats.qualityRatings
  const [dial, setDial] = useState(1)
  const [castDone, setCastDone] = useState(false)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('machine-day-quality-score')
      const saved = Number(raw)
      if (raw !== null && Number.isFinite(saved) && saved >= 0 && saved <= 1) {
        setDial(saved)
        setCastDone(true)
      }
    } catch {
      // storage unavailable (private mode): start from the default
    }
  }, [])
  const commitDial = () => {
    if (castDone) return
    setCastDone(true)
    try {
      window.localStorage.setItem('machine-day-quality-score', String(dial))
    } catch {
      // storage unavailable (private mode): the rating is not remembered
    }
  }
  const fmtScore = (n: number) => n.toLocaleString(INTL_LOCALE, { maximumFractionDigits: 1 })
  const multShown = Math.round(multTotal * dial)
  const fmtR = fmtUsd
  const th = 'pb-2 pr-8 text-left text-[12px] font-normal text-white/40'
  const tdLabel = 'py-3 pr-8 text-[13px] text-white/45'
  const td = 'py-3 pr-8 text-[17px] font-bold text-white/90 min-[760px]:text-[20px]'
  const tdMult = 'py-3 text-[17px] font-bold min-[760px]:text-[20px]'
  const dialControl = (
    <div className="flex items-center gap-2.5">
      <span className="w-[44px] tabular-nums text-[15px] font-bold text-white/90">
        <span className="underline decoration-dotted decoration-white/30 underline-offset-4">
          ×{fmtScore(dial)}
        </span>
      </span>
      <div className="relative h-[24px] w-[96px]">
        <span
          aria-hidden
          className="absolute top-1/2 h-0 w-full -translate-y-1/2 border-t-2 border-dashed border-white/35"
        />
        <span
          aria-hidden
          className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/85"
          style={{ width: `${dial * 100}%`, transition: 'width 90ms ease' }}
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={dial}
          onChange={(e) => setDial(Number(e.target.value))}
          onPointerUp={commitDial}
          onKeyUp={commitDial}
          onTouchEnd={commitDial}
          className="open-qdial absolute inset-0 w-full"
          aria-label="machine quality in team units: 1 — a team, 0 — falls short"
        />
      </div>
    </div>
  )
  const hallLine =
    hall && hall.count >= 10 && hall.median !== null ? (
      <span className="block whitespace-nowrap text-[11px] font-normal text-white/45">
        hall: {fmtScore(hall.median)} · {hall.count.toLocaleString(INTL_LOCALE)}{' '}
        {plural(hall.count, 'rating', 'ratings', 'ratings')}
      </span>
    ) : null
  return (
    <div id="tally-final" className="mt-12">
      <style>{`
        .open-qdial{ -webkit-appearance:none; appearance:none; background:transparent; height:24px; cursor:grab; outline:none; position:relative; z-index:1 }
        .open-qdial:active{ cursor:grabbing }
        .open-qdial::-webkit-slider-runnable-track{ height:24px; background:transparent }
        .open-qdial::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:13px; height:13px; border-radius:9999px; background:#F0F0F0; margin-top:5.5px; box-shadow:0 0 0 4px rgba(240,240,240,0.12); transition:transform 120ms ease, box-shadow 120ms ease }
        .open-qdial:hover::-webkit-slider-thumb{ transform:scale(1.25) }
        .open-qdial:active::-webkit-slider-thumb{ transform:scale(1.4); box-shadow:0 0 0 7px rgba(240,240,240,0.16) }
        .open-qdial::-moz-range-track{ height:24px; background:transparent }
        .open-qdial::-moz-range-thumb{ width:13px; height:13px; border:0; border-radius:9999px; background:#F0F0F0; box-shadow:0 0 0 4px rgba(240,240,240,0.12); transition:transform 120ms ease }
        .open-qdial:hover::-moz-range-thumb{ transform:scale(1.25) }
      `}</style>
      <div className="min-[760px]:hidden">
        {(
          [
            {
              k: 'price',
              mult: `×${multMoney}`,
              m: `~${fmtR(machineUsdMonth)}/mo`,
              t: fmtR(teamUsd),
              in: rowsIn[0],
            },
            {
              k: 'speed',
              mult: `×${multTime}`,
              m: fmtDur(D),
              t: fmtDur(teamDays),
              in: rowsIn[1],
            },
          ] as const
        ).map((r) => (
          <div
            key={r.k}
            className="border-b border-white/10 py-4 first:border-t first:pt-[18px]"
            style={{ opacity: r.in }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[12px] text-white/45">{r.k}</span>
              <span className="tabular-nums text-[22px] font-bold text-white/90">{r.mult}</span>
            </div>
            <div className="mt-2 tabular-nums text-[15px] text-white/50">
              machine · <span className="text-white">{r.m}</span>
            </div>
            <div className="mt-1 tabular-nums text-[15px] text-white/50">
              team · <span className="text-white">{r.t}</span>
            </div>
          </div>
        ))}
        <div className="border-b border-white/10 py-4" style={{ opacity: rowsIn[2] }}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[12px] text-white/45">
              quality
              <Fn n={7} />
            </span>
            <span className="tabular-nums text-[22px] font-bold text-white/90">
              ×{fmtScore(dial)}
            </span>
          </div>
          <div className="relative mt-3 h-[24px]">
            <span
              aria-hidden
              className="absolute top-1/2 h-0 w-full -translate-y-1/2 border-t-2 border-dashed border-white/30"
            />
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-[10px] -translate-y-1/2 rounded-full"
              style={{
                width: `${Math.max(dial * 100, 1)}%`,
                minWidth: 3,
                background: AMBER,
                transition: 'width 90ms ease',
              }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={dial}
              onChange={(e) => setDial(Number(e.target.value))}
              onPointerUp={commitDial}
              onKeyUp={commitDial}
              onTouchEnd={commitDial}
              className="open-qdial absolute inset-0 w-full"
              aria-label="machine quality in team units: 1 — a team, 0 — falls short"
            />
          </div>
          <div className="mt-1 tabular-nums text-[15px] text-white/50">
            machine · <span className="text-white">through the gate and selection</span>{' '}
            <span className="whitespace-nowrap text-[13px] text-white/45">— rate it yourself</span>
          </div>
          <div className="mt-2 h-[10px] w-full rounded-full bg-[#3A3A3E]" />
          <div className="mt-1.5 tabular-nums text-[15px] text-white/50">
            team · <span className="text-white">review and QA</span>
          </div>
          {hallLine}
        </div>
        <div className="py-4" style={{ opacity: rowsIn[3] }}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[12px] text-white/45">total</span>
            <span className="tabular-nums text-[34px] font-bold" style={{ color: AMBER }}>
              ×{multShown.toLocaleString(INTL_LOCALE)}
            </span>
          </div>
          <div className="mt-2 text-right tabular-nums text-[15px] text-white/50">
            <span className="whitespace-nowrap">
              cheaper <span className="text-white">×{multMoney}</span>
            </span>{' '}
            ·{' '}
            <span className="whitespace-nowrap">
              faster <span className="text-white">×{multTime}</span>
            </span>{' '}
            ·{' '}
            <span className="whitespace-nowrap">
              quality <span className="text-white">×{fmtScore(dial)}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="hidden overflow-x-auto min-[760px]:block">
        <table className="w-full max-w-[820px] border-collapse tabular-nums">
          <thead>
            <tr className="border-b border-white/10">
              <th className={th} />
              <th className={th}>machine</th>
              <th className={th}>team</th>
              <th className={`${th} w-[168px]`} />
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/10" style={{ opacity: rowsIn[0] }}>
              <td className={tdLabel}>price</td>
              <td className={td}>
                ~{fmtR(machineUsdMonth)}
                <span className="text-[12px] font-normal text-white/40"> /mo</span>
              </td>
              <td className={td}>
                <span className="tune-num">{fmtR(teamUsd)}</span>
              </td>
              <td className={tdMult} style={{ color: 'rgba(255,255,255,0.9)' }}>
                ×{multMoney}
              </td>
            </tr>
            <tr className="border-b border-white/10" style={{ opacity: rowsIn[1] }}>
              <td className={tdLabel}>speed</td>
              <td className={td}>{fmtDur(D)}</td>
              <td className={td}>
                <span className="tune-num">{fmtDur(teamDays)}</span>
              </td>
              <td className={tdMult} style={{ color: 'rgba(255,255,255,0.9)' }}>
                ×{multTime}
              </td>
            </tr>
            <tr className="border-b border-white/10" style={{ opacity: rowsIn[2] }}>
              <td className={tdLabel}>
                quality
                <Fn n={7} />
              </td>
              <td className="py-3 pr-8 text-[14px] text-white/75">
                through the gate and selection
              </td>
              <td className="py-3 pr-8 text-[14px] text-white/75">review and QA</td>
              <td className={tdMult} style={{ color: 'rgba(255,255,255,0.9)' }}>
                {dialControl}
                {hallLine}
              </td>
            </tr>
            <tr style={{ opacity: rowsIn[3] }}>
              <td className={tdLabel}>total</td>
              <td className={td}>≈{fmtUsdShort(machineTotal)}</td>
              <td className={td}>≈{fmtUsdShort(teamTotal)}</td>
              <td
                className="py-3 text-[20px] font-bold min-[760px]:text-[26px]"
                style={{ color: AMBER }}
              >
                ×{multShown.toLocaleString(INTL_LOCALE)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Col({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`w-full max-w-[900px] ${className ?? ''}`}>{children}</div>
}

const NUMBER_RU = new Intl.NumberFormat(INTL_LOCALE)

function Fn({ n }: { n: number }) {
  return (
    <sup className="fn-mark" aria-label={`Footnote ${n}`}>
      <style>{`
        sup.fn-mark{font-feature-settings:'numr';font-size:1em;vertical-align:baseline;top:auto;line-height:0}
      `}</style>
      {n}
    </sup>
  )
}

function H2({
  children,
  id,
  className,
}: {
  children: React.ReactNode
  id?: string
  className?: string
}) {
  return (
    <h2
      id={id}
      className={`scroll-mt-24 text-[34px] font-bold leading-[1.05] tracking-tight min-[760px]:text-[52px] ${className ?? ''}`}
    >
      {children}
    </h2>
  )
}

/**
 * The whole landing page below the header: hero with the commit dunes, the
 * live terminal, the 24-hour timelapse, the repository map, the operator,
 * price / speed / quality and the footnotes.
 *
 * All numbers arrive as props (see lib/data.ts); brand and copy come from
 * site.config.ts; story content lives in content/*.
 */
export function OpenScene({
  pulse,
  commits,
  feed,
  stats,
}: {
  /** Built on the server from activity (lib/pulse.ts). */
  pulse: Pulse | null
  commits: Commit[]
  feed: Feed | null
  stats: Stats
}) {
  const snapshot = useMemo(() => (feed ? toSnapshot(feed) : null), [feed])
  const startDay = pulse?.days[0] ?? null
  const endDay = pulse?.lastDay ?? null
  const machine = useMemo(
    () => ({ feed: snapshot, commits, stats, startDay, endDay }),
    [snapshot, commits, stats, startDay, endDay]
  )
  const duneDays = pulse?.days ?? []
  const duneSeries: DuneSeries[] = pulse?.series ?? []
  const heroTotal = pulse?.total ?? 0
  const heroDays = duneDays.length
  const heroLastTotal = pulse?.lastTotal ?? null
  const heroLastWord = pulse && !pulse.lastIsYesterday ? fmtDay(pulse.lastDay) : 'yesterday'
  const heroDay24 = stats.commitsLast24h > 0 ? stats.commitsLast24h : null
  const heroLast = heroLastTotal ?? heroDay24 ?? 0

  const [dataEndX, setDataEndX] = useState(0.87)
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth
      if (vw < 760) {
        setDataEndX((vw - 20 + 0.06 * vw) / (1.12 * vw))
        return
      }
      const textRight = vw / 2 + Math.min(vw - 112, 1400) / 2
      setDataEndX((textRight + 0.06 * vw) / (1.12 * vw))
    }
    calc()
    window.addEventListener('resize', calc, { passive: true })
    return () => window.removeEventListener('resize', calc)
  }, [])
  const crew = DEFAULT_CREW
  const costs = {
    teamUsd: TEAM_USD_PER_MONTH,
    machineUsdMonth: stats.machineCosts.subscriptionsUsdPerMonth,
  }
  const [timeCalc, setTimeCalc] = useState({
    teamDays: Math.round(54 * defaultTimeMult()),
    D: 54,
  })
  const [gridJoker, setGridJoker] = useState(false)

  return (
    <MachineProvider value={machine}>
      <div className="min-h-screen bg-[#000000] text-[#F0F0F0] antialiased">
        <PageProgress />
        <RevealHost selector="section[id]:not(#footnotes)" />

        <style>{`
        @keyframes map-shimmer-once-run {
          0% { transform: translateX(-140%) skewX(-12deg); }
          100% { transform: translateX(480%) skewX(-12deg); }
        }
        .map-shimmer-once {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent);
          animation: map-shimmer-once-run 1.1s cubic-bezier(0.25, 0.1, 0.25, 1) 1 both;
        }
        @keyframes map-tile-flash {
          0%, 100% { filter: none; }
          40% { filter: brightness(1.4); }
        }
        @keyframes map-tile-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-2px) rotate(-0.35deg); }
          55% { transform: translateX(2px) rotate(0.35deg); }
          80% { transform: translateX(-1px) rotate(-0.15deg); }
        }
        @keyframes map-tile-breath {
          0%, 100% { transform: scale(1); }
          45% { transform: scale(1.02); }
        }
        @keyframes map-tile-shine-run {
          0% { transform: translateX(-130%) skewX(-14deg); }
          100% { transform: translateX(260%) skewX(-14deg); }
        }
        .map-tile-shine {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          animation: map-tile-shine-run 0.9s cubic-bezier(0.25, 0.1, 0.25, 1) 1 both;
        }
        @keyframes map-shimmer-run {
          0% { transform: translateX(-140%) skewX(-12deg); }
          14% { transform: translateX(480%) skewX(-12deg); }
          100% { transform: translateX(480%) skewX(-12deg); }
        }
        .map-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          animation: map-shimmer-run 8s linear infinite;
        }
        a, button {
          transition:
            color 0.32s cubic-bezier(0.4, 0, 0.6, 1),
            background-color 0.32s cubic-bezier(0.4, 0, 0.6, 1),
            border-color 0.32s cubic-bezier(0.4, 0, 0.6, 1),
            opacity 0.24s ease;
        }
        .tune-num { border-bottom: 1.5px dashed rgba(255,255,255,0.4); padding-bottom: 1px; }
      `}</style>

        <main className="relative mx-auto max-w-[1400px] px-0 pt-3 min-[760px]:px-6 min-[1500px]:px-0">
          {/* Hero: headline, the dunes (commits per day by zone), live terminal */}
          <section id="live" data-reveal-skip className="relative text-white">
            <div className="flex min-h-[calc(100svh_-_74px)] flex-col min-[760px]:min-h-[calc(100svh_-_83px)]">
              <div className="relative px-5 pt-[max(24px,calc(28svh_-_115px))] min-[760px]:px-0 min-[760px]:pt-[max(32px,calc(28svh_-_124px))]">
                <div>
                  <p className="text-[17px] font-bold leading-[25px] text-white">
                    {siteConfig.hero.kicker}
                  </p>
                  <Col>
                    <h1 className="mt-4 max-w-[900px] text-[36px] font-bold leading-[1.02] tracking-tight min-[760px]:text-[55px]">
                      {siteConfig.hero.title}
                    </h1>
                  </Col>
                </div>
                <p className="mt-3 max-w-[720px] text-[15px] leading-relaxed text-white/60 min-[1100px]:text-[17px]">
                  {NUMBER_RU.format(heroTotal)} {siteConfig.hero.unit.many} in {heroDays}{' '}
                  {plural(heroDays, 'day', 'days', 'days')} — live feed below.
                </p>
                <div className="relative z-10 mt-12" />
              </div>

              <div aria-hidden className="flex-1" />
              <div className="dark relative left-1/2 mt-8 min-h-[calc(23.333vw_+_42px)] w-screen flex-[2_1_0%] -translate-x-1/2 overflow-hidden min-[760px]:mt-10 min-[760px]:min-h-[calc(23.333vw_-_67px)]">
                <div className="absolute inset-y-0 -left-[6vw] -right-[6vw]">
                  {duneDays.length > 0 ? (
                    <DuneAreaChart
                      stretch
                      days={duneDays}
                      series={duneSeries}
                      chrome="bare"
                      height={200}
                      entrance="pen"
                      penColor={AMBER}
                      dataEndX={dataEndX}
                      penHoverLabel={`${heroLastWord} · ${heroLast} ${siteConfig.hero.unit.many}`}
                      yLabel={siteConfig.hero.chartLabel}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <AfterDune total={heroTotal} days={heroDays} last={heroLast} lastWord={heroLastWord} />
            <div className="pb-8 min-[760px]:pb-10" />
          </section>

          {/* "A machine day in one minute": the statement and the 24-hour timelapse */}
          <DuneStatement ether={snapshot} pages={stats.sitePages} />

          {/* The repository map: three readings of the same commits */}
          <MapScrolly gridOn={gridJoker} onGrid={setGridJoker} />

          {/* The human in the loop */}
          <section id="operator" className="px-5 pb-4 pt-36 min-[760px]:px-0">
            <Col>
              <H2>{siteConfig.operator.title}</H2>
            </Col>
            <div className="mt-12 grid w-full items-start gap-x-12 gap-y-8 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(720px,940px)]">
              <div className="min-w-0">
                <p className="max-w-[720px] text-[16px] leading-relaxed text-[#C9C9CE] min-[760px]:text-[18px]">
                  {siteConfig.operator.bio}
                </p>
              </div>
              <div>
                <div
                  className="relative overflow-hidden rounded-xl border border-white/10"
                  style={{ aspectRatio: '21 / 9' }}
                >
                  <Image
                    src={siteConfig.operator.photo.src}
                    alt={siteConfig.operator.photo.alt}
                    fill
                    sizes="(min-width: 760px) 1200px, 100vw"
                    className="object-cover"
                    style={{
                      objectPosition: siteConfig.operator.photo.position,
                      filter: OPER_FX.filter,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: OPER_FX.overlay }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Price. Speed. Quality. */}
          <section id="axiom" className="px-5 pb-4 pt-16 min-[760px]:px-0">
            <OvertureScene />
          </section>

          <SpeedTact days={duneDays} crew={crew} onTime={setTimeCalc} />

          <FunnelTact />

          <section id="summary" className="px-5 pt-36 min-[760px]:px-0">
            <TriangleCloseScene
              teamUsd={costs.teamUsd}
              machineUsdMonth={costs.machineUsdMonth}
              teamDays={timeCalc.teamDays}
              D={timeCalc.D}
            />
          </section>
        </main>

        {/* Footnotes and methodology (content/footnotes.ts) */}
        <section id="footnotes" className="bg-[#F0F0F0] pb-12 pt-10 text-[#111111]">
          <div className="mx-auto max-w-[1400px] px-5 min-[760px]:px-6 min-[1500px]:px-0">
            <div className="tabular-nums text-[12px] text-[#8A8A8A]">footnotes and methodology</div>
            <ol className="mt-4 list-decimal space-y-3 pl-5 tabular-nums text-[12px] leading-relaxed text-[#111111]/55 min-[1024px]:columns-2 min-[1024px]:gap-12">
              {FOOTNOTES.map((text, i) => (
                <li key={i} className="break-inside-avoid" id={`fn-${i + 1}`}>
                  {text}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {gridJoker ? <BlueprintOverlay /> : null}
      </div>
    </MachineProvider>
  )
}

/** Easter egg of the Frontend region: layout guides over the whole page. */
function BlueprintOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      <div className="absolute inset-y-0 left-1/2 w-full max-w-[1400px] -translate-x-1/2 border-x border-dashed border-[color:var(--accent)]/60 min-[760px]:w-[calc(100%-48px)]">
        <div className="absolute inset-y-0 left-0 w-full max-w-[760px] border-r border-dashed border-[color:var(--accent)]/60" />
        <span className="absolute left-2 top-24 rounded-full bg-black px-2 py-0.5 tabular-nums text-[10px] text-[color:var(--accent)]">
          C1 · container 1400
        </span>
        <span className="absolute left-2 top-32 rounded-full bg-black px-2 py-0.5 tabular-nums text-[10px] text-[color:var(--accent)] min-[760px]:left-[calc(min(100%,760px)-110px)]">
          C3 · column 760
        </span>
      </div>
      <div className="absolute inset-x-0 top-[70px] border-t border-dashed border-[color:var(--accent)]/60" />
    </div>
  )
}
