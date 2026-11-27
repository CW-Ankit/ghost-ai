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
- [x] Full Codebase Audit, Verification & Bug Fixes:
  - Verified 100% test pass rate across all 3 test files (50/50 unit tests passing in Vitest).
  - Verified strict TypeScript compilation with zero errors across the entire repository (`tsc --noEmit`).
  - Verified Next.js 16 (Turbopack) production build (`next build`) compiling all static pages and dynamic routes with zero errors.
  - Fixed Next.js 16 `proxy.ts` middleware redirect bug blocking unauthenticated Convex background actions from invoking `/api/specs/upload` and ensuring API routes return 401 JSON rather than 307 HTML redirects.
  - Fixed spec download mechanism in `components/editor/ai-sidebar.tsx` to route through `/api/specs/[specId]?url=...` with `Content-Disposition: attachment`, overcoming browser cross-origin download restrictions on remote Vercel Blob URLs.
  - Removed obsolete/dead server file `lib/projects-server.ts`.
  - Cleaned up unused imports in `components/editor/access-denied.tsx` and `components/editor/ai-sidebar.tsx`.
  - Type-safe cleanup of `internal.crons.prunePresence` in `convex/crons.ts`.
  - Aligned `README.md` feature matrix and tech stack to accurately document live implementations.
- [x] Implemented Technical Spec PDF & Print Export:
  - Built `lib/print-spec.ts` generating standalone formatted documents with A4 pagination, header metadata, clean white background, table styling, code formatting, and automatic trigger of native print / Save as PDF dialog.
  - Added "PDF / Print" action in `components/editor/ai-sidebar.tsx` spec preview modal.
  - Added unit test suite in `test/print-spec.test.ts` verifying isolated iframe rendering, style generation, and SSR window safety.
- [x] Implemented Visual Architecture Diffs on Canvas:
  - Implemented `computeArchitectureDiffs` in `lib/ai-helpers.ts` comparing incoming nodes with existing canvas state to tag `added` and `modified` components.
  - Enhanced `CanvasNode` (`components/editor/canvas/nodes/canvas-node.tsx`) with animated status badges (`+ New` in brand cyan glow, `Updated` in AI purple glow) and ring highlight outlines.
  - Integrated in-place Liveblocks CRDT diff tagging with automatic 12-second fade-out via `clearDiffFlags` mutation.
  - Added comprehensive unit tests in `test/ai-helpers.test.ts` verifying diff computation (57 total tests passing).

- [x] Implemented Read-Only Public Architecture Sharing Links & Access Denied Guards:
  - Extended Convex schema (`convex/schema.ts`) with `publicAccess: v.optional(v.union(v.literal('PRIVATE'), v.literal('VIEW_ONLY')))`.
  - Added `setPublicAccess` mutation in `convex/projects.ts` allowing project owners to toggle public sharing.
  - Enhanced `getByRoomId` in `convex/projects.ts` resolving fine-grained `role` (`owner` | `editor` | `viewer`) and `isReadOnly` flags across authenticated members, public viewers, and unauthenticated guests.
  - Enhanced `getCanvasUrl` and `specs` queries (`listByProject`, `getById`) to support public read-only viewers.
  - Updated `lib/project-access.ts` to allow anonymous/guest access checking for public rooms.
  - Updated `/api/liveblocks-auth` to issue `session.allow(roomId, session.READ_ACCESS)` for read-only rooms and `FULL_ACCESS` for editors.
  - Integrated `<AccessDenied />` in `CanvasProvider` and `WorkspaceShell` when projects are missing or inaccessible, preventing unauthorized Liveblocks connections.
  - Built `CanvasContextProvider` (`components/editor/canvas/canvas-context.tsx`) broadcasting `isReadOnly` state to all canvas subcomponents.
  - Updated `ShareDialog` (`components/editor/share-dialog.tsx`) with a dedicated "Public Link Sharing" card, accessible `Switch` toggle (`components/ui/switch.tsx`), permission indicator pills, and copy link action.
  - Adapted `WorkspaceShell`:
    - Shows "View Only" badge in header next to project title.
    - Displays disabled "View Only" indicator in place of Save trigger.
    - Hides "Templates" button to prevent canvas overwrites.
  - Adapted `Canvas`:
    - Disables node dragging, connection creation, drop actions, and keyboard deletion when `isReadOnly`.
    - Hides `ShapePanel` and disables undo/redo controls in `CanvasControlBar`.
    - Disables `useCanvasAutosave` in read-only mode to prevent unnecessary network overhead.
  - Adapted `AISidebar`:
    - Displays prominent read-only notification banner.
    - Disables architecture generation/refinement inputs and starter prompts.
    - Disables spec generation and delete actions while preserving Markdown preview, copy, download, and PDF/print export.
