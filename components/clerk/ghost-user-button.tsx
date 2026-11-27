'use client'

import React, { useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useClerk, useOrganization, useUser } from '@clerk/nextjs'
import {
  Building2,
  ChevronDown,
  Laptop,
  Loader2,
  LogOut,
  Shield,
  UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnchoredPopup } from '@/components/editor/anchored-popup'
import { GhostAvatar } from './ghost-clerk-shared'
import { GhostAccountDialog } from './ghost-account-dialog'
import { GhostOrgProfileDialog } from './ghost-org-dialogs'

interface GhostUserButtonProps {
  /** `header` renders a tactile 3D button for the app bar; `compact` renders an avatar ring for the canvas dock. */
  variant?: 'header' | 'compact'
  className?: string
}

export function GhostUserButton({ variant = 'header', className }: GhostUserButtonProps) {
  const { user, isLoaded, isSignedIn } = useUser()
  const { organization } = useOrganization()
  const clerk = useClerk()

  const [open, setOpen] = useState(false)
  const [accountTab, setAccountTab] = useState<'profile' | 'security' | 'sessions'>('profile')
  const [accountOpen, setAccountOpen] = useState(false)
  const [orgDialogOpen, setOrgDialogOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const triggerId = useId()

  if (!isLoaded) {
    return (
      <div
        className={cn(
          'animate-pulse bg-white/[0.06]',
          variant === 'compact' ? 'h-8 w-8 rounded-full' : 'h-9 w-9 sm:w-28 rounded-xl',
          className
        )}
      />
    )
  }

  if (!isSignedIn || !user) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex items-center justify-center rounded-xl h-8 px-3 text-xs font-medium bg-[linear-gradient(180deg,#122936_0%,#0a1922_100%)] text-[#bce6ec] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_12px_-4px_rgba(0,0,0,0.7)] hover:brightness-110 transition-all"
      >
        Sign In
      </Link>
    )
  }

  const displayName =
    user.fullName || user.firstName || user.username || user.primaryEmailAddress?.emailAddress || 'User'
  const shortName = user.firstName || user.username || displayName.split(' ')[0]
  const email = user.primaryEmailAddress?.emailAddress || ''

  const handleOpenAccount = (targetTab: 'profile' | 'security' | 'sessions') => {
    setOpen(false)
    setAccountTab(targetTab)
    setAccountOpen(true)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await clerk.signOut({ redirectUrl: '/' })
    } finally {
      setSigningOut(false)
      setOpen(false)
    }
  }

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      {variant === 'compact' ? (
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label="Open account menu"
          onClick={() => setOpen((prev) => !prev)}
          className="relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary cursor-pointer transition-transform hover:scale-105 active:scale-95"
        >
          <GhostAvatar
            imageUrl={user.imageUrl}
            hasImage={user.hasImage}
            name={displayName}
            size="md"
            shape="circle"
            className="ring-2 ring-accent-primary/45"
          />
        </button>
      ) : (
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label="Open account menu"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl h-9 px-1.5 sm:pr-2.5 select-none cursor-pointer transition-all',
            'bg-[linear-gradient(180deg,#122936_0%,#0a1922_100%)] hover:bg-[linear-gradient(180deg,#173343_0%,#0d202b_100%)]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_14px_-4px_rgba(0,0,0,0.85)]',
            open && 'ring-1 ring-[#7ecbd4]/40'
          )}
        >
          <div className="relative">
            <GhostAvatar
              imageUrl={user.imageUrl}
              hasImage={user.hasImage}
              name={displayName}
              size="xs"
              shape="rounded"
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-state-success ring-2 ring-[#0a1922]"
              aria-hidden="true"
            />
          </div>
          <span className="hidden md:inline text-xs font-medium text-text-primary max-w-[100px] truncate">
            {shortName}
          </span>
          <ChevronDown
            className={cn(
              'hidden md:block h-3.5 w-3.5 text-text-muted transition-transform duration-150',
              open && 'rotate-180 text-[#7ecbd4]'
            )}
          />
        </button>
      )}

      <AnchoredPopup
        open={open}
        onOpenChange={setOpen}
        anchorRef={triggerRef}
        align="end"
        minWidth={288}
        maxWidth={304}
        enableArrowNavigation
        id={menuId}
        ariaLabelledBy={triggerId}
        className="p-2"
      >
        <div className="space-y-1">
          {/* Identity Header */}
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.035] p-3 mb-1.5">
            <GhostAvatar
              imageUrl={user.imageUrl}
              hasImage={user.hasImage}
              name={displayName}
              size="lg"
              shape="circle"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-text-primary truncate">
                {displayName}
              </div>
              {email && (
                <div className="text-[11px] text-text-muted truncate">{email}</div>
              )}
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#7ecbd4] truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7ecbd4] shrink-0" />
                <span className="truncate">
                  {organization ? organization.name : 'Personal Studio'}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Actions */}
          <button
            type="button"
            onClick={() => handleOpenAccount('profile')}
            className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.07] hover:text-text-primary focus-visible:bg-white/[0.09] focus-visible:text-text-primary focus-visible:outline-none transition-colors cursor-pointer"
          >
            <UserCog className="h-4 w-4 text-[#7ecbd4] shrink-0" />
            <span>Account Settings</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAccount('security')}
            className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.07] hover:text-text-primary focus-visible:bg-white/[0.09] focus-visible:text-text-primary focus-visible:outline-none transition-colors cursor-pointer"
          >
            <Shield className="h-4 w-4 text-text-muted shrink-0" />
            <span>Password &amp; Security</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAccount('sessions')}
            className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.07] hover:text-text-primary focus-visible:bg-white/[0.09] focus-visible:text-text-primary focus-visible:outline-none transition-colors cursor-pointer"
          >
            <Laptop className="h-4 w-4 text-text-muted shrink-0" />
            <span>Active Devices</span>
          </button>

          {organization && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setOrgDialogOpen(true)
              }}
              className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.07] hover:text-text-primary focus-visible:bg-white/[0.09] focus-visible:text-text-primary focus-visible:outline-none transition-colors cursor-pointer"
            >
              <Building2 className="h-4 w-4 text-text-muted shrink-0" />
              <span className="truncate">Manage {organization.name}</span>
            </button>
          )}

          <hr className="my-1.5 border-white/[0.06]" />

          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-state-error/90 hover:bg-state-error/10 hover:text-state-error focus-visible:bg-state-error/10 focus-visible:outline-none transition-colors cursor-pointer disabled:opacity-50"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" />
            )}
            <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </AnchoredPopup>

      <GhostAccountDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
        initialTab={accountTab}
      />

      <GhostOrgProfileDialog
        open={orgDialogOpen}
        onOpenChange={setOrgDialogOpen}
      />
    </div>
  )
}
