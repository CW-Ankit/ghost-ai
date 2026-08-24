import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    ownerId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("DRAFT"), v.literal("ARCHIVED"), v.literal("REVIEW")),
    roomId: v.string(),
    canvasJsonPath: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    pinned: v.optional(v.boolean()),
    lastAccessedAt: v.optional(v.number()),
    nodeCount: v.optional(v.number()),
    edgeCount: v.optional(v.number()),
    lastContributorId: v.optional(v.string()),
    canvasSnapshot: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_roomId", ["roomId"]),

  projectCollaborators: defineTable({
    projectId: v.id("projects"),
    email: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_projectId_and_email", ["projectId", "email"]),

  favorites: defineTable({
    userId: v.string(),
    projectId: v.id("projects"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_projectId", ["userId", "projectId"]),

  presence: defineTable({
    userId: v.string(),
    projectId: v.id("projects"),
    lastActive: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_userId", ["userId"])
    .index("by_lastActive", ["lastActive"]),
});
