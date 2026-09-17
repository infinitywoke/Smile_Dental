# Agent Development Rules

- **Framework**: Next.js App Router. Do not use the Pages router.
- **Data Fetching**: Use Server Components by default. Use Client Components only when interactivity is required.
- **Mutations**: Use Server Actions for all data mutations. Do not create REST API endpoints unless absolutely necessary for external webhooks.
- **Styling**: Tailwind CSS.
- **Database**: Supabase. Use the Supabase SSR package for auth and data access.
- **Architecture**: Keep business logic out of UI components. Place complex logic in a service layer under `src/services/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
