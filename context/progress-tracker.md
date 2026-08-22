# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Design System & Foundation

## Current Goal

- Implement advanced edge behavior and custom rendering (16-edge-behavior.md).

## Completed

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
- [x] Addressed Code Review Findings:
  - Fixed security vulnerability in `updateSnapshot` mutation by adding project membership verification.
  - Fixed potential race condition in `WorkspaceShell` presence cleanup.
  - Standardized error reporting in `useProjectActions` to use `toast.error` instead of `alert`.




## In Progress

- Implementing advanced project dashboard and visual insights (05-better-dashboard.md).
  - [x] Search bar and real-time filtering.
  - [x] "Last Modified" and "Node Count" metadata in cards.
  - [x] "Recent Projects" quick-access rail.
  - [x] Grid vs List view toggle.
  - [x] Visual Canvas snapshots (Phase 3).
  - [x] Bulk administrative actions (Archive/Delete).
  - [x] Tag-based organization and filtering.
  - [x] Interactive hover previews for snapshots.


## Next Up

- 17-canvas-ergonomics.md.md (Floating canvas control bar and keyboard shortcuts)
- 18-starter-templates.md (Prebuilt system design templates library)

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
