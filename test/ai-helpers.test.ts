import { describe, it, expect } from 'vitest'
import {
  validateAiGraphResponse,
  transformAiGraphToCanvas,
  serializeGraphForLLM,
  extractSpecTitle,
  formatCurrentGraphForPrompt,
  formatConversationHistory,
  computeArchitectureDiffs,
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

  describe('formatCurrentGraphForPrompt', () => {
    it('formats existing canvas nodes and edges for contextual refinement prompt', () => {
      const nodes = [
        {
          id: 'auth',
          data: { label: 'Auth Gateway', shape: 'diamond', color: 'blue' },
          position: { x: 100.4, y: 150.8 },
        },
        {
          id: 'db',
          data: { label: 'Postgres DB', shape: 'cylinder', color: 'green' },
          position: { x: 400, y: 150 },
        },
      ]
      const edges = [
        {
          id: 'e1',
          source: 'auth',
          target: 'db',
          sourceHandle: 'right',
          targetHandle: 'left',
          data: { label: 'Queries' },
        },
      ]

      const jsonString = formatCurrentGraphForPrompt(nodes, edges)
      const parsed = JSON.parse(jsonString)

      expect(parsed.nodes).toHaveLength(2)
      expect(parsed.edges).toHaveLength(1)
      expect(parsed.nodes[0]).toEqual({
        id: 'auth',
        label: 'Auth Gateway',
        shape: 'diamond',
        color: 'blue',
        position: { x: 100, y: 151 },
      })
      expect(parsed.edges[0]).toEqual({
        id: 'e1',
        source: 'auth',
        target: 'db',
        sourceHandle: 'right',
        targetHandle: 'left',
        label: 'Queries',
      })
    })

    it('handles empty canvas elements without error', () => {
      const jsonString = formatCurrentGraphForPrompt([], [])
      const parsed = JSON.parse(jsonString)
      expect(parsed.nodes).toEqual([])
      expect(parsed.edges).toEqual([])
    })
  })

  describe('formatConversationHistory', () => {
    it('truncates history to the requested maximum turns', () => {
      const history: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'user', content: 'Turn 1' },
        { role: 'assistant', content: 'Reply 1' },
        { role: 'user', content: 'Turn 2' },
        { role: 'assistant', content: 'Reply 2' },
        { role: 'user', content: 'Turn 3' },
        { role: 'assistant', content: 'Reply 3' },
        { role: 'user', content: 'Turn 4' },
      ]

      const formatted = formatConversationHistory(history, 4)
      expect(formatted).toHaveLength(4)
      expect(formatted[0].content).toBe('Reply 2')
      expect(formatted[3].content).toBe('Turn 4')
    })

    it('filters out empty or whitespace-only messages', () => {
      const history: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'user', content: 'Valid message' },
        { role: 'assistant', content: '   ' },
        { role: 'user', content: '' },
      ]

      const formatted = formatConversationHistory(history)
      expect(formatted).toHaveLength(1)
      expect(formatted[0].content).toBe('Valid message')
    })
  })

  describe('transformAiGraphToCanvas summary support', () => {
    it('passes through summary field when returned by AI refinement', () => {
      const raw = {
        summary: 'Added Redis Cache in front of Postgres database',
        nodes: [{ id: 'redis', label: 'Redis Cache', shape: 'cylinder', color: 'orange' }],
        edges: [],
      }

      const result = transformAiGraphToCanvas(raw)
      expect(result.summary).toBe('Added Redis Cache in front of Postgres database')
      expect(result.nodes[0].id).toBe('redis')
      expect(result.nodes[0].data.label).toBe('Redis Cache')
    })
  })

  describe('computeArchitectureDiffs', () => {
    const existing = [
      { id: 'node-1', data: { label: 'Web Server' } },
      { id: 'node-2', data: { label: 'Database' } },
    ]

    it('identifies newly added nodes with diff="added"', () => {
      const incoming = [
        { id: 'node-1', data: { label: 'Web Server' } },
        { id: 'node-2', data: { label: 'Database' } },
        { id: 'node-3', data: { label: 'Redis Cache' } },
      ]

      const diffed = computeArchitectureDiffs(existing, incoming)
      expect(diffed[0].data.diff).toBeNull()
      expect(diffed[1].data.diff).toBeNull()
      expect(diffed[2].data.diff).toBe('added')
    })

    it('identifies modified node labels with diff="modified"', () => {
      const incoming = [
        { id: 'node-1', data: { label: 'API Gateway (Renamed)' } },
        { id: 'node-2', data: { label: 'Database' } },
      ]

      const diffed = computeArchitectureDiffs(existing, incoming)
      expect(diffed[0].data.diff).toBe('modified')
      expect(diffed[1].data.diff).toBeNull()
    })

    it('marks all nodes as "added" when existing nodes list is empty', () => {
      const incoming = [
        { id: 'n1', data: { label: 'Service A' } },
        { id: 'n2', data: { label: 'Service B' } },
      ]

      const diffed = computeArchitectureDiffs([], incoming)
      expect(diffed[0].data.diff).toBe('added')
      expect(diffed[1].data.diff).toBe('added')
    })

    it('handles empty incoming nodes without error', () => {
      const diffed = computeArchitectureDiffs(existing, [])
      expect(diffed).toEqual([])
    })
  })
})
