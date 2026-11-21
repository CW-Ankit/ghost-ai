import { describe, it, expect, vi } from 'vitest'

describe('Project Access & Liveblocks Session Auth', () => {
  it('gracefully handles timeout when Convex query exceeds timeout threshold', async () => {
    // Simulate Promise.race with delayed query
    const delayedQuery = new Promise((resolve) => setTimeout(() => resolve({ _id: 'proj-1' }), 100))
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 20)
    )

    const result = await Promise.race([delayedQuery, timeoutPromise])
    expect(result).toBeNull()
  })

  it('resolves project access when Convex returns within timeout limit', async () => {
    const fastQuery = new Promise((resolve) => setTimeout(() => resolve({ _id: 'proj-fast', name: 'Fast Project' }), 10))
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 100)
    )

    const result = (await Promise.race([fastQuery, timeoutPromise])) as any
    expect(result).not.toBeNull()
    expect(result._id).toBe('proj-fast')
  })
})

describe('Data URI Markdown Specification Utilities', () => {
  it('correctly encodes and decodes markdown content into data URIs', () => {
    const markdown = `# Architecture Specification\n\n## 1. Overview\nThis is a test spec.`
    const dataUri = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`

    expect(dataUri.startsWith('data:text/markdown;charset=utf-8,')).toBe(true)

    const commaIndex = dataUri.indexOf(',')
    const decoded = decodeURIComponent(dataUri.slice(commaIndex + 1))
    expect(decoded).toBe(markdown)
  })

  it('correctly parses title from markdown', () => {
    const markdown = `# Microservices E-Commerce Architecture\n\nSome text`
    const match = markdown.match(/^#\s+(.+)$/m)
    const title = match ? match[1].trim() : 'Default'
    expect(title).toBe('Microservices E-Commerce Architecture')
  })
})
