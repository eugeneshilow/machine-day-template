/**
 * Brand, copy and links — edit this file first.
 *
 * Everything that names the project lives here: the header, the hero, the
 * section headings, the operator block, the footer and the accent color.
 * The demo values describe vibecoding.tech (the site this page was built for);
 * replace them with your own. Numbers come from `lib/data.ts`, not from here.
 */

export type NavLink = {
  label: string
  href: string
  /** Emoji shown before the label, or 'pixel-book' for the built-in pixel icon (optional). */
  icon?: string
}

export type FooterLink = {
  label: string
  href: string
  icon: 'threads' | 'mail' | 'youtube' | 'x' | 'github' | 'linkedin' | 'telegram' | 'link'
}

export const siteConfig = {
  /** Wordmark in the header and footer. The accent-colored cursor is added automatically. */
  name: 'vibecoding.tech',
  /** Canonical origin, used for metadata. */
  url: 'https://vibecoding.tech',
  /** Locale for number and date formatting. */
  locale: 'en-US',
  /** Time zone for clocks and timestamps on the page, and its short label. */
  timeZone: 'Europe/Moscow',
  timeZoneLabel: 'UTC+3',
  /** Accent color: counters, the "served" rows, the pen on the chart, hover states. */
  accent: '#FF7A1A',

  metadata: {
    title: 'Agentic development. A machine day in one minute.',
    description:
      'A live look inside a machine of agents: every commit, every decision and every published story of the last day, compressed into one scroll.',
  },

  header: {
    /** Where the wordmark links to. */
    homeHref: '/',
    /** Search icon on the right; remove the line to hide it. */
    searchHref: 'https://vibecoding.tech/search' as string | undefined,
    nav: [
      { label: 'AI map', href: 'https://vibecoding.tech/map', icon: '🗺️' },
      { label: 'Guide', href: 'https://vibecoding.tech/build', icon: 'pixel-book' },
    ] as NavLink[],
  },

  hero: {
    kicker: 'Agentic engineering',
    title: 'vibecoding.tech is run by a machine of agents.',
    /** Hover label on the chart and the unit in "N commits in M days". */
    unit: { one: 'commit', many: 'commits' },
    chartLabel: 'build waves: commits per day by type of work',
  },

  live: {
    title: 'The machine keeps working while you read',
  },

  timelapse: {
    title: "See for yourself: the machine's last 24 hours",
    statement: 'Agentic development.',
    subtitle: 'A machine day in one minute.',
  },

  operator: {
    title: 'A human writes the rules and accepts the work',
    bio: 'Your name, in one or two sentences: who you are and what you build. In this machine the human writes the rules up front and accepts the work after the fact; everything else is done by agents.',
    photo: {
      src: '/demo/operator.jpg',
      alt: 'The operator at the machine console',
      position: '50% 45%',
    },
  },

  footer: {
    copyright: '© 2026',
    /** Small links under the columns (privacy, terms…). */
    bottomLinks: [] as Array<{ label: string; href: string }>,
    columns: [
      {
        title: 'Project channels',
        links: [
          { label: 'Threads', href: 'https://www.threads.com/@ruvibecoding', icon: 'threads' },
          { label: 'Newsletter', href: 'https://vibecoding.tech/waitlist', icon: 'mail' },
        ] as FooterLink[],
      },
      {
        title: 'Author',
        links: [
          { label: 'YouTube', href: 'https://youtube.com/@shilovtech', icon: 'youtube' },
        ] as FooterLink[],
      },
    ],
  },
} as const

export type SiteConfig = typeof siteConfig
