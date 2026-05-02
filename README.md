# 👻 GHOST AI

A high-performance, AI-driven web application built with a minimal dark-themed interface.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (Custom Minimal Dark Theme)
- **Backend/Database**: [Convex](https://convex.dev/) (Real-time Database & Serverless Functions)
- **Authentication**: [Clerk](https://clerk.com/)
- **Language**: TypeScript
- **Package Manager**: pnpm

---

## 🚀 Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
CLERK_FRONTEND_API_URL=https://your-clerk-frontend-api-url.clerk.accounts.dev

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

### 3. Backend Setup (Convex)

1. Initialize Convex in your project:

   ```bash
   pnpm dlx convex dev
   ```

2. This will prompt you to log in and create a project. It will also automatically sync the `convex/schema.ts` and `convex/auth.config.ts` to your backend.

### 4. Authentication Setup (Clerk)

1. Go to the [Clerk Dashboard](https://dashboard.clerk.com/).
2. Navigate to **Integrations** $\rightarrow$ **Convex**.
3. Activate the Convex integration.
4. Copy the **Frontend API URL** and paste it into `CLERK_FRONTEND_API_URL` in your `.env.local`.

### 5. Running the App

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🏗 Architecture Overview

- `app/`: Next.js App Router pages and layouts.
- `convex/`: Backend logic, schema definitions, and auth configuration.
- `components/`: Reusable UI components (including the `ConvexClientProvider`).
- `lib/`: Shared utility functions and client initializations.
- `context/`: Project architectural guidelines and documentation.

## 🎨 Design System

The app uses a strict minimal dark mode:

- **Background**: `#0a0a0a`
- **Foreground**: `#e5e5e5`
- **Muted**: `#737373`
- **Border**: `#262626`
