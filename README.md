# AI Image Generator

A full-stack AI image generator built with Next.js 16, powered by HuggingFace FLUX.1-schnell. Users sign in with GitHub, generate images from text prompts, browse a community feed, and save their favourite images to a personal collection.

## Features

- **Text-to-image generation** — prompt, negative prompt, color tint, resolution, and guidance scale
- **Community feed** — masonry grid with full-text search; whole page scrolls vertically
- **Generation history** — large image + two-column metadata view (prompt, negative prompt, resolution, seed, date)
- **Collections** — bookmark any image from the feed
- **Dark / light theme** — persisted via Zustand; sidebar matches content background in both themes
- **Responsive** — desktop icon-only sidebar, mobile right-side drawer with close button

## Tech Stack

| Layer     | Technology                                   |
| --------- | -------------------------------------------- |
| Framework | Next.js 16 (App Router)                      |
| Language  | TypeScript                                   |
| Auth      | NextAuth v5 — GitHub OAuth                   |
| Database  | Neon PostgreSQL (`@neondatabase/serverless`) |
| Image AI  | HuggingFace Inference API — FLUX.1-schnell   |
| State     | Zustand                                      |
| Styling   | CSS Modules + CSS custom properties          |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/mcastig/ai-image-generator.git
cd ai-image-generator
npm install
```

### 2. Set up environment variables

Create `.env.local` at the project root:

```env
# NextAuth
AUTH_SECRET=<run: npx auth secret>
AUTH_GITHUB_ID=<your GitHub OAuth App client id>
AUTH_GITHUB_SECRET=<your GitHub OAuth App client secret>

# Database
DATABASE_URL=<your Neon or local Postgres connection string>

# HuggingFace
HUGGINGFACE_API_TOKEN=<your HuggingFace read token>
```

#### Where to get each value

- **AUTH_SECRET** — run `npx auth secret` and paste the output
- **AUTH_GITHUB_ID / SECRET** — create an OAuth App at [github.com/settings/developers](https://github.com/settings/developers); set the callback URL to `http://localhost:3000/api/auth/callback/github`
- **DATABASE_URL** — create a free project at [neon.tech](https://neon.tech) or run local Postgres with Docker (see below)
- **HUGGINGFACE_API_TOKEN** — create a free Read token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### 3. Set up the database

**Option A — Local Docker**

```bash
docker compose up -d
```

This starts Postgres and runs `docker/postgres/init.sql` to create the schema.

**Option B — Neon**

Copy the connection string from your Neon dashboard into `DATABASE_URL` and run the SQL in `docker/postgres/init.sql` via the Neon SQL editor.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev          # Dev server with hot reload
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint
npm run test         # Run unit tests
npm run test:coverage # Run tests with coverage report
npx tsc --noEmit     # Type-check without building
```

## Testing

The project has a full unit test suite with **100% code coverage** (statements, branches, functions, and lines).

```bash
npm test                # Run all 202 tests
npm run test:coverage   # Run tests + generate coverage report
```

**Test stack:** Jest · ts-jest · React Testing Library · jsdom

**What's covered:**

| Layer | Tests |
|-------|-------|
| Types & constants | `RESOLUTIONS`, `COLOR_OPTIONS` |
| Zustand store | All actions and initial state |
| `lib/db` | Neon and pg-Pool paths, `upsertUser` |
| `lib/hf` | `textToImageBase64`, resolution parsing |
| `src/auth` | NextAuth config, `jwt` and `session` callbacks |
| API routes | All 7 routes — auth, error, and edge-case branches |
| React components | All 7 components + page shell |

Tests live in `src/__tests__/`. API route tests use `@jest-environment node` to access Web platform globals (`Request`, `Response`).

## Project Structure

```
src/
├── app/
│   ├── api/           — API routes (generate, feed, history, collection, image)
│   ├── globals.css    — CSS custom properties, dark/light theme
│   ├── layout.tsx     — Root layout
│   └── page.tsx       — Single-page shell with tab switching
├── auth.ts            — NextAuth v5 configuration
├── components/        — UI components (Sidebar, GeneratePage, FeedPage, …)
├── lib/
│   ├── db.ts          — Neon/Postgres client
│   └── hf.ts          — HuggingFace FLUX.1-schnell helper
├── store/
│   └── useStore.ts    — Zustand global store
└── types/
    └── index.ts       — Shared types and constants
```

## Database Schema

```sql
users        — id, github_id, name, email, avatar_url, created_at
images       — id, user_id, prompt, negative_prompt, color, resolution,
               guidance, image_url, seed, created_at
saved_images — user_id, image_id, created_at
```

## UI Overview

### Feed
Masonry grid (4 columns → 1 on mobile). The whole page scrolls vertically. Each card shows the image with rounded corners and the author + bookmark button below it on a transparent background. The search bar at the top has a transparent fill with the search icon on the right.

### Generation History
Each entry shows a large image on the left and a two-column metadata panel on the right: **Prompt details / Created on / Seed** in the left column and **Negative prompt / Input Resolution** in the right column. Entries are divided by a subtle border with generous spacing — no card backgrounds.

### Sidebar
- **Desktop**: 60px fixed left column, icon-only.
- **Mobile**: full-height drawer that slides in from the **right**. The top shows a styled X close button; nav items display icons with text labels; the user avatar is centred at the bottom.
