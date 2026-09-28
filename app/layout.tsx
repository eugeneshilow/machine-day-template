import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import type { CSSProperties, ReactNode } from 'react'

import { siteConfig } from '@/site.config'

import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
// Monospace of the live terminal
const jbMono = JetBrains_Mono({ variable: '--font-jbmono', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.metadata.title,
  description: siteConfig.metadata.description,
  openGraph: {
    title: siteConfig.metadata.title,
    description: siteConfig.metadata.description,
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      style={{ '--accent': siteConfig.accent, scrollBehavior: 'smooth' } as CSSProperties}
    >
      <body className={`${inter.variable} ${jbMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
