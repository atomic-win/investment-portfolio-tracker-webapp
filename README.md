# Investment Portfolio Tracker

A client-heavy SPA for tracking investment portfolios, built with TanStack Start. Migrated from a Next.js App Router application.

## Stack

| Layer         | Technology                                       |
| ------------- | ------------------------------------------------ |
| Framework     | TanStack Start (`@tanstack/react-start`)         |
| Router        | TanStack Router (file-based routing)             |
| Data fetching | TanStack Query + axios                           |
| Tables        | TanStack Table                                   |
| Toolchain     | Biome (lint + format)                            |
| Bundler       | Vite 8                                           |
| Styling       | Tailwind CSS 4 + shadcn/ui                       |
| Forms         | react-hook-form + zod                            |
| Charts        | TanStack Charts (`@tanstack/charts/react`)        |
| Auth          | Google OAuth (`@react-oauth/google`)             |
| Package mgr   | npm                                             |

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000` and expects an external API at `http://localhost:5185/api`.

## Scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start dev server on port 3000            |
| `npm run build`   | Type-check with tsc + production build   |
| `npm run preview` | Preview production build                 |
| `npm run start`   | Run production server                    |
| `npm run test`    | Run tests with Vitest                    |
| `npm run lint`    | Lint with Biome                          |
| `npm run format`  | Format with Biome                        |
| `npm run check`   | Lint + format check with Biome           |

## Architecture

- **Client-heavy SPA** — all data fetching via React Query + axios to an external API
- **Auth** — Google OAuth token stored in localStorage, sent as Bearer token
- **No server components or server functions** — fully client-rendered
- **HOC composition pattern** — `withAssetItems`, `withCurrency`, `withValuations`, etc.
- **File-based routing** via TanStack Router in `src/routes/`

## Routes

| Path                                                        | File                                                                         |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/`                                                         | `src/routes/index.tsx`                                                       |
| `/assetitems`                                               | `src/routes/assetitems/index.tsx`                                            |
| `/assetitems/add`                                           | `src/routes/assetitems/add.tsx`                                              |
| `/assetitems/:assetItemId`                                  | `src/routes/assetitems/$assetItemId.index.tsx`                               |
| `/assetitems/:assetItemId/transactions/add`                 | `src/routes/assetitems/$assetItemId.transactions.add.tsx`                    |
| `/assetitems/:assetItemId/transactions/:transactionId/edit` | `src/routes/assetitems/$assetItemId.transactions.$transactionId.edit.tsx`    |
| `/portfolio`                                                | `src/routes/portfolio/index.tsx`                                             |
| `/portfolio-trends`                                         | `src/routes/portfolio-trends/index.tsx`                                      |

## License

Source-available — view only. See [LICENSE](LICENSE) for details.
