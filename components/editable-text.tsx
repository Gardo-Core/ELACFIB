/**
 * ============================================================================
 * EDITABLE TEXT COMPONENT
 * ============================================================================
 * 
 * PURPOSE: Provides inline editing capability for text content with
 * keyboard support and accessibility features.
 * 
 * WHY THIS COMPONENT:
 * - Encapsulates editing logic in a reusable unit
 * - Consistent UX across all editable fields
 * - Proper keyboard support (Enter to save, Escape to cancel)
 * - Accessible with proper ARIA labels
 * 
 * USAGE:
 * ```tsx
 * <EditableText
 *   value={title}
 *   onChange={(newTitle) => updateTitle(newTitle)}
 *   className="text-2xl font-bold"
 * />
 * ```
 */

'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Pencil, Check, X } from 'lucide-react'

interface EditableTextProps {
  /** Current text value */
  value: string
  /** Callback when text is saved */
  onChange: (value: string) => void
  /** CSS classes for the text display */
  className?: string
  /** CSS classes for the input/textarea */
  inputClassName?: string
  /** Whether to use textarea for multiline editing */
  multiline?: boolean
  /** Placeholder text when empty */
  placeholder?: string
  /** Accessible label for edit button */
  editLabel?: string
}

/**
 * EditableText Component
 * 
 * Memoized to prevent re-renders from parent state changes
 * 
 * WHY memo: Multiple EditableText instances may be used in a form;
 * editing one shouldn't re-render the others
 */
export const EditableText = memo(function EditableText({
  value,
  onChange,
  className = '',
  inputClassName = '',
  multiline = false,
  placeholder = 'Click to edit',
  editLabel = 'Edit',
}: EditableTextProps) {
  // Track editing state
  const [isEditing, setIsEditing] = useState(false)
  // Temporary value during editing (allows cancel without losing original)
  const [tempValue, setTempValue] = useState(value)
  // Reference to input for focus management
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  /**
   * Sync tempValue when external value changes
   * WHY: Handles cases where value is updated from outside (e.g., reset)
   */
  useEffect(() => {
    if (!isEditing) {
      setTempValue(value)
    }
  }, [value, isEditing])

  /**
   * Focus and select input when entering edit mode
   * WHY: Better UX - user can immediately start typing
   */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  /**
   * Save the edited value
   * WHY useCallback: Prevents new function reference on each render
   */
  const handleSave = useCallback(() => {
    // Trim whitespace and validate
    const trimmedValue = tempValue.trim()
    if (trimmedValue !== value) {
      onChange(trimmedValue)
    }
    setIsEditing(false)
  }, [tempValue, value, onChange])

  /**
   * Cancel editing and restore original value
   */
  const handleCancel = useCallback(() => {
    setTempValue(value) // Restore original
    setIsEditing(false)
  }, [value])

  /**
   * Handle keyboard shortcuts
   * - Enter: Save (for single-line)
   * - Escape: Cancel
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    },
    [multiline, handleSave, handleCancel]
  )

  /**
   * Handle click outside to save
   * WHY: Common UX pattern - clicking away saves changes
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Check if the new focus target is one of our action buttons
      const relatedTarget = e.relatedTarget as HTMLElement
      if (relatedTarget?.closest('[data-editable-action]')) {
        return // Don't save if clicking action buttons
      }
      handleSave()
    },
    [handleSave]
  )

  // Render edit mode
  if (isEditing) {
    return (
      <div className="inline-flex items-start gap-2 w-full">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={`
              bg-secondary/50 border border-border rounded px-2 py-1 w-full
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              ${inputClassName}
            `}
            rows={4}
            placeholder={placeholder}
            aria-label="Edit text"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={`
              bg-secondary/50 border border-border rounded px-2 py-1
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              ${inputClassName}
            `}
            placeholder={placeholder}
            aria-label="Edit text"
          />
        )}
        
        {/* 
          ACTION BUTTONS
          WHY data-editable-action attribute: Allows blur handler to detect
          clicks on these buttons and prevent auto-save
        */}
        <div className="flex flex-col gap-1 shrink-0">
          <button
            data-editable-action
            onClick={handleSave}
            className="p-1.5 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
            aria-label="Save changes"
            type="button"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            data-editable-action
            onClick={handleCancel}
            className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            aria-label="Cancel editing"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Render display mode with edit trigger
  return (
    <span className="group/edit inline-flex items-start gap-2 cursor-pointer">
      <span 
        className={className}
        onClick={() => setIsEditing(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsEditing(true)
          }
        }}
        aria-label={`${value || placeholder}. Press Enter to edit.`}
      >
        {value || <span className="text-muted-foreground italic">{placeholder}</span>}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 opacity-0 group-hover/edit:opacity-100 text-muted-foreground hover:text-foreground transition-all shrink-0"
        aria-label={editLabel}
        type="button"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </span>
  )
})

EditableText.displayName = 'EditableText'
