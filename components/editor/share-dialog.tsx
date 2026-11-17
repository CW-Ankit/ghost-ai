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
import { Button } from '@/components/ui/button'
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
  open: boolean
  onOpenChange: (open: boolean) => void
  publicAccess?: 'PRIVATE' | 'VIEW_ONLY'
  roomId?: string
}

export function ShareDialog({
  projectId,
  ownerId,
  open,
  onOpenChange,
  publicAccess: initialPublicAccess,
  roomId: propRoomId,
}: ShareDialogProps) {
  const { userId } = useAuth()
  const isOwner = userId === ownerId

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
      <DialogContent className="sm:max-w-md rounded-3xl bg-bg-surface border-border-default text-text-primary overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Share Architecture</DialogTitle>
          <DialogDescription className="text-text-muted">
            Share this architecture diagram with your team or publish a view-only link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Public Link Sharing Toggle Card */}
          <div className="p-3.5 rounded-2xl bg-bg-elevated border border-border-default space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
                    isPublic
                      ? 'bg-accent-primary-dim text-accent-primary border-accent-primary/40'
                      : 'bg-bg-subtle text-text-muted border-border-subtle'
                  }`}
                >
                  {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-text-primary">Public Link Sharing</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        isPublic
                          ? 'bg-accent-primary-dim text-accent-primary border-accent-primary/40'
                          : 'bg-bg-subtle text-text-muted border-border-subtle'
                      }`}
                    >
                      {isPublic ? 'View Only' : 'Restricted'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {isPublic
                      ? 'Anyone with this link can view the canvas.'
                      : 'Only invited collaborators can access.'}
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
              <p className="text-[10px] text-text-faint italic pt-1 border-t border-border-subtle/50">
                Only the project owner can change public link sharing settings.
              </p>
            )}
          </div>

          {/* Invite Section */}
          {isOwner && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-text-faint uppercase tracking-wider">
                Invite by Email
              </h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-bg-base border-border-subtle text-text-primary placeholder:text-text-faint rounded-xl text-xs h-9"
                  />
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={isLoading || !email}
                  className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 rounded-xl gap-1.5 text-xs h-9 font-medium"
                >
                  {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Invite</span>
                </Button>
              </div>
            </div>
          )}

          {/* Collaborators List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-medium text-text-faint uppercase tracking-wider">
              Collaborators
            </h3>
            {isFetching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-5 border border-dashed border-border-subtle rounded-2xl">
                <p className="text-xs text-text-muted">No collaborators invited yet</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {collaborators.map((collab) => (
                  <div
                    key={collab.email}
                    className="flex items-center justify-between p-2 rounded-xl bg-bg-elevated border border-transparent hover:border-border-subtle transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border border-border-subtle">
                        <AvatarImage src={collab.avatarUrl || ''} />
                        <AvatarFallback className="bg-bg-subtle text-text-secondary text-[10px]">
                          {collab.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-text-primary">
                          {collab.name || collab.email}
                        </span>
                        <span className="text-[10px] text-text-muted">{collab.email}</span>
                      </div>
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(collab.email)}
                        className="h-7 w-7 text-text-muted hover:text-state-error hover:bg-state-error/10 rounded-lg"
                        title={`Remove ${collab.email}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Copy Link Section */}
          <div className="pt-2 border-t border-border-subtle">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="w-full justify-between bg-bg-base border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-xl gap-2 h-9 text-xs"
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
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-text-muted hover:text-text-primary rounded-xl text-xs h-8"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
