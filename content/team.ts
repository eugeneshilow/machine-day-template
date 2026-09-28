/**
 * The "same work by a team" hypothesis: roles it would take to do the
 * machine's work by hand, with the full monthly cost of each role (USD,
 * salary plus taxes, hardware and hiring). Edit freely — the price row and
 * the final multipliers are recalculated from this list.
 */
export const TEAM_ROLES: Array<{ role: string; usdPerMonth: number; fte: number }> = [
  { role: 'tech lead (CTO)', usdPerMonth: 8125, fte: 1 },
  { role: 'frontend', usdPerMonth: 5000, fte: 1 },
  { role: 'backend', usdPerMonth: 5750, fte: 1 },
  { role: 'devops', usdPerMonth: 6000, fte: 1 },
  { role: 'qa', usdPerMonth: 3750, fte: 1 },
  { role: 'designer', usdPerMonth: 4375, fte: 1 },
  { role: 'illustrator', usdPerMonth: 2125, fte: 1 },
  { role: 'managing editor', usdPerMonth: 4000, fte: 1 },
  { role: 'news writer', usdPerMonth: 2750, fte: 1 },
  { role: 'longform writer', usdPerMonth: 3250, fte: 1 },
  { role: 'product', usdPerMonth: 4750, fte: 1 },
  { role: 'researcher', usdPerMonth: 4125, fte: 1 },
  { role: 'hr', usdPerMonth: 2375, fte: 1 },
]

/** Monthly cost of the whole team, USD. */
export const TEAM_USD_PER_MONTH = TEAM_ROLES.reduce((s, r) => s + r.usdPerMonth * r.fte, 0)
