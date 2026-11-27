'use client'

import React from 'react'
import { Plus, Shapes } from 'lucide-react'
import { EditorButton } from './editor-button'

interface EditorHomeProps {
  onNewProject: () => void
}

export function EditorHome({ onNewProject }: EditorHomeProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center p-6">
      <div className="mb-6 p-4 rounded-full bg-accent-primary/10 text-accent-primary">
        <Shapes className="h-12 w-12" />
      </div>
      <h1 className="text-3xl font-heading font-semibold text-text-primary mb-2">
        It&apos;s a little quiet in here.
      </h1>
      <p className="text-text-secondary max-w-md mb-8">
        Spin up a fresh architecture canvas, or grab an existing project from the sidebar.
      </p>
      <EditorButton
        tone="primary"
        size="lg"
        onClick={onNewProject}
        className="h-12 px-6 text-base"
      >
        <Plus className="h-5 w-5" />
        New Project
      </EditorButton>
    </div>
  )
}
