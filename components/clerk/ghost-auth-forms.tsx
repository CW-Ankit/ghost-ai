'use client'

import React, { useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AuthenticateWithRedirectCallback, useClerk, useSignIn, useSignUp } from '@clerk/nextjs'
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
} from 'lucide-react'
import { EditorButton } from '@/components/editor/editor-button'
import { cn } from '@/lib/utils'
import {
  extractClerkError,
  getSavedAuthStrategy,
  ghostAuthInputClass,
  type GhostOAuthStrategy,
  OAUTH_PROVIDER_META,
  OAuthProviderIcon,
  saveLastAuthStrategy,
} from './ghost-clerk-shared'

interface ClerkEnvShape {
  client?: {
    lastAuthenticationStrategy?: string | null
  }
  __unstable__environment?: {
    userSettings?: {
      authenticatableSocialStrategies?: string[]
      attributes?: {
        username?: { enabled?: boolean; required?: boolean }
        first_name?: { enabled?: boolean; required?: boolean }
        last_name?: { enabled?: boolean; required?: boolean }
      }
    }
  }
}

function useNavigateAfterAuth() {
  const router = useRouter()
  return ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
    const dest = decorateUrl('/editor')
    if (dest.startsWith('http')) {
      window.location.href = dest
      return
    }
    router.push(dest)
  }
}

function useEnabledOAuthStrategies(): GhostOAuthStrategy[] {
  const clerk = useClerk()
  const rawClerk = clerk as unknown as ClerkEnvShape
  return useMemo(() => {
    const strategies = rawClerk.__unstable__environment?.userSettings?.authenticatableSocialStrategies
    if (Array.isArray(strategies)) {
      return strategies.filter((s): s is GhostOAuthStrategy => s in OAUTH_PROVIDER_META)
    }
    return ['oauth_google', 'oauth_github']
  }, [rawClerk.__unstable__environment?.userSettings?.authenticatableSocialStrategies])
}

function useLastAuthStrategy(): string | null {
  const clerk = useClerk()
  const rawClerk = clerk as unknown as ClerkEnvShape
  const clerkStrategy = rawClerk.client?.lastAuthenticationStrategy || null
  const [savedStrategy, setSavedStrategy] = useState<string | null>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSavedStrategy(getSavedAuthStrategy())
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return clerkStrategy || savedStrategy
}

function LastUsedBadge() {
  return (
    <span className="rounded-md bg-[#12303b] border border-[#7ecbd4]/25 px-1.5 py-0.5 text-[10px] font-medium text-[#8ee0ea] leading-none shrink-0">
      Last used
    </span>
  )
}

function AuthCardShell({
  title,
  error,
  footer,
  children,
}: {
  title: string
  error?: string | null
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="w-full rounded-2xl bg-[#0e141c]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_28px_80px_-16px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
      <div className="p-6 sm:p-8 space-y-5">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-text-primary">
          {title}
        </h2>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-state-error/10 border border-state-error/25 px-3.5 py-2.5 text-xs text-state-error"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {children}
      </div>

      {footer && (
        <div className="px-6 sm:px-8 py-4 bg-white/[0.025] border-t border-white/[0.06] text-center">
          {footer}
        </div>
      )}
    </div>
  )
}

function IdentifierSummaryChip({
  value,
  onEdit,
}: {
  value: string
  onEdit: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] border border-white/[0.07] px-3 py-2 text-xs">
      <span className="truncate font-medium text-text-secondary">{value}</span>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7ecbd4] hover:text-accent-primary shrink-0 cursor-pointer"
      >
        <Pencil className="h-3 w-3" />
        <span>Edit</span>
      </button>
    </div>
  )
}

