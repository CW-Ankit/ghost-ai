'use client'

import React, { useState, useEffect } from 'react'
import { EditorNavbar } from '@/components/editor/editor-navbar'
import { ProjectSidebar } from '@/components/editor/project-sidebar'
import { ProjectDashboard } from '@/components/editor/project-dashboard'
import { ProjectDialogsComponent } from '@/components/editor/project-dialogs'
import { useProjectActions } from '../../hooks/use-project-actions'
import { Doc } from '@/convex/_generated/dataModel'

interface EditorLayoutProps {
  initialProjects: Doc<'projects'>[]
  initialSharedProjects: Doc<'projects'>[]
}

export function EditorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const projectActions = useProjectActions()
  
  // Dashboard State
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "recent" | "oldest">("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-screen w-full bg-bg-canvas" />
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-bg-canvas">
      <EditorNavbar 
        sidebarOpen={sidebarOpen} 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNewProject={projectActions.openCreateDialog}
      />
      
      <ProjectSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        actions={projectActions}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <main className="relative h-[calc(100vh-3.5rem)] w-full pt-14">
        <ProjectDashboard 
          onNewProject={projectActions.openCreateDialog} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          actions={projectActions}
        />
      </main>

      <ProjectDialogsComponent state={projectActions} />
    </div>
  )
}
