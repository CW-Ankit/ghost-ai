'use client'

import React from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { editorButtonClass } from './editor-button'

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base text-center p-6">
      <div className="bg-bg-surface border border-border-default p-8 rounded-3xl max-w-md w-full flex flex-col items-center gap-4 shadow-2xl">
        <div className="h-16 w-16 bg-accent-primary-dim rounded-full flex items-center justify-center text-brand mb-2">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">Whoa there — this room is locked.</h1>
        <p className="text-text-secondary">
          Looks like you don&apos;t have the keys to this workspace, or it vanished into thin air.
        </p>
        <Link
          href="/editor"
          className={editorButtonClass({ tone: 'primary', size: 'md', className: 'mt-4 px-5' })}
        >
          Take me back to Projects
        </Link>
      </div>
    </div>
  )
}
