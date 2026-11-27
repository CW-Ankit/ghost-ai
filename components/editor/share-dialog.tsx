'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { EditorButton } from './editor-button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Loader2, UserPlus, Trash2, Copy, Check, Globe, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

interface Collaborator {
  email: string
  name: string | null
  avatarUrl: string | null
}

interface ShareDialogProps {
  projectId: string
  ownerId: string
  canManage?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  publicAccess?: 'PRIVATE' | 'VIEW_ONLY'
  roomId?: string
}

export function ShareDialog({
  projectId,
  ownerId,
  canManage,
  open,
  onOpenChange,
  publicAccess: initialPublicAccess,
  roomId: propRoomId,
}: ShareDialogProps) {
  const { userId } = useAuth()
  const isOwner =
    canManage ??
    (Boolean(userId) && (userId === ownerId || ownerId.endsWith(`|${userId}`)))

  const setPublicAccessMutation = useMutation(api.projects.setPublicAccess)

  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPublic, setIsPublic] = useState(initialPublicAccess === 'VIEW_ONLY')
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false)

  useEffect(() => {
    setIsPublic(initialPublicAccess === 'VIEW_ONLY')
  }, [initialPublicAccess])

  const fetchCollaborators = React.useCallback(async () => {
    if (!projectId) return
    setIsFetching(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`)
      if (!res.ok) throw new Error('Failed to fetch collaborators')
      const data = await res.json()
      setCollaborators(data)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch collaborators'
      toast.error(message)
    } finally {
      setIsFetching(false)
    }
  }, [projectId])

  useEffect(() => {
    if (open) {
      fetchCollaborators()
    }
  }, [open, fetchCollaborators])

  async function handleTogglePublicAccess(checked: boolean) {
    if (!projectId || !isOwner) return
    setIsUpdatingAccess(true)
    const newAccess = checked ? 'VIEW_ONLY' : 'PRIVATE'

    try {
      await setPublicAccessMutation({
        projectId: projectId as Id<'projects'>,
        publicAccess: newAccess,
      })
      setIsPublic(checked)
      toast.success(
        checked
          ? 'Public link sharing enabled: Anyone with the link can view'
          : 'Project set to private: Only invited collaborators can access'
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update access'
      toast.error(message)
    } finally {
      setIsUpdatingAccess(false)
    }
  }

  async function handleInvite() {
    if (!email) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to invite collaborator')
      }
      toast.success(`Invitation sent to ${email}`)
      setEmail('')
      await fetchCollaborators()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to invite collaborator'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemove(email: string) {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators?email=${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
        }
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove collaborator')
      }
      toast.success(`Removed ${email}`)
      await fetchCollaborators()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove collaborator'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCopyLink() {
    const roomSlug = propRoomId || window.location.pathname.split('/').pop()
    const url = `${window.location.origin}/editor/${roomSlug}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success(isPublic ? 'Public view link copied to clipboard' : 'Project link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-[520px] max-h-[85vh] overflow-hidden">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold">Invite the Crew</DialogTitle>
          <DialogDescription className="text-xs text-text-muted">
            Bring teammates onto the canvas or flip on a read-only link for lurkers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 py-1">
          {/* Public Link Sharing Toggle Card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
                    isPublic
                      ? 'bg-accent-primary-dim text-accent-primary border-accent-primary/40'
                      : 'bg-white/[0.04] text-text-muted border-white/[0.08]'
                  }`}
                >
                  {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-text-primary">Public Link Sharing</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                        isPublic
                          ? 'bg-accent-primary-dim text-accent-primary border-accent-primary/40'
                          : 'bg-white/[0.04] text-text-muted border-white/[0.08]'
                      }`}
                    >
                      {isPublic ? 'View Only' : 'Restricted'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {isPublic
                      ? 'Anyone with this link can peek (read-only).'
                      : 'Locked down — invite-only access.'}
                  </p>
                </div>
              </div>

              {isOwner && (
                <Switch
                  checked={isPublic}
                  disabled={isUpdatingAccess}
                  onCheckedChange={handleTogglePublicAccess}
                  aria-label="Toggle public link access"
                />
              )}
            </div>

            {!isOwner && (
              <p className="text-[10px] text-text-faint italic pt-1 border-t border-white/[0.06]">
                Only the project owner or an org admin can flip the public link switch.
              </p>
            )}
          </div>

          {/* Invite Section */}
          {isOwner && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-medium text-text-faint uppercase tracking-wider">
                Invite by Email
              </h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-bg-base/85 border-white/[0.09] text-text-primary placeholder:text-text-faint rounded-xl text-xs h-9 focus-visible:border-accent-primary/65"
                  />
                </div>
                <EditorButton
                  tone="primary"
                  size="sm"
                  onClick={handleInvite}
                  disabled={isLoading || !email}
                  className="text-xs px-3.5 shrink-0"
                >
                  {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Invite</span>
                </EditorButton>
              </div>
            </div>
          )}

          {/* Collaborators List */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-medium text-text-faint uppercase tracking-wider">
              Collaborators
            </h3>
            {isFetching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-5 px-4">
                <p className="text-xs text-text-muted">
                  Just you in here right now. Drop an email above to bring in a teammate.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {collaborators.map((collab) => (
                  <div
                    key={collab.email}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-7 w-7 border border-white/10 shrink-0">
                        <AvatarImage src={collab.avatarUrl || ''} />
                        <AvatarFallback className="bg-bg-subtle text-text-secondary text-[10px]">
                          {collab.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-text-primary truncate">
                          {collab.name || collab.email}
                        </span>
                        <span className="text-[10px] text-text-muted truncate">{collab.email}</span>
                      </div>
                    </div>
                    {isOwner && (
                      <EditorButton
                        tone="ghost3d"
                        size="icon-sm"
                        onClick={() => handleRemove(collab.email)}
                        className="text-text-muted hover:text-state-error shrink-0"
                        title={`Remove ${collab.email}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </EditorButton>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Copy Link Section */}
          <div className="pt-2 border-t border-white/[0.06]">
            <EditorButton
              tone="socket"
              size="md"
              onClick={handleCopyLink}
              className="w-full justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <Copy className="h-3.5 w-3.5" />
                <span>{isPublic ? 'Copy view-only link' : 'Copy project link'}</span>
              </div>
              {copied ? (
                <div className="flex items-center gap-1 text-state-success font-medium">
                  <Check className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Copied</span>
                </div>
              ) : null}
            </EditorButton>
          </div>
        </div>

        <DialogFooter>
          <EditorButton
            tone="socket"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </EditorButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
