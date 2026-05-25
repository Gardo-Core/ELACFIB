/**
 * ============================================================================
 * PERFORMANCE HOOKS MODULE
 * ============================================================================
 * 
 * PURPOSE: Collection of custom React hooks optimized for performance-critical
 * operations like lazy loading, virtualization, and intersection observation.
 * 
 * WHY CUSTOM HOOKS:
 * - Encapsulates complex performance logic in reusable units
 * - Handles cleanup automatically to prevent memory leaks
 * - Provides consistent API across components
 * - Makes testing easier by isolating side effects
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useDebouncedCallback } from 'use-debounce'

/**
 * ============================================================================
 * useIntersectionObserver
 * ============================================================================
 * 
 * PURPOSE: Detects when an element enters/exits the viewport using the native
 * IntersectionObserver API for efficient visibility detection.
 * 
 * WHY IntersectionObserver:
 * - More performant than scroll event listeners
 * - Doesn't cause layout thrashing
 * - Native browser API with good support
 * - Automatically handles cleanup
 * 
 * @param options - IntersectionObserver options (threshold, rootMargin, etc.)
 * @returns [ref, isIntersecting, entry] - Element ref, visibility state, and full entry
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  options: IntersectionObserverInit = {}
): [React.RefObject<T | null>, boolean, IntersectionObserverEntry | null] {
  // Reference to the DOM element being observed
  const elementRef = useRef<T | null>(null)
  // Whether the element is currently visible in viewport
  const [isIntersecting, setIsIntersecting] = useState(false)
  // Full IntersectionObserverEntry for advanced use cases
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)

  useEffect(() => {
    const element = elementRef.current
    // Guard: Skip if no element or if IntersectionObserver isn't supported
    if (!element || typeof IntersectionObserver === 'undefined') return

    // Create observer with merged options
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setEntry(entry)
      },
      {
        // Default: Trigger when element is 100px before entering viewport
        // WHY: Preloads images before they're visible for smoother UX
        rootMargin: '100px',
        threshold: 0,
        ...options,
      }
    )

    observer.observe(element)

    // Cleanup: Disconnect observer when component unmounts
    // WHY: Prevents memory leaks and unnecessary callbacks
    return () => observer.disconnect()
  }, [options.root, options.rootMargin, options.threshold])

  return [elementRef, isIntersecting, entry]
}

/**
 * ============================================================================
 * useLazyImage
 * ============================================================================
 * 
 * PURPOSE: Handles lazy loading of images with loading states, error handling,
 * and optional blur placeholder support.
 * 
 * WHY THIS APPROACH:
 * - Only loads images when they're about to enter viewport
 * - Provides loading/error states for UI feedback
 * - Supports blur-up effect for better perceived performance
 * - Preloads images in memory before displaying
 * 
 * @param src - Image source URL
 * @param options - Configuration options
 * @returns Object with loading state, error state, and ref to attach to container
 */
export function useLazyImage(
  src: string,
  options: {
    /** Preload the image even before it's in viewport */
    preload?: boolean
    /** Root margin for intersection observer */
    rootMargin?: string
  } = {}
) {
  const { preload = false, rootMargin = '200px' } = options
  
  // Track whether the image has loaded successfully
  const [isLoaded, setIsLoaded] = useState(false)
  // Track loading errors
  const [error, setError] = useState<Error | null>(null)
  // Track if we've started loading
  const [hasStartedLoading, setHasStartedLoading] = useState(false)

  // Use intersection observer to detect when container is visible
  const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin,
    // Once the image enters viewport, we don't need to observe anymore
    // WHY: Reduces unnecessary observer callbacks
    threshold: 0,
  })

  // Determine if we should start loading the image
  const shouldLoad = preload || isVisible

  useEffect(() => {
    // Guard: Don't load if we shouldn't or already have
    if (!shouldLoad || hasStartedLoading) return

    setHasStartedLoading(true)
    setError(null)

    // Create a new Image element to preload in memory
    // WHY: Allows us to detect load/error before displaying
    const img = new Image()
    
    // Set crossOrigin to avoid CORS issues if image is used on canvas later
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      setIsLoaded(true)
    }

    img.onerror = () => {
      setError(new Error(`Failed to load image: ${src}`))
    }

    // Start loading the image
    img.src = src

    // Cleanup: Abort loading if component unmounts
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [shouldLoad, src, hasStartedLoading])

  // Reset state if src changes
  useEffect(() => {
    setIsLoaded(false)
    setError(null)
    setHasStartedLoading(false)
  }, [src])

  return {
    /** Ref to attach to the image container element */
    containerRef,
    /** Whether the image has finished loading */
    isLoaded,
    /** Whether the image is currently loading */
    isLoading: hasStartedLoading && !isLoaded && !error,
    /** Error object if loading failed */
    error,
    /** Whether the container is visible in viewport */
    isVisible,
  }
}

