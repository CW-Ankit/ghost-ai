'use client'

import React, { useMemo } from 'react'
import { useOthers } from '@liveblocks/react'
import { useUser, UserButton } from '@clerk/nextjs'
import { ClientOnly } from '@/components/ui/client-only'

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface CollaboratorInfo {
  id: string
  name: string
  avatar?: string
  color: string
  isThinking?: boolean
}

export function PresenceAvatars() {
  const { user } = useUser()
  const others = useOthers()

  const currentUserId = user?.id

  // Filter out the current user and deduplicate by user ID
  const collaborators = useMemo(() => {
    const seen = new Set<string>()
    const list: CollaboratorInfo[] = []

    for (const other of others) {
      const otherUserId = other.id || other.info?.displayName || String(other.connectionId)

      // Exclude current user
      if (currentUserId && other.id === currentUserId) {
        continue
      }
      if (seen.has(otherUserId)) {
        continue
      }
      seen.add(otherUserId)

      list.push({
        id: otherUserId,
        name: other.info?.displayName || 'Collaborator',
        avatar: other.info?.avatar,
        color: other.info?.cursorColor || '#00c8d4',
        isThinking: Boolean(other.presence?.thinking),
      })
    }

    return list
  }, [others, currentUserId])

  const maxVisible = 5
  const visibleCollaborators = collaborators.slice(0, maxVisible)
  const overflowCount = collaborators.length - maxVisible

  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-2 p-1.5 bg-bg-surface/80 backdrop-blur-md border border-border-default rounded-2xl shadow-xl">
      {/* Collaborator Avatars */}
      {visibleCollaborators.length > 0 && (
        <div className="flex items-center -space-x-2">
          {visibleCollaborators.map((collab) => (
            <div
              key={collab.id}
              className="relative inline-block select-none"
              title={collab.isThinking ? `${collab.name} (thinking...)` : collab.name}
            >
              {collab.avatar ? (
                <img
                  src={collab.avatar}
                  alt={collab.name}
                  className={`h-8 w-8 rounded-full object-cover ring-2 ring-bg-surface border ${
                    collab.isThinking ? 'border-accent-ai shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'border-border-subtle'
                  }`}
                />
              ) : (
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-bg-base ring-2 ring-bg-surface border ${
                    collab.isThinking ? 'border-accent-ai shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'border-border-subtle'
                  }`}
                  style={{ backgroundColor: collab.color }}
                >
                  {getInitials(collab.name)}
                </div>
              )}

              {collab.isThinking && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3" title="AI Generation in progress">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-ai opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-ai border-2 border-bg-surface" />
                </span>
              )}
            </div>
          ))}

          {overflowCount > 0 && (
            <div
              className="h-8 w-8 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-xs font-medium text-text-secondary ring-2 ring-bg-surface select-none"
              title={`${overflowCount} more collaborator${overflowCount > 1 ? 's' : ''}`}
            >
              +{overflowCount}
            </div>
          )}
        </div>
      )}

      {/* Divider only appears when collaborators exist */}
      {collaborators.length > 0 && <div className="h-5 w-[1px] bg-border-subtle mx-0.5" />}

      {/* Clerk UserButton for Current User */}
      <ClientOnly>
        <div className="flex items-center">
          <UserButton />
        </div>
      </ClientOnly>
    </div>
  )
}
