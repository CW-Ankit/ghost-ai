# Deployment Guide: Ghost AI

This guide provides step-by-step instructions to deploy Ghost AI for free using **Vercel**, **Convex**, **Clerk**, and **Liveblocks**.

## 🚀 Architecture Overview

Ghost AI uses a modern, serverless stack designed for real-time collaboration:
- **Frontend & Hosting**: Vercel (Next.js 16)
- **Backend & Database**: Convex
- **Authentication**: Clerk
- **Real-time Canvas**: Liveblocks
- **Artifact Storage**: Vercel Blob

---

## 🛠️ Prerequisites

Before starting, ensure you have free accounts with the following providers:
1. [Vercel](https://vercel.com)
2. [Convex](https://convex.dev)
3. [Clerk](https://clerk.com)
4. [Liveblocks](https://liveblocks.io)

---

## 📦 Step-by-Step Deployment

### 1. Push to GitHub
Push your code to a private or public GitHub repository. Vercel will use this for continuous deployment.

### 2. Setup Convex (Backend)
Convex handles your database and serverless functions.
1. Run `npx convex dev` locally to ensure your schema is up to date.
2. In the Convex dashboard, create a **Production** project.
3. Follow the prompts to connect your GitHub repository to Convex. This will automatically handle deployment of your Convex functions whenever you push to `main`.
4. **Crucial**: Copy the `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` variables for Vercel.

### 3. Setup Clerk (Authentication)
1. Create a new application in the Clerk Dashboard.
2. Select the identifiers you want to support (e.g., Email, Google).
3. Go to **API Keys** and copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Set the **Authorized Redirect URIs** to your Vercel production domain (e.g., `https://your-app.vercel.app`).

### 4. Setup Liveblocks (Real-time)
1. Create a project in the Liveblocks dashboard.
2. Copy the following keys:
   - `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`
   - `LIVEBLOCKS_SECRET_KEY`

### 5. Deploy to Vercel
1. Import your GitHub repository into Vercel.
2. In the **Environment Variables** section, add all the keys collected above:

| Variable | Source | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | Public auth key |
| `CLERK_SECRET_KEY` | Clerk | Secret auth key |
| `NEXT_PUBLIC_CONVEX_URL` | Convex | Production backend URL |
| `CONVEX_DEPLOYMENT` | Convex | Production deployment ID |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | Liveblocks | Public real-time key |
| `LIVEBLOCKS_SECRET_KEY` | Liveblocks | Secret real-time key |

3. Click **Deploy**.

---

## 🔍 Post-Deployment Checks

1. **Verify Auth**: Sign in to the app and ensure you are redirected correctly.
2. **Verify Database**: Create a new project and ensure it appears in the Convex dashboard.
3. **Verify Collaboration**: Open the app in two different browsers; you should see the real-time canvas syncing.

## 💰 Free Tier Maintenance

All selected providers have generous free tiers:
- **Vercel**: Hobby plan (Free for personal projects).
- **Convex**: Free tier includes sufficient storage and function calls for small-to-medium projects.
- **Clerk**: Free for up to 10,000 monthly active users.
- **Liveblocks**: Free tier supports a limited number of concurrent users and rooms.

If you hit a limit, you can upgrade individual components without migrating your entire stack.