function SSOCallbackView() {
  return (
    <AuthCardShell title="Finishing sign-in">
      <div className="py-8 flex flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="h-7 w-7 animate-spin text-[#7ecbd4]" />
        <p className="text-xs">Redirecting to your workspace...</p>
      </div>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/editor"
        signUpForceRedirectUrl="/editor"
      />
    </AuthCardShell>
  )
}

function OAuthButtonRow({
  strategies,
  lastStrategy,
  loadingStrategy,
  disabled,
  onSelect,
}: {
  strategies: GhostOAuthStrategy[]
  lastStrategy: string | null
  loadingStrategy: GhostOAuthStrategy | null
  disabled?: boolean
  onSelect: (strategy: GhostOAuthStrategy) => void
}) {
  if (strategies.length === 0) return null

  return (
    <>
      <div className={cn('grid gap-2.5', strategies.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
        {strategies.map((strategy) => {
          const meta = OAUTH_PROVIDER_META[strategy]
          if (!meta) return null
          const isBusy = loadingStrategy === strategy
          const isLast = lastStrategy === strategy
          return (
            <EditorButton
              key={strategy}
              type="button"
              tone="socket"
              size="md"
              disabled={disabled || Boolean(loadingStrategy)}
              onClick={() => onSelect(strategy)}
              className={cn(
                'relative h-10 w-full justify-center gap-2 text-xs font-medium text-text-primary',
                isLast && 'ring-1 ring-[#7ecbd4]/45'
              )}
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#7ecbd4]" />
              ) : (
                <OAuthProviderIcon strategy={strategy} />
              )}
              <span>{meta.label}</span>
              {isLast && (
                <span className="ml-0.5 rounded bg-[#12303b] px-1.5 py-0.5 text-[9px] font-medium text-[#8ee0ea] leading-none">
                  Last
                </span>
              )}
            </EditorButton>
          )
        })}
      </div>

      <div className="relative flex items-center py-0.5">
        <div className="flex-1 border-t border-white/[0.07]" />
        <span className="px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-text-faint">
          or
        </span>
        <div className="flex-1 border-t border-white/[0.07]" />
      </div>
    </>
  )
}

type SignInStep =
  | 'identifier'
  | 'password'
  | 'email_code_verify'
  | 'second_factor'
  | 'forgot_reset'

export function GhostSignIn() {
  const pathname = usePathname()
  const { signIn, errors, fetchStatus } = useSignIn()
  const oAuthStrategies = useEnabledOAuthStrategies()
  const lastStrategy = useLastAuthStrategy()
  const navigateToApp = useNavigateAfterAuth()

  const [step, setStep] = useState<SignInStep>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [supportsPassword, setSupportsPassword] = useState(true)
  const [supportsEmailCode, setSupportsEmailCode] = useState(true)
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<
    'email_code' | 'phone_code' | 'totp' | 'backup_code'
  >('totp')
  const [localError, setLocalError] = useState<string | null>(null)
  const [loadingOAuth, setLoadingOAuth] = useState<GhostOAuthStrategy | null>(null)

  const identifierId = useId()
  const passwordId = useId()
  const codeId = useId()
  const newPasswordId = useId()

  if (pathname?.endsWith('/sso-callback')) {
    return <SSOCallbackView />
  }

  const busy = fetchStatus === 'fetching'
  const activeError =
    localError ||
    (errors?.global?.length ||
    errors?.fields?.identifier ||
    errors?.fields?.password ||
    errors?.fields?.code
      ? extractClerkError(errors)
      : null)

  const usedEmailFlowLast =
    lastStrategy === 'password' ||
    lastStrategy === 'email_code' ||
    lastStrategy === 'email_address' ||
    lastStrategy === 'username'

  const handleOAuth = async (strategy: GhostOAuthStrategy) => {
    if (!signIn) return
    setLocalError(null)
    setLoadingOAuth(strategy)
    saveLastAuthStrategy(strategy)
    try {
      const { error } = await signIn.sso({
        strategy,
        redirectUrl: '/editor',
        redirectCallbackUrl: '/sign-in/sso-callback',
      })
      if (error) {
        setLocalError(extractClerkError(error))
      }
    } finally {
      setLoadingOAuth(null)
    }
  }

  const finishIfComplete = async (usedMethod: string) => {
    if (!signIn) return false
    if (signIn.status === 'complete') {
      saveLastAuthStrategy(usedMethod)
      const { error } = await signIn.finalize({ navigate: navigateToApp })
      if (error) {
        setLocalError(extractClerkError(error))
      }
      return true
    }
    if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
      saveLastAuthStrategy(usedMethod)
      const supported = signIn.supportedSecondFactors || []
      const hasEmail = supported.some((f) => f.strategy === 'email_code')
      const hasPhone = supported.some((f) => f.strategy === 'phone_code')
      const hasTotp = supported.some((f) => f.strategy === 'totp')

      if (hasEmail) {
        setSecondFactorStrategy('email_code')
        await signIn.mfa.sendEmailCode()
      } else if (hasPhone) {
        setSecondFactorStrategy('phone_code')
        await signIn.mfa.sendPhoneCode()
      } else if (hasTotp) {
        setSecondFactorStrategy('totp')
      } else {
        setSecondFactorStrategy('backup_code')
      }
      setCode('')
      setStep('second_factor')
      return true
    }
    return false
  }

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn || !identifier.trim()) return
    setLocalError(null)

    const { error } = await signIn.create({ identifier: identifier.trim() })
    if (error) {
      setLocalError(extractClerkError(error))
      return
    }

    const firstFactors = signIn.supportedFirstFactors || []
    const canPassword = firstFactors.some((f) => f.strategy === 'password')
    const canEmailCode = firstFactors.some((f) => f.strategy === 'email_code')

    setSupportsPassword(canPassword || firstFactors.length === 0)
    setSupportsEmailCode(canEmailCode || firstFactors.length === 0)

    if ((!canPassword && canEmailCode) || (lastStrategy === 'email_code' && canEmailCode)) {
      const sent = await signIn.emailCode.sendCode()
      if (sent.error) {
        setLocalError(extractClerkError(sent.error))
        return
      }
      setCode('')
      setStep('email_code_verify')
      return
    }

    setPassword('')
    setStep('password')
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return
    setLocalError(null)

    const { error } = await signIn.password({ password })
    if (error) {
      setLocalError(extractClerkError(error))
      return
    }

    await finishIfComplete('password')
  }

  const handleSwitchToEmailCode = async () => {
    if (!signIn) return
    setLocalError(null)
    const sent = await signIn.emailCode.sendCode()
    if (sent.error) {
      setLocalError(extractClerkError(sent.error))
      return
    }
    setCode('')
    setStep('email_code_verify')
  }

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return
    setLocalError(null)

    const verified = await signIn.emailCode.verifyCode({ code: code.trim() })
    if (verified.error) {
      setLocalError(extractClerkError(verified.error))
      return
    }
    await finishIfComplete('email_code')
  }

  const handleVerifySecondFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return
    setLocalError(null)

    const trimmed = code.trim()
    let res: { error: unknown }
    if (secondFactorStrategy === 'email_code') {
      res = await signIn.mfa.verifyEmailCode({ code: trimmed })
    } else if (secondFactorStrategy === 'phone_code') {
      res = await signIn.mfa.verifyPhoneCode({ code: trimmed })
    } else if (secondFactorStrategy === 'totp') {
      res = await signIn.mfa.verifyTOTP({ code: trimmed })
    } else {
      res = await signIn.mfa.verifyBackupCode({ code: trimmed })
    }

    if (res.error) {
      setLocalError(extractClerkError(res.error))
      return
    }
    await finishIfComplete(lastStrategy || 'password')
  }

  const handleStartPasswordReset = async () => {
    if (!signIn) return
    setLocalError(null)
    const sent = await signIn.resetPasswordEmailCode.sendCode()
    if (sent.error) {
      setLocalError(extractClerkError(sent.error))
      return
    }
    setCode('')
    setNewPassword('')
    setStep('forgot_reset')
  }

  const handleSubmitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return
    setLocalError(null)

    const verified = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() })
    if (verified.error) {
      setLocalError(extractClerkError(verified.error))
      return
    }
    const submitted = await signIn.resetPasswordEmailCode.submitPassword({
      password: newPassword,
    })
    if (submitted.error) {
      setLocalError(extractClerkError(submitted.error))
      return
    }
    await finishIfComplete('password')
  }

  const handleResetToIdentifier = async () => {
    setLocalError(null)
    await signIn?.reset()
    setPassword('')
    setCode('')
    setStep('identifier')
  }

  const cardTitle =
    step === 'forgot_reset'
      ? 'Reset your password'
      : step === 'email_code_verify' || step === 'second_factor'
        ? 'Enter verification code'
        : step === 'password'
          ? 'Enter your password'
          : 'Sign in to Ghost AI'

  return (
    <AuthCardShell
      title={cardTitle}
      error={activeError}
      footer={
        <p className="text-xs text-text-muted">
          New to Ghost AI?{' '}
          <Link
            href="/sign-up"
            className="font-medium text-[#7ecbd4] hover:text-accent-primary transition-colors"
          >
            Create an account
          </Link>
        </p>
      }
    >
      {step === 'identifier' && (
        <div className="space-y-4">
          <OAuthButtonRow
            strategies={oAuthStrategies}
            lastStrategy={lastStrategy}
            loadingStrategy={loadingOAuth}
            disabled={busy || !signIn}
            onSelect={handleOAuth}
          />

          <form onSubmit={handleIdentifierSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={identifierId}
                  className="text-xs font-medium text-text-secondary"
                >
                  Email or username
                </label>
                {usedEmailFlowLast && <LastUsedBadge />}
              </div>
              <input
                id={identifierId}
                name="identifier"
                type="text"
                inputMode="email"
                autoComplete="username"
                spellCheck={false}
                autoCapitalize="none"
                enterKeyHint="next"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@studio.dev or username"
                className={ghostAuthInputClass}
              />
            </div>

            <EditorButton
              type="submit"
              tone="primary"
              size="lg"
              disabled={busy || !signIn || !identifier.trim()}
              className="w-full"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Continue</span>
            </EditorButton>
          </form>
        </div>
      )}

      {step === 'password' && (
        <div className="space-y-4">
          <IdentifierSummaryChip value={identifier} onEdit={handleResetToIdentifier} />

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={passwordId}
                    className="text-xs font-medium text-text-secondary"
                  >
                    Password
                  </label>
                  {lastStrategy === 'password' && <LastUsedBadge />}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleStartPasswordReset}
                  className="text-[11px] font-medium text-[#7ecbd4] hover:text-accent-primary cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id={passwordId}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={cn(ghostAuthInputClass, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <EditorButton
              type="submit"
              tone="primary"
              size="lg"
              disabled={busy || !signIn}
              className="w-full"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Sign In</span>
            </EditorButton>
          </form>

          {supportsEmailCode && (
            <button
              type="button"
              disabled={busy}
              onClick={handleSwitchToEmailCode}
              className="w-full py-1 text-center text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Sign in with a one-time code
              {lastStrategy === 'email_code' ? ' (Last used)' : ''}
            </button>
          )}
        </div>
      )}

      {step === 'email_code_verify' && (
        <div className="space-y-4">
          <IdentifierSummaryChip value={identifier} onEdit={handleResetToIdentifier} />

          <form onSubmit={handleVerifyEmailCode} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={codeId} className="text-xs font-medium text-text-secondary">
                  One-time code
                </label>
                {lastStrategy === 'email_code' && <LastUsedBadge />}
              </div>
              <input
                id={codeId}
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                enterKeyHint="done"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className={cn(ghostAuthInputClass, 'font-mono tracking-[0.25em] text-center')}
              />
            </div>

            <EditorButton type="submit" tone="primary" size="lg" disabled={busy} className="w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Sign In</span>
            </EditorButton>
          </form>

          <div className="flex items-center justify-between text-xs text-text-muted">
            {supportsPassword ? (
              <button
                type="button"
                onClick={() => {
                  setLocalError(null)
                  setStep('password')
                }}
                className="hover:text-text-primary cursor-pointer"
              >
                Use password
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => signIn?.emailCode.sendCode()}
              className="text-[#7ecbd4] hover:text-accent-primary cursor-pointer"
            >
              Resend code
            </button>
          </div>
        </div>
      )}

      {step === 'second_factor' && (
        <form onSubmit={handleVerifySecondFactor} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={codeId} className="text-xs font-medium text-text-secondary">
              {secondFactorStrategy === 'backup_code' ? 'Backup code' : 'Two-factor code'}
            </label>
            <input
              id={codeId}
              name="code"
              type="text"
              inputMode={secondFactorStrategy === 'backup_code' ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              enterKeyHint="done"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className={cn(ghostAuthInputClass, 'font-mono tracking-[0.25em] text-center')}
            />
          </div>
          <EditorButton type="submit" tone="primary" size="lg" disabled={busy} className="w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Confirm &amp; Sign In</span>
          </EditorButton>
          <button
            type="button"
            onClick={handleResetToIdentifier}
            className="w-full py-1 text-center text-xs text-text-muted hover:text-text-primary cursor-pointer"
          >
            Back
          </button>
        </form>
      )}

      {step === 'forgot_reset' && (
        <div className="space-y-4">
          <IdentifierSummaryChip value={identifier} onEdit={handleResetToIdentifier} />

          <form onSubmit={handleSubmitNewPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor={codeId} className="text-xs font-medium text-text-secondary">
                Reset code
              </label>
              <input
                id={codeId}
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                enterKeyHint="next"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className={cn(ghostAuthInputClass, 'font-mono tracking-[0.25em] text-center')}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={newPasswordId} className="text-xs font-medium text-text-secondary">
                New password
              </label>
              <div className="relative">
                <input
                  id={newPasswordId}
                  name="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  enterKeyHint="done"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  className={cn(ghostAuthInputClass, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <EditorButton type="submit" tone="primary" size="lg" disabled={busy} className="w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Reset Password &amp; Sign In</span>
            </EditorButton>
          </form>
        </div>
      )}

      <div id="clerk-captcha" />
    </AuthCardShell>
  )
}

interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  hasMinLength: boolean
  hasMixedCase: boolean
  hasNumberOrSymbol: boolean
}

function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const hasMinLength = password.length >= 8
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password)
  const hasNumberOrSymbol = /[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)

  if (!password) {
    return {
      score: 0,
      label: 'Enter at least 8 characters',
      hasMinLength: false,
      hasMixedCase: false,
      hasNumberOrSymbol: false,
    }
  }

  let score = 0
  if (hasMinLength) score += 1
  if (password.length >= 12) score += 1
  if (hasMixedCase) score += 1
  if (hasNumberOrSymbol) score += 1

  const clampedScore = Math.min(4, score) as 0 | 1 | 2 | 3 | 4
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'] as const
  return {
    score: clampedScore,
    label: labels[clampedScore],
    hasMinLength,
    hasMixedCase,
    hasNumberOrSymbol,
  }
}

