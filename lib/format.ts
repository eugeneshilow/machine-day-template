import { siteConfig } from '@/site.config'

/** "$56,375" */
export function fmtUsd(usd: number): string {
  return `$${Math.round(usd).toLocaleString(siteConfig.locale)}`
}

/** "$27K", "$2.2M" */
export function fmtUsdShort(usd: number): string {
  return usd >= 1e6
    ? `$${(usd / 1e6).toLocaleString(siteConfig.locale, { maximumFractionDigits: usd >= 1e7 ? 0 : 1 })}M`
    : `$${Math.round(usd / 1e3).toLocaleString(siteConfig.locale)}K`
}

/** "Tue, Sep 23, 2026" in the given time zone. */
export function fmtWeekdayDate(ms: number, timeZone: string): string {
  return new Date(ms).toLocaleDateString(siteConfig.locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  })
}
