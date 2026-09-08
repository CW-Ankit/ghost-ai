import { describe, it, expect } from 'vitest'
import { CANVAS_TEMPLATES } from '@/components/editor/starter-templates'
import { NODE_SHAPES, NODE_COLORS } from '@/types/canvas'

describe('Starter System Design Templates', () => {
  it('should have at least 4 curated templates', () => {
    expect(CANVAS_TEMPLATES.length).toBeGreaterThanOrEqual(4)
  })

  CANVAS_TEMPLATES.forEach((template) => {
    describe(`Template: ${template.name} (${template.id})`, () => {
      it('has metadata populated', () => {
        expect(template.id).toBeTruthy()
        expect(template.name).toBeTruthy()
        expect(template.description).toBeTruthy()
        expect(template.category).toBeTruthy()
      })

      it('has nodes and edges', () => {
        expect(template.nodes.length).toBeGreaterThan(0)
        expect(template.edges.length).toBeGreaterThan(0)
      })

      it('all nodes use valid shapes from NODE_SHAPES', () => {
        template.nodes.forEach((node) => {
          expect(NODE_SHAPES).toContain(node.data.shape)
        })
      })

      it('all nodes use valid colors from NODE_COLORS', () => {
        const validColors = Object.keys(NODE_COLORS)
        template.nodes.forEach((node) => {
          expect(validColors).toContain(node.data.color)
        })
      })

      it('all edges connect valid existing node ids', () => {
        const nodeIds = new Set(template.nodes.map((n) => n.id))
        template.edges.forEach((edge) => {
          expect(nodeIds.has(edge.source)).toBe(true)
          expect(nodeIds.has(edge.target)).toBe(true)
        })
      })

      it('nodes do not have duplicate ids', () => {
        const nodeIds = template.nodes.map((n) => n.id)
        const uniqueIds = new Set(nodeIds)
        expect(uniqueIds.size).toBe(nodeIds.length)
      })

      it('edges do not have duplicate ids', () => {
        const edgeIds = template.edges.map((e) => e.id)
        const uniqueIds = new Set(edgeIds)
        expect(uniqueIds.size).toBe(edgeIds.length)
      })
    })
  })
})
