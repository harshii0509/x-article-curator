# PRD: "What I Read This Week" — Public Weekly Sharing

---

## 1. Overview

### Problem
Users save articles throughout the week via the Chrome extension. The dashboard already groups links by week (Monday–Sunday). There is no way for users to share their weekly reading list with friends or on social media. No similar product offers this.

### Solution
Let users make individual weeks of their reading list public. Each public week gets a shareable URL (`/u/{username}/week/{weekStart}`) with Open Graph meta tags for rich social media previews. Users toggle week visibility from the dashboard.

### Key User Flow
1. User saves articles during the week using the Chrome extension
2. On the dashboard, user clicks the "eye" toggle on a week group to make it public
3. If no username is set, a dialog prompts them to choose one
4. Once public, a "Copy link" button appears → copies the shareable URL
5. Anyone with the URL sees a clean, read-only list of that week's articles
6. Pasting the URL on Twitter/Slack/etc. shows a rich preview card

---

## 2. Data Model Changes

### 2.1 Add `username` column to `users` table

File: `web/src/db/schema.ts`

```typescript
// Add to the existing users table definition:
username: text("username").unique(),
```

- **Type**: text, unique, nullable
- **Validation**: lowercase alphanumeric + hyphens, 3–30 characters, regex: `/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/`
- **Purpose**: Used in public URL path `/u/{username}/week/{weekStart}`
- Nullable so existing users aren't broken on migration

### 2.2 New `publicWeeks` table

File: `web/src/db/schema.ts`

```typescript
export const publicWeeks = sqliteTable(
  "public_weeks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    weekStart: integer("week_start", { mode: "number" }).notNull(),
    isPublic: integer("is_public", { mode: "number" }).default(0),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    userWeekUnique: uniqueIndex("public_weeks_user_week_unique").on(
      table.userId,
      table.weekStart,
    ),
  }),
);
```

- Tracks which weeks a user has toggled public
- Weeks without a row default to private
- `weekStart` is the Monday 00:00 timestamp (matches `getWeekStart()` from `web/src/lib/week-utils.ts`)

### 2.3 Migration

After schema changes, run:
```bash
cd web
npx drizzle-kit generate
npx drizzle-kit push
```

No data migration needed — new column is nullable, new table starts empty.

---

## 3. API Routes

### 3.1 `GET /api/weeks` — List user's public week settings

File: `web/src/app/api/weeks/route.ts` **(create)**

**Auth**: Required (Bearer token via `resolveAuth()` from `web/src/lib/auth.ts`)

**Response** `200`:
```json
{
  "weeks": [
    { "weekStart": 1709510400000, "isPublic": 1 },
    { "weekStart": 1710115200000, "isPublic": 0 }
  ]
}
```

Returns all `publicWeeks` rows for the authenticated user. The dashboard uses this to render toggle state per week group.

### 3.2 `PATCH /api/weeks` — Toggle week visibility

File: `web/src/app/api/weeks/route.ts` **(same file)**

**Auth**: Required

**Request body**:
```json
{ "weekStart": 1709510400000, "isPublic": true }
```

**Logic**:
1. Validate `weekStart` is a valid integer
2. If `isPublic === true` and user has no `username`, return `{ error: "username_required" }` with status `400`
3. Upsert into `publicWeeks`: if row exists for `(userId, weekStart)`, update `isPublic`; otherwise insert new row
4. Return `{ ok: true, isPublic: 1 }` or `{ ok: true, isPublic: 0 }`

**CORS headers**: Same pattern as other routes — include `corsHeaders` + `withCors()` helper + `OPTIONS` handler.

### 3.3 `GET /api/user/username?check={value}` — Check username availability

File: `web/src/app/api/user/username/route.ts` **(create)**

**Auth**: Required

**Query param**: `check` — the username to validate

**Logic**:
1. Validate format (lowercase alphanumeric + hyphens, 3–30 chars)
2. Query `users` table for existing username
3. If taken by another user → `{ available: false }`
4. If available or already belongs to the requesting user → `{ available: true }`

**Response** `200`:
```json
{ "available": true }
```

### 3.4 `PATCH /api/user/username` — Set username

File: `web/src/app/api/user/username/route.ts` **(same file)**

**Auth**: Required

**Request body**:
```json
{ "username": "harshvardhan" }
```

**Logic**:
1. Validate format: `/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/`
2. Check uniqueness in `users` table
3. Update the authenticated user's `username` field
4. Return `{ ok: true, username: "harshvardhan" }`

**Error responses**:
- `400` — Invalid format or username taken
- `401` — Unauthorized

### 3.5 Update `POST /api/auth/google` response

File: `web/src/app/api/auth/google/route.ts` **(modify)**

