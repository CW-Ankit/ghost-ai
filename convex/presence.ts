import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { resolveProjectAccess } from './lib/access'

const ACTIVE_WINDOW_MS = 60 * 1000

export const setPresence = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      // Public read-only viewers do not record authenticated presence rows
      return null
    }

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return null
    }

    const access = await resolveProjectAccess(ctx, project, identity)
    if (!access) {
      return null
    }

    const userId = identity.tokenIdentifier
    const existing = await ctx.db
      .query('presence')
      .withIndex('by_projectId_and_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', userId)
      )
      .unique()

    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, { lastActive: now })
    } else {
      await ctx.db.insert('presence', {
        userId,
        projectId: args.projectId,
        lastActive: now,
      })
    }

    return true
  },
})

export const clearPresence = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const userId = identity.tokenIdentifier
    const existing = await ctx.db
      .query('presence')
      .withIndex('by_projectId_and_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', userId)
      )
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
    }

    return true
  },
})

export const getActiveProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const cutoff = Date.now() - ACTIVE_WINDOW_MS
    const recent = await ctx.db
      .query('presence')
      .withIndex('by_lastActive', (q) => q.gt('lastActive', cutoff))
      .take(200)

    const projectAccessCache = new Map<string, boolean>()
    const visible = []

    for (const row of recent) {
      const key = row.projectId
      let hasAccess = projectAccessCache.get(key)
      if (hasAccess === undefined) {
        const project = await ctx.db.get(row.projectId)
        const access = project ? await resolveProjectAccess(ctx, project, identity) : null
        hasAccess = access !== null
        projectAccessCache.set(key, hasAccess)
      }
      if (hasAccess) {
        visible.push(row)
      }
    }

    return visible
  },
})
