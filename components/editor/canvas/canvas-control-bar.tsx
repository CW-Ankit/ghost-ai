'use client'

import React from 'react'
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from 'lucide-react'
import { EditorButton } from '../editor-button'

interface CanvasControlBarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  isReadOnly?: boolean
}

export function CanvasControlBar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isReadOnly = false,
}: CanvasControlBarProps) {
  return (
    <div className="absolute bottom-6 left-6 z-40">
      <div className="flex items-center gap-1.5 p-1.5 bg-bg-surface/80 backdrop-blur-md border border-border-default rounded-2xl shadow-2xl">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <EditorButton
            tone="socket"
            size="icon-md"
            onClick={onZoomOut}
            aria-label="Zoom Out"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </EditorButton>
          <EditorButton
            tone="socket"
            size="icon-md"
            onClick={onFitView}
            aria-label="Fit View"
            title="Fit View"
          >
            <Maximize2 className="h-4 w-4" />
          </EditorButton>
          <EditorButton
            tone="socket"
            size="icon-md"
            onClick={onZoomIn}
            aria-label="Zoom In"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </EditorButton>
        </div>

        {/* History Controls (only in editable mode) */}
        {!isReadOnly && (
          <>
            <div className="h-5 w-[1px] bg-border-subtle mx-0.5" />
            <div className="flex items-center gap-1.5">
              <EditorButton
                tone="socket"
                size="icon-md"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </EditorButton>
              <EditorButton
                tone="socket"
                size="icon-md"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo"
                title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
              >
                <Redo2 className="h-4 w-4" />
              </EditorButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