Include `username` in the returned user object:
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "apiToken": "...",
    "name": "Harsh",
    "image": "...",
    "username": "harshvardhan"
  }
}
```

This is returned in two places in the file (new user insert + existing user update). Add `username` to both return blocks.

---

## 4. Frontend Components

### 4.1 `ShareWeekButton` — Per-week action bar

File: `web/src/components/share-week-button.tsx` **(create)**

**Type**: `"use client"` component

**Props**:
```typescript
interface ShareWeekButtonProps {
  weekStart: number;
  isPublic: boolean;
  username: string | null;
  onToggle: (weekStart: number, newState: boolean) => void;
  onUsernameRequired: () => void;
}
```

**Behavior**:
- Renders two elements inline:
  1. **Toggle button** (eye icon): Calls `PATCH /api/weeks` with `{ weekStart, isPublic: !currentState }`. If API returns `username_required` error, calls `onUsernameRequired()`. On success, calls `onToggle()`.
  2. **Share/Copy button** (visible only when `isPublic === true`): Builds URL `{window.location.origin}/u/${username}/week/${weekStart}` and copies to clipboard via `navigator.clipboard.writeText()`. Shows "Copied!" for 2 seconds. Falls back to `navigator.share()` on mobile if available.

**Styling**: Match existing button patterns — small pill buttons similar to `DeleteButton` in `web/src/components/delete-button.tsx`. Use `e.stopPropagation()` and `e.preventDefault()` on click handlers.

### 4.2 `UsernameDialog` — Username setup modal

File: `web/src/components/username-dialog.tsx` **(create)**

**Type**: `"use client"` component

**Props**:
```typescript
interface UsernameDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (username: string) => void;
}
```

**Behavior**:
- Modal overlay (similar pattern to `ShareDialog` in `web/src/components/share-dialog.tsx`)
- Input field for username with live validation:
  - Client-side: regex check, length check, show inline errors
  - On blur or after debounce: `GET /api/user/username?check={value}` to verify availability
  - Show green checkmark when available, red X when taken
- "Save" button calls `PATCH /api/user/username`
- On success: calls `onSaved(username)`, closes dialog
- Also updates `localStorage` with the new username

### 4.3 Modify `WeekGroup` — Add share controls

File: `web/src/components/week-group.tsx` **(modify)**

**Current**: Simple wrapper with label + children.

**Updated props**:
```typescript
interface WeekGroupProps {
  label: string;
  children: ReactNode;
  // New optional props (only provided on dashboard, not on public page):
  weekStart?: number;
  isPublic?: boolean;
  username?: string | null;
  onToggle?: (weekStart: number, newState: boolean) => void;
  onUsernameRequired?: () => void;
}
```

**Layout change**:
```
[Week Label]  ———————————————  [👁 Toggle] [📋 Copy link]
[children cards]
```

When the new props are provided, render `ShareWeekButton` inline in the header row, right-aligned next to the week label. When props are not provided (public page use), render as before — just the label.

### 4.4 Modify `LinkList` — Fetch and manage public week state

File: `web/src/components/link-list.tsx` **(modify)**

**Changes**:
1. Add state: `publicWeeks` map (`Map<number, boolean>`), `username` (string | null), `showUsernameDialog` (boolean)
2. On mount, fetch `GET /api/weeks` to populate `publicWeeks` state
3. Also fetch username from localStorage (stored during login)
4. Pass `weekStart`, `isPublic`, `username`, `onToggle`, `onUsernameRequired` to each `WeekGroup`
5. `onToggle` handler: updates local `publicWeeks` state
6. `onUsernameRequired` handler: sets `showUsernameDialog = true`
7. Render `UsernameDialog` when `showUsernameDialog` is true. On save, update username state and retry the toggle.

### 4.5 Modify `LinkCard` — Add readonly mode

File: `web/src/components/link-card.tsx` **(modify)**

**Add prop**:
```typescript
interface LinkCardProps extends ComponentPropsWithoutRef<"article"> {
  link: Link;
  readonly?: boolean;  // NEW — hides DeleteButton when true
}
```

**Change**: Wrap `DeleteButton` render in `{!readonly && link.id != null ? <DeleteButton ... /> : null}`

---

## 5. Public Weekly Page

### 5.1 Page component

File: `web/src/app/u/[username]/week/[weekStart]/page.tsx` **(create)**

**Type**: Server component (like the existing `web/src/app/c/[slug]/page.tsx`)

**Logic**:
1. Extract `username` and `weekStart` from route params
2. Parse `weekStart` as integer, validate it
3. Query `users` table for `username` → get `userId`, `name`
4. Query `publicWeeks` table for `(userId, weekStart)` where `isPublic = 1`
5. If user not found or week not public → `notFound()`
6. Query `links` table where `userId` matches AND `savedAt` falls within the Monday–Sunday range:
   - `savedAt >= weekStart` AND `savedAt < weekStart + 7 * 24 * 60 * 60 * 1000`
7. Sort links by `savedAt` descending
8. Render page with:
   - Header: user's name or username, week label via `formatWeekLabel(weekStart)` from `web/src/lib/week-utils.ts`, link count
   - Body: `LinkCard` components with `readonly={true}`

### 5.2 OG Meta Tags

File: `web/src/app/u/[username]/week/[weekStart]/page.tsx` **(same file)**

Use Next.js `generateMetadata()`:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  // Fetch user + verify week is public + count links
  return {
    title: `${name}'s Reading — ${formatWeekLabel(weekStart)}`,
    description: `${count} articles saved this week on Nightstand`,
    openGraph: {
      title: `${name}'s Reading — ${formatWeekLabel(weekStart)}`,
      description: `${count} articles saved this week on Nightstand`,
      type: "website",
      url: `${baseUrl}/u/${username}/week/${weekStart}`,
    },
    twitter: {
      card: "summary",
      title: `${name}'s Reading — ${formatWeekLabel(weekStart)}`,
      description: `${count} articles saved this week on Nightstand`,
    },
  };
}
```

---

## 6. Login / Auth Updates

### 6.1 Store username on login

File: `web/src/app/login/page.tsx` **(modify)**

In the `handleGoogleCredential` function, after storing `apiToken` and `email`, also store the username:

```typescript
if (data.user.username) {
  window.localStorage.setItem(`${TOKEN_KEY}:username`, data.user.username);
}
```

---

## 7. File Summary

| File | Action | Description |
|------|--------|-------------|
| `web/src/db/schema.ts` | Modify | Add `username` to users, add `publicWeeks` table |
| `web/src/app/api/weeks/route.ts` | Create | GET + PATCH for week visibility toggle |
| `web/src/app/api/user/username/route.ts` | Create | GET (availability check) + PATCH (set username) |
| `web/src/app/u/[username]/week/[weekStart]/page.tsx` | Create | Public weekly page with OG meta tags |
| `web/src/components/share-week-button.tsx` | Create | Toggle public/private + copy share link |
| `web/src/components/username-dialog.tsx` | Create | Username prompt modal |
| `web/src/components/link-list.tsx` | Modify | Fetch public weeks state, pass to WeekGroup |
| `web/src/components/week-group.tsx` | Modify | Add share controls in week header |
| `web/src/components/link-card.tsx` | Modify | Add `readonly` prop to hide delete button |
| `web/src/app/login/page.tsx` | Modify | Store username in localStorage |
| `web/src/app/api/auth/google/route.ts` | Modify | Return username in user object |

**Existing utilities to reuse**:
- `web/src/lib/week-utils.ts` — `getWeekStart()`, `formatWeekLabel()`, `groupByWeek()`
- `web/src/lib/auth.ts` — `resolveAuth()`
- `web/src/components/link-card.tsx` — reused with `readonly` prop on public page
- `web/src/app/c/[slug]/page.tsx` — reference pattern for public page (server component, direct DB queries)

---

## 8. Build Order

1. Schema changes + migration (`schema.ts` → `drizzle-kit push`)
2. Username API route (`/api/user/username`)
3. Weeks API route (`/api/weeks`)
4. Username dialog component
5. Share week button component
6. Wire into `WeekGroup` + `LinkList` (dashboard integration)
7. Public weekly page (`/u/[username]/week/[weekStart]`) with OG meta
8. Update `LinkCard` with `readonly` prop
9. Update auth route + login page to include username

---

## 9. Verification

1. **Dashboard**: Each week group shows a toggle icon and share button in the header
2. **First share**: Clicking toggle when no username → username dialog appears → set username → week becomes public
3. **Toggle**: Click eye icon → week toggles public/private → API call succeeds → UI updates immediately
4. **Copy link**: When public, click "Copy link" → copies `/u/{username}/week/{weekStart}` to clipboard → shows "Copied!" feedback
5. **Public page**: Visit the URL while logged out → see the reading list with article cards, user name, week label, article count
6. **OG tags**: Paste URL into Twitter/Slack → preview card shows title ("{Name}'s Reading — 3–9 Mar 2026"), description ("{N} articles saved this week on Nightstand")
7. **Privacy**: Toggle week back to private → public URL returns 404
8. **Readonly cards**: Public page shows article cards without delete buttons
9. **Username validation**: Try invalid usernames (too short, special chars, taken) → clear error messages