- [x] Real-Time Performance Audit & Optimization for Large Canvas Graphs (100+ Nodes):
  - Memoized `CanvasNode` (`components/editor/canvas/nodes/canvas-node.tsx`) with `React.memo` preventing cascading re-renders across 100+ nodes on single-node movements.
  - Memoized `CanvasEdge` (`components/editor/canvas/edges/canvas-edge.tsx`) with `React.memo`.
  - Memoized `LiveCursors` (`components/editor/canvas/live-cursors.tsx`) with `React.memo` avoiding unnecessary repaints during multi-user collaboration.
  - Configured `onlyRenderVisibleElements={true}` on `ReactFlow` in `components/editor/canvas/canvas.tsx` for dynamic viewport element culling.
  - Configured `minZoom={0.05}` and `maxZoom={2}` for smooth high-scale canvas pan/zoom across complex system diagrams.
  - Added comprehensive test suite in `test/public-access.test.ts` (65 / 65 unit tests passing across 5 test suites).

- [x] Resolved Liveblocks Client Auth Timeout & Convex AI Offline Fallback:
  - **Liveblocks Auth Timeout Elimination**:
    - Replaced blocking remote Clerk `currentUser()` API call in `/api/liveblocks-auth` with zero-network JWT claims decoding via `auth()`.
    - Added 3500ms timeout guard (`Promise.race`) in `lib/project-access.ts` on Convex `getByRoomId` queries to prevent hanging auth requests.
    - Added 1200ms non-blocking fallback race for `currentUser()` only if claims lack display names, completely eliminating the 10-second `AUTH_TIMEOUT` error.
  - **Convex AI Generation Graceful Offline Fallback (`convex/ai.ts`)**:
    - Handled missing `MISTRAL_API_KEY` without unhandled server crashes by synthesizing full-featured, structured architectures based on prompt intent (AI/Agentic, E-Commerce, Streaming/Analytics, Serverless, DevOps, Chat, General Microservices).
    - Added offline refinement support to intelligently add or remove components while preserving existing node coordinates and IDs.
    - Added offline specification generator producing comprehensive technical specification markdown from canvas graph nodes and connections.
    - Updated `/api/specs/upload` and `/api/specs/[specId]` to encode and decode spec markdown as self-contained data URIs (`data:text/markdown;charset=utf-8,...`), guaranteeing instant preview and download in local development when Vercel Blob tokens are absent.
    - Added unit test suite in `test/project-access-and-specs.test.ts` (69 / 69 unit tests passing across 6 test suites).
    - Verified strict TypeScript compilation (0 errors) and successful Next.js 16 (Turbopack) production build.

- [x] Backend Architecture Hardening, REST API Completion & Testing (`feat/backend-architecture-and-testing`):
  - Added missing Convex indexes in `convex/schema.ts` (`favorites.by_projectId`, `presence.by_projectId_and_userId`, `taskRuns.by_projectId_and_type`) to eliminate table scans and `.filter()` queries.
  - Extracted shared Convex access-control, email normalization, and cascade-deletion helpers in `convex/lib/access.ts`.
  - Enforced authentication and project membership checks across `convex/ai.ts` (`generateDesign`, `generateSpec`), `convex/taskRuns.ts` (`getTaskRun`, `getLatestTaskRun`, `getTaskRunsByProject`), `convex/projects.ts` (`getCollaborators`, `togglePin`, `bulkDelete` cascade delete), and `convex/presence.ts` (`setPresence`, `getActiveProjects`).
  - Normalized AI-generated edge handles in `convex/ai.ts` to match `CanvasNode` handle IDs (`*-source` / `*-target`) and forwarded `x-internal-secret` for `/api/specs/upload`.
  - Created `lib/api-auth.ts` with standardized Clerk/Convex auth resolution, JSON body parsing, SSRF-safe artifact URL validation, and HTTP status error mapping (`400`/`401`/`403`/`404`/`409`).
  - Completed and secured REST API routes in `app/api/`:
    - `GET /api/health`
    - `GET/POST /api/projects` and `GET/PATCH/DELETE /api/projects/[projectId]`
    - `GET/POST/DELETE /api/projects/[projectId]/collaborators` (batched Clerk user lookup)
    - `GET/POST /api/canvas/save` (write-access check + JSON rehydration)
    - `POST /api/ai/design`, `POST /api/ai/spec`, `GET /api/task-runs/[taskRunId]`
    - `GET /api/projects/[projectId]/specs` and `GET /api/projects/[projectId]/specs/[specId]/download`
    - `POST /api/specs/upload` and `GET/DELETE /api/specs/[specId]` (SSRF guard)
  - Added `convex/backend.test.ts` (`convex-test`), `test/api-routes.test.ts`, live runner `scripts/test-backend.mjs` (`pnpm test:api`), and Postman collection/environment in `postman/`.
