import type { CanvasEdge, CanvasNode } from '@/types/canvas'
import type { CanvasTemplate } from '@/components/editor/starter-templates'

export type MatchRange = [number, number]

export interface ParsedSearchQuery {
  raw: string
  terms: string[]
  status?: 'DRAFT' | 'REVIEW' | 'ARCHIVED'
  colors: string[]
  shapes: string[]
  tags: string[]
  pinned?: boolean
}

export interface SearchableSnapshotNode {
  id: string
  x: number
  y: number
  shape: string
  color: string
  label?: string
}

export interface SearchableSnapshotEdge {
  source: string
  target: string
  label?: string
}

export interface SearchableProject {
  _id: string
  name: string
  roomId: string
  description?: string
  status: 'DRAFT' | 'REVIEW' | 'ARCHIVED' | string
  tags?: string[]
  isPinned?: boolean
  updatedAt: number
  nodeCount?: number
  edgeCount?: number
  canvasSnapshot?: {
    nodes: SearchableSnapshotNode[]
    edges: SearchableSnapshotEdge[]
  }
}

export interface ProjectSearchResult {
  project: SearchableProject
  score: number
  nameMatches: MatchRange[]
  matchHint?: string
}

export interface CanvasNodeSearchResult {
  node: CanvasNode
  score: number
  labelMatches: MatchRange[]
  edgeHint?: string
}

export interface TemplateSearchResult {
  template: CanvasTemplate
  score: number
  nameMatches: MatchRange[]
}

export interface QuickActionItem {
  id: string
  label: string
  description: string
  keywords: string[]
  shortcut?: string
}

export interface QuickActionSearchResult {
  action: QuickActionItem
  score: number
  labelMatches: MatchRange[]
}

const VALID_STATUS_MAP: Record<string, 'DRAFT' | 'REVIEW' | 'ARCHIVED'> = {
  draft: 'DRAFT',
  review: 'REVIEW',
  archived: 'ARCHIVED',
}

/**
 * Parses inline filter operators (`status:review`, `color:purple`, `shape:cylinder`,
 * `tag:kafka`, `#kafka`, `pinned:true`) alongside free-text search tokens.
 */
export function parseSearchQuery(raw: string): ParsedSearchQuery {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const parsed: ParsedSearchQuery = {
    raw,
    terms: [],
    colors: [],
    shapes: [],
    tags: [],
  }

  for (const token of tokens) {
    const lower = token.toLowerCase()

    if (lower.startsWith('#') && lower.length > 1) {
      parsed.tags.push(lower.slice(1))
      continue
    }

    const colonIndex = lower.indexOf(':')
    if (colonIndex > 0 && colonIndex < lower.length - 1) {
      const key = lower.slice(0, colonIndex)
      const value = lower.slice(colonIndex + 1)

      if (key === 'status' && VALID_STATUS_MAP[value]) {
        parsed.status = VALID_STATUS_MAP[value]
        continue
      }
      if (key === 'color' || key === 'layer') {
        parsed.colors.push(value)
        continue
      }
      if (key === 'shape') {
        parsed.shapes.push(value)
        continue
      }
      if (key === 'tag') {
        parsed.tags.push(value)
        continue
      }
      if (key === 'pinned' || key === 'pin') {
        if (value === 'true' || value === 'yes' || value === '1') parsed.pinned = true
        if (value === 'false' || value === 'no' || value === '0') parsed.pinned = false
        continue
      }
    }

    parsed.terms.push(lower)
  }

  return parsed
}

export function hasActiveSearchFilters(parsed: ParsedSearchQuery): boolean {
  return (
    parsed.terms.length > 0 ||
    parsed.status !== undefined ||
    parsed.colors.length > 0 ||
    parsed.shapes.length > 0 ||
    parsed.tags.length > 0 ||
    parsed.pinned !== undefined
  )
}

/**
 * Bounded Damerau-Levenshtein distance for typo-tolerant matching on short tokens.
 */
