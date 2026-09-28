import { siteConfig } from '@/site.config'

/** Text wordmark with a static accent cursor: "name_" */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      {siteConfig.name}
      <span style={{ color: siteConfig.accent }}>_</span>
    </span>
  )
}

/** Square app mark: dark tile with an accent underscore. */
export function AppMark() {
  return (
    <span aria-hidden className="sq relative h-[34px] w-[34px] shrink-0 bg-[#111111]">
      <span
        className="absolute bottom-[7px] left-[8px] h-[5px] w-[18px]"
        style={{ backgroundColor: siteConfig.accent }}
      />
    </span>
  )
}
