'use client'

import { useEffect } from 'react'

const HIDE_MS = 700
const FALLBACK_DELAY_MS = 2400

export function RevealHost({ selector = 'section[id], footer' }: { selector?: string }) {
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-reveal-live', '')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const targets = [...document.querySelectorAll<HTMLElement>(selector)].filter(
      (el) => !el.hasAttribute('data-reveal-skip')
    )
    const t0 = performance.now()
    let staggerIndex = 0
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          if (performance.now() - t0 < 300) {
            el.style.transitionDelay = `${staggerIndex * 90}ms`
            staggerIndex += 1
          }
          el.setAttribute('data-in', '')
          el.addEventListener(
            'transitionend',
            () => {
              el.setAttribute('data-settled', '')
              el.style.transitionDelay = ''
            },
            { once: true }
          )
          setTimeout(() => el.setAttribute('data-settled', ''), HIDE_MS + 1200)
          io.unobserve(el)
        }
      },
      { threshold: 0 }
    )
    for (const el of targets) io.observe(el)
    return () => {
      io.disconnect()
      root.removeAttribute('data-reveal-live')
      for (const el of targets) {
        el.removeAttribute('data-in')
        el.removeAttribute('data-settled')
      }
    }
  }, [selector])
  const parts = selector.split(',').map((s) => s.trim())
  const base = parts.join(', ')
  const skip = ':not([data-reveal-skip])'
  const hidden = parts.map((s) => `${s}${skip}:not([data-in]):not([data-settled])`).join(', ')
  const fallback = parts
    .map((s) => `html:not([data-reveal-live]) ${s}${skip}:not([data-in])`)
    .join(', ')
  const settled = parts.map((s) => `${s}[data-settled]`).join(', ')
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        ${base} {
          transition: opacity ${HIDE_MS}ms ease-out, transform ${HIDE_MS}ms ease-out;
        }
        ${hidden} {
          opacity: 0;
          transform: translateY(12px);
        }
        ${fallback} {
          animation: vc-reveal-fallback ${HIDE_MS}ms ease-out ${FALLBACK_DELAY_MS}ms forwards;
        }
        ${settled} {
          transform: none;
          transition: none;
        }
        @keyframes vc-reveal-fallback {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      }
    `}</style>
  )
}
