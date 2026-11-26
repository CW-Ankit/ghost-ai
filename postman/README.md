# Ghost AI Backend Testing Guide (Postman & Test Scripts)

## 1. Automated Unit & Integration Tests (Offline / In-Memory)

Run all Vitest tests (Convex backend `convex-test` suite + Next.js API route handler tests + helper tests):

```bash
pnpm test
```

## 2. Live HTTP API Script (`scripts/test-backend.mjs`)

Start the Next.js server (`pnpm dev`) and run:

```bash
# Public & security boundary checks (401/403/400 + /api/health)
pnpm test:api
```

To run the **full authenticated E2E lifecycle** (projects CRUD, collaborators, Liveblocks auth, canvas save/load, AI design generation, task runs, spec generation & download, cascade delete):

1. Sign in to `http://localhost:3000` in your browser.
2. Open DevTools -> **Application** -> **Cookies** -> copy the `__session` cookie value (or run `await window.Clerk.session.getToken()` in Console for a Bearer token).
3. Run:

```powershell
# PowerShell
$env:AUTH_COOKIE="__session=<your-clerk-session-cookie>"
pnpm test:api
```

## 3. Postman Collection

1. Open **Postman** -> **Import**.
2. Import both:
   - `postman/ghost-ai-backend.postman_collection.json`
   - `postman/ghost-ai-local.postman_environment.json`
3. Select the **Ghost AI — Local** environment in the top-right dropdown.
4. Set `authCookie` to `__session=<your-clerk-session-cookie>` (from your signed-in browser DevTools).
5. Run folders `01 Health` through `08 Cleanup & Security Checks` in order (or use Postman **Collection Runner**). Collection variables (`projectId`, `roomId`, `taskRunId`, `specId`) are automatically populated by each request's `pm.test(...)` script.

## 4. Backend Endpoints Reference

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service readiness & Convex connectivity |
| `GET` | `/api/projects` | List owned & shared projects |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/[projectId]` | Get project details & resolved role |
| `PATCH` | `/api/projects/[projectId]` | Rename, update status, tags, or `publicAccess` |
| `DELETE` | `/api/projects/[projectId]` | Cascade-delete project & all dependent rows |
| `GET` | `/api/projects/[projectId]/collaborators` | List & enrich project collaborators |
| `POST` | `/api/projects/[projectId]/collaborators` | Invite collaborator by email |
| `DELETE` | `/api/projects/[projectId]/collaborators?email=...` | Remove collaborator |
| `POST` | `/api/canvas/save` | Persist canvas JSON to Vercel Blob / fallback & optionally Convex |
| `GET` | `/api/canvas/save?projectId=...` | Load saved canvas JSON |
| `POST` | `/api/ai/design` | Run AI design generation / refinement via Convex action |
| `POST` | `/api/ai/spec` | Generate & store Markdown technical spec via Convex action |
| `GET` | `/api/task-runs/[taskRunId]` | Inspect AI task run status & output |
| `GET` | `/api/projects/[projectId]/specs` | List specs for a project |
| `GET` | `/api/projects/[projectId]/specs/[specId]/download` | Download spec Markdown attachment |
| `POST` | `/api/specs/upload` | Internal / authenticated spec upload to Blob |
| `GET` | `/api/specs/[specId]` | SSRF-guarded spec download proxy |
| `DELETE` | `/api/specs/[specId]` | Owner-only spec deletion |
| `POST` | `/api/liveblocks-auth` | Issue Liveblocks room session (`READ_ACCESS` / `FULL_ACCESS`) |
