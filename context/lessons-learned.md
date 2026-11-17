# Lessons Learned & Mistakes Log: Ghost AI

This document serves as the project's engineering memory, recording mistakes, bugs, architectural oversights, security findings, and performance traps encountered during development, along with the root causes and preventative patterns.

---

## 1. Architecture & Backend Integration

### 1.1 Request-Response Latency vs. Reactive WebSockets

- **Mistake**: Initially routing project mutations (create, rename, delete) through Next.js API routes (`UI -> Next.js API -> DB -> Response -> UI`) and calling `router.refresh()`.
- **Symptom**: High perceived latency (300-800ms), flickering layouts, and persistent loading spinners during basic CRUD operations.
- **Root Cause**: Next.js App Router route hops created an unnecessary middleman layer for real-time relational data.
- **Solution**: Migrated from API route polling to direct Convex client integration (`useQuery`, `useMutation`), enabling real-time WebSocket subscriptions and optimistic UI updates.

### 1.2 Convex Cloud Auth Environment Variable Isolation

- **Mistake**: Placing `CLERK_FRONTEND_API_URL` solely in `.env.local` and expecting `convex/auth.config.ts` to access it.
- **Symptom**: `ctx.auth.getUserIdentity()` returned `null` in Convex mutations and queries, causing all authenticated mutations to fail silently or throw unauthorized errors.
- **Root Cause**: `.env.local` is read by the Next.js local Node runtime, but Convex executes functions in its own serverless runtime/cloud environment.
- **Solution**: Explicitly set the variable in the Convex backend environment using `npx convex env set CLERK_FRONTEND_API_URL ...`.

### 1.3 Documentation & Dependency Speculation Drift

- **Mistake**: Documenting uninstalled tools (Trigger.dev, Vercel Blob) in `README.md`, `package.json` environment checklists, and architecture docs as if they were active dependencies.
- **Symptom**: Confusion during onboarding and setup when environment keys had no corresponding consumers in code.
- **Solution**: Clearly separate active implementations (`Live`) from roadmap features (`Roadmap / In Progress`) in documentation and feature trackers.

### 1.4 Unhandled Clerk Server-Side JWT Template Fetch Errors

- **Mistake**: Calling `auth().getToken({ template: "convex" })` directly inside server utilities without try/catch handling.
- **Symptom**: Unhandled `ClerkAPIResponseError` crashed Next.js Server Component render when the `"convex"` template wasn't configured in the Clerk dashboard or the session was refreshing.
- **Solution**: Wrapped server token retrieval in a resilient try/catch block with fallback to standard session tokens.

### 1.5 Blocking Server Component Route Fetches on Reactive Workspaces

- **Mistake**: Executing blocking async project permission checks on the server inside `app/editor/[roomId]/page.tsx` before rendering `WorkspaceShell`.
- **Symptom**: Noticeable route switching latency (800ms+ delay) and layout tearing when clicking between projects in the sidebar.
- **Solution**: Streamed `WorkspaceShell` immediately from the server, delegating project synchronization to Convex's real-time WebSocket client (`useQuery`) with client-side caching and instant prefetching (`next/link`).

---

## 2. Security & Authorization

### 2.1 Unprotected Snapshot Mutation (`updateSnapshot`)

- **Mistake**: `updateSnapshot` mutation accepted a `projectId` and `snapshot` payload without validating whether the caller was the project owner or an authorized collaborator.
- **Symptom**: Vulnerability where any authenticated user with a valid project ID could overwrite another user's canvas state.
- **Root Cause**: Assuming that possessing the room ID was sufficient proof of authorization.
- **Solution**: Added strict project membership verification in Convex functions:
  ```ts
  const hasAccess =
    project.ownerId === identity.subject || project.collaborators?.includes(identity.subject)
  if (!hasAccess) throw new Error('Unauthorized to modify project snapshot')
  ```

### 2.2 Liveblocks Room Token Issuance Without Membership Validation

