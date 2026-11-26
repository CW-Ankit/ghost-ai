#!/usr/bin/env node

/**
 * Ghost AI Backend HTTP Test Runner
 *
 * Usage:
 *   pnpm test:api                    # Auto-mints a temporary Clerk session via CLERK_SECRET_KEY in .env.local
 *   pnpm test:token                  # Prints a 5-minute Bearer token for Postman testing
 *   SKIP_AUTH=1 pnpm test:api        # Runs only public & unauthenticated security boundary checks (401/403/400)
 *   BEARER_TOKEN="eyJ..." pnpm test:api
 *   AUTH_COOKIE="__session=..." pnpm test:api
 */

import fs from 'node:fs'
import path from 'node:path'

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const out = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return out
}

const localEnv = loadLocalEnv()
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const COLLAB_EMAIL = process.env.TEST_COLLAB_EMAIL || 'backend-test-collab@example.com'
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || localEnv.CLERK_SECRET_KEY || ''
const SKIP_AUTH = process.env.SKIP_AUTH === '1'
const PRINT_TOKEN_ONLY = process.argv.includes('--print-token')

let activeCookie = process.env.AUTH_COOKIE || ''
let activeBearer = process.env.BEARER_TOKEN || ''
let mintedSessionId = null

// If user passed AUTH_COOKIE="__session=<jwt>" without BEARER_TOKEN, also extract JWT for Bearer auth
// because Clerk cookie auth requires __client_uat alongside __session.
if (activeCookie && !activeBearer) {
  const match = activeCookie.match(/(?:^|;\s*)__session=([^;]+)/)
  if (match && match[1]) {
    activeBearer = match[1]
  }
}

const results = []

function authHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra }
  if (activeCookie) headers.Cookie = activeCookie
  if (activeBearer) headers.Authorization = `Bearer ${activeBearer}`
  return headers
}

async function mintClerkSessionToken(expiresInSeconds = 300) {
  if (!CLERK_SECRET_KEY) return null
  const usersRes = await fetch('https://api.clerk.com/v1/users?limit=1', {
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
  })
  if (!usersRes.ok) {
    throw new Error(`Clerk users lookup failed (${usersRes.status})`)
  }
  const users = await usersRes.json()
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error('No users found in Clerk dev instance. Sign up at least one user first.')
  }

  const sessRes = await fetch('https://api.clerk.com/v1/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: users[0].id }),
  })
  if (!sessRes.ok) {
    throw new Error(`Clerk session creation failed (${sessRes.status})`)
  }
  const sess = await sessRes.json()

  const tokRes = await fetch(`https://api.clerk.com/v1/sessions/${sess.id}/tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expires_in_seconds: expiresInSeconds }),
  })
  if (!tokRes.ok) {
    throw new Error(`Clerk token generation failed (${tokRes.status})`)
  }
  const tok = await tokRes.json()
  return { sessionId: sess.id, jwt: tok.jwt }
}

async function revokeClerkSession(sessionId) {
  if (!sessionId || !CLERK_SECRET_KEY) return
  await fetch(`https://api.clerk.com/v1/sessions/${sessionId}/revoke`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
  }).catch(() => {})
}

async function runCheck(name, fn) {
  const start = Date.now()
  try {
    const detail = await fn()
    const ms = Date.now() - start
    results.push({ name, status: 'PASS', ms, detail: detail || '' })
    console.log(`PASS  [${ms}ms] ${name}${detail ? ` — ${detail}` : ''}`)
  } catch (err) {
    const ms = Date.now() - start
    const msg = err instanceof Error ? err.message : String(err)
    results.push({ name, status: 'FAIL', ms, detail: msg })
    console.error(`FAIL  [${ms}ms] ${name} — ${msg}`)
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message)
}

async function fetchJson(reqPath, options = {}) {
  const res = await fetch(`${BASE_URL}${reqPath}`, options)
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { res, text, json }
}

