/**
 * ============================================================================
 * SORTABLE GALLERY ITEM COMPONENT
 * ============================================================================
 * 
 * PURPOSE: Individual gallery item with optional drag-and-drop reordering,
 * inline title editing, and optimized lazy loading.
 */

'use client'

import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Play } from 'lucide-react'
import { LazyImage } from './lazy-image'
import { EditableText } from './editable-text'
import type { GalleryPhoto } from '@/lib/gallery-types'
import { getLayoutVariant, LAYOUT_VARIANTS } from '@/lib/gallery-types'
import { useReducedMotion } from '@/hooks/use-performance'

interface GalleryItemProps {
  /** Photo data */
  photo: GalleryPhoto
  /** Index in the current sorted array */
  index: number
  /** Callback when photo is clicked (opens lightbox) */
  onOpenLightbox: (index: number) => void
  /** Callback when title is updated */
  onUpdateTitle: (id: string, title: string) => void
  /** Whether drag-and-drop is currently active */
  isDragActive: boolean
  /** Whether dragging is disabled for this item */
  disableDrag?: boolean
  /** Whether title editing is disabled for this item */
  disableEdit?: boolean
}

/**
 * GalleryItem Component
 * 
 * Memoized with custom comparison to prevent unnecessary re-renders
 */
export const GalleryItem = memo(
  function GalleryItem({
    photo,
    index,
    onOpenLightbox,
    onUpdateTitle,
    isDragActive,
    disableDrag = false,
    disableEdit = false,
  }: GalleryItemProps) {
    // Get reduced motion preference for accessibility
    const prefersReducedMotion = useReducedMotion()

    // Get layout variant based on index for masonry effect
    const variant = getLayoutVariant(index)
    const layout = LAYOUT_VARIANTS[variant]

    /**
     * dnd-kit sortable hook
     * Provides drag-and-drop functionality with keyboard support
     */
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: photo.id,
      disabled: disableDrag,
    })

    /**
     * CSS styles for drag transform
     * 
     * WHY CSS.Transform: Converts transform object to CSS string
     * Uses GPU-accelerated transforms for smooth dragging
     */
    const style = {
      transform: disableDrag ? undefined : CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : 'auto',
      opacity: isDragging ? 0.8 : 1,
    }

    /**
     * Handle click to open lightbox
     */
    const handleClick = useCallback(() => {
      onOpenLightbox(index)
    }, [onOpenLightbox, index])

    /**
     * Handle title update
     */
    const handleTitleChange = useCallback(
      (newTitle: string) => {
        onUpdateTitle(photo.id, newTitle)
      },
      [onUpdateTitle, photo.id]
    )

    // Animation variants for scroll reveal
    const itemVariants = {
      hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: prefersReducedMotion ? 0.1 : 0.6,
          delay: prefersReducedMotion ? 0 : Math.min(index * 0.05, 0.3), // Cap delay for many items
          ease: 'easeOut',
        },
      },
    }

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`${layout.span} relative group`}
      >
        <motion.div
          className={`
            w-full h-full border-r border-b border-border overflow-hidden
            bg-secondary/5 transition-colors
            ${isDragging ? 'ring-2 ring-primary' : ''}
            ${!isDragging && !isDragActive ? 'hover:bg-secondary/20' : ''}
          `}
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <div className="w-full h-full p-3 md:p-6 flex flex-col relative">
            {/* 
              DRAG HANDLE
              Only shown if drag is enabled
            */}
            {!disableDrag && (
              <div
                {...attributes}
                {...listeners}
                className={`
                  absolute top-2 left-2 z-10 p-2 cursor-grab active:cursor-grabbing
                  bg-background/90 backdrop-blur-sm rounded-md
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  touch-none select-none
                  ${isDragging ? 'opacity-100 cursor-grabbing' : ''}
                `}
                aria-label="Drag to reorder photo"
                role="button"
                tabIndex={0}
              >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
              </div>
            )}

            {/* 
              IMAGE CONTAINER - Clickable
            */}
            <button
              onClick={handleClick}
              className={`
                relative w-full ${layout.height} overflow-hidden mb-3 md:mb-4
                cursor-pointer focus:outline-none
                focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                focus-visible:ring-offset-background rounded-sm
              `}
              aria-label={`View "${photo.title}" ${photo.type === 'video' ? 'video' : 'in fullscreen'}`}
              type="button"
            >
              <LazyImage
                src={photo.type === 'video' && photo.thumbnail ? photo.thumbnail : photo.src}
                alt={photo.title}
                containerClassName="absolute inset-0"
                className=""
                rootMargin="300px"
                grayscale={true}
                hoverEffect={!isDragActive}
              />

              {/* VIDEO PLAY OVERLAY */}
              {photo.type === 'video' && (
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]"
                  aria-hidden="true"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center group-hover:bg-background/90 group-hover:scale-110 transition-all duration-300">
                    <Play className="w-6 h-6 md:w-7 md:h-7 text-foreground ml-1" fill="currentColor" />
                  </div>
                </div>
              )}

              <div 
                className="absolute inset-0 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                aria-hidden="true"
              />
            </button>

            {/* 
              PHOTO INFO SECTION
            */}
            <div className="mt-auto flex justify-between items-end gap-2">
              <div className="min-w-0 flex-1">
                {/* Photo number */}
                <span 
                  className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                
                {/* 
                  PHOTO TITLE (Editable or Read-Only)
                */}
                {disableEdit ? (
                  <span className="font-serif text-xl md:text-2xl lg:text-3xl italic line-clamp-2 text-foreground">
                    {photo.title}
                  </span>
                ) : (
                  <EditableText
                    value={photo.title}
                    onChange={handleTitleChange}
                    className="font-serif text-xl md:text-2xl lg:text-3xl italic line-clamp-2"
                    inputClassName="font-serif text-xl md:text-2xl italic w-full"
                    editLabel={`Edit title for ${photo.title}`}
                  />
                )}
              </div>

              {/* 
                DECORATIVE LINE
              */}
              <div 
                className="w-6 h-[1px] bg-primary/30 group-hover:w-12 transition-all duration-300 shrink-0 self-center"
                aria-hidden="true"
              />
            </div>
          </div>
        </motion.div>
      </div>
    )
  },
  // Custom comparison function for memo
  (prevProps, nextProps) => {
    // Re-render if photo data changed
    if (prevProps.photo.id !== nextProps.photo.id) return false
    if (prevProps.photo.title !== nextProps.photo.title) return false
    if (prevProps.photo.src !== nextProps.photo.src) return false
    // Re-render if index changed (affects layout)
    if (prevProps.index !== nextProps.index) return false
    // Re-render if drag state changes to/from this item
    if (prevProps.isDragActive !== nextProps.isDragActive) return false
    // Re-render if disable flags changed
    if (prevProps.disableDrag !== nextProps.disableDrag) return false
    if (prevProps.disableEdit !== nextProps.disableEdit) return false
    // Otherwise, don't re-render
    return true
  }
)

GalleryItem.displayName = 'GalleryItem'
