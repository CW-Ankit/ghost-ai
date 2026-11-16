# GHOST AI

Ghost AI is a real-time collaborative system design workspace. It enables engineering teams to describe complex systems in natural language, maps architectures onto a shared canvas, allows collaborators to refine designs together in real-time, and automatically generates comprehensive Markdown technical specifications.

---

## 🚀 Feature Matrix & Roadmap

| Feature                               | Description                                                                                                       |     Status     |
| :------------------------------------ | :---------------------------------------------------------------------------------------------------------------- | :------------: |
| **Real-Time Collaborative Canvas**    | Shared architecture surface powered by Liveblocks & React Flow with real-time state sync.                         |    ✅ Live     |
| **Shape Library & Drag-Drop**         | Prebuilt node shapes (Rectangle, Circle, Cylinder/DB, Diamond, Cloud) with 4-side connection handles.             |    ✅ Live     |
| **Orthogonal Edges & Labeling**       | Right-angle edge routing, directional arrowheads, and inline editable label pills.                                |    ✅ Live     |
| **Node Styling & Color Palette**      | Floating contextual color toolbar for node background and border customization.                                   |    ✅ Live     |
| **Project Dashboard**                 | Real-time project search, tag filtering, grid/list view toggle, bulk archive/delete, and hover snapshot previews. |    ✅ Live     |
| **Auth & Collaborator Access**        | User authentication via Clerk, Convex identity mapping, and multi-user project sharing.                           |    ✅ Live     |
| **Canvas Ergonomics**                 | Floating canvas control bar for zoom, undo/redo history, and keyboard shortcuts.                                  |    ✅ Live     |
| **Starter System Templates**          | Curated library of system design patterns (Microservices, Event-driven, Serverless, etc.) importable into canvas. |    ✅ Live     |
| **Multi-User Presence & Cursors**     | Live user cursors, presence indicators, and collaborator avatars.                                                 |    ✅ Live     |
| **Canvas Autosave & Recovery**        | Debounced autosave to Vercel Blob, structural fingerprinting, and automatic state rehydration.                     |    ✅ Live     |
| **AI Architecture Generation**        | Durable background actions translating natural language prompts into canvas nodes & edges with Mistral AI.        |    ✅ Live     |
| **Multi-Turn AI Refinement**          | Context-aware architecture modifications preserving existing component IDs, positions, and styling.               |    ✅ Live     |
| **Technical Spec Generator & Export** | Compiling the canvas graph into persistent Markdown technical specifications via Mistral Large.                   |    ✅ Live     |
| **Spec PDF & Print Export**           | Direct PDF compilation and formatted multi-page technical document downloads.                                      |    ✅ Live     |
| **Visual Architecture Diffs**         | Highlight newly added or modified nodes/edges after AI refinement passes.                                         |    ✅ Live     |

---

## 🛠 Tech Stack