async function main() {
  if (PRINT_TOKEN_ONLY) {
    const minted = await mintClerkSessionToken(300)
    if (!minted) {
      console.error('CLERK_SECRET_KEY not found in environment or .env.local')
      process.exit(1)
    }
    console.log('\n5-minute Clerk Bearer token for Postman (paste into bearerToken):\n')
    console.log(minted.jwt)
    console.log(`\n(Session ID: ${minted.sessionId})\n`)
    return
  }

  console.log(`\nGhost AI Backend Verification against ${BASE_URL}\n${'='.repeat(60)}`)

  // 1. Public & Security Boundary Checks (always run)
  await runCheck('GET /api/health returns 200 or 503 with service flags', async () => {
    const { res, json } = await fetchJson('/api/health')
    assert(res.status === 200 || res.status === 503, `Unexpected status ${res.status}`)
    assert(json && typeof json.services === 'object', 'Missing services object')
    return `status=${json.status}, convexReachable=${json.services.convexReachable}`
  })

  await runCheck('GET /api/projects rejects unauthenticated callers with 401', async () => {
    const { res } = await fetchJson('/api/projects')
    assert(res.status === 401, `Expected 401, got ${res.status}`)
    return '401 Unauthorized'
  })

  await runCheck('POST /api/canvas/save rejects unauthenticated callers with 401', async () => {
    const { res } = await fetchJson('/api/canvas/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'invalid', nodes: [], edges: [] }),
    })
    assert(res.status === 401, `Expected 401, got ${res.status}`)
    return '401 Unauthorized'
  })

  await runCheck('POST /api/specs/upload rejects unauthenticated callers with 401', async () => {
    const { res } = await fetchJson('/api/specs/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'p1', specId: 's1', content: '# Test' }),
    })
    assert(res.status === 401, `Expected 401, got ${res.status}`)
    return '401 Unauthorized'
  })

  await runCheck('POST /api/liveblocks-auth returns 400 when room is missing', async () => {
    const { res } = await fetchJson('/api/liveblocks-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    assert(res.status === 400, `Expected 400, got ${res.status}`)
    return '400 Room ID required'
  })

  await runCheck('POST /api/liveblocks-auth denies unknown/private room with 403', async () => {
    const { res } = await fetchJson('/api/liveblocks-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: 'non-existent-room-check' }),
    })
    assert(res.status === 403, `Expected 403, got ${res.status}`)
    return '403 Forbidden'
  })

  await runCheck('POST /api/ai/design rejects unauthenticated callers with 401', async () => {
    const { res } = await fetchJson('/api/ai/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'p1', prompt: 'test' }),
    })
    assert(res.status === 401, `Expected 401, got ${res.status}`)
    return '401 Unauthorized'
  })

  // Auto-mint a temporary Clerk session token when running locally with CLERK_SECRET_KEY
  if (!SKIP_AUTH && !activeCookie && !activeBearer && CLERK_SECRET_KEY) {
    try {
      const minted = await mintClerkSessionToken(300)
      if (minted) {
        mintedSessionId = minted.sessionId
        activeBearer = minted.jwt
        console.log('INFO  Minted temporary 5-minute Clerk session token for E2E checks.')
      }
    } catch (err) {
      console.warn('WARN  Could not auto-mint Clerk token:', err instanceof Error ? err.message : err)
    }
  }

  // 2. Authenticated Full E2E Lifecycle
  if (SKIP_AUTH || (!activeCookie && !activeBearer)) {
    console.log(
      '\nSkipping authenticated E2E checks (set BEARER_TOKEN or ensure CLERK_SECRET_KEY is in .env.local).'
    )
  } else {
    let createdProjectId = null
    let createdRoomId = null
    let generatedNodes = []
    let generatedEdges = []
    let createdTaskRunId = null
    let createdSpecId = null

    try {
      await runCheck('POST /api/projects creates a new project', async () => {
        const { res, json } = await fetchJson('/api/projects', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            name: 'API Verification Project',
            description: 'Automated backend test run',
          }),
        })
        assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(json)}`)
        assert(json?.projectId && json?.roomId, 'Missing projectId or roomId')
        createdProjectId = json.projectId
        createdRoomId = json.roomId
        return `projectId=${createdProjectId}`
      })

      if (createdProjectId) {
        await runCheck('GET /api/projects/[projectId] returns project details', async () => {
          const { res, json, text } = await fetchJson(`/api/projects/${createdProjectId}`, {
            headers: authHeaders(),
          })
          assert(res.status === 200, `Expected 200, got ${res.status}: ${text}`)
          assert(json?.role === 'owner', `Expected role=owner, got ${json?.role}`)
          return `name="${json.name}", role=${json.role}`
        })

        await runCheck('PATCH /api/projects/[projectId] updates name, status, tags, publicAccess', async () => {
          const { res, json } = await fetchJson(`/api/projects/${createdProjectId}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({
              name: 'API Verification Project v2',
              status: 'REVIEW',
              tags: ['api-test', 'convex'],
              publicAccess: 'VIEW_ONLY',
            }),
          })
          assert(res.status === 200 && json?.success, `Expected 200, got ${res.status}`)
          return 'Updated metadata'
        })

        await runCheck('POST/GET/DELETE /api/projects/[projectId]/collaborators lifecycle', async () => {
          const add = await fetchJson(`/api/projects/${createdProjectId}/collaborators`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ email: COLLAB_EMAIL }),
          })
          assert(add.res.status === 201, `Invite expected 201, got ${add.res.status}`)

          const list = await fetchJson(`/api/projects/${createdProjectId}/collaborators`, {
            headers: authHeaders(),
          })
          assert(list.res.status === 200 && Array.isArray(list.json), 'List collaborators failed')
          assert(
            list.json.some((c) => c.email === COLLAB_EMAIL.toLowerCase()),
            'Invited collaborator missing from list'
          )

          const del = await fetchJson(
            `/api/projects/${createdProjectId}/collaborators?email=${encodeURIComponent(COLLAB_EMAIL)}`,
            { method: 'DELETE', headers: authHeaders() }
          )
          assert(del.res.status === 200, `Remove expected 200, got ${del.res.status}`)
          return 'Invited, listed, and removed collaborator'
        })

        await runCheck('POST /api/liveblocks-auth issues session token for authorized room', async () => {
          const { res, json } = await fetchJson('/api/liveblocks-auth', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ room: createdRoomId }),
          })
          assert(res.status === 200 && json?.token, `Expected 200 token, got ${res.status}`)
          return 'Issued Liveblocks JWT'
        })

        await runCheck('POST & GET /api/canvas/save persists and loads canvas state', async () => {
          const save = await fetchJson('/api/canvas/save', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              projectId: createdProjectId,
              roomId: createdRoomId,
              persistToConvex: true,
              nodes: [
                {
                  id: 'n1',
                  type: 'canvasNode',
                  position: { x: 100, y: 100 },
                  data: { label: 'API Gateway', shape: 'diamond', color: 'blue' },
                },
              ],
              edges: [],
            }),
          })
          assert(
            save.res.status === 200 && save.json?.blobUrl,
            `Save failed: ${save.res.status} ${save.text}`
          )

          const load = await fetchJson(`/api/canvas/save?projectId=${createdProjectId}`, {
            headers: authHeaders(),
          })
          assert(load.res.status === 200, `Load failed: ${load.res.status}`)
          assert(load.json?.canvas?.nodes?.length === 1, 'Loaded canvas nodes mismatch')
          return 'Saved and reloaded 1 node'
        })

        await runCheck('POST /api/ai/design generates architecture and creates taskRun', async () => {
          const { res, json } = await fetchJson('/api/ai/design', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              projectId: createdProjectId,
              prompt: 'Design a serverless SaaS backend with Postgres and Redis',
            }),
          })
          assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(json)}`)
          assert(Array.isArray(json?.nodes) && json.nodes.length > 0, 'No nodes returned')
          generatedNodes = json.nodes
          generatedEdges = json.edges || []
          createdTaskRunId = json.taskRunId
          return `nodes=${generatedNodes.length}, edges=${generatedEdges.length}`
        })

        if (createdTaskRunId) {
          await runCheck('GET /api/task-runs/[taskRunId] retrieves completed run', async () => {
            const { res, json } = await fetchJson(`/api/task-runs/${createdTaskRunId}`, {
              headers: authHeaders(),
            })
            assert(res.status === 200, `Expected 200, got ${res.status}`)
            assert(json?.status === 'completed', `Expected completed, got ${json?.status}`)
            return `status=${json.status}`
          })
        }

        if (generatedNodes.length > 0) {
          await runCheck('POST /api/ai/spec generates and stores technical specification', async () => {
            const { res, json } = await fetchJson('/api/ai/spec', {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({
                projectId: createdProjectId,
                nodes: generatedNodes,
                edges: generatedEdges,
              }),
            })
            assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(json)}`)
            assert(json?.specId && json?.markdown, 'Missing specId or markdown')
            createdSpecId = json.specId
            return `specId=${createdSpecId}`
          })
        }

        if (createdSpecId) {
          await runCheck('GET /api/projects/[projectId]/specs/[specId]/download returns .md attachment', async () => {
            const { res, text } = await fetchJson(
              `/api/projects/${createdProjectId}/specs/${createdSpecId}/download`,
              { headers: authHeaders() }
            )
            assert(res.status === 200, `Expected 200, got ${res.status}`)
            assert(
              res.headers.get('content-disposition')?.includes('attachment'),
              'Missing attachment header'
            )
            assert(text.includes('# '), 'Response body is not Markdown')
            return `${text.length} bytes`
          })

          await runCheck('DELETE /api/specs/[specId] removes specification', async () => {
            const { res } = await fetchJson(`/api/specs/${createdSpecId}`, {
              method: 'DELETE',
              headers: authHeaders(),
            })
            assert(res.status === 200, `Expected 200, got ${res.status}`)
            return 'Deleted spec'
          })
        }

        await runCheck('DELETE /api/projects/[projectId] cascade-deletes test project', async () => {
          const { res } = await fetchJson(`/api/projects/${createdProjectId}`, {
            method: 'DELETE',
            headers: authHeaders(),
          })
          assert(res.status === 200, `Expected 200, got ${res.status}`)
          return 'Cleaned up project'
        })
      }
    } finally {
      if (mintedSessionId) {
        await revokeClerkSession(mintedSessionId)
      }
    }
  }

  const failed = results.filter((r) => r.status === 'FAIL')
  console.log(`\nSummary: ${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal runner error:', err)
  process.exit(1)
})
