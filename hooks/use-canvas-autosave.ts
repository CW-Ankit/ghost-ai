"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export type SaveStatus = "idle" | "saving" | "saved" | "unsaved" | "error";

interface UseCanvasAutosaveProps {
  projectId?: string;
  roomId?: string;
  nodes: any[];
  edges: any[];
  debounceMs?: number;
}

export function useCanvasAutosave({
  projectId,
  roomId,
  nodes,
  edges,
  debounceMs = 2500,
}: UseCanvasAutosaveProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const saveCanvasMutation = useMutation(api.projects.saveCanvas);

  const lastSavedFingerprint = useRef<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Generate a structural fingerprint to detect real changes
  const getFingerprint = useCallback((nodeList: any[], edgeList: any[]) => {
    try {
      const simplifiedNodes = (nodeList || []).map((n: any) => ({
        id: n.id,
        x: Math.round(n.position?.x ?? 0),
        y: Math.round(n.position?.y ?? 0),
        label: n.data?.label || "",
        shape: n.data?.shape || "rectangle",
        color: n.data?.color || "default",
        w: n.style?.width,
        h: n.style?.height,
      }));

      const simplifiedEdges = (edgeList || []).map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.data?.label || "",
      }));

      return JSON.stringify({ nodes: simplifiedNodes, edges: simplifiedEdges });
    } catch {
      return "";
    }
  }, []);

  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!projectId || !nodes) return false;

    try {
      setSaveStatus("saving");

      const currentFingerprint = getFingerprint(nodes, edges);

      // 1. Upload serialized canvas JSON to Vercel Blob via Next.js API route
      const response = await fetch("/api/canvas/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          roomId: roomId || "",
          nodes,
          edges,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload canvas to blob storage: ${response.statusText}`);
      }

      const { blobUrl } = await response.json();

      // 2. Prepare lightweight snapshot for dashboard preview
      const snapshot = {
        nodes: nodes.map((n: any) => ({
          id: n.id,
          x: n.position?.x ?? 0,
          y: n.position?.y ?? 0,
          shape: n.data?.shape,
          color: n.data?.color,
          label: n.data?.label,
        })),
        edges: (edges || []).map((e: any) => ({
          source: e.source,
          target: e.target,
          label: e.data?.label,
        })),
      };

      // 3. Store blob URL and metadata in Convex
      await saveCanvasMutation({
        projectId: projectId as Id<"projects">,
        canvasJsonPath: blobUrl || "",
        nodeCount: nodes.length,
        edgeCount: (edges || []).length,
        snapshot,
      });

      lastSavedFingerprint.current = currentFingerprint;
      setSaveStatus("saved");
      setLastSavedAt(new Date());
      return true;
    } catch (error) {
      console.error("Canvas autosave failed:", error);
      setSaveStatus("error");
      return false;
    }
  }, [projectId, roomId, nodes, edges, getFingerprint, saveCanvasMutation]);

  useEffect(() => {
    // Skip before initialization or when nodes aren't loaded yet
    if (!projectId || !nodes) return;

    const currentFingerprint = getFingerprint(nodes, edges);

    // Initial mount setup
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSavedFingerprint.current = currentFingerprint;
      if (nodes.length > 0) {
        setSaveStatus("saved");
        setLastSavedAt(new Date());
      }
      return;
    }

    // If no changes compared to last saved state, don't trigger autosave
    if (currentFingerprint === lastSavedFingerprint.current) {
      return;
    }

    setSaveStatus("unsaved");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveNow();
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [nodes, edges, projectId, debounceMs, getFingerprint, saveNow]);

  return {
    saveStatus,
    lastSavedAt,
    saveNow,
  };
}
