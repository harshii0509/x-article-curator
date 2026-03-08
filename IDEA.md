# Nightstand

## What is this?

Nightstand is a personal tool for saving articles you find online and actually reading them over the weekend.

You're on Twitter. Someone shares a link to a great essay. You bookmark it. By Saturday, it's buried under fifty other bookmarks and you've forgotten it exists. Nightstand fixes this.

## How it works

1. **Save from anywhere** — A browser extension lets you save any article in one click. Works on Twitter, Substack, blogs, anywhere.
2. **Metadata is automatic** — Title, author, description, and preview image are extracted from the page. You don't type anything.
3. **Grouped by week** — Articles are organized by the week you saved them. Open Nightstand on Saturday morning and your reading list is already there.

## Design philosophy

- **Personal, not social.** No followers, no sharing, no public profiles. This is your reading list.
- **Keyboard-first.** Full navigation and actions via keyboard shortcuts. Arrow keys to move, ⌘+Enter to open, `x` to mark as read.
- **Quiet.** No algorithmic recommendations. No notifications nagging you to read. No infinite scroll. No tracking. No ads.
- **Minimal.** Bare-featured on purpose. It saves articles and shows them by week. That's it.

## Tech stack

- **Frontend/Backend:** Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **Metadata extraction:** unfurl.js (server-side Open Graph / Twitter Card parsing)
- **Auth:** Custom email OTP via Resend (no passwords, no OAuth, no NextAuth)
- **Browser extension:** Chrome Manifest V3

## Architecture

Two pieces:

**Chrome Extension** — Runs on any page. Popup shows the current URL + a Save button. Sends the URL to the backend API. No content scripts, no DOM scraping. Minimal permissions (`storage` + `activeTab`).

**Next.js Web App** — Handles everything else:
- API receives URLs from the extension, extracts metadata via `unfurl.js`, stores in SQLite
- Dashboard renders articles grouped by week with keyboard navigation
- Landing page at `/`, dashboard at `/dashboard`
- Email OTP auth: user enters email → gets a 6-digit code → enters it → done (never leaves the page)

## Data model

**Users:** email, name, apiToken (UUID for extension auth)

**Articles:** url, userId, title, author, description, imageUrl, siteName, isRead, savedAt

- Unique constraint on `(url, userId)` — same user can't save the same article twice
- `savedAt` timestamp determines which week group the article appears in
- `isRead` tracks whether the user has marked the article as read

## Key features

### Implemented
- Save any URL via browser extension
- Automatic metadata extraction (OpenGraph, Twitter Cards)
- Weekly-grouped article list
- Per-user isolation (each user sees only their articles)
- Delete articles
- Dark mode

### In progress
- Landing page with opinionated copy
- Email OTP authentication (replacing Google OAuth)
- Full keyboard navigation (arrow keys + ⌘ shortcuts)
- Mark as read / unread toggle
- Keyboard shortcut help overlay (`?` to show)

### Future
- Estimated reading time per article
- Weekly email digest (Friday: "You saved 6 articles this week")
- Full-text search (SQLite FTS5)
- Archive instead of permanent delete
- Focus mode (one unread article at a time, reduces decision fatigue)
- Weekly reading stats / streaks (quiet gamification — completion rate, not points)

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move between articles |
| `⇧↑` / `⇧↓` | Jump 5 articles |
| `1` `2` `3` | Jump to week group by number |
| `←` / `→` | Move between week groups |
| `⌘ Enter` | Open article in new tab |
| `⌘ C` | Copy article URL |
| `⌘ Backspace` | Delete article |
| `x` | Toggle mark as read |
| `t` | Open source tweet |
| `?` | Show shortcut help |
| `Escape` | Clear focus / close overlay |

## Project structure

```
nightstand/
├── web/                          # Next.js app
│   ├── src/app/                  # Routes (landing, dashboard, API)
│   ├── src/db/                   # Drizzle schema + SQLite connection
│   ├── src/lib/                  # unfurl wrapper, week utils, email templates
│   ├── src/hooks/                # useKeyboardNav
│   └── src/components/           # UI components
├── extension/                    # Chrome Extension (Manifest V3)
│   ├── popup/                    # Save UI
│   ├── options/                  # API config
│   └── background/              # Service worker
├── PLAN.md                       # Detailed implementation plan
└── IDEA.md                       # This file
```

## Running locally

```bash
cd web
npm install
npm run db:push
npm run dev
```

Set up `web/.env.local`:
```
RESEND_API_KEY=re_xxxxx
JWT_SECRET=your-random-secret
```

Load `extension/` as unpacked in Chrome (`chrome://extensions` → Developer mode).
