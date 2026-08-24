"use client";

import { useEffect } from "react";

interface KeyboardShortcutsProps {
  zoomIn: () => void;
  zoomOut: () => void;
  undo: () => void;
  redo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function useKeyboardShortcuts({
  zoomIn,
  zoomOut,
  undo,
  redo,
  canUndo = true,
  canRedo = true,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Ignore shortcuts while typing in input, textarea, or contentEditable elements
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      const isModifier = isMac ? event.metaKey : event.ctrlKey;

      // Zoom In: "+" or "="
      if ((event.key === "+" || event.key === "=") && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        zoomIn();
        return;
      }

      // Zoom Out: "-"
      if (event.key === "-" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        zoomOut();
        return;
      }

      // Undo: Cmd/Ctrl + Z (without Shift)
      if (isModifier && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (canUndo) {
          undo();
        }
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z OR Cmd/Ctrl + Y
      if (
        (isModifier && event.shiftKey && event.key.toLowerCase() === "z") ||
        (isModifier && !event.shiftKey && event.key.toLowerCase() === "y")
      ) {
        event.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [zoomIn, zoomOut, undo, redo, canUndo, canRedo]);
}
