# X Article Curator — Implementation Plan

## Context

Browsing Twitter produces a stream of interesting articles that get lost in bookmarks. This tool gives you a dedicated space to save article links from Twitter, automatically extract their metadata, and review them grouped by week — turning a chaotic bookmark pile into a clean weekly reading list.

## Architecture

Two components:
1. **Chrome Extension** — Runs on x.com/twitter.com. Detects external links in tweets, sends URLs to the backend API via a popup UI.
2. **Next.js Web App** — Stores articles in SQLite, extracts metadata server-side using `unfurl.js`, and renders a weekly-grouped reading list.

## Tech Stack

- **Next.js 14+** (App Router, TypeScript, Tailwind CSS)
- **SQLite** via `better-sqlite3` + **Drizzle ORM** (single-file DB, zero infrastructure)
- **unfurl.js** for server-side Open Graph / Twitter Card metadata extraction
- **Chrome Extension** (Manifest V3)

## Project Structure

```
x-article-curator/
├── web/                          # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Homepage — articles grouped by week
│   │   │   └── api/articles/
│   │   │       └── route.ts      # GET + POST API
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle schema
│   │   │   └── index.ts          # DB connection
│   │   ├── lib/
│   │   │   ├── unfurl.ts         # Metadata extraction wrapper
│   │   │   └── week-utils.ts     # Week grouping helpers
│   │   └── components/
│   │       ├── article-card.tsx
│   │       ├── week-group.tsx
│   │       └── article-list.tsx  # Server Component, queries DB directly
│   └── drizzle.config.ts
│
├── extension/                    # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/                    # Save UI shown on extension click
│   ├── content/content.js        # Link extraction from X.com DOM
│   ├── background/service-worker.js
│   └── options/                  # API URL + key configuration
```

## Database Schema

Single `articles` table:

| Column      | Type    | Notes                                      |
|-------------|---------|---------------------------------------------|
| id          | integer | Primary key, auto-increment                 |
| url         | text    | Article URL, **unique** (dedup constraint)  |
| tweetUrl    | text    | Optional — the tweet that shared it         |
| title       | text    | From og:title                               |
| author      | text    | From og:article:author / twitter:creator    |
| description | text    | From og:description                         |
| imageUrl    | text    | From og:image                               |
| siteName    | text    | From og:site_name                           |
| savedAt     | integer | Timestamp — used for weekly grouping        |
| createdAt   | integer | Timestamp — auto-set on insert              |

## API Design

### `POST /api/articles`
- **Auth**: `Authorization: Bearer <API_SECRET_KEY>` (shared secret)
- **Body**: `{ url, tweetUrl? }`
- Server checks for duplicate, calls `unfurl(url)` for metadata, inserts row
- Returns `{ status: 'created' | 'duplicate', article }`
- CORS headers for extension origin

### `GET /api/articles`
- Returns all articles ordered by `savedAt` desc
- Optional `page` + `limit` params
- Weekly grouping computed on the frontend

## Extension Design

- **Content script** (`content/content.js`): Listens for messages from popup. On request, scans current page DOM for external links using `data-testid="card.wrapper"` and `data-testid="tweetText"` selectors. Returns `{ url, tweetUrl }[]`.
- **Popup** (`popup/popup.js`): Shows detected links with "Save" buttons. Calls `POST /api/articles`. Shows saved/duplicate/error status.
- **Options page**: Form to set API URL and API key, stored in `chrome.storage.sync`.
- Metadata extraction happens **server-side** (not in extension) — more reliable, handles t.co redirects, no DOM scraping fragility for metadata.

## Build Order

### Phase 1: Web App Foundation
1. `npx create-next-app@latest web` (TypeScript, Tailwind, App Router)
2. Install deps: `drizzle-orm`, `better-sqlite3`, `unfurl.js`, `drizzle-kit`
3. Create DB schema + connection (`src/db/`)
4. Run `drizzle-kit generate && drizzle-kit migrate`
5. Create unfurl wrapper (`src/lib/unfurl.ts`)
6. Create `.env.local` with `API_SECRET_KEY`

### Phase 2: API Endpoints
7. Build `POST` and `GET` in `src/app/api/articles/route.ts` with CORS + auth
8. Test with curl

### Phase 3: Chrome Extension
9. Create `extension/` with manifest.json (Manifest V3, x.com + twitter.com hosts)
10. Build options page (API URL + key config)
11. Build content script (link detection from tweets)
12. Build popup (detected links list + save buttons)
13. Create placeholder icons
14. Load unpacked in Chrome, test on x.com

### Phase 4: Frontend Display
15. Create `week-utils.ts` (week start calc, grouping, label formatting)
16. Build `article-card.tsx`, `week-group.tsx`, `article-list.tsx`
17. Wire up `page.tsx` — render weekly-grouped article list
18. Style with Tailwind

### Phase 5: Polish
19. Add delete functionality (`DELETE /api/articles/[id]`)
20. Handle edge cases (content script not loaded, empty states)
21. Git init, `.gitignore`, README

## Verification

1. Start the Next.js dev server (`npm run dev` in `web/`)
2. `curl POST` a test URL to `/api/articles` — verify metadata is extracted and stored
3. Open `localhost:3000` — verify the article appears in the correct week group
4. Load extension in Chrome, navigate to a tweet with a link, click extension icon — verify link is detected
5. Click "Save" in popup — verify it saves and appears on the web app
6. Save the same link again — verify duplicate detection works
