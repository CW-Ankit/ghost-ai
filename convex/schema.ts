import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    ownerId: v.string(), // Clerk user ID
    canvasJsonPath: v.optional(v.string()), // Vercel Blob path
    createdAt: v.number(),
  }).index('by_owner', ['ownerId']),

  collaborators: defineTable({
    projectId: v.id('projects'),
    userId: v.string(), // Clerk user ID,
  })
    .index('by_project', ['projectId'])
    .index('by_user', ['userId']),

  specs: defineTable({
    projectId: v.id('projects'),
    filePath: v.string(), // Vercel Blob path
    title: v.string(),
    createdAt: v.number(),
  }).index('by_project', ['projectId']),

  taskRuns: defineTable({
    projectId: v.id('projects'),
    status: v.string(), // "pending", "running", "completed", "failed"
    taskType: v.string(), // "design_generation", "spec_generation"
    result: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_project', ['projectId']),
})
