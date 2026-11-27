'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { useClerk, useSession, useUser } from '@clerk/nextjs'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Loader2,
  Mail,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  User as UserIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EditorButton } from '@/components/editor/editor-button'
import {
  extractClerkError,
  GhostAvatar,
  ghostAuthInputClass,
  OAuthProviderIcon,
} from './ghost-clerk-shared'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SessionActivityItem {
  id: string
  status: string
  lastActiveAt: Date
  latestActivity?: {
    browserName?: string
    browserVersion?: string
    deviceType?: string
    ipAddress?: string
    city?: string
    country?: string
    isMobile?: boolean
  }
  revoke: () => Promise<unknown>
}

interface GhostAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: 'profile' | 'security' | 'sessions'
}

function formatRelativeActivity(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const mins = Math.max(0, Math.round(diffMs / 60000))
  if (mins < 2) return 'Active right now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function GhostAccountDialog({
  open,
  onOpenChange,
  initialTab = 'profile',
}: GhostAccountDialogProps) {
  const { user, isLoaded } = useUser()
  const { session: activeSession } = useSession()
  const clerk = useClerk()

  const [tab, setTab] = useState<'profile' | 'security' | 'sessions'>(initialTab)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [updatingAvatar, setUpdatingAvatar] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [signOutOthers, setSignOutOthers] = useState(true)
  const [savingPassword, setSavingPassword] = useState(false)

  const [sessions, setSessions] = useState<SessionActivityItem[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const firstNameId = useId()
  const lastNameId = useId()
  const currentPwId = useId()
  const newPwId = useId()

  useEffect(() => {
    if (!open || !user) return
    const frame = requestAnimationFrame(() => {
      setTab(initialTab)
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
    })
    return () => cancelAnimationFrame(frame)
  }, [open, initialTab, user])

  useEffect(() => {
    if (!open || tab !== 'sessions' || !user) return
    let active = true
    const loadSessions = async () => {
      setLoadingSessions(true)
      try {
        const list = await user.getSessions()
        if (active) setSessions(list as SessionActivityItem[])
      } catch {
        if (active) toast.error('Could not load active sessions')
      } finally {
        if (active) setLoadingSessions(false)
      }
    }
    const timer = setTimeout(() => {
      void loadSessions()
    }, 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [open, tab, user])

  if (!isLoaded || !user) return null

  const displayName = user.fullName || user.username || 'Ghost Builder'
  const primaryEmail = user.primaryEmailAddress?.emailAddress || 'No primary email'

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(extractClerkError(err, 'Failed to update profile'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUpdatingAvatar(true)
    try {
      await user.setProfileImage({ file })
      toast.success('Profile photo updated')
    } catch (err) {
      toast.error(extractClerkError(err, 'Failed to upload profile photo'))
    } finally {
      setUpdatingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setUpdatingAvatar(true)
    try {
      await user.setProfileImage({ file: null })
      toast.success('Profile photo removed')
    } catch (err) {
      toast.error(extractClerkError(err, 'Failed to remove photo'))
    } finally {
      setUpdatingAvatar(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword.trim()) return
    setSavingPassword(true)
    try {
      await user.updatePassword({
        currentPassword: user.passwordEnabled ? currentPassword : undefined,
        newPassword,
        signOutOfOtherSessions: signOutOthers,
      })
      setCurrentPassword('')
      setNewPassword('')
      toast.success('Password updated cleanly')
    } catch (err) {
      toast.error(extractClerkError(err, 'Could not update password'))
    } finally {
      setSavingPassword(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId)
    if (!target) return
    setRevokingId(sessionId)
    try {
      await target.revoke()
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      toast.success('Session signed out')
    } catch (err) {
      toast.error(extractClerkError(err, 'Failed to revoke session'))
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-[540px] max-w-[540px] max-h-[85vh] p-0 gap-0 overflow-hidden"
      >
        {/* Header + Tabs */}
        <div className="px-6 pt-6 pb-4 shrink-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_100%)] border-b border-white/[0.06]">
          <DialogHeader className="pr-8">
            <div className="flex items-center gap-3.5">
              <GhostAvatar
                imageUrl={user.imageUrl}
                hasImage={user.hasImage}
                name={displayName}
                size="lg"
                shape="circle"
              />
              <div className="min-w-0">
                <DialogTitle className="font-heading text-base font-semibold text-text-primary truncate">
                  {displayName}
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted truncate">
                  {primaryEmail}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div
            role="tablist"
            aria-label="Account sections"
            className="mt-5 flex items-center gap-1.5 rounded-xl bg-black/30 p-1 w-fit"
          >
            {[
              { id: 'profile', label: 'Profile', icon: UserIcon },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'sessions', label: 'Sessions', icon: Laptop },
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

        {/* Body */}
        <div className="flex-1 min-h-0 px-6 py-5 overflow-y-auto space-y-5">
          {tab === 'profile' && (
            <>
              {/* Photo controls */}
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3.5">
                <div className="flex items-center gap-3">
                  <GhostAvatar
                    imageUrl={user.imageUrl}
                    hasImage={user.hasImage}
                    name={displayName}
                    size="lg"
                    shape="circle"
                  />
                  <div>
                    <div className="text-xs font-medium text-text-primary">Avatar</div>
                    <div className="text-[11px] text-text-muted">
                      Shown to collaborators on your canvas
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <EditorButton
                    type="button"
                    tone="socket"
                    size="xs"
                    disabled={updatingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {updatingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>Upload</span>
                  </EditorButton>
                  {user.hasImage && (
                    <EditorButton
                      type="button"
                      tone="ghost3d"
                      size="icon-sm"
                      disabled={updatingAvatar}
                      aria-label="Remove profile photo"
                      onClick={handleRemoveAvatar}
                      className="text-text-muted hover:text-state-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </EditorButton>
                  )}
                </div>
              </div>

              {/* Name form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor={firstNameId}
                      className="text-[11px] font-medium uppercase tracking-wider text-text-muted"
                    >
                      First Name
                    </label>
                    <input
                      id={firstNameId}
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className={ghostAuthInputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor={lastNameId}
                      className="text-[11px] font-medium uppercase tracking-wider text-text-muted"
                    >
                      Last Name
                    </label>
                    <input
                      id={lastNameId}
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className={ghostAuthInputClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <EditorButton
                    type="submit"
                    tone="primary"
                    size="sm"
                    disabled={savingProfile}
                  >
                    {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Save Profile</span>
                  </EditorButton>
                </div>
              </form>

              {/* Emails & Connected Accounts */}
              <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Email Addresses
                </div>
                <div className="space-y-1.5">
                  {user.emailAddresses.map((email) => {
                    const isPrimary = email.id === user.primaryEmailAddressId
                    const isVerified = email.verification?.status === 'verified'
                    return (
                      <div
                        key={email.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-3.5 w-3.5 text-text-muted shrink-0" />
                          <span className="truncate text-text-primary">{email.emailAddress}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-state-success/10 px-1.5 py-0.5 text-[10px] font-medium text-state-success">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                          {isPrimary && (
                            <span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-medium text-[#7ecbd4]">
                              Primary
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {user.externalAccounts.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                    Connected Accounts
                  </div>
                  <div className="space-y-1.5">
                    {user.externalAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <OAuthProviderIcon strategy={`oauth_${acc.provider}`} />
                          <span className="capitalize font-medium text-text-primary">
                            {acc.provider}
                          </span>
                          <span className="text-text-muted truncate">
                            {acc.emailAddress || acc.username || 'Linked'}
                          </span>
                        </div>
                        <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-text-secondary">
                          Connected
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'security' && (
            <>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
                  <KeyRound className="h-4 w-4 text-[#7ecbd4]" />
                  <span>{user.passwordEnabled ? 'Change Password' : 'Set a Password'}</span>
                </div>

                {user.passwordEnabled && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor={currentPwId}
                      className="text-[11px] font-medium uppercase tracking-wider text-text-muted"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        id={currentPwId}
                        type={showCurrentPw ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={cn(ghostAuthInputClass, 'pr-10')}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw((v) => !v)}
                        aria-label={showCurrentPw ? 'Hide current password' : 'Show current password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary"
                      >
                        {showCurrentPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor={newPwId}
                    className="text-[11px] font-medium uppercase tracking-wider text-text-muted"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id={newPwId}
                      type={showNewPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={cn(ghostAuthInputClass, 'pr-10')}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary"
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signOutOthers}
                    onChange={(e) => setSignOutOthers(e.target.checked)}
                    className="rounded border-white/20 bg-bg-base accent-accent-primary"
                  />
                  <span>Sign out of all other active devices</span>
                </label>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <EditorButton
                    type="button"
                    tone="socket"
                    size="xs"
                    onClick={() => {
                      onOpenChange(false)
                      clerk.openUserProfile()
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-[#7ecbd4]" />
                    <span>MFA, Passkeys &amp; Emails</span>
                  </EditorButton>
                  <EditorButton
                    type="submit"
                    tone="primary"
                    size="sm"
                    disabled={savingPassword || !newPassword}
                  >
                    {savingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Update Password</span>
                  </EditorButton>
                </div>
              </form>
            </>
          )}

          {tab === 'sessions' && (
            <div className="space-y-3">
              <div className="text-xs text-text-muted">
                Devices currently signed in to your Ghost AI account.
              </div>
              {loadingSessions ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-[#7ecbd4]" />
                  <span>Loading sessions...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-2xl bg-white/[0.03] p-6 text-center text-xs text-text-muted">
                  No additional session details available.
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => {
                    const isCurrent = s.id === activeSession?.id
                    const activity = s.latestActivity
                    const DeviceIcon = activity?.isMobile ? Smartphone : Laptop
                    const deviceLabel = [
                      activity?.browserName,
                      activity?.deviceType,
                    ]
                      .filter(Boolean)
                      .join(' on ') || 'Web session'
                    const locationLabel = [
                      activity?.city,
                      activity?.country,
                      activity?.ipAddress,
                    ]
                      .filter(Boolean)
                      .join(' · ')

                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-[#7ecbd4]">
                            <DeviceIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-text-primary truncate">
                                {deviceLabel}
                              </span>
                              {isCurrent && (
                                <span className="rounded-md bg-accent-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-[#7ecbd4]">
                                  This device
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-text-muted truncate">
                              {locationLabel ? `${locationLabel} · ` : ''}
                              {formatRelativeActivity(new Date(s.lastActiveAt))}
                            </div>
                          </div>
                        </div>

                        {!isCurrent && (
                          <EditorButton
                            type="button"
                            tone="ghost3d"
                            size="xs"
                            disabled={revokingId === s.id}
                            onClick={() => handleRevokeSession(s.id)}
                            className="text-state-error hover:text-state-error shrink-0"
                          >
                            {revokingId === s.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Revoke'
                            )}
                          </EditorButton>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
