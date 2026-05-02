import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addProjectCollaborator = mutation({
  args: {
    projectId: v.id("projects"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the collaborator already exists for this project
    const existing = await ctx.db
      .query("projectCollaborators")
      .withIndex("by_projectId_and_email", (q) =>
        q.eq("projectId", args.projectId).eq("email", args.email)
      )
      .unique();

    if (existing) {
      throw new Error(`Collaborator with email ${args.email} already exists for this project.`);
    }

    // Insert the new collaborator
    return await ctx.db.insert("projectCollaborators", {
      projectId: args.projectId,
      email: args.email,
      createdAt: Date.now(),
    });
  },
});
