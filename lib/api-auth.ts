import { auth } from '@clerk/nextjs/server'
import { get as getBlob, put as putBlob } from '@vercel/blob'
import { ConvexHttpClient } from 'convex/browser'
import { NextResponse } from 'next/server'

export interface AuthenticatedConvexContext {
  userId: string
  orgId: string | null
  orgRole: string | null
  token: string
  convex: ConvexHttpClient
}

/**
 * Resolves a Convex-ready JWT from Clerk, matching `ConvexProviderWithClerk`:
 * uses the default session token directly when Clerk's native Convex integration
 * is active (`aud === 'convex'`), falling back to the legacy `convex` JWT template.
 */
export async function resolveConvexToken(
  sessionClaims: Record<string, unknown> | null | undefined,
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<string | null> {
  const aud = sessionClaims?.aud
  const hasNativeConvexAud =
    aud === 'convex' || (Array.isArray(aud) && aud.includes('convex'))

  if (hasNativeConvexAud) {
    return await getToken().catch(() => null)
  }

  try {
    return await getToken({ template: 'convex' })
  } catch {
    return await getToken().catch(() => null)
  }
}

/**
 * Resolves the Clerk session (including optional active organization context)
 * and creates a per-request authenticated ConvexHttpClient.
 * Returns either the authenticated context or a ready-to-return 401/500 NextResponse.
 */
export async function getAuthenticatedConvex(): Promise<
  | { ok: true; ctx: AuthenticatedConvexContext }
  | { ok: false; response: NextResponse }
> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'NEXT_PUBLIC_CONVEX_URL is not configured' },
        { status: 500 }
      ),
    }
  }

  const { userId, orgId, orgRole, sessionClaims, getToken } = await auth()
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }),
    }
  }

  const token = await resolveConvexToken(
    sessionClaims as Record<string, unknown> | null | undefined,
    getToken
  )

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }),
    }
  }

  const convex = new ConvexHttpClient(convexUrl)
  convex.setAuth(token)

  return {
    ok: true,
    ctx: {
      userId,
      orgId: orgId ?? null,
      orgRole: orgRole ?? null,
      token,
      convex,
    },
  }
}

/**
 * Creates a ConvexHttpClient optionally authenticated with the current Clerk session.
 * Useful for endpoints that support both authenticated users and public VIEW_ONLY access.
 */
export async function getOptionalConvex(): Promise<{
  userId: string | null
  orgId: string | null
  orgRole: string | null
  token: string | null
  convex: ConvexHttpClient
}> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured')
  }

  const { userId, orgId, orgRole, sessionClaims, getToken } = await auth()
  const token = userId
    ? await resolveConvexToken(
        sessionClaims as Record<string, unknown> | null | undefined,
        getToken
      )
    : null

  const convex = new ConvexHttpClient(convexUrl)
  if (token) {
    convex.setAuth(token)
  }

  return {
    userId: userId ?? null,
    orgId: orgId ?? null,
    orgRole: orgRole ?? null,
    token,
    convex,
  }
}

/**
 * Safely parses a JSON request body, returning a 400 NextResponse on invalid JSON.
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  req: Request
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  try {
    const data = (await req.json()) as T
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 }),
      }
    }
    return { ok: true, data }
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 }),
    }
  }
}

/**
 * Validates that a remote artifact URL is safe to fetch server-side (SSRF guard).
 * Allows data:text/markdown or data:application/json URIs and Vercel Blob HTTPS URLs.
 */
export function isAllowedArtifactUrl(rawUrl: string): boolean {
  if (rawUrl.startsWith('data:text/markdown') || rawUrl.startsWith('data:application/json')) {
    return true
  }
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'https:') return false
    const hostname = parsed.hostname.toLowerCase()
    return (
      hostname === 'blob.vercel-storage.com' ||
      hostname.endsWith('.blob.vercel-storage.com') ||
      hostname.endsWith('.public.blob.vercel-storage.com')
    )
  } catch {
    return false
  }
}

