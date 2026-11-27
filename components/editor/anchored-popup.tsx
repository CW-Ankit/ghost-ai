'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export const GHOST_POPUP_SURFACE_CLASS =
  'rounded-2xl bg-[#0e141c]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.06)] text-text-primary'

interface AnchoredPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorRef: React.RefObject<HTMLElement | null>
  align?: 'start' | 'end'
  sideOffset?: number
  minWidth?: number
  maxWidth?: number
  matchAnchorWidth?: boolean
  enableArrowNavigation?: boolean
  id?: string
  ariaLabelledBy?: string
  ariaLabel?: string
  role?: React.AriaRole
  className?: string
  children: React.ReactNode
}

interface PopupCoords {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
  placement: 'bottom' | 'top'
}

export function AnchoredPopup({
  open,
  onOpenChange,
  anchorRef,
  align = 'start',
  sideOffset = 8,
  minWidth = 200,
  maxWidth = 340,
  matchAnchorWidth = false,
  enableArrowNavigation = false,
  id,
  ariaLabelledBy,
  ariaLabel,
  role,
  className,
  children,
}: AnchoredPopupProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<PopupCoords | null>(null)

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const margin = 12

      const desiredWidth = matchAnchorWidth
        ? Math.max(rect.width, minWidth)
        : Math.max(minWidth, Math.min(maxWidth, vw - margin * 2))
      const width = Math.min(desiredWidth, vw - margin * 2)

      let left = align === 'end' ? rect.right - width : rect.left
      left = Math.max(margin, Math.min(left, vw - width - margin))

      const spaceBelow = vh - rect.bottom - sideOffset - margin
      const spaceAbove = rect.top - sideOffset - margin
      const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow

      if (openAbove) {
        setCoords({
          bottom: vh - rect.top + sideOffset,
          left,
          width,
          maxHeight: Math.max(160, spaceAbove),
          placement: 'top',
        })
      } else {
        setCoords({
          top: rect.bottom + sideOffset,
          left,
          width,
          maxHeight: Math.max(180, spaceBelow),
          placement: 'bottom',
        })
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, anchorRef, align, sideOffset, minWidth, maxWidth, matchAnchorWidth])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      if (anchorRef.current?.contains(target)) return
      onOpenChange(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
        anchorRef.current?.focus()
        return
      }
      if (event.key === 'Tab') {
        onOpenChange(false)
        return
      }
      if (!enableArrowNavigation || !panelRef.current) return

      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
      )
      if (items.length === 0) return
      const currentIdx = items.indexOf(document.activeElement as HTMLButtonElement)
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        items[(currentIdx + 1 + items.length) % items.length]?.focus()
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        items[(currentIdx - 1 + items.length) % items.length]?.focus()
      } else if (event.key === 'Home') {
        event.preventDefault()
        items[0]?.focus()
      } else if (event.key === 'End') {
        event.preventDefault()
        items[items.length - 1]?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onOpenChange, anchorRef, enableArrowNavigation])

  if (!open || typeof document === 'undefined' || !coords) return null

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role={role}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        top: coords.top,
        bottom: coords.bottom,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight,
      }}
      className={cn(
        'z-[70] overflow-y-auto overflow-x-hidden p-1.5',
        GHOST_POPUP_SURFACE_CLASS,
        coords.placement === 'top' ? 'origin-bottom' : 'origin-top',
        'animate-in fade-in-0 zoom-in-95 duration-100',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  )
}
