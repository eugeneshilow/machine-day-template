'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { Commit, Stats } from '@/lib/data'
import type { FeedSnapshot } from '@/lib/feed'

/** Data the deep parts of the scene read (terminal, feed tails, counters). */
export type MachineContextValue = {
  feed: FeedSnapshot | null
  commits: Commit[]
  stats: Stats
  /** First day of the activity series (`YYYY-MM-DD`): the pace is counted from it. */
  startDay: string | null
  /** Last day of the activity series (`YYYY-MM-DD`). */
  endDay: string | null
}

const MachineContext = createContext<MachineContextValue | null>(null)

export function MachineProvider({
  value,
  children,
}: {
  value: MachineContextValue
  children: ReactNode
}) {
  return <MachineContext.Provider value={value}>{children}</MachineContext.Provider>
}

export function useMachine(): MachineContextValue {
  const ctx = useContext(MachineContext)
  if (!ctx) throw new Error('useMachine() must be used inside <MachineProvider>')
  return ctx
}
