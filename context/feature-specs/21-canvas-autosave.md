Add autosave and loading for the collaborative canvas so project state is persisted before adding AI generation Canvas JSON should be stored in Vercel Blob, and the saved blob URL should be stored on the Convex project record.

## What to Install

- `@vercel/blob`

## Implementation

1. Check the existing project schema.
   - review `convex/schema.ts`
   - add or reuse a field for the canvas blob URL
   - keep Convex responsible for metadata only

2. Add canvas save/load Convex functions.
   Create a mutation: `convex/projects.ts` -> `saveCanvas`
   This function should:
   - receive the latest canvas JSON
   - upload the JSON to Vercel Blob (from the client or via a Convex action)
   - store the returned blob URL on the matching Convex project record

   Create a query: `convex/projects.ts` -> `getCanvasUrl`
   This function should:
   - read the project’s saved blob URL from Convex
   - return the canvas blob URL to the editor

3. Add an autosave hook in the `/hook` folder.
   - watch the canvas nodes and edges
   - debounce saves to avoid excessive writes
   - save through the Convex mutation
   - track save status: saving, saved, error

4. Load saved canvas state in the editor.
   - when the editor loads, check if the Liveblocks room has any existing nodes or edges
   - if the room is empty and the project has a saved canvas blob URL, fetch the JSON from Vercel Blob and load the saved canvas state
   - if the room already has nodes or edges, skip the load entirely to avoid overwriting active collaboration

5. Add a small save status indicator in the editor Save button.
   - show saving, saved, or error states

## Storage Pattern

- Convex stores project metadata and the canvas blob URL.
- Vercel Blob stores the actual canvas JSON.

## Check When Done

- `@vercel/blob` is installed.
- Convex schema supports storing the canvas blob URL.
- Save/load functions use Convex for metadata and Vercel Blob for canvas JSON.
- Autosave hook debounces canvas saves.
- Editor shows save status.
- Saved canvas does not load if the room already has
  active nodes or edges
- `pnpm run build` passes.