export function damerauLevenshtein(a: string, b: string, maxDist = 2): number {
  const lenA = a.length
  const lenB = b.length
  if (Math.abs(lenA - lenB) > maxDist) return maxDist + 1
  if (lenA === 0) return lenB
  if (lenB === 0) return lenA

  const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
    new Array<number>(lenB + 1).fill(0)
  )

  for (let i = 0; i <= lenA; i++) dp[i][0] = i
  for (let j = 0; j <= lenB; j++) dp[0][j] = j

  for (let i = 1; i <= lenA; i++) {
    let rowMin = Infinity
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let val = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, dp[i - 2][j - 2] + cost)
      }
      dp[i][j] = val
      if (val < rowMin) rowMin = val
    }
    if (rowMin > maxDist && i < lenA) {
      // Early-exit hint isn't strictly monotonic with transpositions, keep loop clean for short words
    }
  }

  return dp[lenA][lenB]
}

function mergeRanges(ranges: MatchRange[]): MatchRange[] {
  if (ranges.length <= 1) return ranges
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const merged: MatchRange[] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1]
    const curr = sorted[i]
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1])
    } else {
      merged.push(curr)
    }
  }
  return merged
}

/**
 * Scores a single query token against a target string using exact, prefix,
 * word-boundary, substring, subsequence fuzzy, and Damerau-Levenshtein matching.
 */
export function scoreTokenAgainstText(
  token: string,
  target: string
): { score: number; ranges: MatchRange[] } {
  if (!token || !target) return { score: 0, ranges: [] }

  const lowerTarget = target.toLowerCase()

  if (lowerTarget === token) {
    return { score: 120, ranges: [[0, target.length]] }
  }

  if (lowerTarget.startsWith(token)) {
    return { score: 95, ranges: [[0, token.length]] }
  }

  // Word-boundary prefix match (e.g. "gate" in "API Gateway")
  const words = lowerTarget.split(/[\s\-_/]+/).filter(Boolean)
  const exactIndex = lowerTarget.indexOf(token)
  if (exactIndex !== -1) {
    const isWordStart =
      exactIndex === 0 || /[\s\-_/]/.test(lowerTarget[exactIndex - 1] ?? '')
    return {
      score: isWordStart ? 78 : 56,
      ranges: [[exactIndex, exactIndex + token.length]],
    }
  }

  // Fuzzy subsequence match (e.g. "ecom" -> "E-Commerce")
  if (token.length >= 2) {
    let tIdx = 0
    const indices: number[] = []
    for (let i = 0; i < lowerTarget.length && tIdx < token.length; i++) {
      if (lowerTarget[i] === token[tIdx]) {
        indices.push(i)
        tIdx++
      }
    }
    if (tIdx === token.length) {
      const span = indices[indices.length - 1] - indices[0] + 1
      const compactness = token.length / span
      if (compactness >= 0.35) {
        const ranges = mergeRanges(indices.map((idx) => [idx, idx + 1]))
        return { score: Math.round(28 * compactness + 14), ranges }
      }
    }
  }

  // Typo tolerance against individual words in the target
  if (token.length >= 3) {
    const maxAllowed = token.length >= 6 ? 2 : 1
    let bestDist = Infinity
    for (const word of words) {
      if (word.length < 2) continue
      const dist = damerauLevenshtein(token, word, maxAllowed)
      if (dist <= maxAllowed && dist < bestDist) {
        bestDist = dist
      }
    }
    if (bestDist <= maxAllowed) {
      return { score: bestDist === 1 ? 34 : 20, ranges: [] }
    }
  }

  return { score: 0, ranges: [] }
}

/**
 * Scores an array of query tokens (AND-semantics: every term must match at least one field).
 */
