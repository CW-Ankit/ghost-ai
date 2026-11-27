'use client'

import React, { useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs'
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnchoredPopup } from '@/components/editor/anchored-popup'
import {
  extractClerkError,
  formatOrgRole,
  GhostAvatar,
} from './ghost-clerk-shared'
import { EditorButton } from '@/components/editor/editor-button'
import { GhostCreateOrgDialog, GhostOrgProfileDialog } from './ghost-org-dialogs'
import { toast } from 'sonner'

export function GhostOrgSwitcher({ className }: { className?: string }) {
  const router = useRouter()
  const { user } = useUser()
  const { organization, membership } = useOrganization()
  const { isLoaded, setActive, userMemberships, userInvitations } = useOrganizationList({
    userMemberships: { infinite: true },
    userInvitations: { infinite: true },
  })

  const [open, setOpen] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [acceptingInviteId, setAcceptingInviteId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const triggerId = useId()

  if (!isLoaded) {
    return <div className="h-10 w-full rounded-xl bg-white/[0.04] animate-pulse" />
  }

  const personalLabel = user?.fullName || user?.firstName || user?.username || 'Personal Studio'
  const activeName = organization ? organization.name : personalLabel
  const activeSubtitle = organization ? formatOrgRole(membership?.role) : 'Personal workspace'
  const orgMemberships = userMemberships.data || []
  const pendingInvites = (userInvitations.data || []).filter((inv) => inv.status === 'pending')

  const handleSelectWorkspace = async (orgId: string | null) => {
    if (!setActive) return
    const targetKey = orgId ?? '__personal__'
    setSwitchingId(targetKey)
    try {
      await setActive({ organization: orgId })
      setOpen(false)
      router.push('/editor')
    } catch (err) {
      toast.error(extractClerkError(err, 'Could not switch workspace'))
    } finally {
      setSwitchingId(null)
    }
  }

  const handleAcceptInvite = async (inviteId: string) => {
    const target = pendingInvites.find((inv) => inv.id === inviteId)
    if (!target) return
    setAcceptingInviteId(inviteId)
    try {
      await target.accept()
      await userMemberships.revalidate?.()
      await userInvitations.revalidate?.()
      if (setActive && target.publicOrganizationData?.id) {
        await setActive({ organization: target.publicOrganizationData.id })
      }
      toast.success(`Joined ${target.publicOrganizationData?.name || 'workspace'}`)
      setOpen(false)
      router.push('/editor')
    } catch (err) {
      toast.error(extractClerkError(err, 'Could not accept invitation'))
    } finally {
      setAcceptingInviteId(null)
    }
  }

  return (
    <div className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer',
          'hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-primary',
          open && 'bg-white/[0.07]'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {organization ? (
            <GhostAvatar
              imageUrl={organization.imageUrl}
              hasImage={organization.hasImage}
              name={organization.name}
              size="sm"
              shape="rounded"
              isOrg
            />
          ) : (
            <GhostAvatar
              imageUrl={user?.imageUrl}
              hasImage={user?.hasImage}
              name={personalLabel}
              size="sm"
              shape="rounded"
            />
          )}
          <div className="min-w-0">
            <div className="text-xs font-semibold text-text-primary truncate">{activeName}</div>
            <div className="text-[11px] text-text-muted truncate">{activeSubtitle}</div>
          </div>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 text-text-muted shrink-0" />
      </button>

      <AnchoredPopup
        open={open}
        onOpenChange={setOpen}
        anchorRef={triggerRef}
        align="start"
        minWidth={276}
        maxWidth={312}
        matchAnchorWidth
        enableArrowNavigation
        id={panelId}
        ariaLabelledBy={triggerId}
        className="p-2"
      >
        <div className="space-y-1">
          <div className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            Workspaces
          </div>

          {/* Personal Workspace */}
          <button
            type="button"
            disabled={Boolean(switchingId)}
            onClick={() => handleSelectWorkspace(null)}
            className={cn(
              'w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer',
              !organization
                ? 'bg-white/[0.08] text-text-primary'
                : 'text-text-secondary hover:bg-white/[0.05] hover:text-text-primary'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <GhostAvatar
                imageUrl={user?.imageUrl}
                hasImage={user?.hasImage}
                name={personalLabel}
                size="xs"
                shape="rounded"
              />
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{personalLabel}</div>
                <div className="text-[10px] text-text-muted">Personal Studio</div>
              </div>
            </div>
            {switchingId === '__personal__' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7ecbd4] shrink-0" />
            ) : (
              !organization && <Check className="h-3.5 w-3.5 text-[#7ecbd4] shrink-0" />
            )}
          </button>

          {/* Team Organizations */}
          {orgMemberships.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
              {orgMemberships.map((mem) => {
                const org = mem.organization
                const isCurrent = organization?.id === org.id
                return (
                  <button
                    key={mem.id}
                    type="button"
                    disabled={Boolean(switchingId)}
                    onClick={() => handleSelectWorkspace(org.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer',
                      isCurrent
                        ? 'bg-white/[0.08] text-text-primary'
                        : 'text-text-secondary hover:bg-white/[0.05] hover:text-text-primary'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GhostAvatar
                        imageUrl={org.imageUrl}
                        hasImage={org.hasImage}
                        name={org.name}
                        size="xs"
                        shape="rounded"
                        isOrg
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{org.name}</div>
                        <div className="text-[10px] text-text-muted truncate">
                          {mem.roleName || formatOrgRole(mem.role)}
                        </div>
                      </div>
                    </div>
                    {switchingId === org.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7ecbd4] shrink-0" />
                    ) : (
                      isCurrent && <Check className="h-3.5 w-3.5 text-[#7ecbd4] shrink-0" />
                    )}
                  </button>
                )
              })}
              {userMemberships.hasNextPage && (
                <button
                  type="button"
                  onClick={() => userMemberships.fetchNext?.()}
                  className="w-full py-1.5 text-center text-[11px] font-medium text-[#7ecbd4] hover:underline cursor-pointer"
                >
                  Load more workspaces
                </button>
              )}
            </div>
          )}

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <>
              <hr className="my-1.5 border-white/[0.06]" />
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                Invitations
              </div>
              <div className="space-y-1">
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-2.5 py-1.5"
                  >
                    <span className="text-xs text-text-primary truncate">
                      {inv.publicOrganizationData?.name || 'Workspace invite'}
                    </span>
                    <EditorButton
                      type="button"
                      tone="primarySoft"
                      size="xs"
                      disabled={acceptingInviteId === inv.id}
                      onClick={() => handleAcceptInvite(inv.id)}
                      className="h-6 px-2 text-[11px]"
                    >
                      {acceptingInviteId === inv.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Join'
                      )}
                    </EditorButton>
                  </div>
                ))}
              </div>
            </>
          )}

          <hr className="my-1.5 border-white/[0.06]" />

          {organization && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setManageOpen(true)
              }}
              className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.06] hover:text-text-primary transition-colors cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-text-muted shrink-0" />
              <span>Manage Workspace</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setCreateOpen(true)
            }}
            className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-[#8ee0ea] hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span>Create Organization</span>
          </button>
        </div>
      </AnchoredPopup>

      <GhostCreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
      <GhostOrgProfileDialog open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  )
}
