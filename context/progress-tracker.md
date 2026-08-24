# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Design System & Foundation

## Current Goal

- Implement AI prompt-to-graph background workflows and spec generator integration.

## Completed

- [x] Implemented AI Workspace Sidebar Shell (20-ai-sidebar-shell.md):
  - Extracted AI workspace sidebar into dedicated `AISidebar` component (`components/editor/ai-sidebar.tsx`).
  - Preserved floating slide-over drawer layout with smooth transition, backdrop blur, and dark technical workspace styling.
  - Built header with Bot icon badge, `AI Workspace` title, subtitle, and close action.
  - Integrated shadcn `Tabs` with `AI Architect` and `Specs` views.
  - Implemented `AI Architect` tab featuring:
    - Empty state with bot icon, description, and 3 starter prompt pills (`Design an e-commerce backend`, `Create a chat app architecture`, `Build a CI/CD pipeline`).
    - Right-aligned user bubbles (`bg-accent-primary-dim border-accent-primary/40`) and left-aligned assistant bubbles (`bg-bg-elevated border-border-default`).
    - Auto-resizing textarea (`72px` min to `160px` max), `Enter` submission, and `Shift+Enter` multi-line editing.
    - Interactive mock responses to verify live message appending and scrolling.
  - Implemented `Specs` tab featuring:
    - `Generate Spec` action button with animated loading state.
    - Structured Markdown preview spec card with metadata badges.
    - Disabled download action ready for backend binding.
  - Integrated `AISidebar` in `WorkspaceShell` with top navbar toggle and clean open/close state.
- [x] Implemented Live Presence Avatars and Multi-User Cursors (19-presence-avatars-cursors.md):
  - Configured shared `Presence` and `UserMeta` types and registered global `Liveblocks` interface in `liveblocks.config.ts`.
  - Updated `RoomProvider` initial presence to `{ cursor: null, thinking: false }`.
  - Built `PresenceAvatars` component in `components/editor/canvas/presence-avatars.tsx` rendering up to 5 collaborator avatars in an overlapping stack with profile pictures or initials, `+N` overflow chip, subtle ring styling, dynamic divider, and Clerk `UserButton` for the active user.
  - Built `LiveCursors` component in `components/editor/canvas/live-cursors.tsx` rendering colored SVG pointers and name badges for all active collaborators, mapped from canvas flow coordinates via `useViewport()`.
  - Integrated `onMouseMove` and `onMouseLeave` in `components/editor/canvas/canvas.tsx` broadcasting cursor coordinates via `useUpdateMyPresence()`.
  - Preserved existing editor home navbar without global modification.
- [x] Implemented Starter System Design Templates Library (18-starter-templates.md):
  - Created `components/editor/starter-templates.ts` defining `CanvasTemplate` and 4 curated architecture blueprints (Microservices E-Commerce, Event-Driven Analytics, Serverless Web App, CI/CD Pipeline) using valid shapes, colors, handles, and arrowheads.
  - Built `StarterTemplatesModal` with responsive SVG diagram previews, search and category filtering, and confirmation prompt before canvas overwrite.
  - Integrated template loader with Liveblocks CRDT storage (`useMutation`) and ReactFlow `fitView()`.
  - Added "Templates" button to the top editor navbar in `WorkspaceShell.tsx`.
- [x] Implemented Canvas Ergonomics (17-canvas-ergonomics.md.md):
  - Created `useKeyboardShortcuts` hook handling zoom (`+`, `-`) and history (`Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`, `Cmd/Ctrl+Y`) with editable element guard.
  - Added bottom-left floating `CanvasControlBar` with animated zoom in/out/fit view and Liveblocks history undo/redo buttons.
  - Dynamically disabled and visually dimmed history buttons when `!canUndo` / `!canRedo`.
- [x] Implemented advanced edge behavior and custom rendering (16-edge-behavior.md):
  - Added handles on all four sides of nodes with hover fade-in.
  - Created custom `CanvasEdge` with right-angle routing and arrowhead.
  - Implemented inline label editing with `EdgeLabelRenderer`.
  - Added visual pill badges for labels and faint hints for unlabeled edges.
  - Updated collaborative data flow and Convex snapshot to include edge and node labels.
- [x] Implemented Node Color Toolbar (15-node-color-toolbar.md):
  - Added floating color toolbar for selected nodes.
  - Implemented predefined background/text color pairs.
  - Ensured seamless sync with collaborative canvas state.
- [x] Fixed runtime crash in `CanvasInner` due to null nodes/edges.
- [x] Addressed Code Review Findings & Feature Inconsistencies:
  - Fixed security vulnerability in `updateSnapshot` mutation by adding project membership verification.
  - Fixed potential race condition in `WorkspaceShell` presence cleanup.
  - Standardized error reporting in `useProjectActions` to use `toast.error` instead of `alert`.
  - Fixed `getToken({ template: "convex" })` in `lib/project-access.ts` ensuring authenticated Liveblocks room checks.
  - Secured `CanvasProvider` by replacing `publicApiKey` with `authEndpoint="/api/liveblocks-auth"`.
  - Added `.index("by_roomId", ["roomId"])` in `convex/schema.ts` and optimized `getByRoomId` query.
  - Added distinct handle IDs (`id="top-target"`, etc.) across all 4 sides of `CanvasNode`.
  - Attached default arrowhead `MarkerType.ArrowClosed` on edge creation in `canvas.tsx`.
  - Rendered interactive tag filter chips in `ProjectDashboard`.

## In Progress

- None.

## Next Up

- AI Background Workflows (Trigger.dev integration & canvas node generation)

## Open Questions

- None.

## Architecture Decisions

- Switched from Prisma/PostgreSQL to Convex as the backend.
- Using Vercel Blob for large canvas JSON storage, with metadata in Convex.
- Track postmortems, bugs, and edge-case lessons in `context/lessons-learned.md`.

## Session Notes

- Theme is strict dark-only.
- Components are managed via shadcn CLI.
- **Critical**: Avoid running recursive terminal commands (e.g., `grep -r`, `find .`) that may timeout or take excessively long. Use targeted commands on specific directories or files first.