export function scoreMultiFieldTokens(
  terms: string[],
  fields: Array<{ text: string; weight: number; isPrimary?: boolean; labelPrefix?: string }>
): { score: number; primaryMatches: MatchRange[]; hint?: string } {
  if (terms.length === 0) {
    return { score: 1, primaryMatches: [] }
  }

  let totalScore = 0
  const primaryRanges: MatchRange[] = []
  let bestSecondaryHint: { score: number; hint: string } | null = null

  for (const term of terms) {
    let bestTermScore = 0

    for (const field of fields) {
      if (!field.text) continue
      const { score, ranges } = scoreTokenAgainstText(term, field.text)
      if (score <= 0) continue

      const weighted = score * field.weight
      if (weighted > bestTermScore) {
        bestTermScore = weighted
      }

      if (field.isPrimary && ranges.length > 0) {
        primaryRanges.push(...ranges)
      } else if (!field.isPrimary && field.labelPrefix) {
        if (!bestSecondaryHint || weighted > bestSecondaryHint.score) {
          bestSecondaryHint = {
            score: weighted,
            hint: `${field.labelPrefix}: ${field.text}`,
          }
        }
      }
    }

    if (bestTermScore === 0) {
      return { score: 0, primaryMatches: [] }
    }

    totalScore += bestTermScore
  }

  return {
    score: totalScore,
    primaryMatches: mergeRanges(primaryRanges),
    hint: primaryRanges.length === 0 ? bestSecondaryHint?.hint : undefined,
  }
}

export function searchProjects<T extends SearchableProject>(
  projects: T[],
  parsed: ParsedSearchQuery
): Array<ProjectSearchResult & { project: T }> {
  const results: Array<ProjectSearchResult & { project: T }> = []

  for (const project of projects) {
    if (parsed.status && project.status !== parsed.status) continue
    if (parsed.pinned !== undefined && Boolean(project.isPinned) !== parsed.pinned) continue

    if (parsed.tags.length > 0) {
      const projectTags = (project.tags ?? []).map((t) => t.toLowerCase())
      const allTagsMatch = parsed.tags.every((wanted) =>
        projectTags.some((tag) => tag.includes(wanted))
      )
      if (!allTagsMatch) continue
    }

    const snapshotNodes = project.canvasSnapshot?.nodes ?? []
    const snapshotEdges = project.canvasSnapshot?.edges ?? []

    if (parsed.colors.length > 0) {
      const nodeColors = new Set(snapshotNodes.map((n) => (n.color || 'default').toLowerCase()))
      const hasAllColors = parsed.colors.every((c) => nodeColors.has(c))
      if (!hasAllColors) continue
    }

    if (parsed.shapes.length > 0) {
      const nodeShapes = new Set(snapshotNodes.map((n) => (n.shape || 'rectangle').toLowerCase()))
      const hasAllShapes = parsed.shapes.every((s) => nodeShapes.has(s))
      if (!hasAllShapes) continue
    }

    const fields: Array<{ text: string; weight: number; isPrimary?: boolean; labelPrefix?: string }> = [
      { text: project.name, weight: 3.0, isPrimary: true },
      { text: project.roomId, weight: 1.2, labelPrefix: 'Room' },
      ...(project.tags ?? []).map((t) => ({
        text: t,
        weight: 2.2,
        labelPrefix: 'Tag',
      })),
      ...(project.description ? [{ text: project.description, weight: 1.0, labelPrefix: 'About' }] : []),
      ...snapshotNodes
        .filter((n) => typeof n.label === 'string' && n.label.trim().length > 0)
        .map((n) => ({
          text: n.label!,
          weight: 1.8,
          labelPrefix: 'Node',
        })),
      ...snapshotEdges
        .filter((e) => typeof e.label === 'string' && e.label.trim().length > 0)
        .map((e) => ({
          text: e.label!,
          weight: 1.3,
          labelPrefix: 'Edge',
        })),
    ]

    const scored = scoreMultiFieldTokens(parsed.terms, fields)
    if (scored.score === 0) continue

    // Small recency bonus so equally ranked projects surface freshest first
    const recencyBoost = Math.min(10, project.updatedAt ? project.updatedAt / 1e12 : 0)

    let hint = scored.hint
    if (!hint && parsed.colors.length > 0) {
      const matchingNode = snapshotNodes.find((n) =>
        parsed.colors.includes((n.color || 'default').toLowerCase())
      )
      if (matchingNode?.label) {
        hint = `${parsed.colors[0]} layer: ${matchingNode.label}`
      }
    }

    results.push({
      project,
      score: scored.score + recencyBoost,
      nameMatches: scored.primaryMatches,
      matchHint: hint,
    })
  }

  return results.sort((a, b) => b.score - a.score)
}

