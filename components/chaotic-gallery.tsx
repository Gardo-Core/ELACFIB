/**
 * ============================================================================
 * CHAOTIC GALLERY COMPONENT - MAIN GALLERY CONTROLLER
 * ============================================================================
 * 
 * PURPOSE: Main gallery component that orchestrates photo display from Google Drive,
 * drag-and-drop reordering (only in demo mode), and state management.
 */

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  MeasuringStrategy,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { GalleryItem } from './gallery-item'
import { Lightbox } from './lightbox'
import { useMobileDetect } from '@/hooks/use-performance'
import type { GalleryPhoto } from '@/lib/gallery-types'
import { Sparkles, Info } from 'lucide-react'

export function ChaoticGallery() {
  // Gallery state
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [demoMessage, setDemoMessage] = useState("")

  // Load photos from API route on mount
  useEffect(() => {
    async function loadPhotos() {
      try {
        const response = await fetch('/api/photos')
        if (response.ok) {
          const data = await response.json()
          setPhotos(data.photos || [])
          setIsDemo(!!data.isDemo)
          if (data.message) {
            setDemoMessage(data.message)
          }
        } else {
          console.error("Failed to load photos from API. Status:", response.status)
        }
      } catch (error) {
        console.error("Error loading photos:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPhotos()
  }, [])

  // Drag state (only relevant when isDemo is true)
  const [isDragActive, setIsDragActive] = useState(false)

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Device detection
  const { isTouch } = useMobileDetect()

  // DND Sensors Configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // DND Measuring Configuration
  const measuringConfig = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  }

  // Drag Start Handler
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragActive(true)
  }, [])

  // Drag End Handler (only updates state locally in demo mode)
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDragActive(false)

    const { active, over } = event
    if (!over || active.id === over.id) return

    setPhotos((currentPhotos) => {
      const oldIndex = currentPhotos.findIndex((p) => p.id === active.id)
      const newIndex = currentPhotos.findIndex((p) => p.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return currentPhotos

      const reordered = arrayMove(currentPhotos, oldIndex, newIndex)
      return reordered.map((photo, index) => ({
        ...photo,
        order: index,
      }))
    })
  }, [])

  // Drag Cancel Handler
  const handleDragCancel = useCallback(() => {
    setIsDragActive(false)
  }, [])

  // Update Photo Title (only relevant in demo/local mode)
  const handleUpdateTitle = useCallback(
    (id: string, title: string) => {
      setPhotos((currentPhotos) =>
        currentPhotos.map((photo) =>
          photo.id === id ? { ...photo, title } : photo
        )
      )
    },
    []
  )

  // Lightbox controls
  const openLightbox = useCallback((index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  const goToPrev = useCallback(() => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? photos.length - 1 : prev - 1
    )
  }, [photos.length])

  const goToNext = useCallback(() => {
    setCurrentImageIndex((prev) => 
      prev === photos.length - 1 ? 0 : prev + 1
    )
  }, [photos.length])

  const goToIndex = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  // Memoized Item IDs for DND Context
  const photoIds = useMemo(
    () => photos.map((photo) => photo.id),
    [photos]
  )

  // LOADING SKELETON STATE
  if (isLoading) {
    return (
      <section className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-24">
        <div className="grid grid-cols-12 gap-0 border-t border-l border-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className="col-span-6 md:col-span-4 lg:col-span-3 h-[300px] border-r border-b border-border bg-secondary/20 animate-pulse"
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <>
      <section 
        className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-24"
        aria-label="Photo Gallery"
      >
        {/* Info banner for Demo Mode / Google Drive Connection status */}
        {isDemo ? (
          <div className="mb-8 p-4 bg-secondary/30 border border-border flex items-start gap-3 rounded-sm">
            <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold block mb-1">Demo Mode Attiva</span>
              <p className="text-muted-foreground">{demoMessage}</p>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-3 bg-green-950/20 border border-green-800/40 flex items-center gap-2 rounded-sm w-fit">
            <Sparkles className="w-4 h-4 text-green-400" />
            <span className="text-xs font-mono text-green-400">Google Drive Connesso (Ordinamento Alfabetico Attivo)</span>
          </div>
        )}

        {isDemo ? (
          /* Drag and Drop layout active in Demo/Local mode */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            measuring={measuringConfig}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={photoIds}
              strategy={rectSortingStrategy}
            >
              <div 
                className="grid grid-cols-12 gap-0 border-t border-l border-border"
                role="list"
                aria-label="Draggable photo gallery"
              >
                {photos.map((photo, index) => (
                  <GalleryItem
                    key={photo.id}
                    photo={photo}
                    index={index}
                    onOpenLightbox={openLightbox}
                    onUpdateTitle={handleUpdateTitle}
                    isDragActive={isDragActive}
                    disableDrag={false}
                    disableEdit={false}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          /* Strictly Read-Only layout with Alphabetical Sorting when connected to Google Drive */
          <div 
            className="grid grid-cols-12 gap-0 border-t border-l border-border"
            role="list"
            aria-label="Google Drive photo gallery"
          >
            {photos.map((photo, index) => (
              <GalleryItem
                key={photo.id}
                photo={photo}
                index={index}
                onOpenLightbox={openLightbox}
                onUpdateTitle={handleUpdateTitle}
                isDragActive={false}
                disableDrag={true}
                disableEdit={true}
              />
            ))}
          </div>
        )}

        {/* Decorative Grid Lines */}
        <div 
          className="relative w-full h-16 md:h-24 mt-8 md:mt-12 overflow-hidden" 
          aria-hidden="true"
        >
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border" />
          <div className="absolute top-0 left-1/4 w-[1px] h-full bg-border rotate-12 origin-top" />
          <div className="absolute top-0 right-1/3 w-[1px] h-full bg-border -rotate-6 origin-bottom" />
        </div>

        {/* Gallery Info footer */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-muted-foreground">
          <p className="text-sm">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </p>
          <p className="text-xs">
            {isDemo ? (
              isTouch 
                ? 'Pressione prolungata e trascina per riordinare • Tocca per ingrandire'
                : 'Trascina l\'icona per riordinare • Clicca per visualizzare a schermo intero'
            ) : (
              'Le foto sono sincronizzate in ordine alfabetico da Google Drive • Clicca per visualizzare a schermo intero'
            )}
          </p>
        </div>
      </section>

      {/* Lightbox Viewer */}
      <Lightbox
        photos={photos}
        currentIndex={currentImageIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onPrev={goToPrev}
        onNext={goToNext}
        onGoTo={goToIndex}
      />
    </>
  )
}
