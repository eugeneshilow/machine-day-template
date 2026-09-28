export type DiveCluster = { label: string; n: number }
export type DiveZone = { total: number; sub: DiveCluster[] }

export const MAP_DIVE: Record<string, DiveZone> = {
  docs: {
    total: 1678,
    sub: [
      { label: 'docs/strategy', n: 500 },
      { label: 'docs/product', n: 306 },
      { label: 'docs/operations', n: 160 },
      { label: 'docs/DECISIONS.md', n: 157 },
      { label: 'docs/marketing', n: 136 },
      { label: 'docs/engine', n: 122 },
      { label: 'docs/admin', n: 103 },
      { label: 'everything else', n: 194 },
    ],
  },
  journal: {
    total: 1010,
    sub: [
      { label: 'docs/strategy', n: 376 },
      { label: 'docs/engine', n: 215 },
      { label: 'docs/product', n: 158 },
      { label: 'docs/admin', n: 77 },
      { label: 'docs/operations', n: 60 },
      { label: 'docs/marketing', n: 55 },
      { label: 'docs/public', n: 49 },
      { label: 'everything else', n: 20 },
    ],
  },
  front: {
    total: 711,
    sub: [
      { label: 'app/tools', n: 165 },
      { label: 'components/site51', n: 92 },
      { label: 'components/base', n: 92 },
      { label: 'app/test', n: 74 },
      { label: 'app/rubench', n: 40 },
      { label: 'app/news', n: 27 },
      { label: 'app/app-shell.tsx', n: 26 },
      { label: 'everything else', n: 195 },
    ],
  },
  back: {
    total: 524,
    sub: [
      { label: 'convex', n: 280 },
      { label: 'scripts', n: 85 },
      { label: 'lib/admin', n: 76 },
      { label: 'lib/entity-cards', n: 37 },
      { label: 'lib/ai-market-assets.ts', n: 10 },
      { label: 'lib/og', n: 8 },
      { label: 'lib/benchmark-data', n: 6 },
      { label: 'everything else', n: 22 },
    ],
  },
  admin: {
    total: 185,
    sub: [
      { label: 'app/admin/projects', n: 100 },
      { label: 'app/admin/_components', n: 61 },
      { label: 'app/admin/(sections)', n: 10 },
      { label: 'app/admin/ru', n: 10 },
      { label: 'app/admin/test', n: 3 },
      { label: 'app/admin/page.tsx', n: 1 },
    ],
  },
  'CI/CD': {
    total: 68,
    sub: [
      { label: 'public', n: 26 },
      { label: '.github', n: 15 },
      { label: 'package.json', n: 7 },
      { label: '.claude', n: 6 },
      { label: 'next.config.ts', n: 3 },
      { label: '_wt', n: 3 },
      { label: 'pnpm-lock.yaml', n: 3 },
      { label: 'everything else', n: 5 },
    ],
  },
}

export const DOCS_TOP: DiveCluster[] = [
  { label: 'product/frontend/design-panel.html', n: 79 },
  { label: 'strategy/README.md', n: 63 },
  { label: 'operations/admin/README.md', n: 44 },
  { label: 'brand/patterns/card.md', n: 43 },
  { label: 'brand/patterns/page-types.md', n: 41 },
  { label: 'strategy/launch-factory/launch.md', n: 36 },
  { label: 'brand/foundations/typography.md', n: 35 },
  { label: 'selfheal/README.md', n: 33 },
]

export const DECISIONS_TOTAL = 1268

export const SCREEN_WORLDS: Array<{ id: string; label: string; n: number }> = [
  { id: 'site', label: 'Site, outward', n: 142 },
  { id: 'cup', label: 'Mission control screens', n: 151 },
  { id: 'poly', label: 'Test grounds', n: 35 },
]

