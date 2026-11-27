// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'

type GlobMeta = {
  glob: (patterns: string[]) => Record<string, () => Promise<unknown>>
}

const modules = (import.meta as unknown as GlobMeta).glob(['./**/*.ts', '!./**/*.test.ts'])

const OWNER_IDENTITY = {
  tokenIdentifier: 'clerk|owner-1',
  subject: 'owner-1',
  email: 'owner@example.com',
  name: 'Owner User',
}

const COLLAB_IDENTITY = {
  tokenIdentifier: 'clerk|collab-2',
  subject: 'collab-2',
  email: 'Collab@Example.com',
  name: 'Collaborator User',
}

const STRANGER_IDENTITY = {
  tokenIdentifier: 'clerk|stranger-3',
  subject: 'stranger-3',
  email: 'stranger@example.com',
  name: 'Stranger User',
}

describe('Convex Backend Architecture', () => {
  it('enforces auth and CRUD lifecycle for projects', async () => {
    const t = convexTest(schema, modules)

    // Unauthenticated list returns null, unauthenticated create throws
    expect(await t.query(api.projects.list, {})).toBeNull()
    await expect(
      t.mutation(api.projects.create, { roomId: 'room-unauth' })
    ).rejects.toThrow(/Unauthenticated/)

    const asOwner = t.withIdentity(OWNER_IDENTITY)
    const projectId = await asOwner.mutation(api.projects.create, {
      roomId: 'room-alpha',
      description: 'Core architecture',
    })

    // Duplicate roomId is rejected to preserve unique room lookups
    await expect(
      asOwner.mutation(api.projects.create, { roomId: 'room-alpha' })
    ).rejects.toThrow(/already exists/)

    const listed = await asOwner.query(api.projects.list, {})
    expect(listed).not.toBeNull()
    expect(listed!.owned).toHaveLength(1)
    expect(listed!.owned[0].name).toBe('Untitled Project')
    expect(listed!.owned[0].publicAccess).toBe('PRIVATE')
    expect(listed!.shared).toHaveLength(0)

    await asOwner.mutation(api.projects.rename, {
      projectId,
      name: '  Payments Architecture  ',
    })
    await asOwner.mutation(api.projects.updateStatus, {
      projectId,
      status: 'REVIEW',
    })
    await asOwner.mutation(api.projects.updateTags, {
      projectId,
      tags: ['payments', ' kafka ', 'payments', ''],
    })

    const loaded = await asOwner.query(api.projects.getById, { projectId })
    expect(loaded).not.toBeNull()
    expect(loaded!.name).toBe('Payments Architecture')
    expect(loaded!.status).toBe('REVIEW')
    expect(loaded!.tags).toEqual(['payments', 'kafka'])
    expect(loaded!.role).toBe('owner')
    expect(loaded!.isReadOnly).toBe(false)
  })

  it('normalizes collaborator emails and enforces owner vs editor vs stranger boundaries', async () => {
    const t = convexTest(schema, modules)
    const asOwner = t.withIdentity(OWNER_IDENTITY)
    const asCollab = t.withIdentity(COLLAB_IDENTITY)
    const asStranger = t.withIdentity(STRANGER_IDENTITY)

    const projectId = await asOwner.mutation(api.projects.create, {
      name: 'Shared Workspace',
      roomId: 'room-shared',
    })

    // Validation checks
    await expect(
      asOwner.mutation(api.projects.addCollaborator, {
        projectId,
        email: 'not-an-email',
      })
    ).rejects.toThrow(/Invalid email/)

    await expect(
      asOwner.mutation(api.projects.addCollaborator, {
        projectId,
        email: 'OWNER@example.com',
      })
    ).rejects.toThrow(/Cannot invite the project owner/)

    // Invite collaborator with mixed case
    await asOwner.mutation(api.projects.addCollaborator, {
      projectId,
      email: '  collab@EXAMPLE.com ',
    })

    await expect(
      asOwner.mutation(api.projects.addCollaborator, {
        projectId,
        email: 'collab@example.com',
      })
    ).rejects.toThrow(/already invited/)

    // Collaborator sees project in shared list and has editor role
    const collabList = await asCollab.query(api.projects.list, {})
    expect(collabList!.shared).toHaveLength(1)
    expect(collabList!.shared[0]._id).toBe(projectId)

    const collabRoom = await asCollab.query(api.projects.getByRoomId, {
      roomId: 'room-shared',
    })
    expect(collabRoom?.role).toBe('editor')
    expect(collabRoom?.isReadOnly).toBe(false)

    // Collaborator can save canvas, but cannot rename/delete/invite
    await asCollab.mutation(api.projects.saveCanvas, {
      projectId,
      canvasJsonPath: 'data:application/json;charset=utf-8,%7B%7D',
      nodeCount: 2,
      edgeCount: 1,
    })

    await expect(
      asCollab.mutation(api.projects.rename, { projectId, name: 'Hijacked' })
    ).rejects.toThrow(/Only the project owner/)

    await expect(
      asCollab.mutation(api.projects.remove, { projectId })
    ).rejects.toThrow(/Only the project owner/)

    // Stranger cannot read project, collaborators, or canvas URL
    expect(await asStranger.query(api.projects.getById, { projectId })).toBeNull()
    expect(await asStranger.query(api.projects.getCollaborators, { projectId })).toBeNull()
    expect(await asStranger.query(api.projects.getCanvasUrl, { projectId })).toBeNull()
    await expect(
      asStranger.mutation(api.projects.saveCanvas, {
        projectId,
        canvasJsonPath: 'https://evil.test/x.json',
      })
    ).rejects.toThrow(/Unauthorized/)
  })

  it('supports VIEW_ONLY public access for guests while blocking mutations', async () => {
    const t = convexTest(schema, modules)
    const asOwner = t.withIdentity(OWNER_IDENTITY)
    const asStranger = t.withIdentity(STRANGER_IDENTITY)

    const projectId = await asOwner.mutation(api.projects.create, {
      name: 'Public Demo',
      roomId: 'room-public',
    })
    await asOwner.mutation(api.projects.saveCanvas, {
      projectId,
      canvasJsonPath: 'data:application/json;charset=utf-8,%7B%22nodes%22%3A%5B%5D%7D',
    })

    // Private initially
    expect(await t.query(api.projects.getByRoomId, { roomId: 'room-public' })).toBeNull()

    await asOwner.mutation(api.projects.setPublicAccess, {
      projectId,
      publicAccess: 'VIEW_ONLY',
    })

    const guestView = await t.query(api.projects.getByRoomId, { roomId: 'room-public' })
    expect(guestView?.role).toBe('viewer')
    expect(guestView?.isReadOnly).toBe(true)
    expect(await t.query(api.projects.getCanvasUrl, { projectId })).toContain('data:application/json')

    // Guest presence is a safe no-op, not an unhandled crash
    expect(await t.mutation(api.presence.setPresence, { projectId })).toBeNull()

    // Stranger with account still gets viewer read-only and cannot mutate
    const strangerView = await asStranger.query(api.projects.getByRoomId, {
      roomId: 'room-public',
    })
    expect(strangerView?.isReadOnly).toBe(true)
    await expect(
      asStranger.mutation(api.projects.saveCanvas, {
        projectId,
        canvasJsonPath: 'data:application/json,x',
      })
    ).rejects.toThrow(/Unauthorized/)
  })

  it('enforces authorization on AI actions, taskRuns, and specs, and runs offline pipelines', async () => {
    const t = convexTest(schema, modules)
    const asOwner = t.withIdentity(OWNER_IDENTITY)
    const asCollab = t.withIdentity(COLLAB_IDENTITY)
    const asStranger = t.withIdentity(STRANGER_IDENTITY)

    const projectId = await asOwner.mutation(api.projects.create, {
      name: 'AI Pipeline Project',
      roomId: 'room-ai',
    })
    await asOwner.mutation(api.projects.addCollaborator, {
      projectId,
      email: 'collab@example.com',
    })

    // Unauthenticated & stranger AI calls are rejected before inserting taskRuns
    await expect(
      t.action(api.ai.generateDesign, { projectId, prompt: 'Build an API gateway' })
    ).rejects.toThrow(/Unauthenticated/)
    await expect(
      asStranger.action(api.ai.generateDesign, { projectId, prompt: 'Build an API gateway' })
    ).rejects.toThrow(/Unauthorized/)
    await expect(
      asOwner.action(api.ai.generateDesign, { projectId, prompt: '   ' })
    ).rejects.toThrow(/empty/)

    // Authorized design generation (offline fallback when MISTRAL_API_KEY is unset)
    const design = await asOwner.action(api.ai.generateDesign, {
      projectId,
      prompt: 'Design an e-commerce microservices backend',
    })
    expect(design.nodes.length).toBeGreaterThan(3)
    expect(design.edges.length).toBeGreaterThan(2)
    expect(design.edges[0].sourceHandle).toMatch(/-(source)$/)
    expect(design.edges[0].targetHandle).toMatch(/-(target)$/)

    // Task run visibility is enforced per project member
    expect(await asStranger.query(api.taskRuns.getTaskRun, { taskRunId: design.taskRunId })).toBeNull()
    expect(await asStranger.query(api.taskRuns.getTaskRunsByProject, { projectId })).toBeNull()

    const ownerTaskRun = await asOwner.query(api.taskRuns.getTaskRun, {
      taskRunId: design.taskRunId,
    })
    expect(ownerTaskRun?.status).toBe('completed')

    const latestDesign = await asCollab.query(api.taskRuns.getLatestTaskRun, {
      projectId,
      type: 'design',
    })
    expect(latestDesign?._id).toBe(design.taskRunId)

    // Authorized spec generation
    const specResult = await asCollab.action(api.ai.generateSpec, {
      projectId,
      nodes: design.nodes,
      edges: design.edges,
      siteUrl: 'http://localhost:3000',
    })
    expect(specResult.markdown).toContain('Executive Overview')
    expect(specResult.filePath.startsWith('data:text/markdown;charset=utf-8,')).toBe(true)

    const specs = await asOwner.query(api.specs.listByProject, { projectId })
    expect(specs).toHaveLength(1)
    expect(await asStranger.query(api.specs.listByProject, { projectId })).toEqual([])

    // Only owner can delete spec
    await expect(
      asCollab.mutation(api.specs.remove, { specId: specResult.specId })
    ).rejects.toThrow(/Only the project owner/)
    await asOwner.mutation(api.specs.remove, { specId: specResult.specId })
    expect(await asOwner.query(api.specs.listByProject, { projectId })).toHaveLength(0)
  })

  it('cascade-deletes all dependent tables on remove and bulkDelete and prunes stale presence', async () => {
    const t = convexTest(schema, modules)
    const asOwner = t.withIdentity(OWNER_IDENTITY)
    const asStranger = t.withIdentity(STRANGER_IDENTITY)

    const p1 = await asOwner.mutation(api.projects.create, { name: 'P1', roomId: 'room-1' })
    const p2 = await asOwner.mutation(api.projects.create, { name: 'P2', roomId: 'room-2' })

    await asOwner.mutation(api.projects.addCollaborator, {
      projectId: p1,
      email: 'collab@example.com',
    })
    await asOwner.mutation(api.projects.togglePin, { projectId: p1 })
    await asOwner.mutation(api.presence.setPresence, { projectId: p1 })
    await asOwner.action(api.ai.generateDesign, { projectId: p1, prompt: 'Serverless SaaS' })

    // Active presence is visible to owner, hidden from stranger
    expect(await asOwner.query(api.presence.getActiveProjects, {})).toHaveLength(1)
    expect(await asStranger.query(api.presence.getActiveProjects, {})).toHaveLength(0)

    // Bulk delete cascades cleanly
    await asOwner.mutation(api.projects.bulkDelete, { projectIds: [p1, p2] })

    const counts = await t.run(async (ctx) => {
      return {
        projects: (await ctx.db.query('projects').collect()).length,
        collabs: (await ctx.db.query('projectCollaborators').collect()).length,
        favorites: (await ctx.db.query('favorites').collect()).length,
        presence: (await ctx.db.query('presence').collect()).length,
        taskRuns: (await ctx.db.query('taskRuns').collect()).length,
        specs: (await ctx.db.query('specs').collect()).length,
      }
    })
    expect(counts).toEqual({
      projects: 0,
      collabs: 0,
      favorites: 0,
      presence: 0,
      taskRuns: 0,
      specs: 0,
    })

    // Test stale presence pruning cron
    const p3 = await asOwner.mutation(api.projects.create, { name: 'P3', roomId: 'room-3' })
    await t.run(async (ctx) => {
      await ctx.db.insert('presence', {
        projectId: p3,
        userId: OWNER_IDENTITY.tokenIdentifier,
        lastActive: Date.now() - 10 * 60 * 1000,
      })
    })
    const pruned = await t.mutation(internal.crons.prunePresence, {})
    expect(pruned).toBe(1)
  })

  it('supports optional Clerk organizations alongside personal workspaces', async () => {
    const t = convexTest(schema, modules)

    const personalOwner = t.withIdentity(OWNER_IDENTITY)
    const orgAdmin = t.withIdentity({
      ...OWNER_IDENTITY,
      org_id: 'org_acme',
      org_role: 'org:admin',
    })
    const orgMember = t.withIdentity({
      ...COLLAB_IDENTITY,
      org_id: 'org_acme',
      org_role: 'org:member',
    })
    // Also support Clerk session token v2 compact `o` claim
    const orgMemberCompact = t.withIdentity({
      ...STRANGER_IDENTITY,
      o: { id: 'org_acme', rol: 'member' },
    })
    const otherOrgUser = t.withIdentity({
      ...STRANGER_IDENTITY,
      org_id: 'org_other',
      org_role: 'org:admin',
    })

    // 1. Personal project has no orgId and stays isolated from org list
    const personalId = await personalOwner.mutation(api.projects.create, {
      name: 'Personal Blueprint',
      roomId: 'room-personal-1',
    })

    // 2. Org member creates an organization project
    const orgProjectId = await orgMember.mutation(api.projects.create, {
      name: 'Acme Core Platform',
      roomId: 'room-acme-1',
    })

    // Personal workspace sees only personal projects; org workspace sees only org projects
    const personalList = await personalOwner.query(api.projects.list, {})
    expect(personalList?.activeOrgId).toBeNull()
    expect(personalList?.owned.map((p) => p._id)).toEqual([personalId])

    const acmeList = await orgAdmin.query(api.projects.list, {})
    expect(acmeList?.activeOrgId).toBe('org_acme')
    expect(acmeList?.owned.map((p) => p._id)).toEqual([orgProjectId])

    const otherList = await otherOrgUser.query(api.projects.list, {})
    expect(otherList?.activeOrgId).toBe('org_other')
    expect(otherList?.owned).toHaveLength(0)

    // 3. Another org member (compact v2 claims) gets editor access, not owner/admin
    const compactRoom = await orgMemberCompact.query(api.projects.getByRoomId, {
      roomId: 'room-acme-1',
    })
    expect(compactRoom?.role).toBe('editor')
    expect(compactRoom?.isReadOnly).toBe(false)
    expect(compactRoom?.canManage).toBe(false)

    // Non-creator org:member can save canvas and run AI, but cannot rename/delete org project
    await orgMemberCompact.mutation(api.projects.saveCanvas, {
      projectId: orgProjectId,
      canvasJsonPath: 'data:application/json;charset=utf-8,%7B%7D',
    })
    await expect(
      orgMemberCompact.mutation(api.projects.rename, { projectId: orgProjectId, name: 'Hijacked' })
    ).rejects.toThrow(/Only the project owner/)

    const orgSpec = await orgMemberCompact.action(api.ai.generateSpec, {
      projectId: orgProjectId,
      nodes: [{ id: 'n1', data: { label: 'Gateway', shape: 'diamond', color: 'blue' } }],
      edges: [],
      siteUrl: 'http://localhost:3000',
    })
    await expect(
      orgMemberCompact.mutation(api.specs.remove, { specId: orgSpec.specId })
    ).rejects.toThrow(/Only the project owner/)

    // 4. Org admin can manage (rename, delete specs, delete project) created by another member
    await orgAdmin.mutation(api.projects.rename, {
      projectId: orgProjectId,
      name: 'Acme Renamed Platform',
    })
    await orgAdmin.mutation(api.specs.remove, { specId: orgSpec.specId })
    expect(await orgAdmin.query(api.specs.listByProject, { projectId: orgProjectId })).toHaveLength(
      0
    )

    // 5. User outside org_acme cannot access org project
    expect(await otherOrgUser.query(api.projects.getById, { projectId: orgProjectId })).toBeNull()
    expect(await personalOwner.query(api.projects.getById, { projectId: orgProjectId })).toBeNull()

    await orgAdmin.mutation(api.projects.remove, { projectId: orgProjectId })
    expect(await orgAdmin.query(api.projects.getById, { projectId: orgProjectId })).toBeNull()
  })
})
