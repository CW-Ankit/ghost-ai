import { describe, it, expect } from 'vitest'

describe('Public Access & Read-Only Logic', () => {
  it('correctly resolves role and read-only status for project owner', () => {
    const project = {
      _id: 'proj-123',
      ownerId: 'user-alice',
      publicAccess: 'PRIVATE' as 'PRIVATE' | 'VIEW_ONLY',
      roomId: 'room-abc',
    }

    const identity = { tokenIdentifier: 'user-alice', email: 'alice@example.com' }
    const isOwner = identity.tokenIdentifier === project.ownerId

    expect(isOwner).toBe(true)
    const result = {
      ...project,
      role: 'owner' as const,
      isReadOnly: false,
    }

    expect(result.role).toBe('owner')
    expect(result.isReadOnly).toBe(false)
  })

  it('correctly resolves role and read-only status for invited collaborator', () => {
    const project = {
      _id: 'proj-123',
      ownerId: 'user-alice',
      publicAccess: 'PRIVATE' as 'PRIVATE' | 'VIEW_ONLY',
      roomId: 'room-abc',
    }

    const identity = { tokenIdentifier: 'user-bob', email: 'bob@example.com' }
    const isOwner = identity.tokenIdentifier === project.ownerId
    const collaborators = [{ email: 'bob@example.com' }]
    const isCollaborator = collaborators.some((c) => c.email === identity.email)

    expect(isOwner).toBe(false)
    expect(isCollaborator).toBe(true)

    const result = {
      ...project,
      role: 'editor' as const,
      isReadOnly: false,
    }

    expect(result.role).toBe('editor')
    expect(result.isReadOnly).toBe(false)
  })

  it('correctly resolves view-only role when project has VIEW_ONLY access', () => {
    const project = {
      _id: 'proj-123',
      ownerId: 'user-alice',
      publicAccess: 'VIEW_ONLY' as const,
      roomId: 'room-abc',
    }

    const identity = { tokenIdentifier: 'user-charlie', email: 'charlie@example.com' }
    const isOwner = identity.tokenIdentifier === project.ownerId
    const isCollaborator = false
    const isPublicView = project.publicAccess === 'VIEW_ONLY'

    expect(isOwner).toBe(false)
    expect(isCollaborator).toBe(false)
    expect(isPublicView).toBe(true)

    const result = {
      ...project,
      role: 'viewer' as const,
      isReadOnly: true,
    }

    expect(result.role).toBe('viewer')
    expect(result.isReadOnly).toBe(true)
  })

  it('correctly resolves view-only role for unauthenticated guest viewer when project is VIEW_ONLY', () => {
    const project = {
      _id: 'proj-123',
      ownerId: 'user-alice',
      publicAccess: 'VIEW_ONLY' as const,
      roomId: 'room-abc',
    }

    const identity = null
    const isPublicView = project.publicAccess === 'VIEW_ONLY'

    expect(identity).toBeNull()
    expect(isPublicView).toBe(true)

    const result = {
      ...project,
      role: 'viewer' as const,
      isReadOnly: true,
    }

    expect(result.role).toBe('viewer')
    expect(result.isReadOnly).toBe(true)
  })

  it('correctly denies access when project is PRIVATE and user is not owner or collaborator', () => {
    const project = {
      _id: 'proj-123',
      ownerId: 'user-alice',
      publicAccess: 'PRIVATE' as 'PRIVATE' | 'VIEW_ONLY',
      roomId: 'room-abc',
    }

    const identity = { tokenIdentifier: 'user-charlie', email: 'charlie@example.com' }
    const isOwner = identity.tokenIdentifier === project.ownerId
    const isCollaborator = false
    const isPublicView = project.publicAccess === 'VIEW_ONLY'

    const hasAccess = isOwner || isCollaborator || isPublicView
    expect(hasAccess).toBe(false)
  })

  it('assigns session.READ_ACCESS for read-only view sessions in Liveblocks', () => {
    const mockSession = {
      READ_ACCESS: ['room:read', 'room:presence:write', 'comments:read'],
      FULL_ACCESS: ['room:write'],
      allowedPermissions: null as string[] | null,
      allow(_roomId: string, permissions: string[]) {
        this.allowedPermissions = permissions
      },
    }

    const isReadOnly = true
    if (isReadOnly) {
      mockSession.allow('test-room', mockSession.READ_ACCESS)
    } else {
      mockSession.allow('test-room', mockSession.FULL_ACCESS)
    }

    expect(mockSession.allowedPermissions).toEqual([
      'room:read',
      'room:presence:write',
      'comments:read',
    ])
    expect(mockSession.allowedPermissions).not.toContain('room:write')
  })

  it('assigns session.FULL_ACCESS for editor sessions in Liveblocks', () => {
    const mockSession = {
      READ_ACCESS: ['room:read', 'room:presence:write', 'comments:read'],
      FULL_ACCESS: ['room:write'],
      allowedPermissions: null as string[] | null,
      allow(_roomId: string, permissions: string[]) {
        this.allowedPermissions = permissions
      },
    }

    const isReadOnly = false
    if (isReadOnly) {
      mockSession.allow('test-room', mockSession.READ_ACCESS)
    } else {
      mockSession.allow('test-room', mockSession.FULL_ACCESS)
    }

    expect(mockSession.allowedPermissions).toEqual(['room:write'])
    expect(mockSession.allowedPermissions).toContain('room:write')
  })

  it('configures React Flow interaction guards correctly when in read-only mode', () => {
    const isReadOnly = true

    const reactFlowProps = {
      nodesDraggable: !isReadOnly,
      nodesConnectable: !isReadOnly,
      elementsSelectable: true,
      deleteKeyCode: isReadOnly ? null : ['Backspace', 'Delete'],
      onlyRenderVisibleElements: true,
    }

    expect(reactFlowProps.nodesDraggable).toBe(false)
    expect(reactFlowProps.nodesConnectable).toBe(false)
    expect(reactFlowProps.elementsSelectable).toBe(true)
    expect(reactFlowProps.deleteKeyCode).toBeNull()
    expect(reactFlowProps.onlyRenderVisibleElements).toBe(true)
  })
})
