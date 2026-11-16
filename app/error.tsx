'use client'

import React, { useEffect } from 'react'
import { ShieldAlert, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application runtime error:', error)
  }, [error])

  const isClerkBlocked =
    error.message?.includes('failed_to_load_clerk_js') ||
    error.message?.includes('Failed to load Clerk JS') ||
    error.name === 'ClerkRuntimeError'

  if (isClerkBlocked) {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary flex items-center justify-center p-6 selection:bg-accent-primary/20">
        <div className="max-w-md w-full bg-bg-surface border border-border-default rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-state-warning/10 border border-state-warning/30 text-state-warning flex items-center justify-center mb-5">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h1 className="text-xl font-semibold font-heading text-text-primary mb-2">
            Browser Shield / Ad-Blocker Detected
          </h1>

          <p className="text-xs text-text-secondary leading-relaxed mb-6">
            Your browser (such as <strong>Brave Shields</strong>, <strong>uBlock Origin</strong>, or a privacy extension) is blocking Clerk&apos;s authentication script (<code className="font-mono text-accent-primary bg-bg-elevated px-1.5 py-0.5 rounded text-[11px]">*.clerk.accounts.dev</code>).
          </p>

          <div className="w-full bg-bg-elevated/70 border border-border-subtle rounded-2xl p-4 text-left text-xs space-y-2.5 mb-6 text-text-secondary">
            <div className="font-semibold text-text-primary flex items-center gap-1.5">
              <span>Quick Fix:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11.5px] leading-relaxed text-text-muted">
              <li>
                Click the <strong className="text-text-primary">Brave Shields (lion icon)</strong> or ad-blocker icon in your browser address bar.
              </li>
              <li>
                Toggle Shields <strong className="text-state-warning">OFF</strong> for <span className="font-mono text-text-primary">localhost:3000</span>.
              </li>
              <li>Click the button below to reload the page.</li>
            </ol>
          </div>

          <div className="flex items-center gap-3 w-full">
            <Button
              variant="default"
              onClick={() => reset()}
              className="flex-1 bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-medium h-10 rounded-xl gap-2 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex-1 border-border-subtle bg-bg-subtle text-text-secondary hover:text-text-primary h-10 rounded-xl text-xs"
            >
              <span>Reload Page</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-bg-surface border border-border-default rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        <div className="h-14 w-14 rounded-2xl bg-state-error/10 border border-state-error/30 text-state-error flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="text-lg font-semibold font-heading text-text-primary mb-2">
          Something went wrong
        </h1>

        <p className="text-xs text-text-muted mb-6 leading-relaxed max-w-sm">
          {error.message || 'An unexpected runtime error occurred.'}
        </p>

        <Button
          variant="default"
          onClick={() => reset()}
          className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-medium h-9 px-6 rounded-xl gap-2 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </Button>
      </div>
    </div>
  )
}
