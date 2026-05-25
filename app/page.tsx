/**
 * ============================================================================
 * MAIN PAGE COMPONENT
 * ============================================================================
 * 
 * PURPOSE: Root page component that composes the main sections of the
 * photographer portfolio landing page.
 * 
 * ARCHITECTURE:
 * 
 * Page (This Component - Server Component by default in Next.js 16)
 * │
 * ├── Hero (Client Component)
 * │   └── Editable hero content with parallax
 * │
 * ├── ChaoticGallery (Client Component)
 * │   ├── GalleryItem (x N) - Draggable, lazy-loaded photos
 * │   └── Lightbox - Fullscreen viewer
 * │
 * └── Footer (Client Component)
 *     └── Contact info, social links
 * 
 * WHY Server Component at page level:
 * - Faster initial page load (less JS shipped)
 * - Better SEO (content rendered on server)
 * - Client components are marked with "use client"
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Each section is a separate client boundary
 * - State is isolated to relevant components
 * - No prop drilling through page component
 */

import { Hero } from "@/components/hero"
import { ChaoticGallery } from "@/components/chaotic-gallery"
import { Footer } from "@/components/footer"

/**
 * Page Component (Server Component)
 * 
 * Renders the main portfolio page structure
 */
export default function Page() {
  return (
    <main 
      className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground"
      role="main"
    >
      {/* 
        HERO SECTION
        Main landing area with title and description
      */}
      <Hero />

      {/* 
        GALLERY SECTION
        Photo grid with drag-to-reorder and lightbox viewing
      */}
      <ChaoticGallery />

      {/* 
        FOOTER SECTION
        Contact information and site navigation
      */}
      <Footer />
    </main>
  )
}
