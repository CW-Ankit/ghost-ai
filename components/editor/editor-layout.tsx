'use client'

import React, { useMemo, useState } from 'react'
import { Select } from '@base-ui/react/select'
import { ArrowUpDown, Check, ChevronDown, Grid3X3, List, Plus } from 'lucide-react'
import { EditorButton, editorButtonClass } from '@/components/editor/editor-button'
import { EditorShell } from '@/components/editor/editor-shell'
import { ProjectDashboard } from '@/components/editor/project-dashboard'
import { ProjectDialogsComponent } from '@/components/editor/project-dialogs'
import { SearchCommandBar } from '@/components/editor/search-command-bar'
import { Logo } from '@/components/ui/logo'
import type { QuickActionItem } from '@/lib/search-engine'
import { useProjectActions } from '../../hooks/use-project-actions'

type SortOption = 'recent' | 'oldest' | 'name-asc' | 'name-desc'

const SORT_ITEMS: Array<{ value: SortOption; label: string }> = [
  { value: 'recent', label: 'Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name-asc', label: 'A–Z' },
  { value: 'name-desc', label: 'Z–A' },
]

export function EditorLayout() {
  const projectActions = useProjectActions()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'new-project',
        label: 'Start a New Blueprint',
        description: 'Create a fresh architecture canvas',
        keywords: ['create', 'new', 'project', 'blueprint'],
      },
      {
        id: 'view-grid',
        label: 'Switch to Grid View',
        description: 'Browse projects as visual cards',
        keywords: ['grid', 'cards', 'layout'],
      },
      {
        id: 'view-list',
        label: 'Switch to List View',
        description: 'Browse projects as a compact table',
        keywords: ['list', 'table', 'rows'],
      },
    ],
    []
  )

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'new-project') projectActions.openCreateDialog()
    if (actionId === 'view-grid') setViewMode('grid')
    if (actionId === 'view-list') setViewMode('list')
  }

  return (
    <EditorShell
      defaultDesktopSidebarOpen={true}
      actions={projectActions}
      searchQuery={searchQuery}
      sortBy={sortBy}
      locationSlot={
        <div className="flex items-center gap-2 min-w-0">
          <Logo className="text-[#7ecbd4] shrink-0" size={20} />
          <span className="text-sm font-semibold font-heading text-text-primary truncate">
            Projects
          </span>
        </div>
      }
      searchSlot={
        <SearchCommandBar
          value={searchQuery}
          onValueChange={setSearchQuery}
          quickActions={quickActions}
          onRunQuickAction={handleQuickAction}
          onSelectTemplate={() => projectActions.openCreateDialog()}
          placeholder="Hunt down a project, layer, or blueprint..."
        />
      }
      actionsSlot={
        <div className="flex items-center gap-2">
          <div className="hidden md:flex bg-black/25 p-1 rounded-xl gap-1">
            <EditorButton
              tone={viewMode === 'grid' ? 'surface' : 'ghost3d'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </EditorButton>
            <EditorButton
              tone={viewMode === 'list' ? 'surface' : 'ghost3d'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </EditorButton>
          </div>

          <div className="hidden sm:block">
            <Select.Root
              items={SORT_ITEMS}
              value={sortBy}
              onValueChange={(value) => {
                if (value) setSortBy(value)
              }}
            >
              <Select.Trigger
                aria-label="Sort projects"
                className={editorButtonClass({
                  tone: 'surface',
                  size: 'sm',
                  className: 'px-2.5 text-xs text-text-secondary hover:text-text-primary gap-1.5',
                })}
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-text-muted" />
                <Select.Value />
                <Select.Icon className="text-text-muted">
                  <ChevronDown className="h-3.5 w-3.5" />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Positioner sideOffset={8} align="end" className="z-[70]">
                  <Select.Popup className="min-w-[168px] rounded-2xl bg-[#0e141c]/95 backdrop-blur-2xl border border-white/[0.08] p-1.5 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition-[opacity,transform] duration-150 data-[starting-style]:opacity-0 data-[starting-style]:-translate-y-1 data-[ending-style]:opacity-0 data-[ending-style]:-translate-y-1">
                    <Select.List className="flex flex-col gap-0.5">
                      {SORT_ITEMS.map((item) => (
                        <Select.Item
                          key={item.value}
                          value={item.value}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs text-text-secondary cursor-pointer select-none outline-none transition-colors data-[highlighted]:bg-white/[0.08] data-[highlighted]:text-text-primary data-[selected]:text-text-primary data-[selected]:font-medium"
                        >
                          <Select.ItemText>{item.label}</Select.ItemText>
                          <Select.ItemIndicator>
                            <Check className="h-3.5 w-3.5 text-[#7ecbd4]" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>

          <EditorButton
            tone="primary"
            size="sm"
            onClick={projectActions.openCreateDialog}
            className="px-3 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Project</span>
          </EditorButton>
        </div>
      }
    >
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
      <ProjectDialogsComponent state={projectActions} />
    </EditorShell>
  )
}
