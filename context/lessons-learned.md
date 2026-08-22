# Lessons Learned & Mistakes Log: Ghost AI

This document serves as the project's engineering memory, recording mistakes, bugs, architectural oversights, security findings, and performance traps encountered during development, along with the root causes and preventative patterns.

---

## 1. Architecture & Backend Integration

### 1.1 Request-Response Latency vs. Reactive WebSockets
* **Mistake**: Initially routing project mutations (create, rename, delete) through Next.js API routes (`UI -> Next.js API -> DB -> Response -> UI`) and calling `router.refresh()`.
* **Symptom**: High perceived latency (300-800ms), flickering layouts, and persistent loading spinners during basic CRUD operations.
* **Root Cause**: Next.js App Router route hops created an unnecessary middleman layer for real-time relational data.
* **Solution**: Migrated from API route polling to direct Convex client integration (`useQuery`, `useMutation`), enabling real-time WebSocket subscriptions and optimistic UI updates.

### 1.2 Convex Cloud Auth Environment Variable Isolation
* **Mistake**: Placing `CLERK_FRONTEND_API_URL` solely in `.env.local` and expecting `convex/auth.config.ts` to access it.
* **Symptom**: `ctx.auth.getUserIdentity()` returned `null` in Convex mutations and queries, causing all authenticated mutations to fail silently or throw unauthorized errors.
* **Root Cause**: `.env.local` is read by the Next.js local Node runtime, but Convex executes functions in its own serverless runtime/cloud environment.
* **Solution**: Explicitly set the variable in the Convex backend environment using `npx convex env set CLERK_FRONTEND_API_URL ...`.

### 1.3 Documentation & Dependency Speculation Drift
* **Mistake**: Documenting uninstalled tools (Trigger.dev, Vercel Blob) in `README.md`, `package.json` environment checklists, and architecture docs as if they were active dependencies.
* **Symptom**: Confusion during onboarding and setup when environment keys had no corresponding consumers in code.
* **Solution**: Clearly separate active implementations (`Live`) from roadmap features (`Roadmap / In Progress`) in documentation and feature trackers.

---

## 2. Security & Authorization

### 2.1 Unprotected Snapshot Mutation (`updateSnapshot`)
* **Mistake**: `updateSnapshot` mutation accepted a `projectId` and `snapshot` payload without validating whether the caller was the project owner or an authorized collaborator.
* **Symptom**: Vulnerability where any authenticated user with a valid project ID could overwrite another user's canvas state.
* **Root Cause**: Assuming that possessing the room ID was sufficient proof of authorization.
* **Solution**: Added strict project membership verification in Convex functions:
  ```ts
  const hasAccess = project.ownerId === identity.subject || project.collaborators?.includes(identity.subject);
  if (!hasAccess) throw new Error("Unauthorized to modify project snapshot");
  ```

### 2.2 Liveblocks Room Token Issuance Without Membership Validation
* **Mistake**: The `/api/liveblocks-auth` route initialized user room sessions based purely on Clerk authentication without querying project membership.
* **Symptom**: Any logged-in user could connect to any Liveblocks room ID and read/write real-time canvas events.
* **Solution**: Integrated Convex HTTP client checks inside `/api/liveblocks-auth` to ensure `userId` is either the project owner or a registered collaborator before calling `liveblocks.identifyUser()`.

---

## 3. Real-Time Canvas & React Flow Integration

### 3.1 Unhandled Null State on Canvas Mount
* **Mistake**: Accessing `nodes.length` or mapping over `nodes` immediately upon `CanvasInner` mounting.
* **Symptom**: App crashed with runtime error `TypeError: Cannot read properties of null (reading 'length')`.
* **Root Cause**: `useLiveblocksFlow()` returns `null`/`undefined` for `nodes` and `edges` while the Liveblocks room is in the connecting/hydrating phase.
* **Solution**: Added explicit null guards and fallback skeleton loading states before rendering React Flow components.

### 3.2 Screen Coordinate vs. Canvas Flow Coordinate Misalignment
* **Mistake**: Using raw browser event coordinates (`event.clientX`, `event.clientY`) when dropping shapes onto the canvas.
* **Symptom**: Dropped nodes appeared far away from the user cursor, especially when the canvas was panned or zoomed.
* **Root Cause**: React Flow uses a transformed SVG/HTML coordinate space that differs from DOM viewport pixels.
* **Solution**: Converted mouse coordinates using React Flow's `screenToFlowPosition({ x: event.clientX, y: event.clientY })`.

### 3.3 Missing Edge Handle Identifiers
* **Mistake**: Rendering multiple `Handle` components (top, bottom, left, right) on `CanvasNode` without distinct `id` attributes.
* **Symptom**: Connecting edges always snapped to the default handle, causing strange orthogonal routing and overlapping lines.
* **Solution**: Provided unique handle IDs (`id="top"`, `id="bottom"`, etc.) alongside explicit `Position` constants (`Position.Top`, `Position.Bottom`).

### 3.4 Mutation Storms During Node Dragging
* **Mistake**: Syncing snapshot state to Convex on every continuous `onNodesChange` event.
* **Symptom**: Hundreds of database write mutations per second, overwhelming the Convex client and causing OCC (Optimistic Concurrency Control) conflicts.
* **Solution**: Implemented a 5-second debounce window with `clearTimeout` on unmount to persist snapshots only after user interaction settles.

---

## 4. State Management & Lifecycle

### 4.1 Presence Cleanup Race Conditions on Unmount
* **Mistake**: Relying solely on `useEffect` cleanup in `WorkspaceShell` to remove user presence from the database on page exit.
* **Symptom**: If the user closed the browser tab abruptly, closed their laptop, or navigated rapidly, their presence avatar remained "stuck" indefinitely.
* **Root Cause**: Unmount hooks are not guaranteed to finish asynchronous network calls when a tab is terminated.
* **Solution**: Implemented a two-pronged strategy:
  1. Best-effort client cleanup on unmount.
  2. Scheduled Convex cron job (`convex/crons.ts`) to automatically prune stale presence records older than 30 seconds.

### 4.2 Inconsistent Error Handling (`alert()` vs. Toast Notifications)
* **Mistake**: Using native browser `alert()` in `useProjectActions` for failed project deletions or renames.
* **Symptom**: Harsh, blocking modal popups that froze user interaction and broke the design system aesthetic.
* **Solution**: Replaced all native dialogs with `sonner` toast notifications (`toast.error(...)`, `toast.success(...)`).

---

## 5. Development Tools & Workspace Traps

### 5.1 Unbounded Recursive Terminal Commands
* **Mistake**: Running unconstrained terminal commands such as `grep -r "..." .` or `find .` across the workspace.
* **Symptom**: Commands hung indefinitely traversing massive `node_modules/`, `.next/`, and generated directories, locking agent execution.
* **Root Cause**: Windows PowerShell and CLI tools scanning deeply nested dependency folders.
* **Solution**: Mandated scoped searches with exclusions or targeted search tools (`grep_search` with glob filters, `find_by_name`).