- **Mistake**: The `/api/liveblocks-auth` route initialized user room sessions based purely on Clerk authentication without querying project membership.
- **Symptom**: Any logged-in user could connect to any Liveblocks room ID and read/write real-time canvas events.
- **Solution**: Integrated Convex HTTP client checks inside `/api/liveblocks-auth` to ensure `userId` is either the project owner or a registered collaborator before calling `liveblocks.identifyUser()`.

### 2.3 Liveblocks Auth Protocol Payload Format (`room` vs `roomId`)

- **Mistake**: Expecting the Liveblocks client to send `{ roomId: "..." }` in `/api/liveblocks-auth` POST requests, and returning `NextResponse.json({ token: result.body })`.
- **Symptom**: Liveblocks client logged `Unauthorized: Room ID is required (400 returned by POST /api/liveblocks-auth)` and `Connection to websocket server closed`.
- **Root Cause**: The official `@liveblocks/client` protocol sends `{ room: string }` (named `room`, not `roomId`). Additionally, `session.authorize()` returns a pre-serialized JSON string in `body`, so wrapping it with `NextResponse.json({ token })` double-encoded the JSON token string.
- **Solution**: Extracted `body.room || body.roomId || searchParams.get("room")` and returned `new Response(authBody, { status })` directly.

---

## 3. Real-Time Canvas & React Flow Integration

### 3.1 Unhandled Null State on Canvas Mount

- **Mistake**: Accessing `nodes.length` or mapping over `nodes` immediately upon `CanvasInner` mounting.
- **Symptom**: App crashed with runtime error `TypeError: Cannot read properties of null (reading 'length')`.
- **Root Cause**: `useLiveblocksFlow()` returns `null`/`undefined` for `nodes` and `edges` while the Liveblocks room is in the connecting/hydrating phase.
- **Solution**: Added explicit null guards and fallback skeleton loading states before rendering React Flow components.

### 3.2 Screen Coordinate vs. Canvas Flow Coordinate Misalignment

- **Mistake**: Using raw browser event coordinates (`event.clientX`, `event.clientY`) when dropping shapes onto the canvas.
- **Symptom**: Dropped nodes appeared far away from the user cursor, especially when the canvas was panned or zoomed.
- **Root Cause**: React Flow uses a transformed SVG/HTML coordinate space that differs from DOM viewport pixels.
- **Solution**: Converted mouse coordinates using React Flow's `screenToFlowPosition({ x: event.clientX, y: event.clientY })`.

### 3.3 Missing Edge Handle Identifiers

- **Mistake**: Rendering multiple `Handle` components (top, bottom, left, right) on `CanvasNode` without distinct `id` attributes.
- **Symptom**: Connecting edges always snapped to the default handle, causing strange orthogonal routing and overlapping lines.
- **Solution**: Provided unique handle IDs (`id="top"`, `id="bottom"`, etc.) alongside explicit `Position` constants (`Position.Top`, `Position.Bottom`).

### 3.4 Mutation Storms During Node Dragging

- **Mistake**: Syncing snapshot state to Convex on every continuous `onNodesChange` event.
- **Symptom**: Hundreds of database write mutations per second, overwhelming the Convex client and causing OCC (Optimistic Concurrency Control) conflicts.
- **Solution**: Implemented a 5-second debounce window with `clearTimeout` on unmount to persist snapshots only after user interaction settles.

### 3.5 Liveblocks Global Interface & Canvas Cursor Coordinate Projection

- **Mistake**: Broadcasting raw screen mouse coordinates across collaborators or defining unconstrained `Storage` in `declare global { interface Liveblocks }`.
- **Symptom**: Cursors appeared in wrong positions when users panned or zoomed independently; TypeScript build failed with `RoomProvider` demanding mandatory `initialStorage` matching raw TypeScript interfaces.
- **Root Cause**: Collaborators view the canvas with independent viewport pan (`x`, `y`) and `zoom` factors. Additionally, `@liveblocks/react` requires LSON-compatible `initialStorage` when `Storage` is declared globally on `Liveblocks`.
- **Solution**: Broadcast cursor coordinates in React Flow space via `screenToFlowPosition({ x: clientX, y: clientY })`, and project other users' cursors onto the screen using `useViewport()` (`flowX * zoom + viewportX`, `flowY * zoom + viewportY`). Typed `Presence` and `UserMeta` on global `Liveblocks` interface.

