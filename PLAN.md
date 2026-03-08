# Nightstand — Implementation Plan

## Context

Browsing Twitter/X, Substack, and the web produces a stream of interesting articles that get lost in bookmarks. You click a link in a tweet, land on the article, bookmark it "for later." Later never comes. By the weekend, it's buried under fifty other bookmarks.

Nightstand is a personal tool that gives you a browser extension to save articles in one click, a backend that automatically extracts metadata (title, image, description), and a clean web app that shows your saved articles grouped by week — ready for weekend reading.

---

## How It Works

1. You find an article worth reading — on Twitter, Substack, a blog, anywhere.
2. You click the **Nightstand** browser extension icon.
3. The popup shows the current page URL and a **Save** button.
4. You click Save — the extension sends the URL to the backend API.
5. The server extracts Open Graph metadata (title, description, image, author, site name) via `unfurl.js`.
6. The article is stored in SQLite and appears on the web app, grouped into the correct week.
7. On the weekend, you open Nightstand — your reading list is waiting, organized by week.

---

## Architecture

Two components:
1. **Chrome Extension** — Works on any page. Reads the current tab's URL and sends it to the backend API via a popup UI.
2. **Next.js Web App** — Stores articles in SQLite, extracts metadata server-side, and renders a weekly-grouped reading list with keyboard-first navigation.

---

## Tech Stack

- **Next.js 15** (App Router, TypeScript, Tailwind CSS)
- **SQLite** via `better-sqlite3` + **Drizzle ORM**
- **unfurl.js** for server-side Open Graph / Twitter Card metadata extraction
- **date-fns** for week grouping calculations
- **Custom email OTP auth** + **Resend** for passwordless authentication (no NextAuth)
- **Chrome Extension** (Manifest V3)

---

## Project Structure

```
nightstand/
├── PLAN.md
├── IDEA.md
├── .gitignore
│
├── web/                              # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout (fonts, CSS only)
│   │   │   ├── (landing)/
│   │   │   │   ├── layout.tsx        # Minimal layout
│   │   │   │   └── page.tsx          # Landing page
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx        # Auth-aware layout
│   │   │   │   └── page.tsx          # Article list + API token
│   │   │   ├── middleware.ts         # Auth guard: /dashboard → / when unauthenticated
│   │   │   └── api/
│   │   │       ├── articles/
│   │   │       │   └── route.ts      # GET + POST articles
│   │   │       ├── articles/[id]/
│   │   │       │   └── route.ts      # DELETE article
│   │   │       └── auth/
│   │   │           ├── send-otp/
│   │   │           │   └── route.ts  # POST: generate & email OTP
│   │   │           ├── verify-otp/
│   │   │           │   └── route.ts  # POST: verify OTP, create session
│   │   │           └── logout/
│   │   │               └── route.ts  # POST: clear session cookie
│   │   ├── db/
│   │   │   ├── schema.ts            # Drizzle schema (users, articles, otp_codes)
│   │   │   └── index.ts             # DB connection
│   │   ├── lib/
│   │   │   ├── unfurl.ts            # Metadata extraction wrapper
│   │   │   ├── week-utils.ts        # Week grouping helpers
│   │   │   ├── session.ts           # JWT session helpers (sign, verify, cookie)
│   │   │   └── email.ts             # OTP email template via Resend
│   │   ├── hooks/
│   │   │   └── use-keyboard-nav.ts  # Keyboard navigation hook
│   │   └── components/
│   │       ├── article-card.tsx
│   │       ├── article-list.tsx      # Server Component
│   │       ├── week-group.tsx
│   │       ├── auth-header.tsx
│   │       ├── dashboard-shell.tsx   # Client wrapper: keyboard state + focus
│   │       ├── keyboard-help.tsx     # ? shortcut overlay
│   │       ├── toast.tsx             # Action feedback toasts
│   │       └── delete-button.tsx
│   ├── drizzle.config.ts
│   └── .env.local                    # RESEND_API_KEY, JWT_SECRET (not committed)
│
├── extension/                        # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/                        # Save UI
│   ├── background/service-worker.js
│   └── options/                      # API URL + token configuration
```

---

## Database Schema

### `users` table

| Column    | Type    | Notes                        |
|-----------|---------|------------------------------|
| id        | integer | PK, auto-increment           |
| email     | text    | NOT NULL, UNIQUE             |
| name      | text    | nullable                     |
| image     | text    | nullable                     |
| apiToken  | text    | NOT NULL, UNIQUE (UUID)      |
| createdAt | integer | NOT NULL (ms since epoch)    |