export const DOCS_FILE = {
  path: 'docs/strategy/company/brand/1-foundations/typography.md',
  edits: 35,
  text: '# Typography — fonts, scale, density\n\nDate: 2026-08-16\n\n## Principles\n\n1. Light base, dark text; breathing room in the hero, density in data.\n2. H1 is short and functional — no marketing giant.\n3. **Mono — code only**: command\n   snippets, terminal output, kbd — and only through `pre/code/kbd/samp`\n   (system monospace, globals.css). Mono does not belong in UI, kickers,\n   or labels: the utility voice uses Inter through size/weight/color, not\n   a family change. The 15.08 sweep removed font-mono from 166 product-surface files.\n4. Mobile remains data-first: compact list, details on click.\n5. Line length is the semantics of the 760 column; the rule canon is\n   [grid.md](grid.md) §One-axis law.\n6. **Weight law: 400 and 700 only**.\n   Text is 400; accents, headings, run-ins are 700. Intermediate weights\n   (500, 600) and 800 are outlawed, except for the single “navigation\n   chip” role (600, registry; 16.08): a midtone blurs\n   the signal. A one-off exception is made manually by the owner in place\n   only and is not added to the canon. An accent already carried by color\n   (blue link, black breadcrumb ancestor) does not duplicate the weight — it\n   stays 400. Bold prose accent in cards: Inter 700 at 0.9em in a serif body\n   (review ruling 15.08, owner — card-page styles).\n\n## Typography state registry\n\nA single matrix of ALL named font states on the site: role = a fixed\ncombination of “family · size/line height · weight · color”. There are\nno states outside the registry: a new combination = a new row by ruling,\nnot “to suit the page”. Duplicate steps were removed in the 15.08 sweep:\nhalf pixels (10.5/12.5/13.5/14.5) and 16px were consolidated into steps.\nThe small scale has five steps inside the matrix (16px retired — W4 audit);\noutside the scale, chips/buttons are valid (not body text). The glass showcase is\n/admin/…/1-foundations/typography (each row written for itself).\n\n| role | family | size (desktop · mobile) | weight | color |\n| --- | --- | --- | --- | --- |\n| Card H1 | Inter | 52/56 · mobile 34/38 | 700 | #111111 |\n| Article H2 | Inter | 38/45 · mobile 28/32 | 700 | #111111 |\n| Header deck | Inter | 30/35 · mobile 26/30 | 400 | #111111 |\n| Article lead | Charis | 27/35 · mobile 23/30 | 400 | #111111 |\n| H3 subheading | Inter | 23/30 | 700 | #111111 |\n| Article paragraph | Charis | 21/30 · margin 25px | 400 | #111111 |\n| Prose link | Charis | 21/30 | 400 | #2962FF |\n| Prose run-in | Inter | 0.9em prose size (≈19/30) | 700 | #111111 |\n| H4 subheading | Inter | 19/30 | 700 | #111111 |\n| Spoiler trigger | Inter | 19/30 | 400; open — 700 | #111111 |\n| index_ number | SF Rounded (ui-rounded; ruling 16.08, Wink ref) | 21/25 | 700 | #F77313 |\n| large | Inter | 17/25 | 400 | #111111 |\n| large-accent | Inter | 17/25 | 700 | #111111 |\n| accent | Inter | 15/22 | 400 | #111111 |\n| accent-active | Inter | 15/22 · controls /none | 700 | #111111 |\n| navigation chip | Inter | 15 / none | 600 | #111111 |\n| base | Inter | 14/21 | 400 | #8A8A8A |\n| meta | Inter | 13/19 | 400 | #8A8A8A |\n| meta-black (breadcrumb-current) | Inter | 13/19 | 400 | #111111 |\n| caption | Inter | 12/18 | 400 | #8A8A8A |\n| map mini-label | Inter | 9–11/12 | 400 | #8A8A8A |\n| code snippet | system mono (pre/code/kbd/samp) | 13/22 | 400 | #111111 |\n\nOne row — one combination of “size · weight · color” (owner’s word\n16.08: “do not mix different colors and weights in one row”); a state\nwith another weight or color gets a separate row.\n\nBold and gray do not combine: 700 at scale steps\nis valid only in black #111111, #8A8A8A is always 400;\na muted accent is achieved with color, not weight. Registry order is\nsize descending; color and container variations\nare ROW states, not separate roles: nav item = “accent” in a control,\nbreadcrumbs = “meta” in two colors, prose link = “paragraph” in link color,\ndark skin colors the same roles with DARK_* pairs.\n\nThe map explainer “Where X is on the big AI map” uses the “large” step\n17/25 · 400 (FT/NYT gesture: an inset heading quieter than section headings);\nright-column panel headings use the **H4** role (review 16.08; edit history —\nmeta-700 kicker-retire → accent-400 explainer-accent-400 — journal; the kicker\nrole was retired, along with tracking). Prose paragraph spacing is 25px; the\nprose column is 760 (axis semantics — [grid.md](grid.md)); prose roles are a\neditorial. The dark skin colors the same roles\nwith palette pairs (DARK_INK/DARK_TEXT/DARK_MUTED — [color.md](color.md)); the registry\ndoes not create separate dark states. Step and displaced-pair checks are in\n`lib/brand-type.test.ts`.\n',
}