type SignUpStep = 'email' | 'password' | 'profile' | 'verify_email'

export function GhostSignUp() {
  const pathname = usePathname()
  const clerk = useClerk()
  const { signUp, errors, fetchStatus } = useSignUp()
  const oAuthStrategies = useEnabledOAuthStrategies()
  const lastStrategy = useLastAuthStrategy()
  const navigateToApp = useNavigateAfterAuth()

  const [step, setStep] = useState<SignUpStep>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [code, setCode] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [loadingOAuth, setLoadingOAuth] = useState<GhostOAuthStrategy | null>(null)

  const emailId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()
  const usernameId = useId()
  const nameId = useId()
  const codeId = useId()

  if (pathname?.endsWith('/sso-callback')) {
    return <SSOCallbackView />
  }

  const rawClerk = clerk as unknown as ClerkEnvShape
  const usernameAttr = rawClerk.__unstable__environment?.userSettings?.attributes?.username
  const usernameEnabled = usernameAttr?.enabled ?? true
  const usernameRequired = Boolean(usernameAttr?.required)

  const busy = fetchStatus === 'fetching'
  const activeError =
    localError ||
    (errors?.global?.length ||
    errors?.fields?.emailAddress ||
    errors?.fields?.password ||
    errors?.fields?.username ||
    errors?.fields?.code ||
    errors?.fields?.captcha
      ? extractClerkError(errors)
      : null)

  const strength = evaluatePasswordStrength(password)
  const passwordsMatch = Boolean(confirmPassword && password === confirmPassword)
  const passwordsMismatch = Boolean(confirmPassword && password !== confirmPassword)

  const handleOAuth = async (strategy: GhostOAuthStrategy) => {
    if (!signUp) return
    setLocalError(null)
    setLoadingOAuth(strategy)
    saveLastAuthStrategy(strategy)
    try {
      const { error } = await signUp.sso({
        strategy,
        redirectUrl: '/editor',
        redirectCallbackUrl: '/sign-up/sso-callback',
      })
      if (error) {
        setLocalError(extractClerkError(error))
      }
    } finally {
      setLoadingOAuth(null)
    }
  }

  const handleEmailStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLocalError(null)
    setStep('password')
  }

  const handlePasswordStep = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!strength.hasMinLength || strength.score < 2) {
      setLocalError('Choose a stronger password (at least 8 characters with mixed letters or numbers).')
      return
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    setStep('profile')
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp) return
    setLocalError(null)

    const trimmedName = fullName.trim()
    const spaceIdx = trimmedName.indexOf(' ')
    const firstName = spaceIdx > 0 ? trimmedName.slice(0, spaceIdx) : trimmedName || undefined
    const lastName = spaceIdx > 0 ? trimmedName.slice(spaceIdx + 1).trim() || undefined : undefined
    const cleanUsername = username.trim()

    let res = await signUp.password({
      emailAddress: email.trim(),
      password,
      ...(usernameEnabled && cleanUsername ? { username: cleanUsername } : {}),
      firstName,
      lastName,
    })

    // Fallback if Clerk dashboard does not have the username attribute enabled
    if (res.error && cleanUsername && extractClerkError(res.error).toLowerCase().includes('username')) {
      res = await signUp.password({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName,
        unsafeMetadata: { handle: cleanUsername },
      })
    }

    if (res.error) {
      setLocalError(extractClerkError(res.error))
      return
    }

    saveLastAuthStrategy('password')

    if (signUp.status === 'complete') {
      const fin = await signUp.finalize({ navigate: navigateToApp })
      if (fin.error) setLocalError(extractClerkError(fin.error))
      return
    }

    if (
      signUp.status === 'missing_requirements' &&
      (signUp.unverifiedFields.includes('email_address') ||
        signUp.verifications.emailAddress.nextAction === 'needs_attempt' ||
        signUp.verifications.emailAddress.status === 'unverified')
    ) {
      const sendRes = await signUp.verifications.sendEmailCode()
      if (sendRes.error) {
        setLocalError(extractClerkError(sendRes.error))
        return
      }
      setCode('')
      setStep('verify_email')
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp) return
    setLocalError(null)

    const verified = await signUp.verifications.verifyEmailCode({ code: code.trim() })
    if (verified.error) {
      setLocalError(extractClerkError(verified.error))
      return
    }

    if (signUp.status === 'complete') {
      saveLastAuthStrategy('password')
      const fin = await signUp.finalize({ navigate: navigateToApp })
      if (fin.error) setLocalError(extractClerkError(fin.error))
    } else {
      setLocalError('Additional verification details are required to finish setup.')
    }
  }

  const signUpTitle =
    step === 'verify_email'
      ? 'Verify your email'
      : step === 'profile'
        ? 'Username and name'
        : step === 'password'
          ? 'Set a password'
          : 'Create your account'

  return (
    <AuthCardShell
      title={signUpTitle}
      error={activeError}
      footer={
        <p className="text-xs text-text-muted">
          Already have a studio pass?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-[#7ecbd4] hover:text-accent-primary transition-colors"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {step === 'email' && (
        <div className="space-y-4">
          <OAuthButtonRow
            strategies={oAuthStrategies}
            lastStrategy={lastStrategy}
            loadingStrategy={loadingOAuth}
            disabled={busy || !signUp}
            onSelect={handleOAuth}
          />

          <form onSubmit={handleEmailStep} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor={emailId} className="text-xs font-medium text-text-secondary">
                Email address
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                enterKeyHint="next"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.dev"
                className={ghostAuthInputClass}
              />
            </div>

            <EditorButton
              type="submit"
              tone="primary"
              size="lg"
              disabled={busy || !signUp || !email.trim()}
              className="w-full"
            >
              <span>Continue</span>
            </EditorButton>
          </form>
        </div>
      )}

      {step === 'password' && (
        <div className="space-y-4">
          <IdentifierSummaryChip
            value={email}
            onEdit={() => {
              setLocalError(null)
              setStep('email')
            }}
          />

          <form onSubmit={handlePasswordStep} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor={passwordId} className="text-xs font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <input
                  id={passwordId}
                  name="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  enterKeyHint="next"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className={cn(ghostAuthInputClass, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              <div className="pt-1.5 space-y-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((segment) => {
                    const filled = strength.score >= segment
                    const barColor =
                      strength.score <= 1
                        ? 'bg-state-error'
                        : strength.score === 2
                          ? 'bg-state-warning'
                          : strength.score === 3
                            ? 'bg-[#7ecbd4]'
                            : 'bg-state-success'
                    return (
                      <div
                        key={segment}
                        className={cn(
                          'h-1 rounded-sm transition-colors',
                          filled ? barColor : 'bg-white/[0.08]'
                        )}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Strength</span>
                  <span
                    className={cn(
                      'font-medium',
                      strength.score === 0 && 'text-text-faint',
                      strength.score === 1 && 'text-state-error',
                      strength.score === 2 && 'text-state-warning',
                      strength.score === 3 && 'text-[#7ecbd4]',
                      strength.score === 4 && 'text-state-success'
                    )}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted">
                  {[
                    { ok: strength.hasMinLength, text: '8+ characters' },
                    { ok: strength.hasMixedCase, text: 'Upper & lower' },
                    { ok: strength.hasNumberOrSymbol, text: 'Number or symbol' },
                  ].map((req) => (
                    <span
                      key={req.text}
                      className={cn(
                        'inline-flex items-center gap-1 transition-colors',
                        req.ok ? 'text-state-success' : 'text-text-muted'
                      )}
                    >
                      <Check className={cn('h-3 w-3', !req.ok && 'opacity-30')} />
                      <span>{req.text}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={confirmPasswordId}
                  className="text-xs font-medium text-text-secondary"
                >
                  Confirm password
                </label>
                {passwordsMatch && (
                  <span className="text-[11px] text-state-success">Match</span>
                )}
                {passwordsMismatch && (
                  <span className="text-[11px] text-state-error">Does not match</span>
                )}
              </div>
              <div className="relative">
                <input
                  id={confirmPasswordId}
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  enterKeyHint="done"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={cn(
                    ghostAuthInputClass,
                    'pr-10',
                    passwordsMismatch && 'border-state-error/50 focus:border-state-error'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <EditorButton
              type="submit"
              tone="primary"
              size="lg"
              disabled={!strength.hasMinLength || strength.score < 2 || !passwordsMatch}
              className="w-full"
            >
              <span>Continue</span>
            </EditorButton>
          </form>
        </div>
      )}

      {step === 'profile' && (
        <div className="space-y-4">
          <IdentifierSummaryChip
            value={email}
            onEdit={() => {
              setLocalError(null)
              setStep('email')
            }}
          />

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor={usernameId} className="text-xs font-medium text-text-secondary">
                Username
              </label>
              <input
                id={usernameId}
                name="username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                autoCapitalize="none"
                enterKeyHint="next"
                required={usernameRequired}
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ada_lovelace"
                className={ghostAuthInputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={nameId} className="text-xs font-medium text-text-secondary">
                Full name
              </label>
              <input
                id={nameId}
                name="fullname"
                type="text"
                autoComplete="name"
                enterKeyHint="done"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
                className={ghostAuthInputClass}
              />
            </div>

            <EditorButton
              type="submit"
              tone="primary"
              size="lg"
              disabled={busy || !signUp || !fullName.trim() || (usernameRequired && !username.trim())}
              className="w-full"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Create Account</span>
            </EditorButton>
          </form>

          <button
            type="button"
            onClick={() => {
              setLocalError(null)
              setStep('password')
            }}
            className="w-full py-1 text-center text-xs text-text-muted hover:text-text-primary cursor-pointer"
          >
            Back to password
          </button>
        </div>
      )}

      {step === 'verify_email' && (
        <div className="space-y-4">
          <IdentifierSummaryChip
            value={email}
            onEdit={async () => {
              setLocalError(null)
              await signUp?.reset()
              setStep('email')
            }}
          />

          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor={codeId} className="text-xs font-medium text-text-secondary">
                Verification code
              </label>
              <input
                id={codeId}
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                enterKeyHint="done"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className={cn(ghostAuthInputClass, 'font-mono tracking-[0.25em] text-center')}
              />
            </div>
            <EditorButton type="submit" tone="primary" size="lg" disabled={busy} className="w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Verify &amp; Create Account</span>
            </EditorButton>
          </form>

          <div className="flex items-center justify-end text-xs">
            <button
              type="button"
              disabled={busy}
              onClick={() => signUp?.verifications.sendEmailCode()}
              className="text-[#7ecbd4] hover:text-accent-primary cursor-pointer"
            >
              Resend code
            </button>
          </div>
        </div>
      )}

      <div id="clerk-captcha" />
    </AuthCardShell>
  )
}
