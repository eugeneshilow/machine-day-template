import { ZONES, type ZoneKey } from './data'

/**
 * Work zones of the repository: labels and colors.
 * Colors are CSS variables with fallbacks, so a theme can override them in CSS.
 */
export const ZONE_LABELS: Record<ZoneKey, string> = {
  docs: 'Documentation',
  journal: 'Journal',
  front: 'Frontend',
  back: 'Backend',
  admin: 'Admin',
  ci: 'CI/CD',
}

export const ZONE_COLORS: Record<ZoneKey, string> = {
  docs: 'var(--zn-doc, #0071E3)',
  journal: 'var(--zn-j, #3FD8B8)',
  front: 'var(--zn-front, #BA62FC)',
  back: 'var(--zn-back, #6DD400)',
  admin: 'var(--zn-adm, #FF2E54)',
  ci: 'var(--zn-ci, #45657D)',
}

/** Business view of the same commits (the "whole company" map). */
export const BIZ_LABELS = {
  dev: 'Development',
  strategy: 'Strategy',
  product: 'Product',
  marketing: 'Marketing',
  ops: 'Operations',
} as const

const ALL_LABELS: Record<string, string> = { ...ZONE_LABELS, ...BIZ_LABELS }

/** Display label of a zone id (work zone or business zone); unknown ids pass through. */
export function zoneLabel(id: string): string {
  return ALL_LABELS[id] ?? id
}

export { ZONES, type ZoneKey }
