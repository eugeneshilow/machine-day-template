import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Do not write AGENTS.md / CLAUDE.md into the project on `next dev`.
  agentRules: false,
  // No floating dev-tools badge while you work on the page.
  devIndicators: false,
  // For a fully static build (any static host, no server): uncomment and
  // remove `revalidate` from app/page.tsx.
  // output: 'export',
}

export default nextConfig