/**
 * ============================================================================
 * useImagePreloader
 * ============================================================================
 * 
 * PURPOSE: Preloads multiple images in the background, useful for preloading
 * adjacent images in a gallery/lightbox for instant navigation.
 * 
 * WHY:
 * - Eliminates loading delay when navigating to next/prev images
 * - Uses browser's native caching mechanism
 * - Doesn't block main thread (images load asynchronously)
 * 
 * @param urls - Array of image URLs to preload
 */
export function useImagePreloader(urls: string[]) {
  useEffect(() => {
    // Guard: Don't preload empty arrays
    if (urls.length === 0) return

    // Create Image objects to trigger browser preloading
    // WHY: Browser will cache these images for instant display later
    const images = urls.map((url) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = url
      return img
    })

    // Cleanup: No actual cleanup needed as browser handles caching
    // But we clear our references to allow garbage collection
    return () => {
      images.length = 0
    }
  }, [urls.join(',')]) // Depend on stringified URLs to handle array reference changes
}

/**
 * ============================================================================
 * useDebouncedStorage
 * ============================================================================
 * 
 * PURPOSE: Provides a state value that's automatically persisted to localStorage
 * with debouncing to prevent excessive writes.
 * 
 * WHY DEBOUNCING:
 * - localStorage writes are synchronous and can block main thread
 * - Rapid state changes (e.g., during drag) would cause performance issues
 * - Debouncing batches multiple updates into a single write
 * 
 * @param key - Storage key to use
 * @param initialValue - Initial/default value
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 */
export function useDebouncedStorage<T>(
  key: string,
  initialValue: T,
  delay: number = 500
): [T, (value: T) => void, boolean] {
  // Track if we've done initial load from storage
  const [isHydrated, setIsHydrated] = useState(false)
  // The actual state value
  const [value, setValue] = useState<T>(initialValue)

  // Debounced save function to prevent excessive localStorage writes
  // WHY useDebouncedCallback: Automatically handles cleanup and memoization
  const debouncedSave = useDebouncedCallback(
    (newValue: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.error(`[Storage] Failed to save ${key}:`, error)
      }
    },
    delay
  )

  // Load initial value from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        setValue(JSON.parse(stored))
      }
    } catch (error) {
      console.warn(`[Storage] Failed to load ${key}:`, error)
    }
    setIsHydrated(true)
  }, [key])

  // Combined setter that updates state and triggers debounced save
  const setValueAndSave = useCallback(
    (newValue: T) => {
      setValue(newValue)
      debouncedSave(newValue)
    },
    [debouncedSave]
  )

  return [value, setValueAndSave, isHydrated]
}

/**
 * ============================================================================
 * useReducedMotion
 * ============================================================================
 * 
 * PURPOSE: Detects user's prefers-reduced-motion setting for accessibility.
 * 
 * WHY:
 * - Respects user's system preferences for motion sensitivity
 * - Required for WCAG accessibility compliance
 * - Prevents motion sickness in affected users
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if matchMedia is available (not in SSR)
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes (user might change system preferences)
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

/**
 * ============================================================================
 * useWindowSize
 * ============================================================================
 * 
 * PURPOSE: Tracks window dimensions with debouncing to prevent excessive
 * re-renders during resize.
 * 
 * WHY:
 * - Enables responsive behavior beyond CSS media queries
 * - Debouncing prevents performance issues during resize
 * - Useful for calculating virtualized list heights
 */
export function useWindowSize(debounceDelay: number = 100) {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  const debouncedResize = useDebouncedCallback(
    () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    },
    debounceDelay
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Set initial size
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    window.addEventListener('resize', debouncedResize)
    return () => window.removeEventListener('resize', debouncedResize)
  }, [debouncedResize])

  return size
}

/**
 * ============================================================================
 * useMobileDetect
 * ============================================================================
 * 
 * PURPOSE: Detects if user is on a mobile/touch device for adaptive UI.
 * 
 * WHY:
 * - Touch devices need different interaction patterns (no hover states)
 * - Drag behavior differs between mouse and touch
 * - Can optimize rendering for mobile devices
 */
export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check viewport width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Check for touch capability
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    )

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return { isMobile, isTouch }
}
