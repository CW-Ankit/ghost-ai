# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Design System & Foundation

## Current Goal

- Implement live presence avatars and multi-user cursors (19-presence-avatars-cursors.md).

## Completed

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

- 19-presence-avatars-cursors.md (Live presence avatars and multi-user cursors)

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
