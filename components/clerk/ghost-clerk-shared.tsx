'use client'

import React from 'react'
import { Building2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Normalizes any Clerk v7 error shape (ClerkError, Errors<T>, ClerkAPIResponseError, or Error)
 * into a concise, human-readable message for Ghost AI forms and dialogs.
 */
export function extractClerkError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback
  if (typeof err === 'string') return err

  if (typeof err === 'object') {
    const record = err as Record<string, unknown>

    if (typeof record.longMessage === 'string' && record.longMessage.trim()) {
      return record.longMessage
    }
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message
    }

    // Clerk Errors<T> object returned by useSignIn / useSignUp signals
    const globalErrors = record.global
    if (Array.isArray(globalErrors) && globalErrors.length > 0) {
      return extractClerkError(globalErrors[0], fallback)
    }
    const fields = record.fields
    if (fields && typeof fields === 'object') {
      for (const value of Object.values(fields as Record<string, unknown>)) {
        if (value) {
          return extractClerkError(value, fallback)
        }
      }
    }

    // ClerkAPIResponseError `.errors` array
    const errors = record.errors
    if (Array.isArray(errors) && errors.length > 0) {
      return extractClerkError(errors[0], fallback)
    }
  }

  return fallback
}

export function getInitials(label?: string | null): string {
  if (!label) return 'G'
  const clean = label.trim()
  if (!clean) return 'G'
  const parts = clean.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function slugifyWorkspaceName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export function formatOrgRole(role?: string | null): string {
  if (!role) return 'Member'
  const normalized = role.replace(/^org:/, '')
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/_/g, ' ')
}

export interface GhostAvatarProps {
  imageUrl?: string | null
  hasImage?: boolean
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  shape?: 'rounded' | 'circle'
  isOrg?: boolean
  className?: string
}

const AVATAR_SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
} as const

export function GhostAvatar({
  imageUrl,
  hasImage,
  name,
  size = 'md',
  shape = 'rounded',
  isOrg = false,
  className,
}: GhostAvatarProps) {
  const showImage = Boolean(imageUrl && (hasImage === undefined || hasImage))
  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl'

  if (showImage && imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name || 'Avatar'}
        className={cn(
          'shrink-0 object-cover ring-1 ring-white/15 bg-bg-elevated select-none',
          AVATAR_SIZE_CLASSES[size],
          radiusClass,
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'shrink-0 flex items-center justify-center font-semibold select-none ring-1 ring-white/10',
        isOrg
          ? 'bg-[linear-gradient(180deg,#15303d_0%,#0c1f28_100%)] text-[#8ee0ea]'
          : 'bg-[linear-gradient(180deg,#1a2633_0%,#101720_100%)] text-[#9adce6]',
        AVATAR_SIZE_CLASSES[size],
        radiusClass,
        className
      )}
    >
      {isOrg && !name ? (
        <Building2 className="h-3.5 w-3.5" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}

export const ghostAuthInputClass =
  'w-full rounded-xl bg-bg-base/85 border border-white/[0.09] px-3.5 h-10 text-sm text-text-primary placeholder:text-text-faint outline-none transition-colors focus:border-accent-primary/65 focus:ring-2 focus:ring-accent-primary/20 disabled:opacity-50'

export type GhostOAuthStrategy =
  | 'oauth_google'
  | 'oauth_github'
  | 'oauth_discord'
  | 'oauth_apple'
  | 'oauth_microsoft'

export const OAUTH_PROVIDER_META: Record<
  GhostOAuthStrategy,
  { label: string; strategy: GhostOAuthStrategy }
> = {
  oauth_google: { label: 'Google', strategy: 'oauth_google' },
  oauth_github: { label: 'GitHub', strategy: 'oauth_github' },
  oauth_discord: { label: 'Discord', strategy: 'oauth_discord' },
  oauth_apple: { label: 'Apple', strategy: 'oauth_apple' },
  oauth_microsoft: { label: 'Microsoft', strategy: 'oauth_microsoft' },
}

export function OAuthProviderIcon({ strategy }: { strategy: string }) {
  if (strategy === 'oauth_google') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        />
      </svg>
    )
  }

  if (strategy === 'oauth_github') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-1.05-.01-1.91-2.78.62-3.37-1.22-3.37-1.22-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.85c.85 0 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.82-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" />
      </svg>
    )
  }

  return <ShieldCheck className="h-4 w-4 shrink-0 text-[#7ecbd4]" />
}

const LAST_AUTH_STRATEGY_KEY = 'ghostai:last-auth-strategy'

export function getSavedAuthStrategy(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(LAST_AUTH_STRATEGY_KEY)
  } catch {
    return null
  }
}

export function saveLastAuthStrategy(strategy: string): void {
  if (typeof window === 'undefined' || !strategy) return
  try {
    window.localStorage.setItem(LAST_AUTH_STRATEGY_KEY, strategy)
  } catch {
    // ignore storage errors
  }
}
