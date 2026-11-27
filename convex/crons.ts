import { cronJobs } from 'convex/server'
import { internalMutation } from './_generated/server'
import { internal } from './_generated/api'

export const prunePresence = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const timeout = 60 * 1000 * 5 // Prune records older than 5 minutes

    const expired = await ctx.db
      .query('presence')
      .withIndex('by_lastActive', (q) => q.lt('lastActive', now - timeout))
      .take(200)

    for (const p of expired) {
      await ctx.db.delete(p._id)
    }

    return expired.length
  },
})

const crons = cronJobs()
crons.interval('prune-presence', { minutes: 5 }, internal.crons.prunePresence)

export default crons
