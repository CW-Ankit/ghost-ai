'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk, useOrganization, useOrganizationList, useUser } from '@clerk/nextjs'
import {
  Building2,
  Loader2,
  MailPlus,
  Settings,
  Trash2,
  Upload,
  UserMinus,
  Users,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EditorButton } from '@/components/editor/editor-button'
import {
  extractClerkError,
  formatOrgRole,
  GhostAvatar,
  ghostAuthInputClass,
  slugifyWorkspaceName,
} from './ghost-clerk-shared'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface GhostCreateOrgDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (orgId: string) => void
}

export function GhostCreateOrgDialog({
  open,
  onOpenChange,
  onCreated,
}: GhostCreateOrgDialogProps) {
  const router = useRouter()
  const { createOrganization, setActive, isLoaded } = useOrganizationList()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const nameId = useId()
  const slugId = useId()
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      setName('')
      setSlug('')
      setSlugTouched(false)
      nameInputRef.current?.focus()
    }, 40)
    return () => clearTimeout(timer)
  }, [open])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugTouched) {
      setSlug(slugifyWorkspaceName(val))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !createOrganization || !setActive || !name.trim()) return

    setSubmitting(true)
    try {
      const org = await createOrganization({
        name: name.trim(),
        slug: slug.trim() || undefined,
      })
      await setActive({ organization: org.id })
      toast.success(`Workspace "${org.name}" created`)
      onOpenChange(false)
      onCreated?.(org.id)
      router.push('/editor')
    } catch (err) {
      toast.error(extractClerkError(err, 'Could not create organization'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-[440px] rounded-3xl bg-[#0e141c] border border-white/[0.09] p-6 shadow-[0_28px_80px_-16px_rgba(0,0,0,0.9)]"
      >
        <DialogHeader className="flex-row items-center gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#15303d_0%,#0c1f28_100%)] text-[#8ee0ea] ring-1 ring-white/10">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="font-heading text-base font-semibold text-text-primary">
              Create Team Workspace
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted">
              Spin up a shared home for teammates and blueprints.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label
              htmlFor={nameId}
              className="text-[11px] font-medium uppercase tracking-wider text-text-muted"
            >
              Workspace Name
            </label>
            <input
              ref={nameInputRef}
              id={nameId}
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Core Platform Team"
              className={ghostAuthInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={slugId}
              className="text-[11px] font-medium uppercase tracking-wider text-text-muted"
            >
              Slug
            </label>
            <input
              id={slugId}
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugifyWorkspaceName(e.target.value))
              }}
              placeholder="core-platform-team"
              className={cn(ghostAuthInputClass, 'font-mono text-xs')}
            />
          </div>

          <DialogFooter className="mx-0 mb-0 mt-2 border-0 bg-transparent p-0 pt-2">
            <EditorButton
              type="button"
              tone="socket"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </EditorButton>
            <EditorButton
              type="submit"
              tone="primary"
              size="sm"
              disabled={submitting || !name.trim()}
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Create Workspace</span>
            </EditorButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface OrgMemberRow {
  id: string
  role: string
  roleName?: string
  publicUserData?: {
    userId?: string
    firstName?: string | null
    lastName?: string | null
    identifier?: string
    imageUrl?: string
    hasImage?: boolean
  }
}

interface OrgInviteRow {
  id: string
  emailAddress: string
  role: string
  roleName?: string
  status: string
  revoke: () => Promise<unknown>
}

interface GhostOrgProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GhostOrgProfileDialog({ open, onOpenChange }: GhostOrgProfileDialogProps) {
  const router = useRouter()
  const clerk = useClerk()
  const { user } = useUser()
  const { organization, membership } = useOrganization()
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  })

  const [tab, setTab] = useState<'members' | 'settings'>('members')
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [updatingLogo, setUpdatingLogo] = useState(false)

  const [members, setMembers] = useState<OrgMemberRow[]>([])
  const [invites, setInvites] = useState<OrgInviteRow[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'org:member' | 'org:admin'>('org:member')
  const [inviting, setInviting] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const slugId = useId()
  const inviteId = useId()

  const isAdmin = membership?.role === 'org:admin'

  useEffect(() => {
    if (!open || !organization) return
    const frame = requestAnimationFrame(() => {
      setOrgName(organization.name)
      setOrgSlug(organization.slug || '')
      setTab('members')
    })
    return () => cancelAnimationFrame(frame)
  }, [open, organization])

  useEffect(() => {
    if (!open || !organization || tab !== 'members') return
    let active = true
    const loadRoster = async () => {
      setLoadingMembers(true)
      try {
        const [membersRes, invitesRes] = await Promise.all([
          organization.getMemberships({ pageSize: 25 }),
          isAdmin ? organization.getInvitations({ status: ['pending'], pageSize: 25 }) : Promise.resolve(null),
        ])
        if (!active) return
        setMembers((membersRes?.data || []) as OrgMemberRow[])
        setInvites((invitesRes?.data || []) as OrgInviteRow[])
      } catch {
        if (active) toast.error('Could not load workspace crew')
      } finally {
        if (active) setLoadingMembers(false)
      }
    }
    const timer = setTimeout(() => {
      void loadRoster()
    }, 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [open, organization, tab, isAdmin])

  if (!organization) return null

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim()) return
    setSavingSettings(true)
    try {
      await organization.update({
        name: orgName.trim(),
        slug: orgSlug.trim() || undefined,
      })
      await userMemberships?.revalidate?.()
      toast.success('Workspace updated')
    } catch (err) {
      toast.error(extractClerkError(err, 'Failed to update workspace'))
    } finally {
      setSavingSettings(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUpdatingLogo(true)
    try {
      await organization.setLogo({ file })
      toast.success('Workspace logo updated')
    } catch (err) {
      toast.error(extractClerkError(err, 'Could not upload workspace logo'))
    } finally {
      setUpdatingLogo(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = inviteEmail.trim()
    if (!cleanEmail) return
    setInviting(true)
    try {
      const inv = await organization.inviteMember({
        emailAddress: cleanEmail,
        role: inviteRole,
      })
      setInvites((prev) => [inv as OrgInviteRow, ...prev])
      setInviteEmail('')
      toast.success(`Invitation sent to ${cleanEmail}`)
    } catch (err) {
      toast.error(extractClerkError(err, 'Could not send invitation'))
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (targetUserId: string) => {
    try {
      await organization.removeMember(targetUserId)
      setMembers((prev) => prev.filter((m) => m.publicUserData?.userId !== targetUserId))
      toast.success('Member removed from workspace')
    } catch (err) {
      toast.error(extractClerkError(err, 'Could not remove member'))
    }
  }

  const handleRevokeInvite = async (inviteIdToRevoke: string) => {
    const target = invites.find((i) => i.id === inviteIdToRevoke)
    if (!target) return
    try {
      await target.revoke()
      setInvites((prev) => prev.filter((i) => i.id !== inviteIdToRevoke))
      toast.success('Invitation revoked')
    } catch (err) {
      toast.error(extractClerkError(err, 'Could not revoke invitation'))
    }
  }

  const handleLeaveOrg = async () => {
    if (!user) return
    setLeaving(true)
    try {
      await user.leaveOrganization(organization.id)
      await setActive?.({ organization: null })
      toast.success(`Left ${organization.name}`)
      onOpenChange(false)
      router.push('/editor')
    } catch (err) {
      toast.error(extractClerkError(err, 'Could not leave workspace'))
    } finally {
      setLeaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-[560px] max-w-[560px] max-h-[85vh] p-0 gap-0 overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 shrink-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_100%)] border-b border-white/[0.06]">
          <DialogHeader className="pr-8">
            <div className="flex items-center gap-3.5">
              <GhostAvatar
                imageUrl={organization.imageUrl}
                hasImage={organization.hasImage}
                name={organization.name}
                size="lg"
                shape="rounded"
                isOrg
              />
              <div className="min-w-0">
                <DialogTitle className="font-heading text-base font-semibold text-text-primary truncate">
                  {organization.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted truncate">
                  {organization.membersCount} member{organization.membersCount === 1 ? '' : 's'} ·{' '}
                  {formatOrgRole(membership?.role)}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div
            role="tablist"
            aria-label="Workspace sections"
            className="mt-5 flex items-center gap-1.5 rounded-xl bg-black/30 p-1 w-fit"
          >
            {[
              { id: 'members', label: 'Members', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon
              const isActive = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(item.id as typeof tab)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                    isActive
                      ? 'bg-[#17242e] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isActive && 'text-[#7ecbd4]')} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 px-6 py-5 overflow-y-auto space-y-5">
          {tab === 'members' && (
            <>
              {isAdmin && (
                <form
                  onSubmit={handleInviteMember}
                  className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3.5 space-y-3"
                >
                  <label
                    htmlFor={inviteId}
                    className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted"
                  >
                    <MailPlus className="h-3.5 w-3.5 text-[#7ecbd4]" />
                    <span>Invite Teammate</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id={inviteId}
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      className={cn(ghostAuthInputClass, 'h-9 flex-1 text-xs')}
                    />
                    <select
                      aria-label="Member role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'org:member' | 'org:admin')}
                      className="h-9 rounded-xl bg-bg-base/85 border border-white/[0.09] px-2.5 text-xs text-text-primary outline-none focus:border-accent-primary/65"
                    >
                      <option value="org:member">Member</option>
                      <option value="org:admin">Admin</option>
                    </select>
                    <EditorButton
                      type="submit"
                      tone="primary"
                      size="sm"
                      disabled={inviting || !inviteEmail.trim()}
                    >
                      {inviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Invite</span>
                    </EditorButton>
                  </div>
                </form>
              )}

              {loadingMembers ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-[#7ecbd4]" />
                  <span>Loading workspace crew...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    {members.map((m) => {
                      const pub = m.publicUserData
                      const mName =
                        [pub?.firstName, pub?.lastName].filter(Boolean).join(' ') ||
                        pub?.identifier ||
                        'Member'
                      const isSelf = pub?.userId && pub.userId === user?.id
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <GhostAvatar
                              imageUrl={pub?.imageUrl}
                              hasImage={pub?.hasImage}
                              name={mName}
                              size="sm"
                              shape="circle"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-text-primary truncate">
                                {mName} {isSelf && <span className="text-text-muted">(You)</span>}
                              </div>
                              {pub?.identifier && (
                                <div className="text-[11px] text-text-muted truncate">
                                  {pub.identifier}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                              {m.roleName || formatOrgRole(m.role)}
                            </span>
                            {isAdmin && !isSelf && pub?.userId && (
                              <EditorButton
                                type="button"
                                tone="ghost3d"
                                size="icon-sm"
                                title="Remove member"
                                onClick={() => handleRemoveMember(pub.userId!)}
                                className="h-7 w-7 text-text-muted hover:text-state-error"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </EditorButton>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {invites.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                        Pending Invitations
                      </div>
                      {invites.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.025] px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="text-text-primary truncate">{inv.emailAddress}</div>
                            <div className="text-[10px] text-text-muted">
                              {inv.roleName || formatOrgRole(inv.role)} · Pending
                            </div>
                          </div>
                          {isAdmin && (
                            <EditorButton
                              type="button"
                              tone="ghost3d"
                              size="xs"
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="text-state-error hover:text-state-error shrink-0"
                            >
                              Revoke
                            </EditorButton>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === 'settings' && (
            <div className="space-y-5">
              {isAdmin && (
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3.5">
                  <div className="flex items-center gap-3">
                    <GhostAvatar
                      imageUrl={organization.imageUrl}
                      hasImage={organization.hasImage}
                      name={organization.name}
                      size="lg"
                      shape="rounded"
                      isOrg
                    />
                    <div>
                      <div className="text-xs font-medium text-text-primary">Workspace Emblem</div>
                      <div className="text-[11px] text-text-muted">
                        Shown in the sidebar switcher
                      </div>
                    </div>
                  </div>
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <EditorButton
                      type="button"
                      tone="socket"
                      size="xs"
                      disabled={updatingLogo}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {updatingLogo ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span>Upload</span>
                    </EditorButton>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveOrg} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor={nameId}
                    className="text-[11px] font-medium uppercase tracking-wider text-text-muted"
                  >
                    Workspace Name
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    disabled={!isAdmin}
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className={ghostAuthInputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={slugId}
                    className="text-[11px] font-medium uppercase tracking-wider text-text-muted"
                  >
                    Workspace Slug
                  </label>
                  <input
                    id={slugId}
                    type="text"
                    disabled={!isAdmin}
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(slugifyWorkspaceName(e.target.value))}
                    className={cn(ghostAuthInputClass, 'font-mono text-xs')}
                  />
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-between gap-2">
                    <EditorButton
                      type="button"
                      tone="socket"
                      size="xs"
                      onClick={() => {
                        onOpenChange(false)
                        clerk.openOrganizationProfile()
                      }}
                    >
                      <span>Domains &amp; Advanced</span>
                    </EditorButton>
                    <EditorButton
                      type="submit"
                      tone="primary"
                      size="sm"
                      disabled={savingSettings || !orgName.trim()}
                    >
                      {savingSettings && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Save Changes</span>
                    </EditorButton>
                  </div>
                )}
              </form>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-text-primary">Leave Workspace</div>
                  <div className="text-[11px] text-text-muted">
                    Remove yourself from {organization.name}
                  </div>
                </div>
                <EditorButton
                  type="button"
                  tone="destructive"
                  size="xs"
                  disabled={leaving}
                  onClick={handleLeaveOrg}
                >
                  {leaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>Leave</span>
                </EditorButton>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
