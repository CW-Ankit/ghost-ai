import { MarkerType } from '@xyflow/react'
import {
  CanvasEdge,
  CanvasNode,
  NodeColorKey,
  NodeShape,
  NODE_COLORS,
  NODE_SHAPES,
} from '@/types/canvas'

export interface RawAiNode {
  id?: string
  label?: string
  shape?: string
  color?: string
  position?: { x: number; y: number }
}

export interface RawAiEdge {
  id?: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

export interface RawAiGraphResponse {
  nodes: RawAiNode[]
  edges: RawAiEdge[]
}

/**
 * Validates that an AI response has the required nodes and edges arrays.
 */
export function validateAiGraphResponse(parsed: unknown): asserts parsed is RawAiGraphResponse {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response is not a valid JSON object')
  }
  const obj = parsed as Record<string, unknown>
  if (!Array.isArray(obj.nodes)) {
    throw new Error('AI response missing nodes array')
  }
  if (!Array.isArray(obj.edges)) {
    throw new Error('AI response missing edges array')
  }
}

/**
 * Transforms raw AI graph output into fully typed, positioned CanvasNodes and CanvasEdges.
 */
export function transformAiGraphToCanvas(raw: RawAiGraphResponse): {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
} {
  const validShapes = new Set<string>(NODE_SHAPES)
  const validColors = new Set<string>(Object.keys(NODE_COLORS))

  const nodes: CanvasNode[] = raw.nodes.map((node, index) => {
    const shape = (
      node.shape && validShapes.has(node.shape) ? node.shape : 'rectangle'
    ) as NodeShape
    const color = (
      node.color && validColors.has(node.color) ? node.color : 'default'
    ) as NodeColorKey
    const x = typeof node.position?.x === 'number' ? node.position.x : 100 + (index % 4) * 300
    const y =
      typeof node.position?.y === 'number' ? node.position.y : 100 + Math.floor(index / 4) * 200

    return {
      id: node.id || `node-${index}-${Date.now()}`,
      type: 'canvasNode',
      position: { x, y },
      data: {
        label: node.label || 'Untitled',
        shape,
        color,
      },
    }
  })

  const edges: CanvasEdge[] = raw.edges.map((edge, index) => ({
    id: edge.id || `edge-${index}-${Date.now()}`,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || 'bottom-source',
    targetHandle: edge.targetHandle || 'top-target',
    type: 'canvasEdge',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: {
      label: edge.label || '',
    },
  }))

  return { nodes, edges }
}

/**
 * Serializes graph nodes/edges into structured text for LLM specification drafting.
 */
export function serializeGraphForLLM(nodes: unknown[], edges: unknown[]): string {
  const nodeLines = (nodes as any[]).map((n) => {
    const label = n.data?.label || n.label || 'Untitled'
    const shape = n.data?.shape || 'rectangle'
    const color = n.data?.color || 'default'
    return `- [${String(shape).toUpperCase()}] "${label}" (color: ${color}, id: ${n.id})`
  })

  const edgeLines = (edges as any[]).map((e) => {
    const label = e.data?.label || e.label || ''
    const labelStr = label ? ` — "${label}"` : ''
    return `- ${e.source} -> ${e.target}${labelStr}`
  })

  return `NODES:\n${nodeLines.join('\n')}\n\nCONNECTIONS:\n${edgeLines.join('\n')}`
}

/**
 * Extracts a title from the first Markdown heading.
 */
export function extractSpecTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  if (match) return match[1].trim()
  return 'System Architecture Specification'
}
