import { ConvexError } from 'convex/values'
import type { UserIdentity } from 'convex/server'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

export type ProjectRole = 'owner' | 'editor' | 'viewer'

export interface ProjectAccessResult {
  role: ProjectRole
  isReadOnly: boolean
}

export interface OrgContext {
  orgId: string | null
  orgRole: string | null
  isOrgAdmin: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

/**
 * Extracts optional Clerk organization claims from Convex UserIdentity.
 * Supports both standard JWT template claims (`org_id`, `org_role`) and
 * Clerk Session Token v2 compact organization claims (`o.id`, `o.rol`).
 */
export function extractOrgContext(identity: UserIdentity | null): OrgContext {
  if (!identity) {
    return { orgId: null, orgRole: null, isOrgAdmin: false }
  }

  const claims = identity as unknown as Record<string, unknown>
  const compactOrg =
    claims.o && typeof claims.o === 'object' && !Array.isArray(claims.o)
      ? (claims.o as Record<string, unknown>)
      : null

  const orgId =
    readNonEmptyString(claims.org_id) ??
    readNonEmptyString(claims.orgId) ??
    readNonEmptyString(compactOrg?.id)

  const orgRole =
    readNonEmptyString(claims.org_role) ??
    readNonEmptyString(claims.orgRole) ??
    readNonEmptyString(compactOrg?.rol)

  const isOrgAdmin = orgRole === 'org:admin' || orgRole === 'admin'

  return { orgId, orgRole, isOrgAdmin }
}

/**
 * Returns true if the authenticated user can perform owner/admin actions on a project.
 * Personal projects require matching `ownerId`; organization projects require active
 * membership in `project.orgId` as either an org admin or the project creator.
 */
export function canManageProject(project: Doc<'projects'>, identity: UserIdentity): boolean {
  if (project.orgId) {
    const orgCtx = extractOrgContext(identity)
    return (
      orgCtx.orgId === project.orgId &&
      (orgCtx.isOrgAdmin || project.ownerId === identity.tokenIdentifier)
    )
  }
  return project.ownerId === identity.tokenIdentifier
}

/**
 * Normalizes email addresses for consistent collaborator indexing and lookup.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Validates basic email syntax before persisting collaborator invitations.
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email))
}

/**
 * Ensures the request has a valid authenticated Clerk/Convex user identity.
 */
export async function requireIdentity(ctx: QueryCtx | MutationCtx): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new ConvexError('Unauthenticated')
  }
  return identity
}

/**
 * Checks whether an authenticated user is listed as a collaborator on a project.
 */
export async function isProjectCollaborator(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<'projects'>,
  email: string | undefined
): Promise<boolean> {
  if (!email) return false

  const normalized = normalizeEmail(email)
  const match = await ctx.db
    .query('projectCollaborators')
    .withIndex('by_projectId_and_email', (q) =>
      q.eq('projectId', projectId).eq('email', normalized)
    )
    .unique()

  if (match) return true

  // Support legacy un-normalized emails stored prior to normalization
  if (normalized !== email) {
    const legacyMatch = await ctx.db
      .query('projectCollaborators')
      .withIndex('by_projectId_and_email', (q) => q.eq('projectId', projectId).eq('email', email))
      .unique()
    if (legacyMatch) return true
  }

  return false
}

/**
 * Resolves a user's effective role and read-only state for a project,
 * or returns null when access is denied.
 */
export async function resolveProjectAccess(
  ctx: QueryCtx | MutationCtx,
  project: Doc<'projects'>,
  identity: UserIdentity | null
): Promise<ProjectAccessResult | null> {
  if (project.orgId) {
    const orgCtx = extractOrgContext(identity)
    if (identity && orgCtx.orgId === project.orgId) {
      const isManager = orgCtx.isOrgAdmin || project.ownerId === identity.tokenIdentifier
      return { role: isManager ? 'owner' : 'editor', isReadOnly: false }
    }
  } else if (identity && project.ownerId === identity.tokenIdentifier) {
    return { role: 'owner', isReadOnly: false }
  }

  if (identity?.email && (await isProjectCollaborator(ctx, project._id, identity.email))) {
    return { role: 'editor', isReadOnly: false }
  }

  if (project.publicAccess === 'VIEW_ONLY') {
    return { role: 'viewer', isReadOnly: true }
  }

  return null
}

/**
 * Verifies the caller is authenticated and is an owner or collaborator (write access).
 */
export async function requireProjectMember(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<'projects'>
): Promise<{
  identity: UserIdentity
  project: Doc<'projects'>
  role: 'owner' | 'editor'
}> {
  const identity = await requireIdentity(ctx)
  const project = await ctx.db.get(projectId)
  if (!project) {
    throw new ConvexError('Project not found')
  }

  const access = await resolveProjectAccess(ctx, project, identity)
  if (!access || access.isReadOnly) {
    throw new ConvexError('Unauthorized: You do not have edit permission for this project')
  }

  return {
    identity,
    project,
    role: access.role as 'owner' | 'editor',
  }
}

/**
 * Verifies the caller is authenticated and can manage the project
 * (sole owner for personal projects, or creator / org admin for organization projects).
 */
export async function requireProjectOwner(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<'projects'>,
  unauthorizedMessage = 'Project not found or unauthorized'
): Promise<{
  identity: UserIdentity
  project: Doc<'projects'>
}> {
  const identity = await requireIdentity(ctx)
  const project = await ctx.db.get(projectId)
  if (!project) {
    throw new ConvexError('Project not found')
  }
  if (!canManageProject(project, identity)) {
    throw new ConvexError(unauthorizedMessage)
  }

  return { identity, project }
}

/**
 * Deletes a project and all dependent records across collaborators, favorites,
 * presence, taskRuns, and specs using indexed queries.
 */
export async function cascadeDeleteProject(
  ctx: MutationCtx,
  projectId: Id<'projects'>
): Promise<void> {
  const collaborators = await ctx.db
    .query('projectCollaborators')
    .withIndex('by_projectId_and_email', (q) => q.eq('projectId', projectId))
    .take(500)
  for (const collab of collaborators) {
    await ctx.db.delete(collab._id)
  }

  const favorites = await ctx.db
    .query('favorites')
    .withIndex('by_projectId', (q) => q.eq('projectId', projectId))
    .take(500)
  for (const fav of favorites) {
    await ctx.db.delete(fav._id)
  }

  const presenceRecords = await ctx.db
    .query('presence')
    .withIndex('by_projectId', (q) => q.eq('projectId', projectId))
    .take(500)
  for (const record of presenceRecords) {
    await ctx.db.delete(record._id)
  }

  const taskRuns = await ctx.db
    .query('taskRuns')
    .withIndex('by_projectId', (q) => q.eq('projectId', projectId))
    .take(500)
  for (const run of taskRuns) {
    await ctx.db.delete(run._id)
  }

  const specs = await ctx.db
    .query('specs')
    .withIndex('by_projectId', (q) => q.eq('projectId', projectId))
    .take(500)
  for (const spec of specs) {
    await ctx.db.delete(spec._id)
  }

  await ctx.db.delete(projectId)
}
