/**
 * ============================================================================
 * HERO COMPONENT - MAIN LANDING SECTION
 * ============================================================================
 * 
 * PURPOSE: Displays the main hero section with editable title, subtitle,
 * description, and tagline. Supports parallax scrolling effects and
 * persists changes to localStorage.
 * 
 * FEATURES:
 * 1. Inline editing for all text content
 * 2. Parallax scroll effect (respects prefers-reduced-motion)
 * 3. Debounced localStorage persistence
 * 4. Responsive typography with clamp/vw units
 * 5. Animated scroll indicator
 * 
 * ACCESSIBILITY:
 * - Semantic HTML (section, h1)
 * - Respects prefers-reduced-motion
 * - Keyboard-navigable edit controls
 * - Proper focus management
 */

'use client'

import { useCallback } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { EditableText } from './editable-text'
import { useDebouncedStorage, useReducedMotion } from '@/hooks/use-performance'
import { STORAGE_KEYS } from '@/lib/storage'
import type { HeroContent } from '@/lib/gallery-types'
import { DEFAULT_HERO_CONTENT } from '@/lib/gallery-types'

/**
 * Hero Component
 * 
 * Main hero section with editable content and parallax effects
 */
export function Hero() {
  /**
   * SCROLL ANIMATION SETUP
   * 
   * WHY useScroll + useTransform:
   * - Native framer-motion scroll tracking
   * - Optimized with requestAnimationFrame
   * - Automatically handles cleanup
   */
  const { scrollY } = useScroll()
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()
  
  /**
   * PARALLAX TRANSFORM
   * 
   * Maps scroll position (0-1000px) to translateY (0-200px)
   * Creates depth effect where background moves slower than foreground
   * 
   * WHY disabled when prefersReducedMotion:
   * - Respects user's accessibility preference
   * - Prevents motion sickness in sensitive users
   */
  const backgroundY = useTransform(
    scrollY, 
    [0, 1000], 
    prefersReducedMotion ? [0, 0] : [0, 200]
  )

  /**
   * CONTENT STATE
   * 
   * Using debounced storage hook that:
   * 1. Loads from localStorage on mount
   * 2. Auto-saves changes with 500ms debounce
   * 3. Handles SSR/hydration properly
   */
  const [content, setContent, isHydrated] = useDebouncedStorage<HeroContent>(
    STORAGE_KEYS.HERO_CONTENT,
    DEFAULT_HERO_CONTENT,
    500
  )

  /**
   * UPDATE INDIVIDUAL FIELD
   * 
   * WHY useCallback: Provides stable function reference for
   * EditableText components to prevent unnecessary re-renders
   * 
   * @param field - The content field to update
   * @param value - The new value
   */
  const updateField = useCallback(
    (field: keyof HeroContent, value: string) => {
      setContent((prev) => ({
        ...prev,
        [field]: value,
      }))
    },
    [setContent]
  )

  /**
   * FIELD UPDATE HANDLERS
   * 
   * WHY separate handlers: Each EditableText needs its own stable
   * callback reference. Creating inline `(v) => updateField('title1', v)`
   * would create new function on every render.
   */
  const handleTitle1Change = useCallback(
    (value: string) => updateField('title1', value),
    [updateField]
  )
  const handleTitle2Change = useCallback(
    (value: string) => updateField('title2', value),
    [updateField]
  )
  const handleDescriptionChange = useCallback(
    (value: string) => updateField('description', value),
    [updateField]
  )
  const handleTaglineChange = useCallback(
    (value: string) => updateField('tagline', value),
    [updateField]
  )

  // Animation configuration for entrance effects
  const animationConfig = {
    duration: prefersReducedMotion ? 0.1 : 1.5,
    ease: 'easeOut' as const,
  }

  /**
   * LOADING STATE
   * 
   * WHY: Prevent hydration mismatch between server (default content)
   * and client (localStorage content). Show minimal skeleton until hydrated.
   */
  if (!isHydrated) {
    return (
      <section className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 md:px-12 pt-24 pb-12">
        <div className="w-full max-w-[1800px] mx-auto animate-pulse">
          <div className="h-32 md:h-48 bg-secondary/20 rounded mb-8" />
          <div className="h-24 w-3/4 bg-secondary/20 rounded" />
        </div>
      </section>
    )
  }

  return (
    <section 
      className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden px-4 md:px-8 lg:px-12 pt-20 md:pt-24 pb-12"
      aria-labelledby="hero-title"
    >
      {/* 
        PARALLAX BACKGROUND ELEMENT
        
        WHY motion.div with style={{ y }}:
        - GPU-accelerated transform
        - Smooth 60fps animation
        - No layout thrashing
        
        WHY opacity-5: Subtle texture without distracting from content
      */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none z-0" 
        style={{ y: backgroundY }}
        aria-hidden="true"
      >
        <div className="w-full h-full bg-gradient-to-b from-secondary/50 to-transparent" />
      </motion.div>

      {/* 
        MAIN CONTENT GRID
        
        WHY 12-column grid:
        - Precise control over responsive layout
        - Standard design grid system
        - Easy to align with gallery below
      */}
      <div className="z-10 w-full max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center">
        {/* 
          TITLE SECTION
          
          WHY large viewport-based typography (vw units):
          - Scales fluidly across screen sizes
          - Maintains visual impact on large displays
          - More expressive than fixed rem values
        */}
        <motion.div
          className="col-span-1 md:col-span-8 md:col-start-2"
          initial={{ y: prefersReducedMotion ? 0 : 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={animationConfig}
        >
          <h1 
            id="hero-title"
            className="font-serif text-[12vw] md:text-[10vw] lg:text-[9vw] leading-[0.85] tracking-tighter text-primary"
          >
            {/* 
              EDITABLE TITLE LINE 1
              
              WHY EditableText component:
              - Consistent editing UX across the site
              - Handles keyboard navigation
              - Auto-saves changes
            */}
            <EditableText
              value={content.title1}
              onChange={handleTitle1Change}
              className="block"
              inputClassName="font-serif text-[12vw] md:text-[10vw] lg:text-[9vw] leading-[0.85] tracking-tighter w-full"
              editLabel="Edit main title"
            />
            <br />
            {/* 
              EDITABLE TITLE LINE 2 (Italic variant)
              
              WHY ml-[10vw]: Creates visual offset for dynamic composition,
              breaks the rigidity of centered text
            */}
            <span className="italic font-light ml-[10vw] md:ml-[15vw] block">
              <EditableText
                value={content.title2}
                onChange={handleTitle2Change}
                className=""
                inputClassName="font-serif text-[12vw] md:text-[10vw] lg:text-[9vw] leading-[0.85] tracking-tighter italic font-light w-full"
                editLabel="Edit subtitle"
              />
            </span>
          </h1>
        </motion.div>

        {/* 
          DESCRIPTION SECTION
          
          WHY separate column on desktop:
          - Creates asymmetric layout (more interesting)
          - Provides breathing room for the title
          - Better readability for description text
        */}
        <motion.div
          className="col-span-1 md:col-span-3 md:col-start-9 mt-6 md:mt-0 flex flex-col gap-4 md:gap-6"
          initial={{ y: prefersReducedMotion ? 0 : 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...animationConfig, delay: prefersReducedMotion ? 0 : 0.4 }}
        >
          {/* 
            EDITABLE DESCRIPTION
            
            WHY multiline: Description is longer text that may need
            line breaks for editing comfort
          */}
          <EditableText
            value={content.description}
            onChange={handleDescriptionChange}
            className="text-sm md:text-base font-light text-muted-foreground max-w-xs leading-relaxed"
            inputClassName="text-sm md:text-base font-light max-w-xs"
            multiline
            editLabel="Edit description"
          />
          
          {/* 
            DECORATIVE SEPARATOR
            WHY: Visual rhythm, separates description from tagline
          */}
          <div className="h-[1px] w-24 bg-primary/30" aria-hidden="true" />
          
          {/* 
            EDITABLE TAGLINE
          */}
          <EditableText
            value={content.tagline}
            onChange={handleTaglineChange}
            className="text-xs uppercase tracking-widest text-primary/60"
            inputClassName="text-xs uppercase tracking-widest"
            editLabel="Edit tagline"
          />
        </motion.div>
      </div>

      {/* 
        SCROLL INDICATOR
        
        WHY animated opacity:
        - Subtle hint to scroll without being intrusive
        - Draws attention without demanding it
        - Disappears naturally as user scrolls
        
        WHY disabled when prefersReducedMotion:
        - Respects user's motion preferences
        - Still visible, just not animated
      */}
      <motion.div
        className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: prefersReducedMotion ? 0.5 : [0.3, 0.7, 0.3] 
        }}
        transition={
          prefersReducedMotion 
            ? { duration: 0.1 } 
            : { duration: 3, repeat: Infinity }
        }
        aria-hidden="true"
      >
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Scroll
        </span>
        <div className="w-[1px] h-8 md:h-12 bg-primary/50" />
      </motion.div>
    </section>
  )
}
