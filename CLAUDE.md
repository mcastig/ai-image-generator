# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start dev server at http://localhost:3000
npm run build         # Production build
npm run start         # Run production build
npm run lint          # Run ESLint
npm run test          # Run unit tests (202 tests, 100% coverage)
npm run test:coverage # Run tests with coverage report
npx tsc --noEmit      # Type-check without building
```

## Environment Variables

Required in `.env.local`:
- `AUTH_SECRET` — NextAuth v5 secret (generated)
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — GitHub OAuth App credentials
- `DATABASE_URL` — Neon PostgreSQL connection string
- `HUGGINGFACE_API_TOKEN` — HuggingFace API token for FLUX.1-schnell image generation

## Architecture

Single-page app: the root `src/app/page.tsx` renders all "pages" as tab-switched components. No Next.js route-based navigation between views.

### Key Files

| Path | Purpose |
|------|---------|
| `src/auth.ts` | NextAuth v5 config — GitHub OAuth, JWT & session callbacks, DB upsert on first sign-in |
| `src/lib/db.ts` | Neon serverless SQL client via `@neondatabase/serverless` |
| `src/lib/hf.ts` | HuggingFace Inference client — calls FLUX.1-schnell, returns base64 data URL |
| `src/store/useStore.ts` | Zustand global state: active tab, theme, modal visibility, selected image |
| `src/types/index.ts` | `Image`, `User`, `TabId`, `RESOLUTIONS`, `COLOR_OPTIONS` constants |

### Component Structure

```
src/components/
├── Sidebar/              — Icon-only nav on desktop; right-side slide-in drawer on mobile with X close button
├── GeneratePage/         — Prompt form + image preview panel (two-column layout)
├── FeedPage/             — Masonry grid with vertically scrolling layout and search bar (transparent, icon right)
├── ImageCard/            — Image with rounded corners; author + bookmark footer below (transparent bg)
├── ImageDetailModal/     — Full image + metadata + download + "Generate with settings"
├── GenerationHistoryPage/— Large image left, two-column metadata right; items separated by border dividers
├── MyCollectionPage/     — Grid of bookmarked images
└── SignInModal/          — GitHub sign-in prompt
```

### API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/generate` | POST | Required | Generate image via HuggingFace FLUX.1-schnell, save to DB |
| `/api/feed` | GET | Optional | All images, supports `?q=` full-text search |
| `/api/feed/save` | POST | Required | Bookmark (`save: true`) or unbookmark an image |
| `/api/image/[imageId]` | GET | Optional | Single image details |
| `/api/image/[imageId]/generate` | POST | Required | Regenerate using same settings |
| `/api/history` | GET | Required | User's own generated images |
| `/api/collection` | GET | Required | User's bookmarked images |

### Database Schema (Neon PostgreSQL — project `ancient-sun-34799819`)

```
users           — github_id (unique), name, email, avatar_url
images          — user_id, prompt, negative_prompt, color, resolution, guidance, image_url, seed
saved_images    — user_id + image_id (unique pair), created_at
```

### Styling

- Traditional CSS with CSS Modules for component isolation
- CSS custom properties defined in `src/app/globals.css` (dark theme default, `[data-theme="light"]` override)
- Theme toggle stored in Zustand, applied to `document.documentElement` in `page.tsx`
- Font: Inter (loaded via Google Fonts `@import` in globals.css)
- Mobile breakpoint: 768px — sidebar becomes a right-side slide-in drawer, mobile header appears
- Sidebar and mobile header use `--color-bg-primary` to match the main content background in both themes

### Sidebar behaviour

- **Desktop**: fixed 60px-wide left column, icon-only nav items, icon-only sign-in button
- **Mobile**: full-height drawer that slides in from the **right** (`transform: translateX(100%)` → `translateX(0)`); shows an X close button (dark rounded button) at the top, text labels next to icons, full-width sign-in button, user avatar centred at the bottom

### FeedPage layout

- The entire page (search bar + grid) scrolls as one vertical unit (`overflow-y: auto` on `.feed-page`)
- Search bar: transparent background, border only, search icon on the **right** as a submit button
- Grid: CSS `columns: 4` masonry (responsive down to 1 column at 580px)

### GenerationHistoryPage layout

- Each item: large image on the left (220px wide, natural height) + two-column metadata grid on the right
- Left metadata column: Prompt details → Created on → Seed
- Right metadata column: Negative prompt → Input Resolution (looked up from `RESOLUTIONS` array)
- Items separated by a `1px` border with 48px padding above and below; no card background

### ImageCard layout

- `overflow: visible` on the card; image has its own `border-radius: 12px`
- Footer (author avatar + name + bookmark button) sits below the image with `background: transparent`

### Path Aliases

`@/` maps to `./src/` (tsconfig). Example: `@/components/Sidebar/Sidebar`.

## Testing

**Stack:** Jest · ts-jest · React Testing Library · `jest-environment-jsdom`

**Config:** `jest.config.ts` at the project root — path aliases mirror tsconfig, CSS files use `identity-obj-proxy`, image/SVG imports use `src/__mocks__/fileMock.ts`.

**Test files:** `src/__tests__/*.test.(ts|tsx)` — one file per source module.

**Key conventions:**
- API route tests add `/** @jest-environment node */` at the top to get Web platform globals (`Request`, `Response`).
- `next/image` is mocked globally to render a plain `<img>` (see `src/__mocks__/next-image.tsx`).
- `next-auth/react` and `@/auth` are mocked per test file with `jest.mock(...)`.
- Zustand store is reset between tests via `useStore.setState(...)` in `beforeEach`.
- `global.fetch` is mocked inline for components that call API routes.

**Coverage:** 100% statements, branches, functions, and lines across all source files.