- [x] Wired Optional Clerk Organizations into Backend (`convex/` & `app/api/`):
  - Added optional `orgId` field and `by_orgId` index to `projects` in `convex/schema.ts`.
  - Added `extractOrgContext` (supporting `org_id`/`org_role`, `orgId`/`orgRole`, and Clerk v2 compact `o.id`/`o.rol` claims) and `canManageProject` in `convex/lib/access.ts`.
  - Updated `resolveProjectAccess` and `requireProjectOwner` so personal projects remain scoped to `ownerId` + email collaborators while organization projects grant org members `editor` access and creator / `org:admin` management permissions.
  - Scoped `projects.list` and `projects.create` by active Clerk organization (`orgId`) vs personal profile (`null`), and updated `bulkUpdateStatus`, `bulkDelete`, and `specs.remove` to support organization admins.
  - Exposed `orgId` and `orgRole` in `lib/api-auth.ts` and `POST /api/projects`, aligned server token resolution (`resolveConvexToken` across `lib/api-auth.ts`, `lib/project-access.ts`, and `/api/liveblocks-auth`) with Clerk's native Convex integration (`sessionClaims.aud === 'convex'`), and added unit/Convex tests for personal vs organization isolation and role boundaries.

## Current Phase

- Phase 2: AI Workflows & Artifact Generation

## Current Goal

- Next feature implementation: Advanced Canvas Export (PNG / SVG diagram export) and Interactive Canvas enhancements.

## In Progress