---

## 4. State Management & Lifecycle

### 4.1 Presence Cleanup Race Conditions on Unmount

- **Mistake**: Relying solely on `useEffect` cleanup in `WorkspaceShell` to remove user presence from the database on page exit.
- **Symptom**: If the user closed the browser tab abruptly, closed their laptop, or navigated rapidly, their presence avatar remained "stuck" indefinitely.
- **Root Cause**: Unmount hooks are not guaranteed to finish asynchronous network calls when a tab is terminated.
- **Solution**: Implemented a two-pronged strategy:
  1. Best-effort client cleanup on unmount.
  2. Scheduled Convex cron job (`convex/crons.ts`) to automatically prune stale presence records older than 30 seconds.

### 4.2 Inconsistent Error Handling (`alert()` vs. Toast Notifications)

- **Mistake**: Using native browser `alert()` in `useProjectActions` for failed project deletions or renames.
- **Symptom**: Harsh, blocking modal popups that froze user interaction and broke the design system aesthetic.
- **Solution**: Replaced all native dialogs with `sonner` toast notifications (`toast.error(...)`, `toast.success(...)`).

### 4.3 React Hook Order Invariants & Early Returns

- **Mistake**: Placing an early return (`if (!nodes || !edges) return <Loading />`) in `CanvasInner` above `useEffect` and `useCallback` hook declarations.
- **Symptom**: Runtime console crash: `React has detected a change in the order of Hooks called by CanvasInner. This will lead to bugs and errors if not fixed`.
- **Root Cause**: On the initial render when nodes/edges were hydrating, the component exited early without registering subsequent hooks; on the next render when data arrived, React encountered new hooks in an unexpected position, violating the Rules of Hooks.
- **Solution**: Positioned all hook definitions (`useEffect`, `useCallback`, `useMemo`, `useMutation`) unconditionally at the top of the component before any conditional early returns.

---

## 5. Development Tools & Workspace Traps

### 5.1 Unbounded Recursive Terminal Commands

- **Mistake**: Running unconstrained terminal commands such as `grep -r "..." .` or `find .` across the workspace.
- **Symptom**: Commands hung indefinitely traversing massive `node_modules/`, `.next/`, and generated directories, locking agent execution.
- **Root Cause**: Windows PowerShell and CLI tools scanning deeply nested dependency folders.
- **Solution**: Mandated scoped searches with exclusions or targeted search tools (`grep_search` with glob filters, `find_by_name`).

---

## 6. Build, Package Management & Frontend Lifecycle

### 6.1 Remote Font Fetch Failures in Next.js Turbopack (`next/font/google`)

- **Mistake**: Using `next/font/google` to fetch Google Fonts (`Geist`, `Geist_Mono`) dynamically during production builds (`next build`).
- **Symptom**: Build aborted with `Turbopack build failed: Failed to fetch Geist from Google Fonts. Error while requesting https://fonts.googleapis.com/...`.
- **Root Cause**: Next.js requires active remote network connections to Google Fonts servers during compile time. In offline, high-latency, or restricted network environments, font fetch calls timeout and fail the entire build.
- **Solution**: Defined font families directly via CSS variables in `globals.css` and applied standard font stacks in `layout.tsx`, decoupling builds from external CDN uptime.

### 6.2 Client-Only Component Hydration Patterns (`useSyncExternalStore`)

- **Mistake**: Using `useEffect` to set a `hasMounted` boolean state flag in `ClientOnly` components.
- **Symptom**: React lint warning `react-hooks/set-state-in-effect: Calling setState synchronously within an effect can trigger cascading renders`.
- **Root Cause**: Synchronously setting state in `useEffect` causes extra render passes and hydration flicker.
- **Solution**: Migrated to React 18/19's `useSyncExternalStore(emptySubscribe, () => true, () => false)` for synchronous, tier-safe client mount detection.

### 6.3 PNPM v10+ Ignored Build Scripts Enforcement

