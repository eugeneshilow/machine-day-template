'use client'

import { useEffect, useRef, useState } from 'react'

import { siteConfig, type NavLink } from '@/site.config'

import { Wordmark } from './logo'

/** 8×8 pixel book, the built-in 'pixel-book' nav icon. */
function PixelBook() {
  const dark = '#C25A10'
  const a = siteConfig.accent
  const w = '#FFFFFF'
  const rows = [
    [dark, a, a, a, a, a],
    [dark, a, w, w, w, a],
    [dark, a, a, a, a, a],
    [dark, a, w, w, a, a],
    [dark, a, a, a, a, a],
    [dark, a, a, a, a, a],
  ]
  return (
    <svg width="18" height="18" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden>
      {rows.flatMap((row, y) =>
        row.map((fill, x) => (
          <rect key={`${x}-${y}`} x={x + 1} y={y + 1} width="1" height="1" fill={fill} />
        ))
      )}
    </svg>
  )
}

function NavChip({ link }: { link: NavLink }) {
  return (
    <a
      href={link.href}
      className="sq flex h-[30px] shrink-0 items-center whitespace-nowrap border border-white/[0.22] py-0 pl-[9px] pr-3 text-[15px] font-semibold leading-none text-[#F0F0F0] transition-colors duration-500 hover:border-[#F0F0F0]"
    >
      {link.icon ? (
        <span aria-hidden className="mr-[7px] flex items-center">
          {link.icon === 'pixel-book' ? (
            <PixelBook />
          ) : (
            <span className="text-[15px] leading-none">{link.icon}</span>
          )}
        </span>
      ) : null}
      <span>{link.label}</span>
    </a>
  )
}

function MenuButton({
  open,
  onClick,
  panel = false,
}: {
  open: boolean
  onClick: () => void
  panel?: boolean
}) {
  return (
    <button
      type="button"
      aria-label="Open navigation"
      aria-expanded={open}
      onClick={onClick}
      className="sq grid h-[30px] w-[30px] shrink-0 cursor-pointer place-items-center text-[#F0F0F0] hover:bg-white/10 hover:text-[color:var(--accent)]"
    >
      {panel ? (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
          <path d="M9.5 5v14" />
          <path d="M6.5 8.5h.01M6.5 11.5h.01" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 5h16" />
          <path d="M4 12h16" />
          <path d="M4 19h16" />
        </svg>
      )}
    </button>
  )
}

function SearchButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      aria-label="Search"
      className="sq grid h-[30px] w-[30px] shrink-0 place-items-center text-[#F0F0F0] transition-colors hover:bg-white/10 hover:text-[color:var(--accent)]"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="10" cy="10" r="6.5" />
        <path d="M15 15 L20.2 20.2" />
      </svg>
    </a>
  )
}

/** Dark, non-sticky site header: menu, wordmark, nav chips, search. */
export function SiteHeader() {
  const { header } = siteConfig
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const menu = open ? (
    <div className="absolute left-3 top-[52px] z-50 w-[220px] rounded-[18px] border border-[#3A3A40] bg-[#1B1B1B] p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] min-[760px]:top-[58px]">
      {header.nav.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="block rounded-[12px] px-3 py-2 text-[15px] text-[#F0F0F0] hover:bg-white/10"
        >
          {link.label}
        </a>
      ))}
    </div>
  ) : null

  return (
    <header
      ref={menuRef}
      className="relative z-40 bg-black text-[#F0F0F0] min-[1024px]:border-b min-[1024px]:border-white/10"
    >
      {/* mobile */}
      <div className="flex flex-col px-5 py-4 min-[760px]:hidden">
        <div className="flex h-[30px] shrink-0 items-center">
          <div className="-ml-[7px] mr-2">
            <MenuButton panel open={open} onClick={() => setOpen((v) => !v)} />
          </div>
          <a
            href={header.homeHref}
            className="flex h-[30px] shrink-0 items-center text-[19px] font-bold leading-none tracking-[-0.01em]"
          >
            <Wordmark />
          </a>
        </div>
      </div>
      {/* tablet and desktop */}
      <div className="hidden h-[70px] items-center px-[30px] min-[760px]:flex min-[1110px]:grid min-[1110px]:grid-cols-[290px_minmax(0,1fr)] min-[1110px]:px-0">
        <span className="flex items-center gap-2 min-[1110px]:pl-[12px]">
          <MenuButton open={open} onClick={() => setOpen((v) => !v)} />
          <a
            href={header.homeHref}
            className="flex h-[30px] shrink-0 items-center text-[19px] font-bold leading-none tracking-[-0.01em]"
          >
            <Wordmark />
          </a>
        </span>
        <div className="ml-auto min-w-0 items-center min-[760px]:flex min-[1110px]:col-start-2 min-[1110px]:row-start-1 min-[1110px]:ml-0">
          <nav className="hidden items-center gap-[5px] min-[1024px]:flex">
            {header.nav.map((link) => (
              <NavChip key={link.href} link={link} />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 min-[1110px]:mr-[12px]">
            {header.searchHref ? <SearchButton href={header.searchHref} /> : null}
          </div>
        </div>
      </div>
      {/* tablet: chips on their own row */}
      <nav className="hidden items-center gap-[5px] overflow-x-auto px-[30px] pb-[35px] min-[760px]:flex min-[1024px]:hidden">
        {header.nav.map((link) => (
          <NavChip key={link.href} link={link} />
        ))}
      </nav>
      {menu}
    </header>
  )
}
