import { siteConfig, type FooterLink } from '@/site.config'

import { AppMark } from './logo'

function FooterIcon({ icon }: { icon: FooterLink['icon'] }) {
  const common = { 'aria-hidden': true, className: 'h-[18px] w-[18px]', viewBox: '0 0 24 24' }
  const stroke = { stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }
  switch (icon) {
    case 'threads':
      return (
        <svg {...common} fill="none">
          <circle cx="12" cy="12" r="4" {...stroke} />
          <path
            d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"
            {...stroke}
            strokeLinecap="round"
          />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common} fill="none">
          <rect x="3" y="5" width="18" height="14" rx="1.5" {...stroke} />
          <path d="m4 7 8 6 8-6" {...stroke} strokeLinejoin="round" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" {...stroke} />
          <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M4 4l16 16M20 4 4 20" {...stroke} strokeLinecap="round" />
        </svg>
      )
    case 'github':
      return (
        <svg {...common}>
          <path
            d="M9 19c-4 1.5-4-2-6-2.5m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.3 5.8 2.6 5.8 2.6a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"
            {...stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'linkedin':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" {...stroke} />
          <path
            d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"
            {...stroke}
            strokeLinecap="round"
          />
        </svg>
      )
    case 'telegram':
      return (
        <svg {...common}>
          <path d="M21 4 3 11l6 2 2 6 3-4 5 4 2-15Z" {...stroke} strokeLinejoin="round" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path
            d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"
            {...stroke}
            strokeLinecap="round"
          />
        </svg>
      )
  }
}

/** Light footer: app mark and name, link columns from site.config.ts. */
export function SiteFooter() {
  const { footer } = siteConfig
  return (
    <footer className="border-t border-[#E3E3E3] bg-[#F0F0F0] px-3 py-10 text-[#111111] min-[760px]:px-6 min-[1500px]:px-0">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col gap-8 min-[760px]:flex-row min-[760px]:items-start min-[760px]:justify-between">
          <div className="flex items-start gap-4 min-[760px]:gap-[10px]">
            <AppMark />
            <div className="text-[13px] leading-[15px] text-[#8A8A8A]">
              <div className="font-medium text-[#111111]">{siteConfig.name}</div>
              <div className="mt-[5px]">{footer.copyright}</div>
            </div>
          </div>
          {footer.columns.map((col, ci) => (
            <div key={col.title}>
              <h2 className="text-[17px] font-bold leading-5">{col.title}</h2>
              <div
                className={
                  ci === footer.columns.length - 1
                    ? 'mt-[10px] flex flex-col gap-5 min-[760px]:gap-[6px]'
                    : 'mt-[10px] flex flex-wrap items-center gap-5 min-[760px]:gap-[30px]'
                }
              >
                {col.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-[7px] text-[13px] leading-[15px] text-[#111111]"
                  >
                    <span
                      className={`sq grid shrink-0 place-items-center bg-[#F0F0F2] text-[#111111] transition-colors group-hover:bg-[#111111] group-hover:text-[color:var(--accent)] group-focus-visible:bg-[#111111] group-focus-visible:text-[color:var(--accent)] ${
                        ci === footer.columns.length - 1 ? 'h-6 w-6' : 'h-[30px] w-[30px]'
                      }`}
                    >
                      <FooterIcon icon={link.icon} />
                    </span>
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-5 text-[15px] leading-5 text-[#8A8A8A] min-[760px]:gap-x-[15px] min-[760px]:gap-y-[5px]">
          {footer.bottomLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-[#111111]">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
