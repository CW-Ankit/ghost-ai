"use client";

import React from "react";
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CanvasControlBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function CanvasControlBar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasControlBarProps) {
  return (
    <div className="fixed bottom-8 left-8 z-40">
      <div className="flex items-center gap-1 p-1.5 bg-bg-surface/80 backdrop-blur-md border border-border-default rounded-2xl shadow-2xl">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomOut}
            className="h-9 w-9 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFitView}
            className="h-9 w-9 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Fit View"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomIn}
            className="h-9 w-9 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="h-5 w-[1px] bg-border-subtle mx-1" />

        {/* History Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              "h-9 w-9 rounded-xl transition-colors",
              canUndo
                ? "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                : "text-text-muted/40 cursor-not-allowed"
            )}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              "h-9 w-9 rounded-xl transition-colors",
              canRedo
                ? "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                : "text-text-muted/40 cursor-not-allowed"
            )}
            title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
