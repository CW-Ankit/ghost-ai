'use client'

import React from 'react'
import { Plus, Shapes } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        Create a project or open an existing one
      </h1>
      <p className="text-text-secondary max-w-md mb-8">
        Start a new architecture workspace, or choose a project from the sidebar.
      </p>
      <Button
        onClick={onNewProject}
        className="gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/90 px-6 py-6 text-lg"
      >
        <Plus className="h-5 w-5" />
        New Project
      </Button>
    </div>
  )
}
