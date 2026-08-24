"use client";

import React, { useCallback, useEffect, useState } from "react";
import { 
  ReactFlow, 
  Background, 
  MiniMap, 
  Controls, 
  useReactFlow,
  addEdge,
  ReactFlowProvider,
  MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useMutation as useLiveblocksMutation, useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { CanvasNode } from "./nodes/canvas-node";
import { CanvasEdge } from "./edges/canvas-edge";
import { ShapePanel } from "./shape-panel";
import { CanvasControlBar } from "./canvas-control-bar";
import { DragPreview } from "./drag-preview";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { NODE_COLORS, NodeShape } from "@/types/canvas";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
 
 
const nodeTypes = {
  canvasNode: CanvasNode,
};

const edgeTypes = {
  canvasEdge: CanvasEdge,
};
 
function CanvasInner({ projectId }: { projectId: string }) {
  const params = useParams();
  const roomId = params?.roomId as string;
  
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
  } = useLiveblocksFlow() as any;
  
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
  const [dragPreview, setDragPreview] = useState<{ shape: NodeShape; position: { x: number; y: number } } | null>(null);
  
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 });
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 300 });
  }, [fitView]);

  useKeyboardShortcuts({
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    undo,
    redo,
    canUndo,
    canRedo,
  });

  const updateSnapshot = useMutation(api.projects.updateSnapshot);

  // Automatically update snapshot when nodes or edges change
  useEffect(() => {
    if (!roomId || !nodes || nodes.length === 0) return;

    const timer = setTimeout(async () => {
      const snapshot = {
        nodes: nodes.map((n: any) => ({
          id: n.id,
          x: n.position.x,
          y: n.position.y,
          shape: n.data.shape,
          color: n.data.color,
          label: n.data.label,
        })),
        edges: (edges || []).map((e: any) => ({
          source: e.source,
          target: e.target,
          label: e.data?.label,
        })),
      };

      try {
        await updateSnapshot({
          projectId: projectId as any,
          snapshot,
          nodeCount: nodes.length,
          edgeCount: (edges || []).length,
        });
      } catch (e) {
        console.error("Snapshot update failed", e);
      }
    }, 5000); // Debounce updates to every 5 seconds

    return () => clearTimeout(timer);
  }, [nodes, edges, roomId, projectId, updateSnapshot]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragPreview(null);

      const dataString = event.dataTransfer.getData("application/ghost-ai-shape");
      if (!dataString) return;

      try {
        const { shape, label, size } = JSON.parse(dataString);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode = {
          id: `${shape}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: "canvasNode",
          position,
          data: { 
            label: label || "", 
            shape, 
            color: "default" 
          },
          style: size ? { width: size.width, height: size.height } : undefined,
        };

        onNodesChange([{ type: "add", item: newNode }]);
      } catch (e) {
        console.error("Failed to parse drop data", e);
      }
    },
    [screenToFlowPosition, onNodesChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    
    const dataString = event.dataTransfer.getData("application/ghost-ai-shape");
    if (dataString) {
      try {
        const { shape } = JSON.parse(dataString);
        setDragPreview({ 
          shape, 
          position: { x: event.clientX, y: event.clientY } 
        });
      } catch {}
    }
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    // Only clear if we are leaving the canvas entirely
    if (event.currentTarget === event.target) {
      setDragPreview(null);
    }
  }, []);

  if (!nodes || !edges) {
    return (
      <div className="h-full w-full bg-base flex items-center justify-center text-text-secondary">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full w-full bg-base" 
      onDrop={onDrop} 
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
       <ReactFlow 
         nodes={nodes} 
         edges={edges} 
         onNodesChange={onNodesChange} 
         onEdgesChange={onEdgesChange} 
         onConnect={onConnect}
         nodeTypes={nodeTypes as any}
         edgeTypes={edgeTypes as any}
         defaultEdgeOptions={{
           type: "canvasEdge",
           markerEnd: { type: MarkerType.ArrowClosed },
         }}
         fitView
       >
         <Background 
           color="var(--border-subtle)" 
           gap={20} 
           variant={"dots" as any} 
         />
        <MiniMap 
          className="bg-bg-surface border border-border-default rounded-xl" 
          nodeColor="var(--accent-primary)" 
        />
      </ReactFlow>
      <CanvasControlBar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <ShapePanel />
      {dragPreview && (
        <DragPreview 
          shape={dragPreview.shape} 
          position={dragPreview.position} 
        />
      )}
    </div>
  );
}

export function Canvas({ projectId: propProjectId }: { projectId?: string }) {
  const params = useParams();
  const roomId = (Array.isArray(params?.roomId) ? params?.roomId[0] : params?.roomId) as string;
  const project = useQuery(api.projects.getByRoomId, { roomId: roomId ?? "" });
  const projectId = propProjectId || (project?._id as string);

  return (
    <div className="h-full w-full">
      <CanvasInner projectId={projectId} />
    </div>
  );
}
