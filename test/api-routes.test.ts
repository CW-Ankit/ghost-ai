import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockAuth = vi.fn()
const mockCurrentUser = vi.fn()
const mockClerkClient = vi.fn()
const mockQuery = vi.fn()
const mockMutation = vi.fn()
const mockAction = vi.fn()
const mockSetAuth = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
  clerkClient: () => mockClerkClient(),
}))

vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    setAuth = mockSetAuth
    query = mockQuery
    mutation = mockMutation
    action = mockAction
  },
}))

vi.mock('@vercel/blob', () => ({
  put: vi.fn(async (pathname: string) => ({
    url: `https://demo.public.blob.vercel-storage.com/${pathname}`,
  })),
}))

describe('Next.js Backend API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://example.convex.cloud'
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
    process.env.CLERK_SECRET_KEY = 'sk_test_123'
    process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY = 'pk_lb_123'
    process.env.LIVEBLOCKS_SECRET_KEY = 'sk_lb_123'
    process.env.CONVEX_INTERNAL_SECRET = 'internal-secret-xyz'
    delete process.env.BLOB_READ_WRITE_TOKEN

    mockAuth.mockResolvedValue({
      userId: 'user_123',
      getToken: vi.fn().mockResolvedValue('convex-jwt-token'),
      sessionClaims: { full_name: 'Test User' },
    })
  })

  it('GET /api/health reports service configuration flags', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 200 }))
    const { GET } = await import('@/app/api/health/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.services.convexConfigured).toBe(true)
    expect(body.services.convexReachable).toBe(true)
  })

  it('GET & POST /api/projects enforce auth and default project name', async () => {
    const { GET, POST } = await import('@/app/api/projects/route')

    mockAuth.mockResolvedValueOnce({ userId: null, getToken: vi.fn() })
    const unauthRes = await GET()
    expect(unauthRes.status).toBe(401)

    mockMutation.mockResolvedValueOnce('proj_1')
    const postReq = new Request('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'New system' }),
    })
    const postRes = await POST(postReq)
    const postJson = await postRes.json()

    expect(postRes.status).toBe(201)
    expect(postJson.projectId).toBe('proj_1')
    expect(postJson.roomId).toMatch(/^room-/)
    expect(mockMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ roomId: postJson.roomId })
    )
  })

  it('PATCH & DELETE /api/projects/[projectId] map authorization & validation errors', async () => {
    const { PATCH, DELETE } = await import('@/app/api/projects/[projectId]/route')

    const badStatusReq = new Request('http://localhost:3000/api/projects/proj_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INVALID' }),
    })
    const badRes = await PATCH(badStatusReq, { params: Promise.resolve({ projectId: 'proj_1' }) })
    expect(badRes.status).toBe(400)

    mockMutation.mockRejectedValueOnce(new Error('Only the project owner can delete this project'))
    const delReq = new Request('http://localhost:3000/api/projects/proj_1', { method: 'DELETE' })
    const delRes = await DELETE(delReq, { params: Promise.resolve({ projectId: 'proj_1' }) })
    expect(delRes.status).toBe(403)
  })

  it('POST /api/projects/[projectId]/collaborators validates email and handles 409 conflicts', async () => {
    const { POST } = await import('@/app/api/projects/[projectId]/collaborators/route')

    const badEmailReq = new Request('http://localhost:3000/api/projects/proj_1/collaborators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid' }),
    })
    const badEmailRes = await POST(badEmailReq, {
      params: Promise.resolve({ projectId: 'proj_1' }),
    })
    expect(badEmailRes.status).toBe(400)

    mockMutation.mockRejectedValueOnce(new Error('User already invited'))
    const dupReq = new Request('http://localhost:3000/api/projects/proj_1/collaborators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com' }),
    })
    const dupRes = await POST(dupReq, { params: Promise.resolve({ projectId: 'proj_1' }) })
    expect(dupRes.status).toBe(409)
  })

  it('POST /api/canvas/save rejects read-only viewers and saves valid JSON payload', async () => {
    const { POST } = await import('@/app/api/canvas/save/route')

    mockQuery.mockResolvedValueOnce({ _id: 'proj_1', roomId: 'room-1', isReadOnly: true })
    const roReq = new NextRequest('http://localhost:3000/api/canvas/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj_1', nodes: [], edges: [] }),
    })
    const roRes = await POST(roReq)
    expect(roRes.status).toBe(403)

    mockQuery.mockResolvedValueOnce({ _id: 'proj_1', roomId: 'room-1', isReadOnly: false })
    const okReq = new NextRequest('http://localhost:3000/api/canvas/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj_1', nodes: [{ id: 'n1' }], edges: [] }),
    })
    const okRes = await POST(okReq)
    const okJson = await okRes.json()
    expect(okRes.status).toBe(200)
    expect(okJson.success).toBe(true)
    expect(okJson.blobUrl.startsWith('data:application/json;charset=utf-8,')).toBe(true)
  })

  it('POST /api/specs/upload requires internal secret or authenticated member', async () => {
    const { POST } = await import('@/app/api/specs/upload/route')

    mockAuth.mockResolvedValueOnce({ userId: null, getToken: vi.fn() })
    const unauthReq = new NextRequest('http://localhost:3000/api/specs/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj_1', specId: 'spec-1', content: '# Spec' }),
    })
    const unauthRes = await POST(unauthReq)
    expect(unauthRes.status).toBe(401)

    const internalReq = new NextRequest('http://localhost:3000/api/specs/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': 'internal-secret-xyz',
      },
      body: JSON.stringify({ projectId: 'proj_1', specId: 'spec-1', content: '# Spec' }),
    })
    const internalRes = await POST(internalReq)
    expect(internalRes.status).toBe(200)
  })

  it('GET /api/specs/[specId] prevents SSRF URL overrides and returns attachment', async () => {
    const { GET } = await import('@/app/api/specs/[specId]/route')

    const validDataUri = `data:text/markdown;charset=utf-8,${encodeURIComponent('# Architecture Spec')}`
    mockQuery.mockResolvedValueOnce({
      _id: 'spec_1',
      projectId: 'proj_1',
      title: 'Architecture Spec',
      filePath: validDataUri,
    })

    const ssrfReq = new NextRequest(
      'http://localhost:3000/api/specs/spec_1?url=http://169.254.169.254/latest/meta-data'
    )
    const ssrfRes = await GET(ssrfReq, { params: Promise.resolve({ specId: 'spec_1' }) })
    expect(ssrfRes.status).toBe(403)

    mockQuery.mockResolvedValueOnce({
      _id: 'spec_1',
      projectId: 'proj_1',
      title: 'Architecture Spec',
      filePath: validDataUri,
    })
    const okReq = new NextRequest('http://localhost:3000/api/specs/spec_1')
    const okRes = await GET(okReq, { params: Promise.resolve({ specId: 'spec_1' }) })
    expect(okRes.status).toBe(200)
    expect(okRes.headers.get('Content-Disposition')).toContain('architecture-spec.md')
    expect(await okRes.text()).toBe('# Architecture Spec')
  })

  it('POST /api/ai/design and POST /api/ai/spec validate input and invoke Convex actions', async () => {
    const { POST: postDesign } = await import('@/app/api/ai/design/route')
    const { POST: postSpec } = await import('@/app/api/ai/spec/route')

    mockAction.mockResolvedValueOnce({
      taskRunId: 'run_1',
      nodes: [{ id: 'n1' }],
      edges: [],
      summary: 'Generated',
    })

    const designReq = new NextRequest('http://localhost:3000/api/ai/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj_1', prompt: 'Design a chat app' }),
    })
    const designRes = await postDesign(designReq)
    expect(designRes.status).toBe(200)
    expect((await designRes.json()).taskRunId).toBe('run_1')

    const emptyNodesReq = new NextRequest('http://localhost:3000/api/ai/spec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj_1', nodes: [], edges: [] }),
    })
    const emptyNodesRes = await postSpec(emptyNodesReq)
    expect(emptyNodesRes.status).toBe(400)
  })
})
