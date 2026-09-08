/**
 * Pure structural fingerprint function to detect real canvas node/edge changes.
 * Subpixel positioning differences are rounded to avoid jitter saves.
 */
export function getCanvasFingerprint(nodeList: any[], edgeList: any[]): string {
  try {
    const simplifiedNodes = (nodeList || []).map((n: any) => ({
      id: n.id,
      x: Math.round(n.position?.x ?? 0),
      y: Math.round(n.position?.y ?? 0),
      label: n.data?.label || '',
      shape: n.data?.shape || 'rectangle',
      color: n.data?.color || 'default',
      w: n.style?.width,
      h: n.style?.height,
    }))

    const simplifiedEdges = (edgeList || []).map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.data?.label || '',
    }))

    return JSON.stringify({ nodes: simplifiedNodes, edges: simplifiedEdges })
  } catch {
    return ''
  }
}
