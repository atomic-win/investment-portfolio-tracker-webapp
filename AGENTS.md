<!-- intent-skills:start -->
## Skill Loading

Before substantial work:
- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# Investment Portfolio Tracker

A client-rendered SPA for tracking investment portfolios, built with Vite + TanStack Router.

## Quick Reference

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Type-check (tsc --noEmit) then Vite build
npm run preview      # Preview production build
npm run test         # Run vitest
npm run check        # Biome lint + format check
npm run lint         # Biome lint only
npm run format       # Biome format only
```

## Stack

| Layer         | Technology                                                |
| ------------- | --------------------------------------------------------- |
| Framework     | Vite SPA + TanStack Router                                |
| Router        | TanStack Router (`@tanstack/react-router`) — file-based   |
| Data fetching | TanStack Query (`@tanstack/react-query`) + axios          |
| Tables        | TanStack Table (`@tanstack/react-table`)                  |
| Toolchain     | Biome 2 (lint + format)                                   |
| Bundler       | Vite 8                                                    |
| Styling       | Tailwind CSS 4 + shadcn/ui                                |
| Forms         | react-hook-form + zod validation schemas                  |
| Charts        | TanStack Charts (`@tanstack/charts/react`)                 |
| Auth          | Google OAuth via `@react-oauth/google`                    |
| Package mgr   | npm                                                      |

## Architecture

- **Client-rendered SPA** — standard Vite SPA with `index.html` entry point. No server components, no SSR. All data fetching via React Query + axios.
- **External API** at `http://localhost:5185/api` — a separate .NET backend, not part of this repo.
- **Auth flow**: Google OAuth token → stored in `localStorage` → sent as `Bearer` token via axios interceptor (`src/hooks/use-primal-api-client.ts`). On 401, token is cleared and user is redirected to `/`.
- **React Query persistence**: query cache persisted to `localStorage` via `@tanstack/query-async-storage-persister` (configured in `src/router.tsx`).

## Project Structure

```
index.html                         # Vite SPA entry point
src/
├── main.tsx                       # React DOM mount point
├── routes/                        # File-based routes (TanStack Router)
│   ├── __root.tsx             # Root layout: sidebar, providers, devtools
│   ├── index.tsx              # / — home/login page
│   ├── asset-items/           # /asset-items/* routes
│   ├── portfolio/             # /portfolio route
│   └── portfolio-trends/      # /portfolio-trends route
├── features/                  # Feature modules (domain logic)
│   ├── asset-items/
│   │   ├── components/        # UI components (forms, tables, dialogs)
│   │   ├── hoc/               # withAssetItems HOC
│   │   ├── hooks/             # React Query hooks (queries + mutations)
│   │   ├── lib/               # Utilities
│   │   └── schema.ts          # Zod validation schema
│   ├── portfolio/
│   │   ├── components/        # Portfolio sections, charts, filters
│   │   ├── hoc/               # withValuations, withInvestmentsFilter, etc.
│   │   ├── hooks/             # Valuation queries
│   │   └── lib/               # Utilities
│   └── transactions/
│       ├── components/        # Add/edit forms, table, delete dialog
│       ├── hooks/             # Transaction queries + mutations
│       ├── lib/               # Utilities
│       └── schema.ts          # Zod validation schema
├── components/
│   ├── hoc/                   # Shared HOCs (withCurrency)
│   ├── ui/                    # shadcn/ui primitives
│   ├── app-sidebar.tsx        # Navigation sidebar
│   └── ...                    # Other shared components
├── hooks/                     # Shared hooks
│   ├── use-access-token.ts    # localStorage-backed access token
│   ├── use-primal-api-client.ts # Axios instance with auth interceptor
│   ├── use-log-in-mutation.ts
│   ├── use-log-out-mutation.ts
│   └── users.ts               # useUserQuery, useUpdateUserMutation
├── lib/
│   └── utils.ts               # Shared display utilities
├── types.ts                   # Domain enums and types
├── router.tsx                 # Router factory + query client setup
└── routeTree.gen.ts           # Auto-generated — do NOT edit
```