/**
 * Uploads an artifact to Vercel Blob, supporting both private and public Blob stores.
 * Falls back to a self-contained data URI when BLOB_READ_WRITE_TOKEN is absent.
 */
export async function uploadArtifactToBlob(
  pathname: string,
  content: string,
  contentType: string
): Promise<{ blobUrl: string; fallback: boolean }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      blobUrl: `data:${contentType},${encodeURIComponent(content)}`,
      fallback: true,
    }
  }

  try {
    const blob = await putBlob(pathname, content, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    })
    return { blobUrl: blob.url, fallback: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
    if (msg.includes('public') && msg.includes('access')) {
      const blob = await putBlob(pathname, content, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType,
      })
      return { blobUrl: blob.url, fallback: false }
    }
    throw err
  }
}

/**
 * Safely reads text content from a verified data URI or allowed Vercel Blob HTTPS URL.
 * Supports both private and public Vercel Blob stores.
 */
export async function readVerifiedArtifact(
  artifactUrl: string
): Promise<{ ok: true; content: string } | { ok: false; status: number; error: string }> {
  if (!isAllowedArtifactUrl(artifactUrl)) {
    return { ok: false, status: 400, error: 'Unsupported or untrusted artifact URL' }
  }

  if (artifactUrl.startsWith('data:')) {
    const commaIndex = artifactUrl.indexOf(',')
    if (commaIndex === -1) {
      return { ok: false, status: 400, error: 'Malformed data URI' }
    }
    return { ok: true, content: decodeURIComponent(artifactUrl.slice(commaIndex + 1)) }
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const isPublicHost = artifactUrl.includes('.public.blob.vercel-storage.com')
      const blobResult = await getBlob(artifactUrl, {
        access: isPublicHost ? 'public' : 'private',
        useCache: false,
      })
      if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
        return { ok: false, status: 404, error: 'Artifact not found in Blob storage' }
      }
      const content = await new Response(blobResult.stream).text()
      return { ok: true, content }
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
      // Retry opposite access level if store visibility differs from URL host heuristic
      if (msg.includes('access') || msg.includes('private') || msg.includes('public')) {
        const retryResult = await getBlob(artifactUrl, {
          access: artifactUrl.includes('.public.blob.vercel-storage.com') ? 'private' : 'public',
          useCache: false,
        })
        if (retryResult && retryResult.statusCode === 200 && retryResult.stream) {
          return { ok: true, content: await new Response(retryResult.stream).text() }
        }
      }
      throw err
    }
  }

  const response = await fetch(artifactUrl)
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: `Failed to fetch artifact content: ${response.statusText}`,
    }
  }

  return { ok: true, content: await response.text() }
}

/**
 * Maps ConvexError and application errors to predictable HTTP status codes.
 */
export function handleApiError(error: unknown, fallbackMessage = 'Internal server error'): NextResponse {
  const message = error instanceof Error ? error.message : fallbackMessage
  const lower = message.toLowerCase()

  if (lower.includes('unauthenticated')) {
    return NextResponse.json({ error: message }, { status: 401 })
  }
  if (
    lower.includes('unauthorized') ||
    lower.includes('only the project owner') ||
    lower.includes('do not have permission') ||
    lower.includes('do not have edit permission')
  ) {
    return NextResponse.json({ error: message }, { status: 403 })
  }
  if (lower.includes('not found')) {
    return NextResponse.json({ error: message }, { status: 404 })
  }
  if (lower.includes('already invited') || lower.includes('already exists')) {
    return NextResponse.json({ error: message }, { status: 409 })
  }
  if (
    lower.includes('invalid') ||
    lower.includes('required') ||
    lower.includes('cannot be empty') ||
    lower.includes('cannot invite') ||
    lower.includes('must contain') ||
    lower.includes('validator error') ||
    lower.includes('argumentvalidationerror') ||
    lower.includes('expected id') ||
    lower.includes('unable to validate id')
  ) {
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ error: message || fallbackMessage }, { status: 500 })
}