### `articles` table

| Column      | Type    | Notes                                              |
|-------------|---------|-----------------------------------------------------|
| id          | integer | PK, auto-increment                                  |
| userId      | integer | FK → users.id                                       |
| url         | text    | NOT NULL                                            |
| tweetUrl    | text    | nullable — source tweet or context                  |
| title       | text    | From og:title                                       |
| author      | text    | From og:article:author / twitter:creator            |
| description | text    | From og:description                                 |
| imageUrl    | text    | From og:image                                       |
| siteName    | text    | From og:site_name                                   |
| isRead      | integer | 0 or 1 — for mark-as-read feature                  |
| openedAt    | integer | nullable — timestamp when user clicked through      |
| savedAt     | integer | NOT NULL (ms since epoch) — used for weekly grouping|
| createdAt   | integer | NOT NULL (ms since epoch)                           |

Unique index on `(url, userId)` — per-user dedup.

### `otp_codes` table

| Column    | Type    | Notes                                |
|-----------|---------|--------------------------------------|
| id        | integer | PK, auto-increment                   |
| email     | text    | NOT NULL                             |
| code      | text    | NOT NULL (6-digit numeric string)    |
| expiresAt | integer | NOT NULL (ms since epoch, 10 min TTL)|
| used      | integer | 0 or 1 — prevent reuse               |
| createdAt | integer | NOT NULL                             |

---

## API Design

### `POST /api/articles`
- **Auth**: `Authorization: Bearer <user-api-token>`
- **Body**: `{ url, tweetUrl? }`
- Checks for duplicate (same URL + same user), calls `unfurl(url)` for metadata, inserts row
- Returns `{ status: 'created' | 'duplicate', article }`
- CORS headers for extension origin

### `GET /api/articles`
- **Auth**: Session (cookie) or Bearer token
- Returns user's articles ordered by `savedAt` desc
- Optional `page` + `limit` params
- Weekly grouping computed on the frontend

### `DELETE /api/articles/[id]`
- **Auth**: Session or Bearer token
- Validates article belongs to authenticated user
- Returns 200 on success

---

## Landing Page

### Content

**Headline:**
Your reading pile, but it actually works.

**Body:**

Every week you find articles worth reading. Blog posts linked in threads. Essays on Substack. Deep dives someone shared on Twitter. You bookmark them. You forget them. By the weekend, they're gone — buried in a graveyard of good intentions.

Nightstand is where you put things you intend to come back to. One click from the browser extension. Title, author, and preview pulled automatically. Organized by the week you saved it. When the weekend comes, your reading list is sitting right where you left it.

No feeds to scroll. No algorithm deciding what's worth your time. No onboarding. No tracking. No ads. Just the articles you picked, grouped by week, on your nightstand.

**CTA:**
Get started — Sign in with your email. Install the extension. Save your first article.

**Colophon:**
Built with Next.js. Open source on GitHub.

### Layout

- Dark background (`bg-black`), centered text, `max-w-xl` (~576px)
- Headline: `text-xl`/`text-2xl`, `font-semibold`, white
- Body: `text-sm`/`text-base`, `text-zinc-400`, `leading-relaxed`
- Font: Geist Sans

---

## Email OTP Auth

Custom passwordless auth — no NextAuth, no OAuth. User stays on the same page throughout.

### Flow
1. User enters email → clicks "Send me a one-time password"
2. Server generates a 6-digit code, stores it in `otp_codes` with 10-minute expiry, emails it via Resend
3. Page transitions to OTP input — user enters the 6-digit code → clicks "Verify OTP"
4. Server verifies code is valid + not expired + not used. Marks it as used.
5. If no user exists for that email → auto-create user with a generated UUID `apiToken`
6. Server creates a signed JWT, sets it as an `HttpOnly` session cookie → redirects to `/dashboard`
7. Hint text: "If you don't see anything after 2 minutes, we likely couldn't match the provided email to an account."

### Session management
- Signed JWT cookie (`nightstand-session`), `HttpOnly`, `SameSite=Lax`, `Secure` in production
- JWT payload: `{ userId, email, iat, exp }` — expires in 30 days
- `lib/session.ts` exports: `createSession(userId, email)`, `getSession(req)`, `clearSession()`
- Middleware reads the cookie to guard `/dashboard`

