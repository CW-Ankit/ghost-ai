# Convex Schema And Data Layer

## Goal

Define the Convex schema for project management and collaboration, ensuring efficient querying and data integrity.

## Schema

Define the schema in `convex/schema.ts`.

Add `projects` table:

- `ownerId`: string (Clerk user ID) - indexed
- `name`: string
- `description`: optional string
- `status`: string (`'DRAFT' | 'ARCHIVED'`)
- `canvasJsonPath`: string (for future canvas blob storage)
- `createdAt`: number (timestamp)
- `updatedAt`: number (timestamp)

Add `projectCollaborators` table:

- `projectId`: Id<"projects"> - indexed
- `email`: string - indexed
- `createdAt`: number (timestamp)

Ensure a unique constraint or validation logic is in place for the project/email combination to prevent duplicate collaborators.

## Data Access

All data access must happen through Convex functions (queries and mutations) in the `convex/` directory. 

Follow the guidelines in `convex/_generated/ai/guidelines.md` for implementing these functions.

## Setup

The Convex client provider is already implemented in `components/convex-client-provider.tsx`.

## Check When Done

- `convex/schema.ts` has both tables with correct types and indexes
- Schema is deployed to Convex
- `pnpm run build` passes
