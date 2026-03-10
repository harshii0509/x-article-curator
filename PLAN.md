# Link Saver — Architecture & Data Model

## Context

New project. Save valuable links while browsing via a Chrome extension, view and organize them in a web app, and share them with friends — both via public URLs and directly with other users.

---

## High-Level Overview

### Three Components

```
┌─────────────────────┐     ┌──────────────────────────────┐     ┌──────────┐
│  Chrome Extension   │────▶│  Next.js Backend + Frontend  │────▶│ Database │
│  (Manifest V3)      │     │  (API Routes + React UI)     │     │ (SQLite) │
└─────────────────────┘     └──────────────────────────────┘     └──────────┘
```

---

## 1. Chrome Extension (Frontend #1)

**Purpose**: One-click save from any webpage.

**Auth**: Google Sign-In (via Chrome Identity API — `chrome.identity.getAuthToken`). This gives the extension a Google ID token without any popup/redirect. The token is sent to the backend, which verifies it and returns an API token (UUID).

**Flow**:
1. User clicks extension icon on any page
2. If not signed in → "Sign in with Google" button (uses `chrome.identity`)
3. If signed in → shows current page title + URL + "Save" button
4. On Save → `POST /api/links` with `Authorization: Bearer <apiToken>`
5. Shows confirmation: "Saved!"

**Permissions**: `identity`, `activeTab`, `storage`

---

## 2. Web App (Frontend #2 + Backend)

**Framework**: Next.js 15 (App Router, TypeScript, Tailwind CSS)

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/dashboard` | Your saved links (authenticated) |
| `/collections` | Your collections (authenticated) |
| `/collections/[id]` | Single collection view (authenticated) |
| `/shared` | Links/collections shared with you (authenticated) |
| `/c/[slug]` | Public collection page (no auth needed) |
| `/login` | Google sign-in page |

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/auth/google` | Verify Google ID token, return apiToken |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/links` | List user's saved links |
| `POST` | `/api/links` | Save a new link (+ auto-extract metadata) |
| `DELETE` | `/api/links/[id]` | Delete a saved link |
| `PATCH` | `/api/links/[id]` | Update link (mark read, edit) |
| `GET` | `/api/collections` | List user's collections |
| `POST` | `/api/collections` | Create a collection |
| `PATCH` | `/api/collections/[id]` | Update collection (title, public/private) |
| `DELETE` | `/api/collections/[id]` | Delete a collection |
| `POST` | `/api/collections/[id]/links` | Add links to a collection |
| `DELETE` | `/api/collections/[id]/links/[linkId]` | Remove link from collection |
| `GET` | `/api/collections/[id]/public` | Get public collection (no auth) |
| `POST` | `/api/shares` | Share a link or collection with a user |
| `GET` | `/api/shares` | List items shared with me |
| `PATCH` | `/api/shares/[id]` | Mark share as seen |

---

## 3. Database

**Engine**: SQLite via `better-sqlite3` + Drizzle ORM (simple, zero-config, single file)

---

## Data Model

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | PK, auto-increment |
| `email` | text | NOT NULL, UNIQUE |
| `googleId` | text | NOT NULL, UNIQUE |
| `name` | text | From Google profile |
| `image` | text | Google avatar URL |
| `apiToken` | text | NOT NULL, UNIQUE — UUID for API auth |
| `createdAt` | integer | ms since epoch |

### `links`

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | PK, auto-increment |
| `userId` | integer | FK → users.id, NOT NULL |
| `url` | text | NOT NULL |
| `title` | text | Extracted via unfurl.js |
| `description` | text | From og:description |
| `imageUrl` | text | From og:image |
| `siteName` | text | From og:site_name |
| `author` | text | From og:article:author |
| `favicon` | text | Site favicon URL |
| `isRead` | integer | 0 or 1, default 0 |
| `savedAt` | integer | NOT NULL, ms since epoch |
| `createdAt` | integer | NOT NULL, ms since epoch |

**Unique index**: `(url, userId)` — same user can't save the same link twice.

### `collections`

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | PK, auto-increment |
| `userId` | integer | FK → users.id, NOT NULL (creator) |
| `title` | text | NOT NULL — e.g. "React Deep Dives" |
| `description` | text | Optional |
| `slug` | text | UNIQUE — for public URL `/c/react-deep-dives` |
| `isPublic` | integer | 0 or 1, default 0 |
| `createdAt` | integer | ms since epoch |
| `updatedAt` | integer | ms since epoch |

### `collection_links` (join table)

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | PK, auto-increment |
| `collectionId` | integer | FK → collections.id, NOT NULL |
| `linkId` | integer | FK → links.id, NOT NULL |
| `sortOrder` | integer | For manual ordering |
| `addedAt` | integer | ms since epoch |

**Unique index**: `(collectionId, linkId)` — no duplicates within a collection.

### `shares` (user-to-user sharing)

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | PK, auto-increment |
| `fromUserId` | integer | FK → users.id (sender) |
| `toEmail` | text | NOT NULL — recipient's email |
| `toUserId` | integer | FK → users.id, nullable (resolved when recipient signs up) |
| `linkId` | integer | FK → links.id, nullable |
| `collectionId` | integer | FK → collections.id, nullable |
| `message` | text | Optional note from sender |
| `seen` | integer | 0 or 1, default 0 |
| `createdAt` | integer | ms since epoch |

**Constraint**: Either `linkId` OR `collectionId` is set, never both.

**Design note**: `toEmail` is the primary target. If the recipient already has an account, `toUserId` is set immediately. If they don't have an account yet, `toUserId` is null — when they sign up with that email, we resolve it and they see the shared items.

---

## Entity Relationship Diagram

```
users ──────┬──── links
            │       │
            │       ├──── collection_links ──── collections
            │       │                              │
            │       └──── shares ──────────────────┘
            │               │
            └───────────────┘ (fromUserId, toUserId)
