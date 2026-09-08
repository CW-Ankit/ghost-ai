import { Node, Edge } from '@xyflow/react'

export const NODE_SHAPES = [
  'rectangle',
  'diamond',
  'circle',
  'pill',
  'cylinder',
  'hexagon',
] as const

export type NodeShape = (typeof NODE_SHAPES)[number]

export type NodeColor = {
  fill: string
  text: string
}

export const NODE_COLORS: Record<string, NodeColor> = {
  default: { fill: '#1F1F1F', text: '#EDEDED' },
  blue: { fill: '#10233D', text: '#52A8FF' },
  purple: { fill: '#2E1938', text: '#BF7AF0' },
  orange: { fill: '#331B00', text: '#FF990A' },
  red: { fill: '#3C1618', text: '#FF6166' },
  pink: { fill: '#3A1726', text: '#F75F8F' },
  green: { fill: '#0F2E18', text: '#62C073' },
  teal: { fill: '#062822', text: '#0AC7B4' },
}

export type NodeColorKey = keyof typeof NODE_COLORS

export interface CanvasNodeData {
  label: string
  color: NodeColorKey
  shape: NodeShape
  [key: string]: any
}

export type CanvasNode = Node<CanvasNodeData>
export type CanvasEdge = Edge
