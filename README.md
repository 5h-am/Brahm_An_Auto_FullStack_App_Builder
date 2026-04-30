# Brahm — Automatic Full-Stack App Builder

> **Write a JSON config. Get a live preview, generated React + Node.js code, and a one-click GitHub push.**

**Live Frontend →** [brahm-an-auto-full-stack-app-builde-puce.vercel.app](https://brahm-an-auto-full-stack-app-builde-puce.vercel.app/)  
**Live Backend →** [brahm-an-auto-fullstack-app-builder.onrender.com](https://brahm-an-auto-fullstack-app-builder.onrender.com)

---

## What Is Brahm?

Brahm is a full-stack, low-code application builder. You describe your app as a JSON configuration — defining entities, components, fields, and layouts — and the platform handles everything else:

- **Live Preview** — a sandboxed React 18 runtime renders your app in real time inside the builder
- **Code Generation** — the engine produces ready-to-run React view components and Express handler/service/repo triplets, one per entity
- **GitHub Export** — push all generated files to a new repository with one click using a stored Personal Access Token
- **Reflexive Backend** — entity API routes are registered dynamically at runtime based on your project config, scoped by user and project for strict data isolation
- **CSV Import** — bulk-seed any entity with data directly from the builder
- **i18n** — define multi-language strings in your config; the preview renders a locale switcher automatically

Brahm is built as a production-grade monorepo. Everything from the shared engine package to the PostgreSQL migration runner was written from scratch.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [The Engine — @brahm/engine](#the-engine--brahmengine)
- [The Builder UI](#the-builder-ui)
- [Authentication](#authentication)
- [Reflexive Backend (Dynamic Data Routes)](#reflexive-backend-dynamic-data-routes)
- [Live Preview Runtime](#live-preview-runtime)
- [Code Generation](#code-generation)
- [GitHub Export](#github-export)
- [CSV Import](#csv-import)
- [Internationalization (i18n)](#internationalization-i18n)
- [Database & Migrations](#database--migrations)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Running Tests](#running-tests)
- [Known Issues & Regressions](#known-issues--regressions)

---

## Architecture Overview

```
brahm/
├── engine/                  # @brahm/engine — shared normalize/validate/codegen
├── platform/
│   ├── backend/             # Express API (Node.js + PostgreSQL)
│   └── frontend/            # React + Vite builder UI
├── migrations/              # SQL migration files + runner
└── package.json             # npm workspaces root
```

Brahm uses **npm workspaces** to wire the three packages together. The engine is declared as a workspace dependency, so both the backend (CommonJS) and the frontend (Vite/ESM via a dedicated browser build) resolve it from the local package without any publishing step.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Styling | styled-components + CSS variables |
| State management | Zustand |
| Code editor | Monaco Editor (VS Code's editor, in-browser) |
| Backend framework | Express.js (Node.js) |
| Database | PostgreSQL (via `pg` connection pool) |
| Authentication | bcrypt (12 rounds) + JWT dual-token (access + refresh) |
| Schema validation | Zod v3 (`^3.22.4`) |
| ID generation | nanoid v3 (pinned — v4+ is ESM-only) |
| Syntax highlighting | highlight.js |
| CSV parsing | PapaParse |
| Security | Helmet, CORS with credentials, cookie-parser, express-rate-limit |
| Encryption | AES-256-GCM (GitHub PAT storage) |
| Preview runtime | React 18.3.1 UMD from jsDelivr (sandboxed iframe) |
| Deployment — frontend | Vercel |
| Deployment — backend | Render |

---

## Project Structure

```
brahm/
│
├── engine/
│   ├── index.js              # CJS entry (Node.js / backend)
│   ├── index.browser.js      # Pure ESM entry (Vite / frontend bundle)
│   ├── normalizer.js         # Shorthand expansion + default injection
│   ├── validator.js          # Zod schemas for all 7 component types
│   ├── constants.js          # DEFAULT_TOKENS
│   └── templates/
│       ├── index.js          # generateTemplates() orchestrator
│       ├── component.template.js
│       ├── handler.template.js
│       ├── service.template.js
│       └── repo.template.js
│
├── platform/
│   ├── backend/
│   │   ├── server.js         # 11-step async startup sequence
│   │   ├── repo/
│   │   │   ├── db.js         # Singleton pg Pool (SSL-aware)
│   │   │   ├── auth.repo.js
│   │   │   ├── project.repo.js
│   │   │   ├── data.repo.js  # app_data queries (user+project scoped)
│   │   │   └── github.repo.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── project.service.js
│   │   │   └── data.service.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── project.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── data.routes.js    # registerEntityRoutes (reflexive)
│   │   │   ├── github.routes.js
│   │   │   └── preview.routes.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── security.middleware.js
│   │   │   └── error.middleware.js
│   │   └── utils/
│   │       └── encrypt.js        # AES-256-GCM
│   │
│   └── frontend/
│       ├── vite.config.js
│       ├── src/
│       │   ├── main.jsx          # React entry + ThemeWrapper
│       │   ├── App.jsx           # Routes + ProtectedRoute
│       │   ├── store/
│       │   │   └── builderStore.js   # Zustand store
│       │   ├── routes/
│       │   │   ├── LandingPage.jsx
│       │   │   ├── AuthPage.jsx
│       │   │   ├── DashboardPage.jsx
│       │   │   └── BuilderPage.jsx   # Main builder shell
│       │   ├── components/
│       │   │   ├── SkeletonComponent.jsx
│       │   │   ├── BrahmErrorBoundary.jsx
│       │   │   └── dynamic/
│       │   │       ├── Form.jsx
│       │   │       ├── Table.jsx
│       │   │       ├── Header.jsx
│       │   │       ├── Card.jsx
│       │   │       ├── Button.jsx
│       │   │       ├── Input.jsx
│       │   │       └── Text.jsx
│       │   ├── registry/
│       │   │   └── index.jsx     # ComponentRegistry (React.lazy)
│       │   ├── hooks/
│       │   │   └── useFetch.js   # apiFetch with token refresh interceptor
│       │   ├── styles/
│       │   │   ├── tokens.js     # lightTokens + darkTokens
│       │   │   └── global.css
│       │   └── data/
│       │       └── exampleConfigs.js
│
└── migrations/
    ├── migrate.js             # Idempotent migration runner
    ├── 001_create_users.sql
    ├── 002_create_projects.sql
    ├── 003_create_refresh_tokens.sql
    ├── 004_create_app_data.sql
    └── 005_create_github_credentials.sql
```

---

## The Engine — @brahm/engine

The engine is the shared contract between the builder, the preview runtime, and the backend. It exposes three functions:

### `normalize(config)`

Expands shorthand properties (9 shorthands supported) and injects sensible defaults for forms, tables, buttons, and theme tokens so users can write minimal configs without spelling out every field. IDs are generated with nanoid v3.

### `validate(normalizedConfig)`

Runs Zod `safeParse` against a discriminated schema dispatch — each of the seven starter component types has its own dedicated sub-schema. No component falls through to a generic fallback.

**Supported component types:** `form` · `table` · `header` · `card` · `button` · `input` · `text`

### `generateTemplates(normalizedConfig, projectId)`

Returns `{ frontend: { [filename]: codeString }, backend: { [filename]: codeString } }`. For each entity defined in the config:

- **Frontend**: A `EntityNameView.jsx` React component with full CRUD operations wired to the project's API
- **Backend**: A `handler.js` / `service.js` / `repo.js` triplet with Postgres queries scoped to the project and user

### Dual Build Targets

The engine ships two entry points:

| Entry | Format | Used by |
|---|---|---|
| `index.js` | CommonJS | Express backend (`require`) |
| `index.browser.js` | Pure ESM | Vite frontend bundle |

Vite's `exports` condition resolves `index.browser.js` automatically — no Node.js APIs (`fs`, `path`, `createRequire`) appear in the browser bundle.

---

## The Builder UI

The builder is a single-page shell (`BuilderPage.jsx`) with five zones:

```
┌─────────────────────────────────────────────────────────┐
│  Topbar (44px) — breadcrumb · dark mode · actions       │
├──────────┬────────────────────────┬─────────────────────┤
│          │                        │  Preview            │
│ Sidebar  │  Monaco Editor         │  ─────────────────  │
│ (200px)  │  (flex 1)              │  Frontend Code      │
│          │                        │  ─────────────────  │
│          │                        │  Backend Code       │
├──────────┴────────────────────────┴─────────────────────┤
│  StatusBar (32px) — validation state · locale switcher  │
└─────────────────────────────────────────────────────────┘
```

### Editor Pipeline (300ms debounce)

Every keystroke in Monaco starts a timer. When it fires:

1. `JSON.parse` — catches malformed JSON immediately
2. `normalize(config)` — expands shorthands, injects defaults
3. `validate(normalizedConfig)` — runs Zod schemas
4. Update Zustand store — sets `normalizedConfig`, `validationErrors`
5. Set Monaco error markers — squiggly underlines with line/column from `getLineColumn()`
6. Auto-save — if valid, `PUT /api/projects/:id` persists the config

### Uncontrolled Editor

The Monaco editor is **uncontrolled** (`defaultValue=""`, not `value={rawConfig}`). A `rawConfigRef` holds the editor's current content. This prevents a React re-render cascade that previously caused pasted content to be wiped — the paste bug root cause was: `onChange → setRawConfig → React re-render → new value prop → Monaco fires onChange again with undefined`.

### Sidebar

Three sections:

1. **Component Palette** — 7 draggable tiles (22×22px icons + display names). Drag onto the editor to push the component snippet into the config's `layout` array
2. **Pages** — project page list
3. **Registry** — live ComponentRegistry keys rendered in monospace 10px

### Dark Mode

Toggled via Zustand `isDarkMode`. A `ThemeWrapper` in `main.jsx` reads the flag and passes either `lightTokens` or `darkTokens` to styled-components `ThemeProvider`. Instant swap, no CSS transitions.

### State Reset on Navigation

Zustand is a global singleton. `BuilderPage` calls `resetBuilderState()` in a `useEffect` cleanup so switching projects never shows stale code or config from the previous project. `isDarkMode` is preserved across resets.

### Examples Panel

A slide-in panel (triggered from the Topbar) displays five curated app templates as cards with entity pills. Selecting one calls `editorRef.current.setValue(template)` which flows through the normal onChange pipeline — auto-normalizes, validates, and updates the preview.

---

## Authentication

Auth follows a strict layered architecture: `repo → service → controller → routes`.

| Concern | Implementation |
|---|---|
| Password hashing | bcrypt, 12 salt rounds |
| Access token | JWT, 15-minute expiry, returned in response body |
| Refresh token | JWT, 7-day expiry, stored as HTTP-only cookie |
| Token rotation | On every `/auth/refresh` call, the old token is revoked and a new one is issued |
| Token storage (client) | `localStorage` key `brahm_access_token` |
| Request interception | `apiFetch` in `useFetch.js` — on 401, automatically calls `/auth/refresh`, updates the stored token, and retries the original request |
| Route protection | `ProtectedRoute` checks token expiry from the JWT `exp` claim before rendering |

### Auth Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login, receive access token + refresh cookie |
| `POST` | `/api/auth/refresh` | Rotate refresh token, issue new access token |
| `POST` | `/api/auth/logout` | Revoke refresh token, clear cookie |

---

## Reflexive Backend (Dynamic Data Routes)

When a project is created or updated with a new config, `registerEntityRoutes(app, projectId, entities)` fires. It:

1. Reads the entity list from the config
2. Generates CRUD route paths (`GET /api/projects/:id/data/:entity`, `POST`, `PUT`, `DELETE`)
3. Registers them on the Express app at runtime
4. Uses a **module-level `Set`** to track registered route strings — duplicate registrations are silently skipped, preventing Express from mounting the same path twice

Every `app_data` query enforces both `project_id` AND `user_id` — there is no query path that allows cross-user data access.

### Data Endpoints (per entity)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/projects/:id/data/:entity` | List all records |
| `POST` | `/api/projects/:id/data/:entity` | Create record |
| `PUT` | `/api/projects/:id/data/:entity/:recordId` | Update record |
| `DELETE` | `/api/projects/:id/data/:entity/:recordId` | Delete record |
| `POST` | `/api/projects/:id/data/:entity/import` | Bulk CSV import (max 500 rows) |

### Payload Validation & Type Coercion

`validatePayload` runs a two-pass pipeline:

1. `coerceIncomingPayload` — converts numeric strings to `number` and boolean strings (`"true"` / `"false"`) to `boolean` based on the entity's field type definitions
2. Zod validation — enforces the coerced payload against the entity schema, returning granular field-level error messages on failure

---

## Live Preview Runtime

The preview uses a **Two-Environment model** — the parent Builder app and the preview each run independent React runtimes. Communication is via `postMessage`.

### Inline Preview (Builder)

- The iframe `srcDoc` is a module-level constant (defined once, never recreated) so React never reloads the iframe after mount
- The iframe sandbox is `allow-scripts allow-same-origin allow-forms`
- React 18.3.1 UMD scripts load from **jsDelivr** (not unpkg) — jsDelivr serves `Access-Control-Allow-Origin: *` without redirects, which is required for null-origin sandboxed iframes
- An `iframeLoadedRef` tracks whether the iframe has fired its `onLoad` event. Config messages are only sent when the iframe is ready — eliminating the postMessage timing race
- The message payload is `{ type: 'CONFIG_UPDATE', payload: { ...config, _projectId, _accessToken } }`

### Preview Runtime Components

The iframe contains seven inline component renderers written with `React.createElement` (no JSX transform available in the UMD context):

`form` · `table` · `header` · `card` · `button` · `input` · `text`

`AppRoot` orchestrates rendering, manages entity state, and handles the `handleAction` dispatch for form submissions and table refreshes. `BrahmForm` coerces input values to typed JSON before API submission and surfaces backend validation errors in the UI.

### Standalone Preview

`POST /preview` stores a config in a server-side memory `Map` with a nanoid key and 30-minute TTL. `GET /preview/:key` serves a self-contained HTML page with the same inline React runtime — no authentication required. The Preview button in the builder opens this page in a new tab.

The standalone preview response includes a `Content-Security-Policy` header that explicitly allows `jsdelivr.net` and `unsafe-inline` scripts, overriding Helmet's default strict CSP.

---

## Code Generation

Clicking the **Frontend Code** or **Backend Code** tab calls `generateTemplates(normalizedConfig, projectId)` from the engine and stores results in Zustand. The code panel renders per-entity file stacks with:

- Sticky filename headers
- Syntax highlighting via highlight.js (GitHub theme)
- Horizontal overflow scrolling for long lines
- Vertical scroll with custom scrollbar styling

Generated code resets to `null` whenever `normalizedConfig` changes (handled in `setNormalizedConfig` in the Zustand store) so stale code never persists.

---

## GitHub Export

### Flow

1. User opens the GitHub modal, enters their Personal Access Token and repository name
2. The PAT is sent to `POST /api/github/credentials` — encrypted server-side with **AES-256-GCM** and stored in the `github_credentials` table, scoped to the user account
3. On export, the backend calls the GitHub API to:
   - Create the repository with `auto_init: true` (creates an initial commit so the repo is never empty)
   - Fetch the latest commit SHA and tree SHA
   - Build a new git tree containing all generated files
   - Create a commit against that tree
   - Update the `main` branch ref to point to the new commit
4. The entire push is atomic — either all files land or none do

### Security

- PATs are never stored in plaintext. The AES-256-GCM encryption key lives in `ENCRYPTION_KEY` environment variable
- Credentials are scoped per user — one Brahm account, one stored PAT

### GitHub API Endpoints (Backend)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/github/credentials` | Store/update encrypted PAT |
| `GET` | `/api/github/credentials` | Check if credentials exist |
| `POST` | `/api/github/push` | Generate code and push to GitHub |

---

## CSV Import

The import flow has three stages, all inside a modal:

1. **Upload** — select a `.csv` file, parsed client-side with PapaParse
2. **Column Mapping** — detected CSV headers are mapped to entity fields with auto-matching based on name similarity. Users can adjust mappings before import
3. **Preview** — a table shows the first rows of data as they will be imported

On confirm, the client posts the mapped rows to `POST /api/projects/:id/data/:entity/import`. The backend uses a **database transaction** for atomicity — if any row fails validation, the entire import is rolled back. Maximum 500 rows per import.

After a successful import, a `DATA_REFRESH` postMessage is sent to the preview iframe, which re-fetches the entity's data and updates the UI without requiring a manual Apply.

---

## Internationalization (i18n)

i18n is defined directly in the JSON config under a top-level `i18n` key:

```json
{
  "i18n": {
    "en": { "greeting": "Hello", "submit": "Submit" },
    "es": { "greeting": "Hola", "submit": "Enviar" }
  },
  "layout": [
    { "type": "button", "props": { "label": "t:submit" } }
  ]
}
```

Any string prop prefixed with `t:` is resolved through the `t()` helper in the preview runtime using the active locale. The normalizer injects default i18n structure and the validator enforces the `I18nSchema`. The preview renders a locale switcher pinned to the top of the app using `position: sticky`.

---

## Database & Migrations

The migration runner (`migrations/migrate.js`) uses a `_migrations` tracking table to record which SQL files have been applied. Re-running the runner is safe — already-applied migrations are skipped.

| Migration | Table |
|---|---|
| `001` | `users` |
| `002` | `projects` |
| `003` | `refresh_tokens` |
| `004` | `app_data` |
| `005` | `github_credentials` |

The `db.js` pool is a singleton — Node.js module caching ensures only one pool is created regardless of how many files `require` it. In production, `ssl: { rejectUnauthorized: false }` is applied when `NODE_ENV=production` to support managed database providers (Render, Supabase).

---

## Production Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | `npm run build -w platform/frontend` as build command |
| Backend | Render | Node.js web service, `npm run start -w platform/backend` |
| Database | Render PostgreSQL | Managed, SSL enabled |

### Build Scripts (root `package.json`)

```bash
npm run build          # builds all workspaces
npm run build:frontend # platform/frontend only
npm run build:backend  # platform/backend only (no-op, JS is source)
```

### Native Bindings

The frontend `package.json` explicitly declares `optionalDependencies` for Linux x64 native bindings required by Vercel's build environment:

- `@rolldown/binding-linux-x64-gnu` — Vite's Rolldown bundler
- `lightningcss-linux-x64-gnu` — CSS transformation

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM (GitHub PAT encryption) |
| `FRONTEND_URL` | Allowed CORS origin (e.g. `https://your-frontend.vercel.app`) |
| `PORT` | Server port (default `3001`) |
| `NODE_ENV` | `production` enables SSL for database pool |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (e.g. `https://your-backend.onrender.com`) |

---

## Local Development

### Prerequisites

- Node.js 20.x
- PostgreSQL running locally
- npm 8+

### Setup

```bash
# Clone and install all workspace dependencies
git clone <repo-url>
cd brahm
npm install

# Copy and fill environment files
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

# Run database migrations
node migrations/migrate.js

# Start backend (port 3001)
npm run dev -w platform/backend

# Start frontend (port 5173, proxied to 3001)
npm run dev -w platform/frontend
```

The Vite dev server proxies `/api` and `/preview` requests to `localhost:3001` so no CORS configuration is needed during local development.

---

## Running Tests

### Engine Unit Tests

```bash
cd engine
npx jest --runInBand
```

75 tests covering: shorthand normalization, all 7 component Zod schemas, Monaco marker shape, malformed input resilience, and generated template output.

**Current status: 72 passed / 3 failed** — see Known Issues below.

### Backend API Tests

```bash
# Create and migrate a test database first
createdb brahm_test
DATABASE_URL=postgresql://localhost/brahm_test node migrations/migrate.js

# Run auth suite
cd platform/backend
npx jest --runInBand __tests__/auth.test.js
```

14 tests covering registration, login, duplicate email handling, token/cookie shape, refresh rotation, and Helmet/CORS headers.

**Current status: 11 passed / 3 failed** — DB assertion failures due to test database isolation issue (server writes to `brahm_db` while test pool queries `brahm_test`).

### Frontend Build Verification

```bash
npm run build -w platform/frontend
# Expected: 0 errors, ~150 modules
```

---

## Known Issues & Regressions

### Engine

| # | Issue | Root Cause |
|---|---|---|
| 1 | `normalize(null)` throws an uncaught exception | No null guard at the top of the normalizer |
| 2 | `normalize(undefined)` throws an uncaught exception | Same as above |
| 3 | Generated frontend templates do not embed the supplied `projectId` in some code paths | Template interpolation not applied uniformly across all entity template variants |

### Backend Tests

| # | Issue | Root Cause |
|---|---|---|
| 4 | DB assertion tests fail in isolation | Spawned test server writes to `brahm_db`; test pool reads from `brahm_test` despite `DATABASE_URL` env override |

### Frontend E2E

| # | Issue | Status |
|---|---|---|
| 5 | Playwright Chromium tests blocked | Chromium binary install fails with `ENOSPC` in CI due to disk constraints |

---

## Design Decisions & Lessons Learned

**Why CommonJS for the engine?** Both Express (Node.js) and Vite (which can consume CJS via interop) need the engine. A pure ESM engine would require `await import()` in Express, complicating the startup sequence. CJS with a separate browser ESM build was the cleanest path.

**Why nanoid v3?** v4+ is ESM-only. Since the engine's CJS entry is consumed via `require()` in Node.js, pinning to v3 avoids a hard incompatibility.

**Why Zod `^3.22.4`?** Zod v4 introduced breaking API changes. Pinning the `^3.x` range — and deleting the lockfile before reinstalling — ensures no v4 artifacts survive in the node_modules tree.

**Why jsDelivr for the preview CDN?** unpkg redirects version-range URLs; browsers block redirects from null-origin sandboxed iframes under CORS policy. jsDelivr serves `Access-Control-Allow-Origin: *` without redirects.

**Why uncontrolled Monaco?** Controlled mode (`value={rawConfig}`) causes a re-render cascade on paste: `onChange → setState → re-render → new value prop → Monaco fires onChange with undefined`. Making the editor uncontrolled with a `useRef` breaks the cycle entirely.

---

## License

MIT

---

*Built by Shubham Kumar*