- **Mistake**: Expecting dependency lifecycle scripts (`sharp`, `esbuild`, `@clerk/shared`) to run implicitly during `pnpm install` in CI/CLI.
- **Symptom**: PNPM exited with `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: ... Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts`.
- **Solution**: Explicitly ran `pnpm approve-builds --all` to authorize and compile native bindings.

---

## 7. Convex Deployment & Backend Function Sync

### 7.1 Missing Public Function Error on Newly Added Convex Mutations

- **Mistake**: Writing new Convex mutations (`projects.updateStatus`, `projects.bulkUpdateStatus`) in local `convex/` files without pushing them to the active Convex deployment.
- **Symptom**: Client console error `[CONVEX M(projects:updateStatus)] Server Error: Could not find public function for 'projects:updateStatus'`.
- **Root Cause**: Unlike local Next.js API routes that hot-reload in Node, Convex functions run on the Convex serverless backend and must be synchronized via `npx convex dev` or `npx convex dev --once`.
- **Solution**: Keep `npx convex dev` running in a dedicated terminal during development or execute `npx convex dev --once` immediately after creating new queries/mutations.

### 7.2 Convex Node.js Runtime Isolation & API Type Regeneration

- **Mistake**: Mixing Convex mutations or queries directly inside a `"use node"` action file (e.g. `convex/ai.ts`) or calling newly created actions before regenerating `convex/_generated/api.d.ts`.
- **Symptom**: Build failure or runtime exception stating that queries/mutations cannot execute in the Node.js runtime, alongside TypeScript errors stating `Property 'ai' does not exist on type 'api'`.
- **Root Cause**: Convex strictly isolates Node runtime actions from standard V8 runtime queries/mutations. Additionally, `api.*` and `internal.*` types are statically declared in `convex/_generated/api.d.ts` which must be regenerated when new backend files are added.
- **Solution**: Keep `"use node"` actions in dedicated files (`convex/ai.ts`) and place database mutations/queries in standard runtime files (`convex/taskRuns.ts`, `convex/specs.ts`). Run `npx convex dev --once` whenever new files or functions are declared.

---

## 8. AI Canvas Refinement & Tooling Evolution

### 8.1 Liveblocks CRDT In-Place Reconciliation vs. Full Map Overwrite

- **Mistake**: Completely clearing `nodesMap` and `edgesMap` (`nodesMap.delete(key)`) every time the AI generated an updated architecture.
- **Symptom**: Collaborator active selections, connection drags, and focus states were abruptly destroyed; visual flicker occurred during multi-turn prompting.
- **Root Cause**: Wiping the collection drops all reactive `LiveObject` instances and forces the canvas to rebuild all React Flow nodes from scratch.
- **Solution**: Implemented in-place reconciliation: update existing nodes/edges by ID, insert newly added nodes/edges, and prune only deleted elements.

### 8.2 Next.js 16 CLI Deprecation of `next lint`

- **Mistake**: Retaining `"lint": "next lint"` in `package.json` under Next.js 16.2.4.
- **Symptom**: `pnpm lint` failed with `Invalid project directory provided, no such directory: D:\Projects\ghost-ai\lint`.
- **Root Cause**: Next.js 16 dropped the embedded `next lint` sub-command, treating `lint` as a directory argument to `next dev/build`.
- **Solution**: Updated `package.json` script to `"lint": "eslint ."` and registered `convex/_generated/**` in ESLint's `globalIgnores`.

---

## 9. Next.js 16 Middleware & Cross-Origin File Downloads

### 9.1 Middleware Route Redirection on Backend AI Action Invocations

- **Mistake**: Restricting `isPublicRoute` in `proxy.ts` strictly to `['/sign-in(.*)', '/sign-up(.*)']` and redirecting all unauthenticated requests to `/sign-in`.
- **Symptom**: Backend AI actions (`convex/ai.ts` `generateSpec`) calling `/api/specs/upload` were greeted with HTTP 307 redirects to `/sign-in` HTML, failing with `SyntaxError: Unexpected token '<'` when parsing the response.
- **Root Cause**: Convex action executions run in the Convex serverless cloud and do not carry Clerk browser session cookies.
- **Solution**: Added `/api/specs/upload(.*)` to `isPublicRoute` in `proxy.ts`, and configured `proxy.ts` to return HTTP 401 JSON for unauthenticated API requests rather than redirecting them to the user HTML sign-in page.

