'use client'

import React from 'react'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ArrowUpDown,
  Grid3X3,
  List,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserButton } from '@clerk/nextjs'
import { Logo } from '@/components/ui/logo'
import { ClientOnly } from '@/components/ui/client-only'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EditorNavbarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  searchQuery?: string
  setSearchQuery?: (val: string) => void
  sortBy?: string
  setSortBy?: (val: any) => void
  viewMode?: 'grid' | 'list'
  setViewMode?: (val: 'grid' | 'list') => void
  onNewProject?: () => void
}

export function EditorNavbar({
  sidebarOpen,
  onToggleSidebar,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  onNewProject,
}: EditorNavbarProps) {
  const isDashboard = searchQuery !== undefined

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 border-b border-border-subtle bg-bg-surface flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          aria-expanded={sidebarOpen}
          className="text-text-secondary hover:text-text-primary hover:bg-bg-subtle"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>

        {isDashboard && (
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold text-text-primary hidden md:block">
              Project Dashboard
            </h1>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                className="pl-9 h-9 bg-bg-subtle border-border-subtle text-text-primary placeholder:text-text-faint focus-visible:ring-accent-primary"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {isDashboard && (
          <div className="flex items-center gap-2">
            <div className="flex bg-bg-subtle p-1 rounded-lg border border-border-subtle">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode?.('grid')}
                className={cn(
                  'h-7 w-7 p-0',
                  viewMode === 'grid' && 'bg-bg-surface text-accent-primary shadow-sm'
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode?.('list')}
                className={cn(
                  'h-7 w-7 p-0',
                  viewMode === 'list' && 'bg-bg-surface text-accent-primary shadow-sm'
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy?.(e.target.value)}
              className="bg-bg-subtle border border-border-subtle text-text-secondary text-xs rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
            >
              <option value="recent" className="bg-bg-surface text-text-primary">
                Recent
              </option>
              <option value="oldest" className="bg-bg-surface text-text-primary">
                Oldest
              </option>
              <option value="name-asc" className="bg-bg-surface text-text-primary">
                A-Z
              </option>
              <option value="name-desc" className="bg-bg-surface text-text-primary">
                Z-A
              </option>
            </select>

            <Button
              onClick={onNewProject}
              className="gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/90 h-9 px-3 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Button>
          </div>
        )}
        <ClientOnly>
          <div className="flex items-center">
            <UserButton />
          </div>
        </ClientOnly>
      </div>
    </nav>
  )
}
