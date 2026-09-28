import { SiteFooter } from '@/components/site/footer'
import { SiteHeader } from '@/components/site/header'
import { OpenScene } from '@/components/scene/scene'
import { getMachineData } from '@/lib/data'
import { buildPulse } from '@/lib/pulse'

// Re-read the data source at most once an hour (ISR). With the bundled
// static snapshot this only refreshes the "yesterday" labels.
export const revalidate = 3600

export default async function Page() {
  const data = await getMachineData()
  const pulse = buildPulse(data.activity, Date.now())
  return (
    <div className="min-h-screen bg-black text-[#F0F0F0]">
      <SiteHeader />
      <OpenScene pulse={pulse} commits={data.commits} feed={data.feed} stats={data.stats} />
      <SiteFooter />
    </div>
  )
}