### 9.2 Browser Cross-Origin Download Attribute Ignoring Remote Blob URLs

- **Mistake**: In `AISidebar`, triggering downloads by injecting `<a href={spec.filePath} download="...">` where `spec.filePath` is a remote Vercel Blob storage URL.
- **Symptom**: Clicking "Download" opened the Markdown document in a new browser tab instead of triggering a local file save dialog.
- **Root Cause**: The HTML5 `download` attribute is strictly disabled by browsers when pointing to cross-origin URLs.
- **Solution**: Routed downloads through the authenticated internal Next.js API proxy (`/api/specs/[specId]?url=...`), which sets `Content-Disposition: attachment; filename="..."`.

---

## 10. Clerk Authentication & Privacy Browser Shield Traps

### 10.1 Clerk JS Script Blocked by Brave Shields / Ad-Blockers

- **Mistake**: Relying on unhandled client-side `<ClerkProvider>` initialization without an App Router error boundary when users access the app from privacy-focused browsers (Brave, Firefox with strict tracking prevention, or Chrome with uBlock Origin / Privacy Badger).
- **Symptom**: Browser console throws unhandled `ClerkRuntimeError: Clerk: Failed to load Clerk JS (code="failed_to_load_clerk_js")`, crashing into a raw Next.js development error overlay.
- **Root Cause**: Brave Shields and ad-blocker filter lists aggressively identify third-party development domains (`*.clerk.accounts.dev`) as cross-site trackers and block the `<script>` tag from loading.
- **Solution**:
  1. Built custom `app/error.tsx` error boundary that intercepts `failed_to_load_clerk_js` and displays an informative dark technical shield dialog explaining the issue with step-by-step instructions to toggle Shields off for `localhost:3000`.
  2. For production environments, configure a custom domain (e.g. `auth.yourdomain.com`) in the Clerk Dashboard to route auth requests through the first-party domain, completely bypassing ad-blocker filter lists.

---

## 11. Public Link Sharing & Multi-User Permission Stratification

### 11.1 Liveblocks Token Permissions (`session.READ_ACCESS` vs. `session.FULL_ACCESS`)

- **Mistake**: Issuing `session.allow(roomId, session.FULL_ACCESS)` indiscriminately to any user whose presence was approved by token auth.
- **Symptom**: Unauthorized visitors or view-only link recipients could still mutate the collaborative Liveblocks CRDT storage (`room:write`).
- **Root Cause**: Liveblocks permission enforcement is declared server-side in the auth endpoint (`/api/liveblocks-auth`). If the session grants `FULL_ACCESS`, the client can dispatch storage mutations regardless of client-side UI flags.
- **Solution**: Evaluated `project.isReadOnly` in `/api/liveblocks-auth`. If `isReadOnly === true`, call `session.allow(roomId, session.READ_ACCESS)` which assigns `['room:read', 'room:presence:write', 'comments:read']` but denies `room:write`. Client-side mutations are rejected at the protocol layer.

### 11.2 React Flow Node Memoization & Viewport Culling for 100+ Node Graphs

- **Mistake**: Rendering unmemoized custom `CanvasNode`, `CanvasEdge`, and `LiveCursors` components in `ReactFlow` without element culling.
- **Symptom**: In large architectures (100+ nodes), dragging a single node or receiving rapid collaborator cursor moves dropped framerates down to 15-20fps due to full graph re-renders.
- **Root Cause**: Every node movement in React Flow dispatches updated node position props to the entire node collection. Without `React.memo` and viewport culling, hundreds of React components and SVG paths re-render on every animation frame.
- **Solution**:
  1. Wrapped `CanvasNode`, `CanvasEdge`, and `LiveCursors` in `React.memo`.
  2. Configured `onlyRenderVisibleElements={true}` on `<ReactFlow />`, dynamically unmounting out-of-viewport nodes and edges from the DOM tree.
  3. Added `CanvasContextProvider` to distribute read-only status without re-triggering storage listeners.
