'use client'

import React from 'react'
import { GhostUserButton } from '@/components/clerk/ghost-user-button'
import { Menu } from 'lucide-react'
import { EditorButton } from './editor-button'
import { ProjectSidebar } from './project-sidebar'
import { ClientOnly } from '@/components/ui/client-only'
import { useProjectActions } from '@/hooks/use-project-actions'

interface EditorShellProps {
  defaultDesktopSidebarOpen?: boolean
  actions: ReturnType<typeof useProjectActions>
  activeProjectId?: string
  searchQuery?: string
  sortBy?: string
  locationSlot: React.ReactNode
  searchSlot: React.ReactNode
  actionsSlot: React.ReactNode
  children: React.ReactNode
}

export function EditorShell({
  defaultDesktopSidebarOpen = true,
  actions,
  activeProjectId,
  searchQuery,
  sortBy,
  locationSlot,
  searchSlot,
  actionsSlot,
  children,
}: EditorShellProps) {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = React.useState(defaultDesktopSidebarOpen)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileSidebarOpen((prev) => !prev)
    } else {
      setDesktopSidebarOpen((prev) => !prev)
    }
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-[linear-gradient(160deg,var(--bg-shell)_0%,var(--bg-shell-deep)_100%)] text-text-primary flex flex-col">
      {/* Upper Dark-Navy Quick Action Bar */}
      <header className="h-16 shrink-0 px-3 sm:px-4 flex items-center justify-between gap-3">
        {/* Left: Hamburger + Current Location */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <EditorButton
            tone="socket"
            size="icon-md"
            onClick={handleToggleSidebar}
            aria-label="Toggle sidebar"
            aria-expanded={desktopSidebarOpen || mobileSidebarOpen}
            aria-controls="editor-sidebar"
            className="bg-[linear-gradient(180deg,#122936_0%,#0a1922_100%)] hover:bg-[linear-gradient(180deg,#173343_0%,#0d202b_100%)]"
          >
            <Menu className="h-4 w-4" />
          </EditorButton>

          <div className="flex items-center gap-2 min-w-0">{locationSlot}</div>
        </div>

        {/* Center: Big Search Control */}
        <div className="flex-1 flex justify-center min-w-0 px-1 sm:px-4">{searchSlot}</div>

        {/* Right: Contextual Page Quick Actions + AI Switch + Account */}
        <div className="flex items-center gap-2 shrink-0">
          {actionsSlot}

          <div className="h-5 w-px bg-white/10 mx-0.5 hidden sm:block" />

          <ClientOnly>
            <div className="flex items-center">
              <GhostUserButton variant="header" />
            </div>
          </ClientOnly>
        </div>
      </header>

      {/* Lower Body: Smooth Inline Sidebar + Rounded Work Box */}
      <div className="flex-1 min-h-0 flex px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5">
        <ProjectSidebar
          id="editor-sidebar"
          isDesktopOpen={desktopSidebarOpen}
          isMobileOpen={mobileSidebarOpen}
          onCloseDesktop={() => setDesktopSidebarOpen(false)}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          actions={actions}
          activeProjectId={activeProjectId}
          searchQuery={searchQuery}
          sortBy={sortBy}
        />

        <main className="flex-1 min-w-0 h-full rounded-3xl bg-bg-base shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden relative flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