export function searchCanvasNodes(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  parsed: ParsedSearchQuery
): CanvasNodeSearchResult[] {
  const results: CanvasNodeSearchResult[] = []

  for (const node of nodes) {
    const color = String(node.data?.color || 'default').toLowerCase()
    const shape = String(node.data?.shape || 'rectangle').toLowerCase()
    const label = String(node.data?.label || node.id)

    if (parsed.colors.length > 0 && !parsed.colors.includes(color)) continue
    if (parsed.shapes.length > 0 && !parsed.shapes.includes(shape)) continue

    const connectedEdgeLabels = edges
      .filter((e) => e.source === node.id || e.target === node.id)
      .map((e) => String((e.data as { label?: string } | undefined)?.label || ''))
      .filter(Boolean)

    const fields = [
      { text: label, weight: 3.0, isPrimary: true },
      { text: shape, weight: 1.4, labelPrefix: 'Shape' },
      { text: color, weight: 1.3, labelPrefix: 'Layer' },
      ...connectedEdgeLabels.map((edgeLabel) => ({
        text: edgeLabel,
        weight: 1.2,
        labelPrefix: 'Connection',
      })),
    ]

    const scored = scoreMultiFieldTokens(parsed.terms, fields)
    if (scored.score === 0) continue

    results.push({
      node,
      score: scored.score,
      labelMatches: scored.primaryMatches,
      edgeHint: scored.hint,
    })
  }

  return results.sort((a, b) => b.score - a.score)
}

export function searchTemplates(
  templates: CanvasTemplate[],
  parsed: ParsedSearchQuery
): TemplateSearchResult[] {
  if (parsed.status || parsed.pinned !== undefined) return []

  const results: TemplateSearchResult[] = []

  for (const template of templates) {
    if (parsed.colors.length > 0) {
      const colors = new Set(template.nodes.map((n) => String(n.data.color || 'default').toLowerCase()))
      if (!parsed.colors.every((c) => colors.has(c))) continue
    }
    if (parsed.shapes.length > 0) {
      const shapes = new Set(template.nodes.map((n) => String(n.data.shape || 'rectangle').toLowerCase()))
      if (!parsed.shapes.every((s) => shapes.has(s))) continue
    }

    const fields = [
      { text: template.name, weight: 3.0, isPrimary: true },
      { text: template.category, weight: 2.0 },
      { text: template.description, weight: 1.1 },
      ...template.nodes.map((n) => ({ text: n.data.label, weight: 1.5 })),
    ]

    const scored = scoreMultiFieldTokens(parsed.terms, fields)
    if (scored.score === 0) continue

    results.push({
      template,
      score: scored.score,
      nameMatches: scored.primaryMatches,
    })
  }

  return results.sort((a, b) => b.score - a.score)
}

export function searchQuickActions(
  actions: QuickActionItem[],
  parsed: ParsedSearchQuery
): QuickActionSearchResult[] {
  if (parsed.terms.length === 0) return []

  const results: QuickActionSearchResult[] = []

  for (const action of actions) {
    const fields = [
      { text: action.label, weight: 2.6, isPrimary: true },
      { text: action.description, weight: 1.1 },
      ...action.keywords.map((kw) => ({ text: kw, weight: 2.0 })),
    ]

    const scored = scoreMultiFieldTokens(parsed.terms, fields)
    if (scored.score === 0) continue

    results.push({
      action,
      score: scored.score,
      labelMatches: scored.primaryMatches,
    })
  }

  return results.sort((a, b) => b.score - a.score)
}

export function extractTopTags(projects: SearchableProject[], limit = 6): string[] {
  const counts = new Map<string, number>()
  for (const p of projects) {
    for (const tag of p.tags ?? []) {
      const clean = tag.trim()
      if (!clean) continue
      counts.set(clean, (counts.get(clean) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag)
}

const RECENT_SEARCHES_KEY = 'ghost-ai:recent-searches'
const MAX_RECENT_SEARCHES = 5

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []
  } catch {
    return []
  }
}

export function pushRecentSearch(query: string): string[] {
  const clean = query.trim()
  if (!clean || typeof window === 'undefined') return getRecentSearches()

  const existing = getRecentSearches().filter((q) => q.toLowerCase() !== clean.toLowerCase())
  const updated = [clean, ...existing].slice(0, MAX_RECENT_SEARCHES)

  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage quota errors
  }

  return updated
}