## Route Map

| Path                                                        | File                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `/`                                                         | `src/routes/index.tsx`                                                    |
| `/asset-items`                                              | `src/routes/asset-items/index.tsx`                                        |
| `/asset-items/add`                                          | `src/routes/asset-items/add.tsx`                                          |
| `/asset-items/:assetItemId`                                 | `src/routes/asset-items/$assetItemId.index.tsx`                           |
| `/asset-items/:assetItemId/edit`                             | `src/routes/asset-items/$assetItemId.edit.tsx`                            |
| `/asset-items/:assetItemId/transactions/add`                | `src/routes/asset-items/$assetItemId.transactions.add.tsx`                |
| `/asset-items/:assetItemId/transactions/:transactionId/edit`| `src/routes/asset-items/$assetItemId.transactions.$transactionId.edit.tsx` |
| `/portfolio`                                                | `src/routes/portfolio/index.tsx`                                          |
| `/portfolio-trends`                                         | `src/routes/portfolio-trends/index.tsx`                                   |

## Domain Types

Defined in `src/types.ts`:

- **Enums**: `Currency`, `Locale`, `AssetClass`, `AssetType`, `TransactionType`, `PortfolioType`
- **Entities**: `User`, `AssetItem`, `Transaction`, `Portfolio`, `Valuation`
- **Portfolio variants**: `OverallPortfolio`, `AssetClassPortfolio`, `AssetTypePortfolio`, `AssetItemPortfolio`
- **Server-determined types**: `AssetType.ETF` is not user-selectable in the add form — it is assigned by the server. ETF behaves like Stock (equity, symbol-based, buy/sell/dividend).

## Key Patterns

### HOC Composition

Data-fetching HOCs wrap components to inject loaded data. They handle loading/error states internally.

```tsx
// src/features/asset-items/hoc/with-asset-items.tsx
export default function withAssetItems<T extends { assetItems: AssetItem[] }>(
  Component: React.ComponentType<T>,
) { ... }

// Usage in route: export default withAssetItems(AssetItemsPage);
```

Available HOCs: `withAssetItems`, `withCurrency`, `withValuations`, `withAssetItemPortfolio`, `withAssetItemPortfolios`, `withInvestmentsFilter`, `withPortfolioTrendsSection`.

### React Query Hooks

Each feature has its own hooks file exporting query/mutation hooks:
- `src/features/asset-items/hooks/asset-items.ts` — `useAllAssetItemsQuery`, `useAddAssetItemMutation`, `useEditAssetItemMutation`, `useDeleteAssetItemMutation`, `refreshAssetItems`, `refreshAssetItem`
- `src/features/transactions/hooks/transactions.ts` — `useAssetItemTransactionsQuery`, `useTransactionQuery`, `useAddTransactionMutation`, `useEditTransactionMutation`, `useDeleteTransactionMutation`
- `src/features/portfolio/hooks/valuations.ts` — `useValuationsQueries` (default export, uses `useQueries` for parallel fetching)

Query key conventions: `["assetitems", ...]`, `["valuations", ...]`, `["users", "me"]`

### API Client

`usePrimalApiClient()` returns an axios instance configured with:
- Base URL: `http://localhost:5185/api`
- Auto-attached Bearer token from localStorage
- 401 interceptor that clears token and redirects

### Form Validation

Zod schemas in `src/features/*/schema.ts`, integrated via `@hookform/resolvers/zod` with react-hook-form. Schemas use `.superRefine()` for conditional validation based on asset type or transaction type.

### Path Aliases

Two aliases are configured (tsconfig `paths` + package.json `imports`):
- `#/*` → `./src/*`
- `@/*` → `./src/*`

The codebase exclusively uses `@/` — always use `@/` for imports.

### DataTable

The shared `DataTable` component (`src/components/ui/data-table.tsx`) supports sorting, pagination, column visibility, and **column filtering** (text and faceted).

