import { ConvexError } from 'convex/values'
import type { UserIdentity } from 'convex/server'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

export type ProjectRole = 'owner' | 'editor' | 'viewer'

export interface ProjectAccessResult {
  role: ProjectRole
  isReadOnly: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  if (identity && project.ownerId === identity.tokenIdentifier) {
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
 * Verifies the caller is authenticated and is the sole owner of the project.
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
  if (project.ownerId !== identity.tokenIdentifier) {
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
