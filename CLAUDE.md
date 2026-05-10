# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run ESLint
npx tsc --noEmit # Type-check without building
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
| `src/store/useStore.ts` | Zustand global state: active tab, theme, modal visibility, selected image |
| `src/types/index.ts` | `Image`, `User`, `TabId`, `RESOLUTIONS`, `COLOR_OPTIONS` constants |

### Component Structure

```
src/components/
├── Sidebar/              — Left nav (icons on desktop, slide-in on mobile), theme toggle, auth
├── GeneratePage/         — Prompt form + image preview panel (two-column layout)
├── FeedPage/             — Masonry grid with search bar
├── ImageCard/            — Card with image, author, bookmark button
├── ImageDetailModal/     — Full image + metadata + download + "Generate with settings"
├── GenerationHistoryPage/— List of user's generated images
├── MyCollectionPage/     — Grid of bookmarked images
└── SignInModal/          — GitHub sign-in prompt
```

### API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/generate` | POST | Required | Generate image via DALL-E 3, save to DB |
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
- Mobile breakpoint: 768px — sidebar becomes a slide-in drawer, mobile header appears

### Path Aliases

`@/` maps to `./src/` (tsconfig). Example: `@/components/Sidebar/Sidebar`.
