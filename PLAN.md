# X Article Curator — Implementation Plan

## Context

Browsing Twitter/X produces a stream of interesting articles that get lost in bookmarks. You click a link in a tweet, land on the article, and want a quick way to save it. This tool gives you a Chrome extension to save the current page with one click, a backend that automatically extracts metadata (title, image, description), and a clean web app that shows your saved articles grouped by week.

## How It Works

1. You see a tweet with an interesting article link on X / Twitter.
2. You click the link and open the article in your browser.
3. You click the **X Article Curator** extension icon.
4. The popup shows the current page URL and a **Save** button.
5. You click Save — the extension sends the URL to the backend API.
6. The server calls `unfurl.js` to extract Open Graph metadata (title, description, image, author, site name).
7. The article is stored in SQLite and appears on the web app, grouped into the correct week.

## Architecture

Two components:
1. **Chrome Extension** — Works on any page. Reads the current tab's URL and sends it to the backend API via a popup UI.
2. **Next.js Web App** — Stores articles in SQLite, extracts metadata server-side using `unfurl.js`, and renders a weekly-grouped reading list.

## Tech Stack

- **Next.js 14+** (App Router, TypeScript, Tailwind CSS)
- **SQLite** via `better-sqlite3` + **Drizzle ORM** (single-file DB, zero infrastructure)
- **unfurl.js** for server-side Open Graph / Twitter Card metadata extraction
- **date-fns** for week grouping calculations
- **Chrome Extension** (Manifest V3)

## Project Structure

```
x-article-curator/
├── PLAN.md
├── .gitignore
│
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
│   ├── drizzle.config.ts
│   └── .env.local                # API_SECRET_KEY (not committed)
│
├── extension/                    # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/                    # Save UI — shows current page URL + Save button
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
- **Body**: `{ url }`
- Server checks for duplicate, calls `unfurl(url)` for metadata, inserts row
- Returns `{ status: 'created' | 'duplicate', article }`
- CORS headers for extension origin

### `GET /api/articles`
- Returns all articles ordered by `savedAt` desc
- Optional `page` + `limit` params
- Weekly grouping computed on the frontend

## Extension Design

- **Popup** (`popup/popup.js`): On open, reads the active tab's URL via `chrome.tabs.query`. Shows the URL and a "Save" button. Calls `POST /api/articles`. Shows saved/duplicate/error status.
- **Options page**: Form to set API URL and API key, stored in `chrome.storage.sync`.
- **Permissions**: Only `storage` and `activeTab` — no content scripts, no broad host permissions.
- Metadata extraction happens **server-side** (not in extension) — more reliable, handles redirects, no DOM scraping.

## Current Status

### Completed
- [x] **Phase 1**: Next.js app scaffolded with TypeScript + Tailwind
- [x] **Phase 1**: SQLite + Drizzle ORM schema + connection
- [x] **Phase 1**: `unfurl.js` wrapper for metadata extraction
- [x] **Phase 2**: `POST /api/articles` with auth, dedup, CORS, and unfurl metadata extraction
- [x] **Phase 2**: `GET /api/articles` with pagination
- [x] **Phase 3**: Chrome extension (Manifest V3) — popup saves current page URL, options page for API config
- [x] **Phase 4**: Weekly-grouped article list UI (`article-card`, `week-group`, `article-list` components)
- [x] **Phase 4**: Homepage renders articles grouped by week using `date-fns`

### Remaining (Phase 5 — Polish)
- [ ] Add delete functionality (`DELETE /api/articles/[id]`)
- [ ] Handle edge cases (empty states, error boundaries)
- [ ] Add a proper README

## Setup & Verification

1. In `web/`: `npm install && npm run db:push && npm run dev`
2. Create `web/.env.local` with `API_SECRET_KEY=dev-change-me`
3. Test API: `curl -X POST http://localhost:3000/api/articles -H "Content-Type: application/json" -H "Authorization: Bearer dev-change-me" -d '{"url":"https://example.com"}'`
4. Open `http://localhost:3000` — verify article appears in the correct week group with metadata
5. Load `extension/` as unpacked in Chrome (`chrome://extensions`, Developer mode)
6. Open extension options, set API URL to `http://localhost:3000` and key to `dev-change-me`
7. Navigate to any article page, click extension icon, click Save — verify it appears on the web app
