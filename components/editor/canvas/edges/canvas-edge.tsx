"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  EdgeProps, 
  getSmoothStepPath, 
  useReactFlow 
} from "@xyflow/react";
import { cn } from "@/lib/utils";

export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState<string>((data as any)?.label || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabel((data as any)?.label || "");
  }, [data?.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (label !== data?.label) {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === id) {
            return { ...edge, data: { ...edge.data, label } };
          }
          return edge;
        })
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      handleBlur();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setLabel((data as any)?.label || "");
      setIsEditing(false);
    }
  };

  return (
    <>
      <path
        id={id}
        className={cn(
          "transition-all duration-200",
          selected ? "stroke-accent-primary stroke-[2px]" : "stroke-border-default stroke-[1px] opacity-50 hover:opacity-100"
        )}
        d={edgePath}
        markerEnd={markerEnd}
      />
      {/* Invisible wider path for easier clicking/hovering */}
      <path
        className="invisible stroke-transparent stroke-[10px]"
        d={edgePath}
        onDoubleClick={handleDoubleClick}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="flex items-center justify-center"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              className="bg-bg-surface border border-border-default text-text-primary text-xs px-2 py-1 rounded-md outline-none min-w-[50px]"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer",
                label 
                  ? "bg-bg-surface border border-border-default text-text-primary shadow-sm" 
                  : "bg-transparent text-text-secondary opacity-0 hover:opacity-40 italic"
              )}
              onDoubleClick={handleDoubleClick}
            >
              {label || "label"}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
