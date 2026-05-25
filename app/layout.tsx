/**
 * ============================================================================
 * ROOT LAYOUT COMPONENT
 * ============================================================================
 * 
 * PURPOSE: Root layout that wraps all pages. Configures:
 * - Font loading (Inter for body, Playfair Display for headings)
 * - Global CSS
 * - HTML metadata and SEO
 * - Theme configuration (dark mode by default)
 * 
 * WHY Root Layout:
 * - Required by Next.js App Router
 * - Shared across all routes
 * - Font loading happens once here, not per-page
 * - HTML structure defined once
 * 
 * FONT STRATEGY:
 * - Inter: Modern, highly readable sans-serif for body text
 * - Playfair Display: Elegant serif for headings (matches photography aesthetic)
 * - Both loaded via next/font/google for optimal performance
 *   (automatic font optimization, no layout shift)
 */

import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"

/**
 * INTER FONT CONFIGURATION
 * 
 * WHY Inter:
 * - Excellent readability at all sizes
 * - Large x-height for screen legibility
 * - Extensive character set and weights
 * - Variable font support for optimal file size
 */
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: "swap", // Prevent FOIT (Flash of Invisible Text)
})

/**
 * PLAYFAIR DISPLAY FONT CONFIGURATION
 * 
 * WHY Playfair Display:
 * - Classic, elegant serif that evokes fine art/photography
 * - High contrast suits large display sizes
 * - Italic variant adds expressiveness to titles
 */
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-serif",
  display: "swap",
})

/**
 * PAGE METADATA
 * 
 * WHY comprehensive metadata:
 * - SEO optimization
 * - Social media sharing (Open Graph)
 * - Browser tab appearance
 */
export const metadata: Metadata = {
  title: "Capturing The Silence | Photography Portfolio",
  description: "Fine art photography portfolio showcasing landscape, architectural, and nature photography. Available for commissions worldwide.",
  keywords: ["photography", "portfolio", "fine art", "landscape", "nature", "photographer"],
  authors: [{ name: "Photographer Name" }],
  creator: "Photographer Name",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Capturing The Silence | Photography Portfolio",
    description: "Fine art photography portfolio showcasing landscape, architectural, and nature photography.",
    siteName: "Capturing The Silence",
  },
  twitter: {
    card: "summary_large_image",
    title: "Capturing The Silence | Photography Portfolio",
    description: "Fine art photography portfolio",
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: "v0.app",
}

/**
 * VIEWPORT CONFIGURATION
 * 
 * WHY separate from metadata:
 * - Next.js 16 requires viewport in separate export
 * - Enables mobile optimization settings
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  themeColor: "#080808", // Dark theme color for browser UI
}

/**
 * RootLayout Component
 * 
 * Wraps all pages with common structure and configuration
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="en" 
      className="dark bg-background"
      // Suppress hydration warning for dark mode class
      // (class is set statically, no hydration mismatch)
      suppressHydrationWarning
    >
      {/* 
        BODY CONFIGURATION
        
        WHY font CSS variables:
        - Enables use of font-sans and font-serif classes anywhere
        - Single source of truth for font families
        
        WHY antialiased:
        - Smoother font rendering on modern displays
        - Standard best practice for web typography
      */}
      <body 
        className={`
          ${inter.variable} 
          ${playfair.variable} 
          font-sans 
          antialiased 
          bg-background 
          text-foreground
        `}
      >
        {children}
      </body>
    </html>
  )
}
