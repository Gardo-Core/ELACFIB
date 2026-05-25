/**
 * ============================================================================
 * FOOTER COMPONENT
 * ============================================================================
 * 
 * PURPOSE: Site footer with contact information, social links, and
 * back-to-top functionality.
 * 
 * FEATURES:
 * 1. Responsive 12-column grid layout
 * 2. Smooth scroll-to-top functionality
 * 3. Hover effects for interactive elements
 * 4. Large decorative typography element
 * 
 * ACCESSIBILITY:
 * - Semantic HTML (footer, nav)
 * - Proper link labeling
 * - Keyboard-accessible scroll-to-top
 */

'use client'

import { useCallback } from 'react'

/**
 * Footer Component
 * 
 * Site footer with contact info and navigation
 */
export function Footer() {
  /**
   * SCROLL TO TOP HANDLER
   * 
   * WHY useCallback: Not strictly necessary for single function,
   * but good practice for consistency with rest of codebase
   * 
   * WHY smooth behavior: Better UX than instant jump,
   * helps user understand they've returned to top
   */
  const scrollToTop = useCallback(() => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    })
  }, [])

  return (
    <footer 
      className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-16 border-t border-border bg-background"
      role="contentinfo"
    >
      {/* 
        MAIN FOOTER GRID
        
        WHY 12-column grid:
        - Matches the gallery grid for visual consistency
        - Provides flexible responsive layout options
      */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        {/* 
          CTA SECTION
          
          WHY 4 columns: Gives adequate space for heading and description
          without overwhelming the layout
        */}
        <div className="col-span-1 md:col-span-4">
          <h2 className="font-serif text-3xl md:text-4xl mb-4 text-balance">
            {"Let's Create"}
          </h2>
          <p className="text-muted-foreground max-w-xs leading-relaxed text-pretty">
            Available for commissions worldwide. Specializing in landscape, 
            architectural, and fine art photography.
          </p>
        </div>

        {/* 
          CONTACT SECTION
          
          WHY col-start-6: Creates whitespace between CTA and contact,
          improves visual breathing room on desktop
        */}
        <div className="col-span-1 md:col-span-4 md:col-start-6">
          <span 
            className="text-xs uppercase tracking-widest text-muted-foreground mb-3 block"
            id="contact-heading"
          >
            Contact
          </span>
          <nav aria-labelledby="contact-heading" className="flex flex-col gap-2">
            {/* 
              EMAIL LINK
              WHY hover:italic: Subtle, elegant hover effect that
              matches the site's typographic style
            */}
            <a 
              href="mailto:hello@example.com" 
              className="text-base md:text-lg hover:italic transition-all duration-200 w-fit"
            >
              hello@example.com
            </a>
            <a 
              href="tel:+1234567890" 
              className="text-base md:text-lg hover:italic transition-all duration-200 w-fit"
            >
              +1 (555) 000-0000
            </a>
          </nav>
        </div>

        {/* 
          SOCIAL LINKS SECTION
          
          WHY col-start-11: Pushes social links to right side,
          creating clear visual hierarchy (CTA → Contact → Social)
        */}
        <div className="col-span-1 md:col-span-2 md:col-start-11">
          <span 
            className="text-xs uppercase tracking-widest text-muted-foreground mb-3 block"
            id="social-heading"
          >
            Social
          </span>
          <nav aria-labelledby="social-heading" className="flex flex-col gap-2">
            <a 
              href="#" 
              className="hover:underline underline-offset-4 transition-all duration-200 w-fit"
              aria-label="Follow on Instagram"
            >
              Instagram
            </a>
            <a 
              href="#" 
              className="hover:underline underline-offset-4 transition-all duration-200 w-fit"
              aria-label="Follow on Twitter"
            >
              Twitter
            </a>
            <a 
              href="#" 
              className="hover:underline underline-offset-4 transition-all duration-200 w-fit"
              aria-label="View portfolio on Behance"
            >
              Behance
            </a>
          </nav>
        </div>
      </div>

      {/* 
        FOOTER BOTTOM SECTION
        
        Contains decorative typography and utility links
      */}
      <div className="mt-16 md:mt-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        {/* 
          DECORATIVE TYPOGRAPHY
          
          WHY large vw-based font:
          - Creates visual anchor at bottom of page
          - Scales with viewport for consistent impact
          - Low opacity keeps it subtle/decorative
          
          WHY pointer-events-none: Prevents accidental selection,
          it's purely decorative
        */}
        <span 
          className="text-[15vw] md:text-[10vw] font-serif leading-none opacity-[0.03] select-none pointer-events-none"
          aria-hidden="true"
        >
          STUDIO
        </span>

        {/* 
          UTILITY SECTION
          Contains back-to-top button and copyright
        */}
        <div className="flex flex-col items-start md:items-end gap-4">
          {/* 
            BACK TO TOP BUTTON
            
            WHY button element: Semantic for interactive element
            that triggers JavaScript action
            
            WHY arrow character: Universal symbol for "up",
            clearer than icon for this simple action
          */}
          <button
            onClick={scrollToTop}
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
            type="button"
            aria-label="Scroll back to top of page"
          >
            Back to Top ↑
          </button>
          
          {/* 
            COPYRIGHT NOTICE
            
            WHY dynamic year: Ensures copyright is always current
            without manual updates
          */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