```

---

## How Sharing Works

### Public sharing (anyone with the URL)
1. User creates a collection and toggles `isPublic = true`
2. System generates a `slug` from the title (e.g. "react-deep-dives")
3. Collection is viewable at `/c/react-deep-dives` — no login required
4. User can copy and share this URL anywhere

### User-to-user sharing
1. User selects a link or collection → clicks "Share"
2. Enters recipient's email + optional message
3. Creates a row in `shares` table
4. If recipient has an account → appears in their `/shared` page immediately
5. If recipient doesn't have an account → when they sign up with that email, pending shares resolve automatically

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (Node.js runtime) |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Auth | Google Sign-In (ID token verified with `jose`) |
| Metadata | `unfurl.js` for Open Graph / Twitter Card extraction |
| Email (optional) | Resend — for share notifications |
| Extension | Chrome Manifest V3 + Chrome Identity API |

---

## Step-by-Step Build Order

### Phase 1: Foundation
1. Initialize Next.js project with TypeScript + Tailwind
2. Set up SQLite + Drizzle ORM
3. Define all tables in schema
4. Run `db:push` to create the database

### Phase 2: Auth
5. Create Google OAuth credentials (Google Cloud Console)
6. Build `POST /api/auth/google` — verify ID token, find/create user, return apiToken
7. Build login page with "Sign in with Google" button (GSI SDK)
8. Store apiToken in localStorage, send as Bearer token
9. Build `resolveAuth()` utility (check Bearer token against DB)

### Phase 3: Core — Save & View Links
10. Build `POST /api/links` — save URL + extract metadata via unfurl.js
11. Build `GET /api/links` — return user's links sorted by savedAt
12. Build `DELETE /api/links/[id]` — delete a link
13. Build `PATCH /api/links/[id]` — mark as read
14. Build dashboard page — display saved links grouped by week

### Phase 4: Chrome Extension
15. Create Manifest V3 extension with `chrome.identity` for Google auth
16. Build popup: "Sign in" state → "Save this page" state
17. Extension calls `POST /api/auth/google` with the ID token to get apiToken
18. Extension calls `POST /api/links` with the apiToken to save pages
19. Store apiToken in `chrome.storage.local`

### Phase 5: Collections
20. Build `POST /api/collections` — create a named collection
21. Build `GET /api/collections` — list user's collections
22. Build `POST /api/collections/[id]/links` — add links to collection
23. Build `DELETE /api/collections/[id]/links/[linkId]` — remove link
24. Build `PATCH /api/collections/[id]` — rename, toggle public
25. Build collections UI pages
26. Build public collection page at `/c/[slug]` (no auth)

### Phase 6: Sharing
27. Build `POST /api/shares` — share a link or collection with an email
28. Build `GET /api/shares` — list items shared with me
29. Build `PATCH /api/shares/[id]` — mark as seen
30. Build "Shared with me" page
31. Add share resolution on signup (resolve pending shares by email)
32. Optional: send email notification via Resend when someone shares with you

### Phase 7: Polish
33. Landing page
34. Loading states + error boundaries
35. Keyboard navigation
36. Mobile responsive
37. Extension icons + branding

---

## Project Structure

```
project/
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── (landing)/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── collections/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── shared/page.tsx
│   │   │   ├── c/[slug]/page.tsx          ← public collection
│   │   │   └── api/
│   │   │       ├── auth/google/route.ts
│   │   │       ├── auth/logout/route.ts
│   │   │       ├── links/route.ts
│   │   │       ├── links/[id]/route.ts
│   │   │       ├── collections/route.ts
│   │   │       ├── collections/[id]/route.ts
│   │   │       ├── collections/[id]/links/route.ts
│   │   │       └── shares/route.ts
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── auth.ts                    ← resolveAuth()
│   │   │   ├── unfurl.ts                  ← metadata extraction
│   │   │   └── slug.ts                    ← slug generation
│   │   └── components/
│   │       ├── link-card.tsx
│   │       ├── link-list.tsx
│   │       ├── collection-card.tsx
│   │       ├── share-dialog.tsx
│   │       └── auth-button.tsx
│   ├── drizzle.config.ts
│   └── .env.local
│
├── extension/
│   ├── manifest.json
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.js
│   ├── background/
│   │   └── service-worker.js
│   └── icons/
│
└── PLAN.md
```

---

## Environment Variables

```
GOOGLE_CLIENT_ID=               # Server-side token verification
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # Client-side GSI SDK
API_SECRET_KEY=                 # Global admin API key (optional)
RESEND_API_KEY=                 # For share notification emails (optional)
```
