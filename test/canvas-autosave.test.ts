import { describe, it, expect } from 'vitest'
import { getCanvasFingerprint } from '@/lib/canvas-helpers'

describe('Canvas Autosave Fingerprinting', () => {
  const baseNodes = [
    {
      id: 'node-1',
      position: { x: 100.2, y: 200.4 },
      data: { label: 'Service A', shape: 'rectangle', color: 'blue' },
    },
    {
      id: 'node-2',
      position: { x: 400.1, y: 200.1 },
      data: { label: 'Database', shape: 'cylinder', color: 'green' },
    },
  ]

  const baseEdges = [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      sourceHandle: 'right-source',
      targetHandle: 'left-target',
      data: { label: 'Queries' },
    },
  ]

  it('produces deterministic fingerprints for identical states', () => {
    const fp1 = getCanvasFingerprint(baseNodes, baseEdges)
    const fp2 = getCanvasFingerprint([...baseNodes], [...baseEdges])
    expect(fp1).toBe(fp2)
  })

  it('rounds floating point subpixel coordinates to avoid jitter saves', () => {
    const slightlyShiftedNodes = [
      {
        ...baseNodes[0],
        position: { x: 100.4, y: 200.2 }, // rounds to 100, 200
      },
      baseNodes[1],
    ]
    const fp1 = getCanvasFingerprint(baseNodes, baseEdges)
    const fp2 = getCanvasFingerprint(slightlyShiftedNodes, baseEdges)
    expect(fp1).toBe(fp2)
  })

  it('detects node position changes greater than 1px', () => {
    const movedNodes = [
      {
        ...baseNodes[0],
        position: { x: 150, y: 200 },
      },
      baseNodes[1],
    ]
    const fp1 = getCanvasFingerprint(baseNodes, baseEdges)
    const fp2 = getCanvasFingerprint(movedNodes, baseEdges)
    expect(fp1).not.toBe(fp2)
  })

  it('detects label edits', () => {
    const editedNodes = [
      {
        ...baseNodes[0],
        data: { ...baseNodes[0].data, label: 'Renamed Service' },
      },
      baseNodes[1],
    ]
    const fp1 = getCanvasFingerprint(baseNodes, baseEdges)
    const fp2 = getCanvasFingerprint(editedNodes, baseEdges)
    expect(fp1).not.toBe(fp2)
  })

  it('detects node addition and deletion', () => {
    const fpBase = getCanvasFingerprint(baseNodes, baseEdges)
    const fpWithLess = getCanvasFingerprint([baseNodes[0]], [])
    expect(fpBase).not.toBe(fpWithLess)
  })

  it('detects edge connection changes', () => {
    const changedEdges = [
      {
        ...baseEdges[0],
        target: 'node-3',
      },
    ]
    const fp1 = getCanvasFingerprint(baseNodes, baseEdges)
    const fp2 = getCanvasFingerprint(baseNodes, changedEdges)
    expect(fp1).not.toBe(fp2)
  })

  it('handles null and empty arrays gracefully without throwing', () => {
    expect(() => getCanvasFingerprint([], [])).not.toThrow()
    expect(getCanvasFingerprint([], [])).toContain('"nodes":[]')
  })
})