- **`createColumnDef`** — helper to build column definitions with optional `sortingFnCompare`, `filterFn`, `linkFn`, and alignment.
- **Filter config** — pass a `filters` array of `DataTableFilterConfig` to `DataTable`:
  - `{ type: "text", columnId, placeholder }` — text input filter (uses built-in `includesString`)
  - `{ type: "faceted", columnId, title, options }` — multi-select popover filter (requires a custom `filterFn` on the column that checks array inclusion)
- **`DataTableToolbar`** (`src/components/ui/data-table-toolbar.tsx`) — renders filter inputs and the `DataTableViewOptions` column toggle.
- **`DataTableFacetedFilter`** — internal component in `data-table-toolbar.tsx` using `Command` (cmdk) inside a `Popover` for searchable multi-select.
- **Important**: when `filterFn` is not needed (text filters), do **not** set it — omitting it lets TanStack Table use its default `includesString` filter. Explicitly setting `filterFn: undefined` disables filtering.
- **`accessorKey`** must match the actual data property name for filtering to work (e.g., use `"name"` not `"transactionName"` when the data field is `name`).

### Charts

- TanStack Charts definition builders live in `src/features/portfolio/lib/charts.ts` and are called directly during rendering: allocation donuts use `pie` + `radialArc` inside `polar`; trends use `lineY` with grouped date tooltips.
- Use `@tanstack/charts/react` for the responsive SVG host. Shared theme tokens and HTML legends live in `src/components/ui/chart.tsx`.
- Preserve missing observations as line gaps. Currency, percentage, ratio formatting, and optional monetary totals are supplied by the trends section.
- Import optional capabilities from exact package subpaths. `d3-scale` supplies calendar-aware time scales and `d3-shape` supplies monotone curves.

## Code Style & Conventions

- **Formatter**: Biome — tabs for indentation, double quotes for strings
- **Class names**: Import `{ cn }` directly from `"cn"`, not from `@/lib/utils`.
- **Lint**: Biome recommended rules
- **TypeScript**: strict mode, `verbatimModuleSyntax` enabled — always use `import type` for type-only imports
- **File naming**: kebab-case for all source files (e.g., `with-asset-items.tsx`, `use-access-token.ts`)
- **Component naming**: PascalCase for components, camelCase for hooks and utilities
- **No default exports** for non-route files; route files export `Route` via `createFileRoute`
- **Route tree**: `src/routeTree.gen.ts` is auto-generated by the TanStack Router Vite plugin — never edit manually

## Environment Variables

| Variable               | Required | Purpose                                  |
| ---------------------- | -------- | ---------------------------------------- |
| `VITE_GOOGLE_CLIENT_ID`| Yes      | Google OAuth client ID                   |

Set in `.env.local` (gitignored). The `.env` file contains an empty placeholder.

## Gotchas

1. **`verbatimModuleSyntax`** — enabled in tsconfig. Use `import type` for type-only imports or builds will fail.
2. **Vite plugin order** — `TanStackRouterVite()` MUST come before `viteReact()` in `vite.config.ts`.
3. **Route path strings** — managed by the TanStack Router Vite plugin. Don't manually edit the path string in `createFileRoute('/...')`.
4. **Build = type-check + build** — `npm run build` runs `tsc --noEmit` before `vite build`.
5. **`routeTree.gen.ts`** — auto-generated, do not edit. It regenerates on dev server start and during build.
6. **External API dependency** — the app requires the .NET API running at `http://localhost:5185` for full functionality.
7. **No `"use client"` directives** — this is a Vite SPA with no RSC/SSR. Do not add `"use client"` directives to any files. When adding new shadcn components, remove any `"use client"` directives they include.
8. **shadcn/ui uses Base UI** — this project uses `@base-ui/react`, not Radix. Components use `render` prop for composition (not `asChild`). When adding shadcn components, ensure they are compatible with the Base UI primitives used in this project.

## Maintaining This File

Keep `AGENTS.md` in sync with the codebase. When you add, remove, or rename routes, features, hooks, environment variables, or change architectural patterns, update the relevant sections of this file as part of the same change.
