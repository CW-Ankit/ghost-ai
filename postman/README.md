# Ghost AI Backend Testing Guide (Postman & Test Scripts)

## 1. Automated Unit & Integration Tests (Offline / In-Memory)

Run all Vitest tests (Convex backend `convex-test` suite + Next.js API route handler tests + helper tests):

```bash
pnpm test
```

## 2. Live HTTP API Script (`scripts/test-backend.mjs`)

Start the Next.js server (`pnpm dev`), then in another terminal run:

```bash
pnpm test:api
```

`pnpm test:api` automatically reads `CLERK_SECRET_KEY` from `.env.local` to mint a temporary 5-minute Clerk Bearer session token, runs **all 18+ E2E checks** (health, security `401`/`403` guards, projects CRUD, collaborators, Liveblocks auth, canvas save/load, AI design generation, task runs, AI spec generation/download, and cascade cleanup), and revokes the temporary session when finished.

- To run only the public & unauthenticated security checks: `SKIP_AUTH=1 pnpm test:api`
- To test with an explicit token: `BEARER_TOKEN="<jwt>" pnpm test:api`

## 3. Postman Collection

1. Open **Postman** -> **Import**.
2. Import both:
   - `postman/ghost-ai-backend.postman_collection.json`
   - `postman/ghost-ai-local.postman_environment.json`
3. Select the **Ghost AI — Local** environment in the top-right dropdown.
4. Generate a fresh 5-minute Bearer token in one command:
   ```bash
   pnpm test:token
   ```
5. Paste the printed JWT into the **`bearerToken`** environment variable in Postman (use Bearer auth rather than a raw `__session` cookie alone, because Clerk's `__session` cookie expires in 60 seconds and requires `__client_uat`).
6. Run folders `01 Health` through `08 Cleanup & Security Checks` in order (or use Postman **Collection Runner**). Collection variables (`projectId`, `roomId`, `taskRunId`, `specId`) are automatically populated by each request's `pm.test(...)` script.

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
