# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Design System & Foundation

## Current Goal

- Implement AI prompt-to-graph background workflows and spec generator integration.

## Completed

- [x] Implemented Canvas Autosave & State Recovery with Vercel Blob & Convex (21-canvas-autosave.md):
  - Installed `@vercel/blob` for artifact storage.
  - Implemented `saveCanvas` mutation and `getCanvasUrl` query in `convex/projects.ts` with strict project membership authorization checks.
  - Created Next.js API route `/api/canvas/save` handling authenticated serialization and upload of canvas JSON to Vercel Blob (`canvas/{projectId}.json`).
  - Created `useCanvasAutosave` hook (`hooks/use-canvas-autosave.ts`) with debounced auto-sync (2.5s) and structural fingerprint change detection.
  - Implemented state rehydration on editor mount if the Liveblocks room is empty (0 nodes and 0 edges), avoiding overwrites when active collaboration exists.
  - Built `SaveProvider` context (`components/editor/canvas/save-context.tsx`) and `SaveStatusIndicator` in `WorkspaceShell` showing saving, saved, unsaved, and error states with manual save support.
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

- [x] Implemented AI Architecture Generation & Spec Generation Pipelines (Phase 2 & 3):
  - Added `@google/genai` (Google Gemini 2.5 Flash) and `react-markdown` dependencies.
  - Extended Convex schema with `taskRuns` table (for tracking durable AI workflows and real-time statuses) and `specs` table (with `by_projectId` index).
  - Strongly typed `canvasSnapshot` in Convex schema replacing loose `v.any()`.
  - Created `convex/ai.ts` background action module running in Node.js runtime:
    - `generateDesign`: Prompt-to-graph synthesis validating output against canvas shapes, colors, and coordinates, saving durable task runs.
    - `generateSpec`: Canvas graph synthesis into detailed Markdown technical specification documents with executive overview, component analysis, data flows, infrastructure, and security sections.
  - Created `convex/taskRuns.ts` containing internal mutations and reactive queries (`getTaskRun`, `getLatestTaskRun`, `getTaskRunsByProject`).
  - Created `convex/specs.ts` containing queries and mutations (`listByProject`, `getById`, `remove`) with strict project authorization checks.
  - Implemented `/api/specs/upload` API route persisting Markdown specs to Vercel Blob at `specs/{projectId}/{specId}.md` with development fallback.
  - Implemented `/api/specs/[specId]` route for authenticated spec streaming and download.
  - Rewrote `AISidebar` (`components/editor/ai-sidebar.tsx`) to directly drive real AI actions:
    - Wired `AI Architect` tab to `api.ai.generateDesign` with live user/assistant messages, loading states, error handling, and Liveblocks CRDT mapping (`applyGeneratedArchitecture`) plus `fitView()`.
    - Wired `Specs` tab to `api.ai.generateSpec` with dynamic node count check, reactive spec listing, Markdown preview dialog with syntax styling, copy to clipboard, direct download, and delete.
  - Passed `projectId` from `WorkspaceShell` to `AISidebar`.
  - Fixed cascade deletion in `projects.remove` mutation to cleanly purge collaborators, favorites, presence, task runs, and specs.
  - Fixed deduplication of owned vs shared projects in `projects.list`.
  - Fixed `ConvexHttpClient` per-request auth pattern in `app/api/projects/[projectId]/collaborators/route.ts`.
  - Removed unused import in `app/editor/page.tsx` and updated docs (`code-standards.md`, `architecture-context.md`).

- [x] Migrated AI Backend to Mistral AI:
  - Replaced `@google/genai` with `@mistralai/mistralai`.
  - Updated `convex/ai.ts` to use Mistral SDK with `mistral-small-latest` (using JSON mode for graph generation) and `mistral-large-latest` (for technical spec drafting).
  - Updated `MISTRAL_API_KEY` configuration and UI error hints in `components/editor/ai-sidebar.tsx`.
  - Updated architecture context documentation.

- [x] Multi-Turn AI Architecture Refinement on Existing Canvas Graphs:
  - Extended `convex/ai.ts` `generateDesign` action with `currentNodes`, `currentEdges`, and `history` arguments.
  - Implemented `REFINEMENT_SYSTEM_PROMPT` tailored for modifying, extending, or refactoring existing canvas graphs while preserving unchanged component IDs, shapes, colors, and coordinates.
  - Built `lib/ai-helpers.ts` utilities: `formatCurrentGraphForPrompt`, `formatConversationHistory`, and `transformAiGraphToCanvas` with `summary` delta reporting.
  - Upgraded `AISidebar` with in-place Liveblocks CRDT reconciliation (patching existing `LiveObject`s by ID instead of clearing maps), preserving live collaborator selection and cursors.
  - Enhanced AI sidebar chat UI with contextual indicators, `REFINEMENT_PROMPTS` suggestions on active canvases, and "Refined Graph" message badges.
  - Added comprehensive unit test suites in `test/ai-helpers.test.ts` (50 total unit tests across starter templates, canvas autosave, and AI generation pipeline).

## Current Phase

- Phase 2: AI Workflows & Artifact Generation

## Current Goal

- Multi-turn AI refinement complete and verified. Moving to end-to-end polish of spec exports and collaboration workflows.

## In Progress

- None.

## Next Up

- Technical Spec download and sharing polish (direct PDF/Markdown export options).
- Real-time performance audit and subscription optimizations for large canvas graphs.

## Open Questions

- None.

## Architecture Decisions

- Switched from Prisma/PostgreSQL to Convex as the backend.
- Using Convex actions (with Node runtime) for AI generation workflows instead of external Trigger.dev.
- Using Mistral AI (`mistral-small-latest` for fast JSON graph generation, `mistral-large-latest` for technical spec writing).
- Using Vercel Blob for large canvas JSON and Markdown spec storage, with metadata in Convex.
- Track postmortems, bugs, and edge-case lessons in `context/lessons-learned.md`.

## Session Notes

- Theme is strict dark-only.
- Components are managed via shadcn CLI.
- **Critical**: Avoid running recursive terminal commands (e.g., `grep -r`, `find .`) that may timeout or take excessively long. Use targeted commands on specific directories or files first.
