import { describe, it, expect } from 'vitest'
import {
  validateAiGraphResponse,
  transformAiGraphToCanvas,
  serializeGraphForLLM,
  extractSpecTitle,
} from '@/lib/ai-helpers'

describe('AI Generation Pipeline Helpers', () => {
  describe('validateAiGraphResponse', () => {
    it('accepts valid AI responses with nodes and edges', () => {
      const valid = {
        nodes: [{ id: 'n1', label: 'Web Server' }],
        edges: [{ source: 'n1', target: 'n2' }],
      }
      expect(() => validateAiGraphResponse(valid)).not.toThrow()
    })

    it('throws on non-object inputs', () => {
      expect(() => validateAiGraphResponse(null)).toThrow('not a valid JSON object')
      expect(() => validateAiGraphResponse('string')).toThrow('not a valid JSON object')
    })

    it('throws if nodes array is missing', () => {
      expect(() => validateAiGraphResponse({ edges: [] })).toThrow('missing nodes array')
    })

    it('throws if edges array is missing', () => {
      expect(() => validateAiGraphResponse({ nodes: [] })).toThrow('missing edges array')
    })
  })

  describe('transformAiGraphToCanvas', () => {
    it('transforms raw AI nodes and edges into canvas-compatible structures', () => {
      const raw = {
        nodes: [
          {
            id: 'api-gw',
            label: 'API Gateway',
            shape: 'diamond',
            color: 'blue',
            position: { x: 200, y: 100 },
          },
          { id: 'auth-svc', label: 'Auth Service', shape: 'pill', color: 'purple' },
        ],
        edges: [{ id: 'e1', source: 'api-gw', target: 'auth-svc', label: 'Authenticate' }],
      }

      const result = transformAiGraphToCanvas(raw)

      expect(result.nodes).toHaveLength(2)
      expect(result.edges).toHaveLength(1)

      // Verify node 1
      expect(result.nodes[0].id).toBe('api-gw')
      expect(result.nodes[0].type).toBe('canvasNode')
      expect(result.nodes[0].data.label).toBe('API Gateway')
      expect(result.nodes[0].data.shape).toBe('diamond')
      expect(result.nodes[0].data.color).toBe('blue')
      expect(result.nodes[0].position).toEqual({ x: 200, y: 100 })

      // Verify fallback position on node 2
      expect(result.nodes[1].id).toBe('auth-svc')
      expect(result.nodes[1].position.x).toBeGreaterThan(0)
      expect(result.nodes[1].position.y).toBeGreaterThan(0)

      // Verify edge
      expect(result.edges[0].id).toBe('e1')
      expect(result.edges[0].source).toBe('api-gw')
      expect(result.edges[0].target).toBe('auth-svc')
      expect(result.edges[0].data?.label).toBe('Authenticate')
      expect(result.edges[0].type).toBe('canvasEdge')
    })

    it('sanitizes invalid shapes and colors to default fallbacks', () => {
      const raw = {
        nodes: [
          { id: 'bad-node', label: 'Bad Node', shape: 'non-existent-shape', color: 'neon-yellow' },
        ],
        edges: [],
      }

      const result = transformAiGraphToCanvas(raw)
      expect(result.nodes[0].data.shape).toBe('rectangle')
      expect(result.nodes[0].data.color).toBe('default')
    })
  })

  describe('serializeGraphForLLM', () => {
    it('serializes nodes and connections into clean structured prompt text', () => {
      const nodes = [
        { id: 'web', data: { label: 'Web App', shape: 'rectangle', color: 'pink' } },
        { id: 'db', data: { label: 'Postgres', shape: 'cylinder', color: 'green' } },
      ]
      const edges = [{ source: 'web', target: 'db', data: { label: 'Reads/Writes' } }]

      const serialized = serializeGraphForLLM(nodes, edges)

      expect(serialized).toContain('NODES:')
      expect(serialized).toContain('CONNECTIONS:')
      expect(serialized).toContain('[RECTANGLE] "Web App" (color: pink, id: web)')
      expect(serialized).toContain('[CYLINDER] "Postgres" (color: green, id: db)')
      expect(serialized).toContain('web -> db — "Reads/Writes"')
    })
  })

  describe('extractSpecTitle', () => {
    it('extracts markdown H1 as title', () => {
      const markdown = '# High-Throughput Payment Processing Engine\n\n## Overview\nThis system...'
      expect(extractSpecTitle(markdown)).toBe('High-Throughput Payment Processing Engine')
    })

    it('falls back to default title if no H1 heading is found', () => {
      const markdown = '### Overview\nThis spec has no top level heading.'
      expect(extractSpecTitle(markdown)).toBe('System Architecture Specification')
    })
  })
})
