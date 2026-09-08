import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { ConvexError } from 'convex/values'

export const setPresence = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError('Unauthenticated')

    const userId = identity.tokenIdentifier

    const existing = await ctx.db
      .query('presence')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('projectId'), args.projectId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { lastActive: Date.now() })
    } else {
      await ctx.db.insert('presence', {
        userId,
        projectId: args.projectId,
        lastActive: Date.now(),
      })
    }
  },
})

export const clearPresence = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return

    const userId = identity.tokenIdentifier
    const existing = await ctx.db
      .query('presence')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('projectId'), args.projectId))
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
    }
  },
})

export const getActiveProjects = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const timeout = 60 * 1000 // 1 minute

    return await ctx.db
      .query('presence')
      .filter((q) => q.gt(q.field('lastActive'), now - timeout))
      .collect()
  },
})
