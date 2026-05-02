'use client'

import React, { useState } from 'react'
import { EditorNavbar } from '@/components/editor/editor-navbar'
import { ProjectSidebar } from '@/components/editor/project-sidebar'
import { EditorHome } from '@/components/editor/editor-home'
import { ProjectDialogsComponent } from '@/components/editor/project-dialogs'
import { useProjectDialogs } from '@/hooks/use-project-dialogs'

export default function EditorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const projectDialogs = useProjectDialogs()

  return (
    <div className="relative h-screen w-full overflow-hidden bg-bg-canvas">
      <EditorNavbar 
        sidebarOpen={sidebarOpen} 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <ProjectSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        dialogs={projectDialogs}
      />

      <main className="relative h-full w-full pt-14">
        <EditorHome onNewProject={projectDialogs.openCreateDialog} />
      </main>

      <ProjectDialogsComponent state={projectDialogs} />
    </div>
  )
}