export const JOURNAL_ENTRY = {
  path: 'docs/engine/1-attention/4-served/site/pages/open/journal.md',
  slug: 'map-dive-zoom',
  date: '2026-08-25 23:00',
  model: 'claude-fable-5',
  title: 'Beat 4: diving into a region instead of pills',
  decision:
    "The map mechanic is a zoomable dive: a click on the region tile itself grows it into the whole map (a 550 ms morph from the tile's geometry), and inside it the region's inner map opens up — real sub-clusters from git, by the same method as the pulse classifier. The tour continues without leaving: the region chips at the bottom of the panel switch the dive directly, and «back to the whole machine» morphs you back.",
  rejected:
    "Side accordion pills (the click is not on the zone itself, the response is words) · a zone «live feed» as a stream — deferred to a second iteration · an «X-ray» of the zone's trace — weaker on «what's inside».",
  ownerWords:
    "I need to click a zone and have it highlight what's going on — and not just in words, but visually somehow; while still being able to walk through the other zones too.",
}

export const DECISIONS_TOP: DiveCluster[] = [
  { label: 'engine/1-attention — attention machine', n: 191 },
  { label: 'brand/foundations — brand foundations', n: 68 },
  { label: 'engine — engine, everything else', n: 59 },
  { label: 'brand/patterns — page templates', n: 55 },
  { label: 'brand/writing — writing canon', n: 43 },
  { label: 'brand/components — components', n: 31 },
]

export const BACKEND_TIERS: Array<{ t: string; body: string }> = [
  {
    t: 'Our own servers',
    body: 'Two Mac nodes under launchd, one on duty around the clock: the feed brains, self-healing and the watchdogs — on crons.',
  },
  {
    t: 'Our own balancer',
    body: 'The «five doors» watch: a multiport proxy with permanent preview ports, no more than three live dev servers, auto-sleep for idle ones, a memory watchdog.',
  },
  {
    t: 'Pipeline',
    body: 'Event sourcing: append-only raw material, then judgment, then the store of truth, then the storefront. Payment webhooks come with cryptographic signature checks.',
  },
]

export const BACKEND_CRONS: Array<{ name: string; every: string }> = [
  { name: 'Feed brains', every: '10 min' },
  { name: 'Machine self-healing', every: '15 min' },
  { name: 'On-duty node network', every: '3 min' },
  { name: 'Mail door secretary', every: '5 min' },
  { name: 'Backup brains', every: '5 min' },
  { name: 'Pulse of this page', every: '1 h' },
  { name: 'Feed source collection', every: '1 h' },
  { name: 'Platform snapshots', every: '24 h' },
  { name: 'Security posture', every: '12 h' },
]

export const CI_FACTS: Array<{ t: string; body: string }> = [
  {
    t: 'Cloud CI bill: $0',
    body: "The whole build pipeline runs on our own Macs — cloud runner minutes aren't bought at all.",
  },
  {
    t: 'Origin story (July 2026)',
    body: "GitHub's included minutes burned out in six days of an agent sprint — 1,091 runs. That's how CI moved onto our own hardware.",
  },
  {
    t: 'What it would cost (summer 2026 measurement)',
    body: "Cloud runners at the same pace would cost $60–120 a month. Our own hardware is already paid for — it holds the agents' pace for free.",
  },
  {
    t: 'Speed',
    body: 'A «free Mac first» router, a warm workspace between runs, static checks in parallel — the gate passes in minutes, not tens of minutes.',
  },
]

export const AGENTS_STEPS: Array<{ n: string; step: string; note: string }> = [
  { n: '0', step: 'Classification', note: 'Conversation · read-only · file-write' },
  { n: '1', step: 'Write-preflight', note: 'Fresh main into a task worktree' },
  { n: '2', step: 'Edits', note: 'Only in its own worktree' },
  { n: '3', step: 'Quality gate', note: 'fmt · typecheck · lint · test' },
  { n: '4', step: 'Commit', note: 'In whole steps; commits = rollbacks' },
  { n: '5', step: 'Push', note: 'Into the task branch, not into main' },
  { n: '6', step: 'PR', note: "Everything that isn't in main" },
  { n: '7', step: 'Review', note: 'Self-review + CI; cross-model by risk' },
  {
    n: '8',
    step: 'Merge',
    note: "Technical calls on its own; risky zones get the owner's verdict",
  },
  { n: '9', step: 'Sync + cleanup', note: 'Main mirrored, desk cleared' },
  { n: '10', step: 'REPORT', note: 'Outcome + live links to the owner' },
]

export const ADMIN_LAW: Array<{ t: string; body: string }> = [
  {
    t: 'The law: no passport, no production',
    body: 'Every loop that touches data, money or an external entry point must have four things: an element · a canon · glass · immunity. Glass is the screen where the loop is visible to the eye.',
  },
  {
    t: "That's why there are hundreds of panes",
    body: 'Every new loop is born with its own screen right away — the admin panel grows along with the machine instead of catching up to it.',
  },
  {
    t: 'The watchdogs watch on their own',
    body: "Glass isn't only for human eyes: a selfheal invariant watches the loop and howls before a reader complains.",
  },
]

