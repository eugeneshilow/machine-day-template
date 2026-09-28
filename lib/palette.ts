/** Categorical fallback colors for chart series without an explicit color. */
export const CATEGORICAL = [
  '#4E79A7',
  '#F28E2B',
  '#59A14F',
  '#B07AA1',
  '#76B7B2',
  '#E15759',
  '#EDC948',
  '#FF9DA7',
  '#9C755F',
  '#BAB0AC',
] as const

/** Stable color for series index i (wraps around the palette). */
export function seriesColor(i: number): string {
  return CATEGORICAL[((i % CATEGORICAL.length) + CATEGORICAL.length) % CATEGORICAL.length]
}

/** Warm status gradient used by the "whole company" map and big headings. */
export const CHAMPAGNE_GRADIENT = ['#E8C878', '#D8A45C', '#C57E45', '#A65B38'] as const
export const COPPER = '#C57E45'
