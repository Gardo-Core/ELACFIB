/**
 * ============================================================================
 * OPTIMIZED LAZY IMAGE COMPONENT
 * ============================================================================
 * 
 * PURPOSE: Renders images with lazy loading, blur placeholder, and smooth
 * fade-in animation for optimal performance with hundreds of photos.
 * 
 * WHY THIS COMPONENT:
 * - Native lazy loading is limited; this provides more control
 * - Blur placeholder improves perceived performance
 * - Intersection Observer only loads images when needed
 * - Handles loading/error states gracefully
 * 
 * PERFORMANCE FEATURES:
 * 1. Intersection Observer for viewport-based loading
 * 2. CSS blur filter for placeholder (GPU accelerated)
 * 3. Skeleton loader while image loads
 * 4. Error state with retry capability
 * 5. Optimized re-render prevention with memo
 */

'use client'

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIntersectionObserver, useReducedMotion } from '@/hooks/use-performance'
import { ImageOff, RefreshCw } from 'lucide-react'

interface LazyImageProps {
  /** Image source URL */
  src: string
  /** Alt text for accessibility */
  alt: string
  /** Additional CSS classes for the image */
  className?: string
  /** Additional CSS classes for the container */
  containerClassName?: string
  /** Root margin for intersection observer (default: 200px) */
  rootMargin?: string
  /** Callback when image loads successfully */
  onLoad?: () => void
  /** Callback when image fails to load */
  onError?: (error: Error) => void
  /** Whether to apply grayscale filter */
  grayscale?: boolean
  /** Whether to show hover effects */
  hoverEffect?: boolean
}

/**
 * LazyImage Component
 * 
 * Memoized to prevent unnecessary re-renders when parent state changes
 * WHY memo: Gallery has many images; preventing re-renders is crucial for performance
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  rootMargin = '200px',
  onLoad,
  onError,
  grayscale = true,
  hoverEffect = true,
}: LazyImageProps) {
  // Track loading states
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Detect user's reduced motion preference
  const prefersReducedMotion = useReducedMotion()

  // Intersection observer for lazy loading
  // WHY 200px rootMargin: Preloads images slightly before they enter viewport
  const [containerRef, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    rootMargin,
    threshold: 0,
  })

  /**
   * Handle successful image load
   * WHY useCallback: Prevents new function reference on each render
   */
  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    setHasError(false)
    onLoad?.()
  }, [onLoad])

  /**
   * Handle image load error
   */
  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoaded(false)
    onError?.(new Error(`Failed to load: ${src}`))
  }, [src, onError])

  /**
   * Retry loading the image
   * WHY: Network errors may be temporary; allow user to retry
   */
  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoaded(false)
    // Increment retry count to force new image request
    setRetryCount((c) => c + 1)
  }, [])

  // Animation variants - disabled if user prefers reduced motion
  const imageVariants = {
    hidden: { opacity: 0, scale: prefersReducedMotion ? 1 : 1.1 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: prefersReducedMotion ? 0.1 : 0.6, ease: 'easeOut' }
    },
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${containerClassName}`}
    >
      {/* 
        SKELETON LOADER
        WHY: Provides visual feedback while image loads
        Uses CSS animation for better performance than JS-based loading indicators
      */}
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-secondary/30 animate-pulse"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* 
        ERROR STATE
        WHY: Shows user-friendly error with retry option instead of broken image
      */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/20 text-muted-foreground">
          <ImageOff className="w-8 h-8 mb-2" />
          <span className="text-xs mb-2">Failed to load</span>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 transition-colors"
            aria-label="Retry loading image"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* 
        ACTUAL IMAGE
        WHY conditional rendering based on isIntersecting:
        - Prevents loading images that are far from viewport
        - Saves bandwidth and memory for galleries with hundreds of images
        
        The image is rendered when:
        1. Container enters viewport (isIntersecting = true)
        2. Or image was already loaded (isLoaded = true, to prevent unmounting loaded images)
      */}
      {(isIntersecting || isLoaded) && !hasError && (
        <motion.img
          // Key includes retryCount to force remount on retry
          key={`${src}-${retryCount}`}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          variants={imageVariants}
          initial="hidden"
          animate={isLoaded ? 'visible' : 'hidden'}
          className={`
            absolute inset-0 w-full h-full object-cover
            ${grayscale ? 'grayscale hover:grayscale-0' : ''}
            ${hoverEffect ? 'transition-all duration-[1.5s] ease-in-out group-hover:scale-105' : ''}
            ${className}
          `}
          // Performance attributes
          loading="lazy"
          decoding="async"
          // Prevent dragging to avoid conflicts with dnd-kit
          draggable={false}
        />
      )}
    </div>
  )
})

LazyImage.displayName = 'LazyImage'
