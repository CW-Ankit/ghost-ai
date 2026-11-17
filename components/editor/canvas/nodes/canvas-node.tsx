'use client'

import React, { useState, useEffect, useRef } from 'react'
import { NodeProps, Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react'
import {
  CanvasNode as CanvasNodeType,
  CanvasNodeData,
  NODE_COLORS,
  NodeShape,
} from '@/types/canvas'
import { cn } from '@/lib/utils'
import { NodeColorToolbar } from './node-color-toolbar'
import { useCanvasContext } from '../canvas-context'

const SHAPE_SVG: Record<
  NodeShape,
  (props: { color: string; selected: boolean }) => React.ReactNode
> = {
  rectangle: ({ color, selected }) => (
    <div
      className={cn(
        'w-full h-full rounded-lg border-2 transition-all',
        selected
          ? 'border-accent-primary shadow-[0-0-10px_rgba(0,200,212,0.3)]'
          : 'border-border-default'
      )}
      style={{ backgroundColor: color }}
    />
  ),
  pill: ({ color, selected }) => (
    <div
      className={cn(
        'w-full h-full rounded-full border-2 transition-all',
        selected
          ? 'border-accent-primary shadow-[0-0-10px_rgba(0,200,212,0.3)]'
          : 'border-border-default'
      )}
      style={{ backgroundColor: color }}
    />
  ),
  circle: ({ color, selected }) => (
    <div
      className={cn(
        'w-full h-full rounded-full border-2 transition-all',
        selected
          ? 'border-accent-primary shadow-[0-0-10px_rgba(0,200,212,0.3)]'
          : 'border-border-default'
      )}
      style={{ backgroundColor: color }}
    />
  ),
  diamond: ({ color, selected }) => (
    <svg
      className="w-full h-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polygon
        points="50,0 100,50 50,100 0,50"
        fill={color}
        stroke={selected ? 'var(--accent-primary)' : 'var(--border-default)'}
        strokeWidth="4"
        className="transition-all"
      />
    </svg>
  ),
  hexagon: ({ color, selected }) => (
    <svg
      className="w-full h-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polygon
        points="25,0 75,0 100,50 75,100 25,100 0,50"
        fill={color}
        stroke={selected ? 'var(--accent-primary)' : 'var(--border-default)'}
        strokeWidth="4"
        className="transition-all"
      />
    </svg>
  ),
  cylinder: ({ color, selected }) => (
    <svg
      className="w-full h-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <ellipse
        cx="50"
        cy="20"
        rx="40"
        ry="10"
        fill={color}
        stroke={selected ? 'var(--accent-primary)' : 'var(--border-default)'}
        strokeWidth="4"
      />
      <path
        d="M10,20 L10,80 A40,10 0 0,0 90,80 L90,20"
        fill={color}
        stroke={selected ? 'var(--accent-primary)' : 'var(--border-default)'}
        strokeWidth="4"
      />
      <ellipse
        cx="50"
        cy="80"
        rx="40"
        ry="10"
        fill={color}
        stroke={selected ? 'var(--accent-primary)' : 'var(--border-default)'}
        strokeWidth="4"
      />
    </svg>
  ),
}

function CanvasNodeComponent(props: any) {
  const { id, data, selected } = props
  const { setNodes } = useReactFlow()
  const { isReadOnly } = useCanvasContext()
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(data.label)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const color = NODE_COLORS[data.color] || NODE_COLORS.default

  useEffect(() => {
    setText(data.label)
  }, [data.label])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isReadOnly) return
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (text !== data.label) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return { ...node, data: { ...node.data, label: text } }
          }
          return node
        })
      )
    }
  }

  const handleColorChange = (newColor: string) => {
    if (isReadOnly) return
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, color: newColor } }
        }
        return node
      })
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.stopPropagation()
      handleBlur()
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      setText(data.label)
      setIsEditing(false)
    }
  }

  return (
    <div
      className="relative w-full h-full group"
      onDoubleClick={isReadOnly ? undefined : handleDoubleClick}
    >
      {selected && !isReadOnly && (
        <NodeColorToolbar currentColor={data.color} onColorChange={handleColorChange} />
      )}
      {data.diff && (
        <div
          className={cn(
            'absolute -top-3 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wider uppercase select-none shadow-md z-30 pointer-events-none transition-all duration-300 animate-in fade-in zoom-in-90',
            data.diff === 'added'
              ? 'bg-accent-primary-dim text-accent-primary border border-accent-primary/60 shadow-[0_0_12px_rgba(0,200,212,0.3)]'
              : 'bg-accent-ai-dim text-accent-ai-text border border-accent-ai/60 shadow-[0_0_12px_rgba(100,87,249,0.3)]'
          )}
        >
          {data.diff === 'added' ? '+ New' : 'Updated'}
        </div>
      )}
      <NodeResizer
        isVisible={selected && !isReadOnly}
        minWidth={100}
        minHeight={50}
        handleClassName="border-accent-primary bg-accent-primary"
      />
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        isConnectable={!isReadOnly}
        className="w-2 h-2 bg-border-subtle border-none opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        id="top-source"
        type="source"
        position={Position.Top}
        isConnectable={!isReadOnly}
        className="w-2 h-2 bg-border-subtle border-none opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        isConnectable={!isReadOnly}
        className="w-2 h-2 bg-border-subtle border-none opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        isConnectable={!isReadOnly}
        className="w-2 h-2 bg-border-subtle border-none opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        isConnectable={!isReadOnly}
        className="w-2 h-2 bg-border-subtle border-none opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        isConnectable={!isReadOnly}
        className="w-2 h-2 bg-border-subtle border-none opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        isConnectable={!isReadOnly}
        className="w-2 h-2 bg-border-subtle border-none opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        id="left-source"
        type="source"
        position={Position.Left}
        isConnectable={!isReadOnly}
        className="w-2 h-2 bg-border-subtle border-none opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <div
        className={cn(
          'relative w-full h-full transition-all duration-200 flex items-center justify-center text-center rounded-xl',
          'px-4 py-3',
          data.diff === 'added' && 'ring-2 ring-accent-primary/60 ring-offset-2 ring-offset-bg-base',
          data.diff === 'modified' && 'ring-2 ring-accent-ai/60 ring-offset-2 ring-offset-bg-base'
        )}
      >
        {SHAPE_SVG[data.shape as NodeShape]({ color: color.fill, selected })}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className={cn(
                'absolute inset-0 w-full h-full bg-transparent text-center resize-none outline-none border-none p-2',
                'text-sm font-medium pointer-events-auto',
                'text-text-primary'
              )}
              style={{ color: color.text }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={cn('text-sm font-medium truncate', 'text-text-primary')}
              style={{ color: color.text }}
            >
              {data.label || <span className="opacity-40 italic">New Node</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export const CanvasNode = React.memo(CanvasNodeComponent)
