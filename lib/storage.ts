/**
 * ============================================================================
 * STORAGE UTILITY MODULE
 * ============================================================================
 * 
 * PURPOSE: Provides a centralized, type-safe interface for localStorage operations
 * with built-in error handling, serialization, and fallback support.
 * 
 * WHY: 
 * - Centralizes all storage logic to prevent code duplication
 * - Provides type safety with generics
 * - Handles edge cases (SSR, quota exceeded, invalid JSON)
 * - Makes it easy to swap storage backends (localStorage -> database) later
 * 
 * USAGE:
 * ```ts
 * const photos = storage.get<Photo[]>('gallery-photos', [])
 * storage.set('gallery-photos', updatedPhotos)
 * ```
 */

/**
 * Storage keys used throughout the application
 * WHY: Prevents typos and makes refactoring easier
 */
export const STORAGE_KEYS = {
  /** Gallery items including order, titles, and image URLs */
  GALLERY_ITEMS: 'photographer-gallery-items',
  /** Hero section content (titles, description, tagline) */
  HERO_CONTENT: 'photographer-hero-content',
  /** User preferences (e.g., reduced motion) */
  USER_PREFERENCES: 'photographer-user-preferences',
} as const

/** Type for storage key values */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

/**
 * Check if we're running in a browser environment
 * WHY: Prevents errors during SSR/SSG when window is undefined
 */
const isBrowser = typeof window !== 'undefined'

/**
 * Storage utility object with type-safe get/set/remove methods
 */
export const storage = {
  /**
   * Retrieves and parses a value from localStorage
   * 
   * @param key - The storage key to retrieve
   * @param defaultValue - Fallback value if key doesn't exist or parsing fails
   * @returns The parsed value or default value
   * 
   * WHY generic type T: Ensures type safety at call site without manual casting
   */
  get<T>(key: StorageKey, defaultValue: T): T {
    // Guard: Return default during SSR
    if (!isBrowser) return defaultValue

    try {
      const item = localStorage.getItem(key)
      // Guard: Return default if key doesn't exist
      if (item === null) return defaultValue
      // Parse and return the stored JSON
      return JSON.parse(item) as T
    } catch (error) {
      // Log error for debugging but don't crash the app
      console.warn(`[Storage] Failed to parse key "${key}":`, error)
      return defaultValue
    }
  },

  /**
   * Serializes and stores a value in localStorage
   * 
   * @param key - The storage key to set
   * @param value - The value to store (will be JSON stringified)
   * @returns true if successful, false otherwise
   * 
   * WHY returns boolean: Allows caller to handle storage failures gracefully
   */
  set<T>(key: StorageKey, value: T): boolean {
    // Guard: Skip during SSR
    if (!isBrowser) return false

    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      // QuotaExceededError happens when storage is full
      console.error(`[Storage] Failed to set key "${key}":`, error)
      return false
    }
  },

  /**
   * Removes a value from localStorage
   * 
   * @param key - The storage key to remove
   * 
   * WHY: Useful for clearing user data or resetting to defaults
   */
  remove(key: StorageKey): void {
    if (!isBrowser) return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`[Storage] Failed to remove key "${key}":`, error)
    }
  },
}
