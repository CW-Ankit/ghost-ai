'use client'

import React, { useState } from 'react'
import { EditorNavbar } from '@/components/editor/editor-navbar'
import { ProjectSidebar } from '@/components/editor/project-sidebar'
import { EditorHome } from '@/components/editor/editor-home'
import { ProjectDialogsComponent } from '@/components/editor/project-dialogs'
import { useProjectActions } from '../../hooks/use-project-actions'
import { Doc } from '@/convex/_generated/dataModel'

interface EditorLayoutProps {
  initialProjects: Doc<'projects'>[]
  initialSharedProjects: Doc<'projects'>[]
}

export function EditorLayout({ initialProjects, initialSharedProjects }: EditorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const projectActions = useProjectActions()

  return (
    <div className="relative h-screen w-full overflow-hidden bg-bg-canvas">
      <EditorNavbar 
        sidebarOpen={sidebarOpen} 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <ProjectSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        actions={projectActions}
        initialProjects={initialProjects}
        initialSharedProjects={initialSharedProjects}
      />

      <main className="relative h-[calc(100vh-3.5rem)] w-full pt-14">
        <EditorHome onNewProject={projectActions.openCreateDialog} />
      </main>

      <ProjectDialogsComponent state={projectActions} />
    </div>
  )
}
