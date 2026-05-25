/**
 * ============================================================================
 * GALLERY TYPES MODULE
 * ============================================================================
 * 
 * PURPOSE: Centralized type definitions for the gallery system.
 * 
 * WHY SEPARATE TYPES FILE:
 * - Single source of truth for data structures
 * - Enables type sharing between components without circular imports
 * - Makes refactoring easier (change type in one place)
 * - Improves code documentation through type annotations
 */

/**
 * Represents a single photo in the gallery
 * 
 * WHY these fields:
 * - id: Unique identifier for React keys and drag-drop
 * - src: Google Drive URL for the image
 * - title: User-editable title shown in gallery and lightbox
 * - order: Explicit ordering for database storage (not array index)
 */
export interface GalleryPhoto {
  /** Unique identifier - used for React keys and dnd-kit */
  id: string
  /** Google Drive image URL (format: https://drive.google.com/uc?export=view&id=FILE_ID) */
  src: string
  /** User-editable photo title */
  title: string
  /** Explicit sort order (0-based) - enables stable ordering independent of array position */
  order: number
}

/**
 * Hero section content structure
 * 
 * WHY these fields:
 * - Matches the visual hierarchy of the hero section
 * - All fields are user-editable for customization
 */
export interface HeroContent {
  /** Main title line 1 (e.g., "CAPTURING") */
  title1: string
  /** Main title line 2 (e.g., "THE SILENCE") */
  title2: string
  /** Description paragraph */
  description: string
  /** Bottom tagline (e.g., "Est. 2024 — Portfolio") */
  tagline: string
}

/**
 * Layout variant for gallery items
 * 
 * WHY: Predefined layouts ensure visual consistency while
 * allowing variety in the masonry-style gallery
 */
export type GalleryLayoutVariant = 
  | 'small'      // 4 columns on desktop
  | 'medium'     // 6 columns on desktop
  | 'large'      // 8 columns on desktop
  | 'wide'       // 12 columns on desktop
  | 'tall'       // Increased height
  | 'featured'   // Full width, extra tall

/**
 * Configuration for layout variants
 * Maps variant names to Tailwind classes
 */
export const LAYOUT_VARIANTS: Record<GalleryLayoutVariant, { span: string; height: string }> = {
  small: {
    span: 'col-span-6 md:col-span-4 lg:col-span-3',
    height: 'h-[250px] md:h-[300px]',
  },
  medium: {
    span: 'col-span-6 md:col-span-6 lg:col-span-4',
    height: 'h-[300px] md:h-[400px]',
  },
  large: {
    span: 'col-span-12 md:col-span-6 lg:col-span-6',
    height: 'h-[350px] md:h-[450px]',
  },
  wide: {
    span: 'col-span-12 md:col-span-8 lg:col-span-8',
    height: 'h-[300px] md:h-[400px]',
  },
  tall: {
    span: 'col-span-6 md:col-span-4 lg:col-span-4',
    height: 'h-[400px] md:h-[550px]',
  },
  featured: {
    span: 'col-span-12',
    height: 'h-[400px] md:h-[600px]',
  },
}

/**
 * Assigns a layout variant based on photo index
 * Creates a visually interesting, repeating pattern
 * 
 * WHY this pattern:
 * - Creates visual rhythm without being monotonous
 * - Balances different sizes for good composition
 * - Repeats every 8 items for consistency with larger galleries
 */
export function getLayoutVariant(index: number): GalleryLayoutVariant {
  // Pattern repeats every 8 items
  const patterns: GalleryLayoutVariant[] = [
    'medium',   // 0
    'large',    // 1
    'small',    // 2
    'tall',     // 3
    'wide',     // 4
    'small',    // 5
    'medium',   // 6
    'featured', // 7 - every 8th photo is featured
  ]
  
  return patterns[index % patterns.length]
}

/**
 * Default gallery photos for initial state
 * 
 * WHY default data:
 * - Provides immediate visual content before user adds their own
 * - Demonstrates the gallery's capabilities
 * - Uses placeholder Google Drive IDs that user will replace
 */
export const DEFAULT_PHOTOS: GalleryPhoto[] = [
  { id: '1', src: 'https://drive.google.com/uc?export=view&id=YOUR_IMAGE_ID_1', title: 'Morning Mist', order: 0 },
  { id: '2', src: 'https://drive.google.com/uc?export=view&id=YOUR_IMAGE_ID_2', title: 'High Altitude', order: 1 },
  { id: '3', src: 'https://drive.google.com/uc?export=view&id=YOUR_IMAGE_ID_3', title: 'Mirror', order: 2 },
  { id: '4', src: 'https://drive.google.com/uc?export=view&id=YOUR_IMAGE_ID_4', title: 'Stone Skin', order: 3 },
  { id: '5', src: 'https://drive.google.com/uc?export=view&id=YOUR_IMAGE_ID_5', title: 'Details', order: 4 },
  { id: '6', src: 'https://drive.google.com/uc?export=view&id=YOUR_IMAGE_ID_6', title: 'Turbulence', order: 5 },
  { id: '7', src: 'https://drive.google.com/uc?export=view&id=YOUR_IMAGE_ID_7', title: 'Golden Hour', order: 6 },
  { id: '8', src: 'https://drive.google.com/uc?export=view&id=YOUR_IMAGE_ID_8', title: 'Cosmos', order: 7 },
]

/**
 * Default hero content
 */
export const DEFAULT_HERO_CONTENT: HeroContent = {
  title1: 'CAPTURING',
  title2: 'THE SILENCE',
  description: 'Photography is the art of freezing time. In the chaos of the natural world, we find a hidden order, a silent rhythm that speaks to the soul.',
  tagline: 'Est. 2024 — Portfolio',
}