| Layer                    | Technology                                                                       | Role                                                                               |
| :----------------------- | :------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **Framework**            | [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/)               | Full-stack App Router architecture with strict server/client boundaries            |
| **UI & Styling**         | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Custom dark-themed technical workspace and accessible component primitives         |
| **Database & Backend**   | [Convex](https://convex.dev/)                                                    | Real-time reactive database, relational metadata, and serverless mutations/queries |
| **Authentication**       | [Clerk](https://clerk.com/)                                                      | Identity management, route protection, and Convex JWT integration                  |
| **Collaboration**        | [Liveblocks](https://liveblocks.io/)                                             | Real-time room state synchronization, presence, and history                        |
| **Canvas Engine**        | [@xyflow/react](https://reactflow.dev/)                                          | High-performance visual node-based graph rendering                                 |
| **AI Workflows**         | [Mistral AI](https://mistral.ai/) via Convex Actions                             | Architecture synthesis (JSON mode) and Markdown technical spec drafting            |
| **Artifact Storage**     | [Vercel Blob](https://vercel.com/storage/blob)                                   | Storage for large canvas snapshots and generated Markdown specs                    |
| **Language**             | TypeScript                                                                       | Strict end-to-end type safety                                                      |

---

## 📁 Project Structure

```text
ghost-ai/
├── app/                      # Next.js App Router (pages, layouts, API routes)
│   ├── (auth)/               # Clerk authentication sign-in & sign-up routes
│   ├── api/                  # Authenticated endpoints (Liveblocks auth, projects API)
│   └── editor/               # Project dashboard and dynamic workspace room canvas
├── components/               # React UI components
│   ├── editor/               # Workspace chrome, navbar, sidebar, dashboard, share dialog
│   │   └── canvas/           # Collaborative React Flow canvas, custom nodes & edges
│   └── ui/                   # Reusable shadcn/ui base components
├── context/                  # Project requirements, architecture specs, and progress tracker
├── convex/                   # Convex backend schema, indexes, queries, and mutations
├── hooks/                    # Custom React hooks (project actions, keyboard shortcuts)
├── lib/                      # Shared client & server utilities, Convex & Liveblocks clients
├── types/                    # Shared TypeScript interfaces and canvas schemas
└── liveblocks.config.ts      # Liveblocks configuration and typed room state
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: `v18.17.0` or higher
- **Package Manager**: `pnpm` (v9+ recommended)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/ghost-ai.git
cd ghost-ai
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud

# Liveblocks Collaboration
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_...
LIVEBLOCKS_SECRET_KEY=sk_...
```

### 3. Backend & Auth Setup

#### A. Initialize Convex

Start the local Convex development server to generate types and sync schema:

```bash
pnpm exec convex dev
```

#### B. Configure Clerk for Convex

1. In the [Clerk Dashboard](https://dashboard.clerk.com/), navigate to **Integrations** &rarr; **Convex** and activate it.
2. Copy your Clerk **Frontend API URL** (or Issuer Domain).
3. Set this domain in your **Convex Backend Environment** (this is required for `convex/auth.config.ts` JWT validation):
   ```bash
   npx convex env set CLERK_FRONTEND_API_URL https://<your-clerk-frontend-api-url>.clerk.accounts.dev
   ```

#### C. Configure Liveblocks

1. In the [Liveblocks Dashboard](https://liveblocks.io/dashboard), create a project.
2. Copy your **Public Key** and **Secret Key** into `.env.local`.

### 4. Running the Application

For local development, keep both the **Convex backend** and the **Next.js frontend** running in separate terminal windows:

```bash
# Terminal 1: Convex real-time backend
pnpm exec convex dev

# Terminal 2: Next.js dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command       | Description                                              |
| :------------ | :------------------------------------------------------- |
| `pnpm dev`    | Starts the Next.js local development server on port 3000 |
| `pnpm build`  | Compiles the production build                            |
| `pnpm start`  | Runs the compiled production server                      |
| `pnpm lint`   | Runs Next.js ESLint checks                               |
| `pnpm format` | Formats all code files using Prettier                    |
| `pnpm check`  | Runs both Prettier formatting and ESLint in sequence     |

---

## 🏗 Architecture & Storage Model

Ghost AI is designed around a reactive, layered architecture:

- **Metadata Layer (Convex)**: Project metadata, membership access, tags, and debounced snapshot states are stored in Convex. All client views subscribe reactively over WebSockets.
- **High-Frequency State (Liveblocks)**: Real-time interactions (node movement, edge connections, cursors) are synchronized with sub-50ms latency using Liveblocks rooms.
- **Durable AI Layer (Trigger.dev - Roadmap)**: Long-running generation jobs run asynchronously to prevent request timeouts and provide resilient retry loops.
- **Artifact Layer (Vercel Blob - Roadmap)**: Large technical specifications and raw canvas graph exports are offloaded to object storage with URLs referenced in the database.

---

## 🎨 Design System

The app adheres strictly to a **Dark Technical Workspace** design language:

- **Surface Palette**: Near-black foundations (`#080809`), deep elevated surfaces (`#111113`), and subtle border treatments (`#26262b`).
- **Accents**: High-contrast vivid cyan (`#00c8d4`) for primary interactions and indigo/purple for AI workflows.
- **Typography**: Geist Sans for interface typography and Geist Mono for identifiers and code blocks.

---

## 🚀 Deployment

For production deployment instructions on Vercel, Convex Production, Clerk, and Liveblocks, see the [Deployment Guide (DEPLOYMENT.md)](./DEPLOYMENT.md).