### API routes
- `POST /api/auth/send-otp` — body: `{ email }`. Generate 6-digit code, store, email via Resend. Rate limit: max 5 OTPs per email per hour.
- `POST /api/auth/verify-otp` — body: `{ email, code }`. Verify, create/find user, set session cookie. Return `{ success: true }`.
- `POST /api/auth/logout` — clear session cookie.

### Environment variables
- `RESEND_API_KEY` — from resend.com (free tier: 100 emails/day)
- `JWT_SECRET` — for signing session JWTs

---

## Keyboard Navigation

Full shortcut system for the dashboard. Arrow keys for navigation, ⌘ modifier for actions.

### Navigation (bare keys)

| Key | Action |
|-----|--------|
| `↑` | Previous article |
| `↓` | Next article |
| `⇧ ↑` | Jump 5 articles up |
| `⇧ ↓` | Jump 5 articles down |
| `1` `2` `3` ... | Jump to week group by number (1 = most recent) |
| `←` | Previous week group |
| `→` | Next week group |
| `Escape` | Clear focus / close overlay |

### Actions (⌘ modifier)

| Key | Action |
|-----|--------|
| `⌘ Enter` | Open article URL in new tab |
| `⌘ C` | Copy article URL to clipboard |
| `⌘ Backspace` | Delete article |
| `⌘ F` | Focus search input (reserved for future) |

### Actions (bare key)

| Key | Action |
|-----|--------|
| `x` | Toggle "mark as read" |
| `t` | Open source tweet (if tweetUrl exists) |
| `?` | Show/hide keyboard shortcut help overlay |

### Focus state
- `focusedIndex` tracks the active article (flattened across weeks)
- Active card gets `bg-zinc-800/60` (dark) / `bg-zinc-100` (light) background tint
- `scrollIntoView({ block: 'nearest', behavior: 'smooth' })` on focus change
- No focus on page load — first `↓` focuses the first article
- All bare-key shortcuts disabled when an input is focused
- Footer hint: "Press ? for keyboard shortcuts"
- Action feedback via auto-dismissing toast (2 seconds)

---

## Current Status

### Completed
- [x] Phase 1: Next.js app with TypeScript + Tailwind
- [x] Phase 1: SQLite + Drizzle ORM schema + connection
- [x] Phase 1: `unfurl.js` metadata extraction
- [x] Phase 2: POST + GET API endpoints with auth, dedup, CORS
- [x] Phase 3: Chrome extension (Manifest V3) — popup saves current URL
- [x] Phase 4: Weekly-grouped article list UI
- [x] Phase 4: Google OAuth + per-user API tokens
- [x] Bug fix: Unauthenticated users no longer see all articles
- [x] Bug fix: Copy button shows "Copied!" feedback
- [x] Feature: Delete article (DELETE endpoint + delete button)

### Next Up
- [ ] **Landing page** — Create `/` route with Nightstand copy, move app to `/dashboard`
- [ ] **Rename** — Update all references from "X Article Curator" to "Nightstand"
- [ ] **Email OTP auth** — Replace Google OAuth with email one-time passwords via Resend
- [ ] **Keyboard navigation** — Full shortcut system with focus state + help overlay
- [ ] **Mark as read** — `isRead` column + toggle on article cards
- [ ] **Loading state** — `loading.tsx` for dashboard Suspense boundary
- [ ] **Error boundary** — `error.tsx` for graceful error handling

### Future Ideas
- [ ] Estimated reading time on article cards
- [ ] Weekly email digest (Friday evening: "You saved 6 articles this week")
- [ ] Full-text search (SQLite FTS5)
- [ ] Archive instead of delete
- [ ] Tags / collections
- [ ] Focus mode (one unread article at a time)
- [ ] Click-through tracking for gamification stats
- [ ] Weekly completion rate + streaks

---

## Setup & Verification

1. In `web/`: `npm install && npm run db:push && npm run dev`
2. Create `web/.env.local` with:
   ```
   RESEND_API_KEY=re_xxxxx
   JWT_SECRET=your-random-secret
   ```
3. Open `http://localhost:3000` — see landing page
4. Enter email → receive OTP → enter code → land on `/dashboard`
5. Load `extension/` as unpacked in Chrome
6. Open extension options, set API URL + paste your API token from dashboard
7. Navigate to any article, click extension, click Save → appears on dashboard
8. Test keyboard: `↓` to focus, `⌘ Enter` to open, `?` for help
