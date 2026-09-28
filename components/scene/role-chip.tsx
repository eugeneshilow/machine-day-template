import { siteConfig } from '@/site.config'

export const razWord = (n: number) => (n === 1 ? 'time' : 'times')

/** "fact" = counted by the machine, "diy" = an estimate the reader can tweak. */
export function RoleChip({ kind }: { kind: 'fact' | 'diy' }) {
  return kind === 'fact' ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-2.5 py-0.5 tabular-nums text-[11px] text-white/60">
      <span
        className="h-[5px] w-[5px] rounded-full"
        style={{ backgroundColor: siteConfig.accent }}
      />
      fact — counted by the machine
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-dashed border-white/25 px-2.5 py-0.5 tabular-nums text-[11px] text-white/60">
      estimate — tweak it yourself
    </span>
  )
}
