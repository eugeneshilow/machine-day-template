'use client'

// docs/engine/1-attention/4-served/site/pages/open/refs/pill-overlay-2026-08-29.md).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const AMBER = '#FF7A1A'

type SheetPhase = 'closed' | 'open' | 'closing'

function SheetOverlay({
  phase,
  onClose,
  onGone,
  kicker,
  title,
  width = 'wide',
  children,
}: {
  phase: SheetPhase
  onClose: () => void
  onGone: () => void
  kicker: string
  title: string
  width?: 'wide' | 'narrow'
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (!mounted) return null
  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex overflow-y-auto p-4 min-[760px]:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        animation:
          phase === 'closing'
            ? 'vc-scrim-out 800ms cubic-bezier(0.645, 0.045, 0.355, 1) both'
            : 'vc-scrim-in 800ms cubic-bezier(0.645, 0.045, 0.355, 1) both',
      }}
    >
      <style>{`@keyframes vc-scrim-in{from{background:rgba(44,44,46,0);-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px)}to{background:rgba(44,44,46,0.62);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}}@keyframes vc-scrim-out{from{background:rgba(44,44,46,0.62);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}to{background:rgba(44,44,46,0);-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px)}}@keyframes vc-sheet-up{from{transform:translateY(100vh)}to{transform:none}}@keyframes vc-sheet-dissolve{from{opacity:1}to{opacity:0}}@media (prefers-reduced-motion: reduce){@keyframes vc-sheet-up{from{opacity:0}to{opacity:1}}}`}</style>
      <div
        className={`m-auto w-full rounded-[26px] bg-[#000000] p-6 text-[#F0F0F0] min-[760px]:p-12 ${width === 'narrow' ? 'max-w-[680px]' : 'max-w-[1200px]'}`}
        style={{
          animation:
            phase === 'closing'
              ? 'vc-sheet-dissolve 800ms cubic-bezier(0.455, 0.03, 0.515, 0.955) both'
              : 'vc-sheet-up 800ms cubic-bezier(0.645, 0.045, 0.355, 1) both',
          willChange: 'transform',
        }}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && phase === 'closing') onGone()
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="tabular-nums text-[13px] text-white/45">{kicker}</div>
            <h4 className="mt-2 text-[28px] font-bold leading-[1.1] tracking-tight min-[760px]:text-[40px]">
              {title}
            </h4>
          </div>
          <button
            type="button"
            aria-label="close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[.1] text-[14px] text-white/70 transition-colors hover:bg-white/[.16] hover:text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export function SceneSheet({
  label,
  kicker,
  title,
  children,
}: {
  label: string
  kicker: string
  title: string
  children: React.ReactNode
}) {
  const [phase, setPhase] = useState<SheetPhase>('closed')
  const close = () => setPhase((p) => (p === 'open' ? 'closing' : p))
  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setPhase('open')}
          className="group flex h-[56px] items-center gap-4 rounded-full pl-6 pr-2.5 text-[17px] font-bold tracking-[-0.022em] text-[#F0F0F0] backdrop-blur-[7px] transition-colors"
          style={{ background: 'rgba(31,31,34,0.72)' }}
        >
          {label}
          <span className="h-9 w-9 rounded-full" style={{ background: AMBER }} aria-hidden>
            <svg
              viewBox="0 0 36 36"
              className="h-full w-full opacity-80 transition-opacity duration-200 group-hover:opacity-100"
            >
              <path
                fill="#FFFFFF"
                d="m24 16.5h-4.5v-4.5c0-.8286-.6719-1.5-1.5-1.5s-1.5.6714-1.5 1.5v4.5h-4.5c-.8281 0-1.5.6714-1.5 1.5s.6719 1.5 1.5 1.5h4.5v4.5c0 .8286.6719 1.5 1.5 1.5s1.5-.6714 1.5-1.5v-4.5h4.5c.8281 0 1.5-.6714 1.5-1.5s-.6719-1.5-1.5-1.5z"
              />
            </svg>
          </span>
        </button>
      </div>
      {phase !== 'closed' ? (
        <SheetOverlay
          phase={phase}
          onClose={close}
          onGone={() => setPhase('closed')}
          kicker={kicker}
          title={title}
        >
          {children}
        </SheetOverlay>
      ) : null}
    </>
  )
}
