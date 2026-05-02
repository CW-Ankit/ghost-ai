# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Design System & Foundation

## Current Goal

- Implement the design system and UI primitive components (01-design-system.md).

## Completed

- [x] Installed `lucide-react`, `clsx`, `tailwind-merge`.
- [x] Configured `app/globals.css` with technical workspace theme and shadcn variable mappings.
- [x] Initialized `shadcn/ui`.
- [x] Added UI primitive components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea.
- [x] Created `lib/utils.ts` helper.
- [x] Migrated feature specs from Prisma/PostgreSQL to Convex (05-convex.md and others).
- [x] Implemented Editor Chrome: Navbar and Project Sidebar (02-editor-chrome.md).
- [x] Fixed Tailwind CSS v4 build error by mapping shadcn variables to `@theme` colors.

## In Progress

- None.

## Next Up

- 03-project-selection.md

## Open Questions

- None.

## Architecture Decisions

- Switched from Prisma/PostgreSQL to Convex as the backend.
- Using Vercel Blob for large canvas JSON storage, with metadata in Convex.

## Session Notes

- Theme is strict dark-only.
- Components are managed via shadcn CLI.