- UI & Landing Page Overhaul:
  - [x] Step 1: Added public `/` landing page placeholder with centered `Ghost AI` heading (`app/page.tsx`) and whitelisted `/` in `proxy.ts`.
  - [x] Step 2: Downloaded `GoogleSansFlex-Variable.woff2` into `app/fonts/` and configured `next/font/local` across `app/layout.tsx` and `app/globals.css`.
  - [x] Step 3 & 4: Configure React Bits registry (`@react-bits`) in `components.json` / shadcn MCP and install needed animated components.
  - [x] Step 5: Align Clerk UI layout and styling with app design system.
  - [x] Step 6: Integrated React Bits `PillNav` (`components/pill-nav.tsx`) and `LandingNav` (`components/landing/landing-nav.tsx`) centered at the bottom of `/` with section links (`Overview` → `#overview`, `Canvas` → `#canvas`, `Specs` → `#specs`, `Pricing` → `#pricing`) and an auth-aware separate CTA button.
  - [x] Step 7: Integrated React Bits `GhostFibers` (`components/ghost-fibers.tsx`) and `HeroBackground` (`components/landing/hero-background.tsx`) as the interactive WebGL hero background on `/` with brand color tokens and pause control.
  - [x] Step 8: Added global `CustomCursor` (`components/custom-cursor.tsx`, `app/globals.css`, `app/layout.tsx`) matching `ankitsahu.indevs.in` across the entire app.
  - [x] Step 9: Integrated React Bits `PixelCard` (`components/pixel-card.tsx`) and built a clean Bento Features Showcase (`components/landing/features-bento.tsx`) with 3D beveled Lucide icon sockets, ambient blur-gradient asset slots, and scrollspy navigation (`#hero`, `#canvas`, `#specs`).
  - [x] Step 10: Updated Bento & Pricing sections (`components/landing/features-bento.tsx`, `components/landing/pricing-section.tsx`, `components/pixel-card.tsx`) with 3D specular surfaces, raised 3D icon sockets (`Sparkles`, `Rocket`, `Users`), 3D tactile CTA buttons, tighter copywriting, and zero unsolicited pills.
  - [x] Step 11: Fixed `LandingNav` active-dot scroll-spy (replaced `-45%` midpoint `IntersectionObserver` with deterministic viewport scroll-spy + smooth-scroll click lock, plus `scroll-mt-8` on section targets), integrated the `Get Started` / `Open Studio` CTA directly inside `PillNav` (`action` slot with synchronized intro animation and exact `44px` vertical alignment), and merged `feat/ui-foundation-and-clerk` into `feat/backend-architecture-and-testing`.
  - [x] Step 12: Replaced `CustomCursor` (`components/custom-cursor.tsx`) with the provided component implementation and removed the duplicate `.custom-cursor` / `.has-custom-cursor` styles from `app/globals.css`.
  - [x] Step 13: Added `BuiltWithMarquee` (`components/landing/built-with-marquee.tsx`) above `PricingSection` on `/` using the 9 SVG logos in `public/logos/` with zero headings/text, edge-fade `mask-image`, compositor `translate3d` loop, hover pause, and `prefers-reduced-motion: no-preference` opt-in.
  - [x] Step 14: Created `EditorButton` (`components/editor/editor-button.tsx`) and updated all `/editor` controls (`editor-home`, `editor-navbar`, `project-dashboard`, `project-sidebar`, `project-dialogs`, `share-dialog`, `workspace-shell`, `starter-templates-modal`, `ai-sidebar`, `shape-panel`, `canvas-control-bar`, `access-denied`) to the 3D specular tactile button styling from the landing page.
  - [x] Step 15: Redesigned `/editor` and `/editor/[roomId]` workspace shell (`components/editor/editor-shell.tsx`, `project-sidebar.tsx`, `editor-layout.tsx`, `workspace-shell.tsx`) with a deep dark cyan-navy outer frame (`--bg-shell`, `--bg-shell-deep`), rounded `rounded-3xl` main work box, page-adaptive upper quick-action bar (hamburger toggle, location breadcrumb, centered search / `Ctrl+K` quick project switcher, contextual actions, AI sidebar switch, and Clerk `UserButton`), and smooth-animating left sidebar housing Clerk `<OrganizationSwitcher />` at the top and projects at the bottom.
  - [x] Step 16: Fixed sidebar Projects vertical fill and refreshed app-wide UI copywriting across landing, auth, empty states, loading states, dialogs, error screens, and `AISidebar` in a warm, human, Discord-inspired voice.
  - [x] Step 17: Toned down excessive cyan/blue usage across `--bg-shell`, `EditorButton`, sidebar, and dashboard cards using deeper navy-slate and muted teal shades, removed unnecessary borders on search/view/sort/org containers, and replaced the native HTML `<select>` sort dropdown in `EditorLayout` with a custom `@base-ui/react/select` floating menu.
  - [x] Step 18: Added global UI select protection (`user-select: none` on `body`, preserving `user-select: text` on inputs, textareas, code, and `[data-selectable="true"]` spec previews) and built the Cosmos-style frontend search engine & anchored popover (`lib/search-engine.ts`, `components/editor/search-command-bar.tsx`) with multi-field fuzzy/typo scoring, inline operators (`status:`, `color:`, `shape:`, `tag:`, `#`), layer color swatches, visual quick cards, in-canvas node jump (`fitView`), starter blueprint search, Raycast-style quick actions, and unit tests in `test/search-engine.test.ts`.
  - [x] Step 19: Recreated all Clerk UI components (`GhostUserButton`, `GhostAccountDialog`, `GhostOrgSwitcher`, `GhostCreateOrgDialog`, `GhostOrgProfileDialog`, `GhostSignIn`, `GhostSignUp` in `components/clerk/`) using Clerk v7 headless hooks (`useSignIn`, `useSignUp`, `useUser`, `useOrganization`, `useOrganizationList`, `useClerk`, `HandleSSOCallback`) and wired them into `app/sign-in`, `app/sign-up`, `EditorShell`, `PresenceAvatars`, and `ProjectSidebar` to match Ghost AI's dark navy-slate and muted teal 3D design system.
  - [x] Step 20: Unified all pop-up menus, dropdowns, and dialogs (`components/editor/anchored-popup.tsx`, `components/ui/dialog.tsx`, `GhostUserButton`, `GhostOrgSwitcher`, `SearchCommandBar`, `EditorLayout` sort menu, `ProjectDashboard` card menu, `ProjectSidebar` row menu, `ProjectDialogsComponent`, `ShareDialog`, `StarterTemplatesModal`, `AISidebar` spec preview, `NodeColorToolbar`) with consistent `#0e141c/95` surface styling, viewport-clamped `createPortal` positioning (preventing clipping inside `overflow-hidden` cards/sidebars), and fixed `sm:max-w-sm` width clamping so modal layouts expand to their intended widths cleanly.
  - [x] Step 21: Refined `/sign-in` and `/sign-up` (`components/auth/auth-layout.tsx`, `components/clerk/ghost-clerk-shared.tsx`, `components/clerk/ghost-auth-forms.tsx`) by removing side info panels and card subtitles, fixing the Google OAuth icon colors, making one-time code option minimal without icons, splitting Sign-In into Email/Username -> Password or One-Time Code, splitting Sign-Up into Email -> Password + Confirm Password with live strength meter -> Username & Name, and adding Last Used authentication strategy detection.
  - [x] Step 22: Redesigned the main projects space (`components/editor/project-dashboard.tsx`, `components/editor/project-dashboard/canvas-preview.tsx`) to match the `#0e141c` dark-navy and muted teal 3D UI with a workspace header, 3D segmented tab switcher, miniature board banners in `ProjectCard`, unified `ProjectListView`, active `sortBy` support, loading skeletons, and tailored empty/filter states.

## Next Up

- Interactive multi-user end-to-end verification.
- Advanced export options (PNG/SVG canvas export alongside Markdown/PDF specs).

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