export const ADMIN_ATLAS: DiveCluster[] = [
  { label: 'Machine engine — warehouses, courts, feeds', n: 138 },
  { label: 'Strategy — maps, forks, launches', n: 47 },
  { label: 'Fleet and CI — machines, runners, cron jobs', n: 26 },
  { label: 'Project reviews', n: 16 },
  { label: 'Security', n: 7 },
  { label: 'Back office', n: 6 },
  { label: 'Everything else', n: 46 },
]
export const ADMIN_TOTAL = 286

// Regions lit in the second reading ("this is vibecoding"): ids of MAP_REGIONS
export const VIBE_LIT = ['front', 'back']

export const BUSINESS_REGIONS: Array<{
  id: string
  n: number
  sub: string
  color: string
  darkText?: boolean
}> = [
  {
    id: 'dev',
    n: 1488,
    sub: 'frontend · backend · admin · CI',
    color: 'var(--zn-back, #6DD400)',
    darkText: true,
  },
  { id: 'strategy', n: 876, sub: "where we're going and why", color: 'var(--zn-doc, #0071E3)' },
  { id: 'product', n: 464, sub: "what we're building", color: 'var(--zn-front, #BA62FC)' },
  {
    id: 'marketing',
    n: 528,
    sub: 'the attention machine: how people find us',
    color: 'var(--zn-adm, #FF2E54)',
  },
  {
    id: 'ops',
    n: 820,
    sub: 'playbooks, bookkeeping, company memory',
    color: 'var(--zn-ci, #45657D)',
  },
]

export const BIZ_STORIES: Record<string, string> = {
  dev: 'All the code and rules of the machine are one cube of the company: the entire former map lives inside it.',
  strategy: "Where we're going and why — brand, market and launches, written down as canons.",
  ops: 'How the company lives day to day — and how it forgets nothing.',
  marketing:
    "The attention machine: it finds, judges and serves stories by itself — that's how people find us.",
  product:
    "What we're building: storefronts, the textbook, tools — every surface is born as a spec.",
}

export const BIZ_TIERS: Record<string, Array<{ t: string; body: string }>> = {
  dev: [
    {
      t: 'The whole former map is inside',
      body: 'Six regions of code and rules — docs, journal, frontend, backend, admin, CI — fit into a single cube of the company: less than a third of its commits.',
    },
    {
      t: "Code executes, it doesn't decide",
      body: 'The direction is one-way: spec first, code second. Code diverging from the canon is a bug in the code, and CI catches it.',
    },
  ],
  strategy: [
    {
      t: 'Brand as a system',
      body: 'Grid, typography, color, page templates, the writing canon — all of it is written down as canons; agents write and lay out pages by them, not «by taste».',
    },
    {
      t: 'Market',
      body: 'Demand, reader personas, players and form donors — the research settles into dated snapshots, and decisions are checked against them.',
    },
    {
      t: 'Launch factory',
      body: 'Launches follow their own canon: from idea to post — on a conveyor, not by heroics.',
    },
  ],
  ops: [
    {
      t: 'Playbooks of the day',
      body: 'Morning cycles, machine duty shifts, the recovery procedure — written so that any agent can run them.',
    },
    {
      t: 'Bookkeeping',
      body: 'Expenses, subscriptions, inventory — as dated registries; the money is visible before it surprises you.',
    },
    {
      t: 'Company memory',
      body: "Every decision is an entry with its reasons and rejections; the summary registries are generated by the machine. You can reopen one — but you'll be arguing with a recorded reason.",
    },
    {
      t: 'Security',
      body: 'Security posture snapshots on a cron and watchdog invariants: a deviation howls before the incident.',
    },
  ],
  marketing: [
    {
      t: 'Attention pipeline',
      body: 'Sources, then judgment, then the truth store, then the storefront: the feed, articles and social posts are gathered by the machine, a human makes the verdicts.',
    },
    {
      t: 'Judgment by spec',
      body: 'The thresholds and tastes of the judgment are written down as rules; the machine learns only from human verdicts on what it submits.',
    },
    {
      t: 'SEO and newsletter',
      body: 'The query map and indexing measurements run on crons; the digest is assembled from what has already been published, with no separate editorial pass.',
    },
  ],
  product: [
    {
      t: 'Storefronts',
      body: "The home page, the AI market map, the atlas, the benchmark, the page you are reading right now - these are the product's public surfaces.",
    },
    {
      t: 'Course and tools',
      body: "The course, the workshops and the utilities are the product's second shelf, built on the same conveyor.",
    },
    {
      t: 'A surface is born from a spec',
      body: 'First the page pattern and its canon, then the build: every storefront has a written "why it looks like this".',
    },
  ],
}
