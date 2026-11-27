import { describe, expect, it } from 'vitest'
import {
  damerauLevenshtein,
  extractTopTags,
  parseSearchQuery,
  searchCanvasNodes,
  searchProjects,
  searchQuickActions,
  searchTemplates,
  type SearchableProject,
} from '@/lib/search-engine'
import { CANVAS_TEMPLATES } from '@/components/editor/starter-templates'
import type { CanvasEdge, CanvasNode } from '@/types/canvas'

const SAMPLE_PROJECTS: SearchableProject[] = [
  {
    _id: 'p1',
    name: 'E-Commerce Microservices',
    roomId: 'ecommerce-123',
    status: 'REVIEW',
    tags: ['kafka', 'payments'],
    isPinned: true,
    updatedAt: 1000,
    canvasSnapshot: {
      nodes: [
        { id: 'n1', label: 'API Gateway', shape: 'diamond', color: 'blue', x: 0, y: 0 },
        { id: 'n2', label: 'Redis Cache', shape: 'cylinder', color: 'red', x: 100, y: 0 },
        { id: 'n3', label: 'Order Postgres', shape: 'cylinder', color: 'green', x: 200, y: 0 },
      ],
      edges: [{ source: 'n1', target: 'n2', label: 'Rate Limit' }],
    },
  },
  {
    _id: 'p2',
    name: 'AI Agent Pipeline',
    roomId: 'ai-agent-999',
    status: 'DRAFT',
    tags: ['llm', 'rag'],
    isPinned: false,
    updatedAt: 2000,
    canvasSnapshot: {
      nodes: [
        { id: 'n1', label: 'Mistral Orchestrator', shape: 'pill', color: 'purple', x: 0, y: 0 },
        { id: 'n2', label: 'Vector Store', shape: 'cylinder', color: 'green', x: 120, y: 0 },
      ],
      edges: [],
    },
  },
]

describe('Frontend Search Engine', () => {
  it('parses inline filter operators and free-text terms', () => {
    const parsed = parseSearchQuery('status:review color:purple shape:cylinder #kafka redis')
    expect(parsed.status).toBe('REVIEW')
    expect(parsed.colors).toEqual(['purple'])
    expect(parsed.shapes).toEqual(['cylinder'])
    expect(parsed.tags).toEqual(['kafka'])
    expect(parsed.terms).toEqual(['redis'])
  })

  it('computes bounded Damerau-Levenshtein distance for typos and transpositions', () => {
    expect(damerauLevenshtein('kafka', 'kafak')).toBe(1)
    expect(damerauLevenshtein('redis', 'redsi')).toBe(1)
    expect(damerauLevenshtein('ecommerce', 'ecomerce')).toBe(1)
  })

  it('ranks projects across names, tags, and deep canvas nodes with typo tolerance', () => {
    const byName = searchProjects(SAMPLE_PROJECTS, parseSearchQuery('ecomerce'))
    expect(byName).toHaveLength(1)
    expect(byName[0].project._id).toBe('p1')

    const byNode = searchProjects(SAMPLE_PROJECTS, parseSearchQuery('redsi'))
    expect(byNode).toHaveLength(1)
    expect(byNode[0].project._id).toBe('p1')
    expect(byNode[0].matchHint).toContain('Redis Cache')

    const byColorAndStatus = searchProjects(
      SAMPLE_PROJECTS,
      parseSearchQuery('status:review color:green')
    )
    expect(byColorAndStatus).toHaveLength(1)
    expect(byColorAndStatus[0].project._id).toBe('p1')
  })

  it('searches live canvas nodes by label, shape, color, and connected edge', () => {
    const nodes: CanvasNode[] = [
      {
        id: 'gw',
        type: 'canvasNode',
        position: { x: 0, y: 0 },
        data: { label: 'Edge Gateway', shape: 'diamond', color: 'blue' },
      },
      {
        id: 'db',
        type: 'canvasNode',
        position: { x: 100, y: 100 },
        data: { label: 'Primary Postgres', shape: 'cylinder', color: 'green' },
      },
    ]
    const edges: CanvasEdge[] = [
      { id: 'e1', source: 'gw', target: 'db', data: { label: 'SQL Pool' } },
    ]

    const nodeHits = searchCanvasNodes(nodes, edges, parseSearchQuery('color:green postgrs'))
    expect(nodeHits).toHaveLength(1)
    expect(nodeHits[0].node.id).toBe('db')

    const edgeHits = searchCanvasNodes(nodes, edges, parseSearchQuery('sql pool'))
    expect(edgeHits.map((r) => r.node.id)).toEqual(['gw', 'db'])
  })

  it('searches starter templates, quick actions, and extracts top tags', () => {
    const tplHits = searchTemplates(CANVAS_TEMPLATES, parseSearchQuery('kafka'))
    expect(tplHits.length).toBeGreaterThan(0)

    const actionHits = searchQuickActions(
      [
        {
          id: 'new',
          label: 'New Blueprint',
          description: 'Create a fresh architecture canvas',
          keywords: ['create', 'project'],
        },
      ],
      parseSearchQuery('create')
    )
    expect(actionHits).toHaveLength(1)

    expect(extractTopTags(SAMPLE_PROJECTS)).toEqual(['kafka', 'llm', 'payments', 'rag'])
  })
})
