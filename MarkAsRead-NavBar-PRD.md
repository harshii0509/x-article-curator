# PRD: Mark as Read + Persistent Navigation Bar

---

## 1. Overview

### Problem
1. **Mark as Read**: The dashboard shows saved articles grouped by week, but there's no way to mark articles as read/unread. The API (`PATCH /api/links/[id]`) already toggles `isRead`, and `LinkCard` already dims read articles + shows a "Read" label — but there's no button to trigger the toggle.
2. **Navigation**: There's no persistent nav bar. Users bounce between dashboard, collections, and shared pages using ad-hoc "Back to links" text links. There's no consistent way to move between pages.

### Solution
1. Add a **toggle button** on each `LinkCard` to mark articles read/unread — follows the existing `DeleteButton` pattern (client component, `useTransition`, `router.refresh()`).
2. Add a **persistent nav bar** to all authenticated pages — a slim top bar with links to Dashboard, Collections, Shared + user info + sign out.

---

## 2. Mark as Read

### 2.1 New Component: `MarkAsReadButton`

File: `web/src/components/mark-as-read-button.tsx` **(create)**

**Type**: `"use client"` component

**Props**:
```typescript
interface MarkAsReadButtonProps {
  linkId: number;
  isRead: boolean;
}
```

**Pattern**: Follow `web/src/components/delete-button.tsx` exactly:
- `useTransition()` for loading state
- `useRouter()` for `router.refresh()` after success
- Read token from `localStorage.getItem("nightstand-api-token")`
- Call `PATCH /api/links/${linkId}` with `Authorization: Bearer ${token}`
- No request body needed — the API toggles `isRead` automatically

**Button behavior**:
- When `isRead === false`: Show a check icon (or "Mark read" text) — neutral styling
- When `isRead === true`: Show a filled check icon (or "Read" text) — green/active styling
- Disabled while `isPending` or no token
- `e.stopPropagation()` and `e.preventDefault()` on click

**Styling**: Match existing `DeleteButton` pattern:
```
rounded-full border border-zinc-200 px-2 py-1
text-[10px] font-semibold uppercase tracking-[0.16em]
text-zinc-500 hover:bg-zinc-100
dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800
```

When `isRead === true`, use green accent:
```
border-emerald-200 text-emerald-600
dark:border-emerald-800 dark:text-emerald-400
```

### 2.2 Modify `LinkCard`

File: `web/src/components/link-card.tsx` **(modify)**

**Current header layout** (line 38-45):
```tsx
<div className="flex items-start justify-between gap-3">
  <div>siteName</div>
  {!readonly && link.id != null ? <DeleteButton linkId={link.id} /> : null}
</div>
```

**New layout** — wrap both buttons in a flex container:
```tsx
<div className="flex items-start justify-between gap-3">
  <div>siteName</div>
  {!readonly && link.id != null ? (
    <div className="flex items-center gap-1.5">
      <MarkAsReadButton linkId={link.id} isRead={Boolean(link.isRead)} />
      <DeleteButton linkId={link.id} />
    </div>
  ) : null}
</div>
```

**Also**: Remove the existing "• Read" text label at the bottom of the card (line ~70) since the button now shows read state. Keep the `opacity-60` dim effect on read cards.

### 2.3 No API Changes Needed

The `PATCH /api/links/[id]` endpoint already exists and works:
- Toggles `isRead` between 0 and 1
- Returns the updated link
- Auth checks ownership
- CORS headers included

### 2.4 Update in `LinkList` re-fetch

The existing 10-second polling in `link-list.tsx` will pick up the change after `router.refresh()`. No changes needed to `link-list.tsx`.

---

## 3. Persistent Navigation Bar

### 3.1 New Component: `NavBar`

File: `web/src/components/nav-bar.tsx` **(create)**

**Type**: `"use client"` component (needs to read auth state from localStorage + detect current route)

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  Nightstand          Links    Collections    Shared    [user@email.com] [Sign out]  │
└──────────────────────────────────────────────────────────────┘
```

**Structure**:
```tsx
<nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
  <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-2.5">
    {/* Left: Brand */}
    <Link href="/dashboard" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
      Nightstand
    </Link>

    {/* Center: Nav links */}
    <div className="flex items-center gap-4">
      <NavLink href="/dashboard" label="Links" />
      <NavLink href="/collections" label="Collections" />
      <NavLink href="/shared" label="Shared" />
    </div>

    {/* Right: User + Sign out */}
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{email}</span>
      <button onClick={handleSignOut} className="...">Sign out</button>
    </div>
  </div>
</nav>
```

**Active link indicator**: Use `usePathname()` from `next/navigation` to detect current page. Active link gets `text-zinc-900 dark:text-zinc-50` and a small bottom border or dot. Inactive links get `text-zinc-500 dark:text-zinc-400`.

**NavLink sub-component** (inline in the same file):
```tsx
function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
        isActive
          ? "text-zinc-900 dark:text-zinc-50"
          : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      }`}
    >
      {label}
    </Link>
  );
}
```

**Auth behavior**:
- Reads token and email from localStorage on mount
- If no token found, returns `null` (don't render nav on login/landing pages)
- Sign out: clears localStorage keys (`nightstand-api-token`, `nightstand-api-token:email`, `nightstand-api-token:username`), calls `POST /api/auth/logout`, redirects to `/login`

**Mobile**: On small screens, collapse nav links or stack them. Keep it simple — the app is primarily desktop-focused. A minimal approach: hide email on mobile, keep nav links visible.

### 3.2 Integrate NavBar into Authenticated Pages

**Option A (Recommended)**: Add `NavBar` to the layout for authenticated pages by creating a layout group.

File: `web/src/app/(app)/layout.tsx` **(create)**

```tsx
import { NavBar } from "@/components/nav-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <div className="px-6 py-8">{children}</div>
    </>
  );
}
```

Then **move** the authenticated pages into this layout group:
- `web/src/app/(app)/dashboard/page.tsx` (moved from `web/src/app/dashboard/page.tsx`)
- `web/src/app/(app)/collections/page.tsx` (moved from `web/src/app/collections/page.tsx`)
- `web/src/app/(app)/collections/[id]/page.tsx` (moved from `web/src/app/collections/[id]/page.tsx`)
- `web/src/app/(app)/shared/page.tsx` (moved from `web/src/app/shared/page.tsx`)

Pages that should NOT have the nav bar (stay outside the group):
- `/login` — login page
- `/` — landing page
- `/c/[slug]` — public collection page
- `/u/[username]/week/[weekStart]` — public weekly page

### 3.3 Remove Redundant Elements

After adding NavBar, remove from each page:
- **Dashboard** (`dashboard/page.tsx`): Remove `<AuthHeader />` — auth info is now in the nav bar
- **Collections** (`collections/page.tsx`): Remove the "Back to links" `<Link>` in the header
- **Shared** (`shared/page.tsx`): Remove the "Back to links" `<Link>` in the header

**Keep `ApiTokenSection` in the dashboard** — it's still needed for users to copy their extension API token. Just remove `AuthHeader` since the nav bar handles that now.

### 3.4 No API Changes Needed

The sign-out logic already exists in `POST /api/auth/logout`. The nav bar just needs to call it the same way `AuthHeader` currently does.

---

## 4. File Summary

| File | Action | Description |
|------|--------|-------------|
| `web/src/components/mark-as-read-button.tsx` | **Create** | Toggle button following DeleteButton pattern |
| `web/src/components/nav-bar.tsx` | **Create** | Persistent nav with links + auth + sign out |
| `web/src/app/(app)/layout.tsx` | **Create** | Layout wrapper that renders NavBar |
| `web/src/components/link-card.tsx` | Modify | Add MarkAsReadButton next to DeleteButton, remove "• Read" text |
| `web/src/app/dashboard/page.tsx` | Modify | Move to `(app)` group, remove AuthHeader |
| `web/src/app/collections/page.tsx` | Modify | Move to `(app)` group, remove "Back to links" |
| `web/src/app/collections/[id]/page.tsx` | Modify | Move to `(app)` group |
| `web/src/app/shared/page.tsx` | Modify | Move to `(app)` group, remove "Back to links" |

**Existing code to reuse**:
- `web/src/components/delete-button.tsx` — exact pattern for MarkAsReadButton (client component, useTransition, router.refresh)
- `web/src/components/auth-header.tsx` — sign out logic (handleSignOut) moves to NavBar
- `PATCH /api/links/[id]` — already toggles isRead, no changes needed
- `POST /api/auth/logout` — already handles sign out, no changes needed

---

## 5. Build Order

1. Create `MarkAsReadButton` component (following DeleteButton pattern)
2. Modify `LinkCard` to include MarkAsReadButton
3. Create `NavBar` component
4. Create `(app)` layout group with NavBar
5. Move dashboard, collections, shared pages into `(app)` group
6. Remove redundant AuthHeader and "Back to" links from moved pages

---

## 6. Verification

1. **Mark as Read — toggle**: Click the check button on an unread article → article dims (opacity-60), button turns green → click again → article returns to normal, button returns to neutral
2. **Mark as Read — persistence**: Toggle read on an article → refresh the page → article still shows as read
3. **Mark as Read — public page**: Visit a public weekly page → cards should NOT show the toggle button (readonly mode)
4. **Nav bar — routing**: Click "Links" → dashboard, "Collections" → collections list, "Shared" → shared items. Active page is highlighted.
5. **Nav bar — active state**: On `/collections/123` (collection detail), the "Collections" link should be highlighted
6. **Nav bar — sign out**: Click "Sign out" → localStorage cleared → redirected to `/login`
7. **Nav bar — responsive**: On mobile screen widths, nav should remain usable (links visible, email hidden or truncated)
8. **Nav bar — public pages**: Visit `/u/{username}/week/{weekStart}` or `/c/{slug}` → no nav bar shown
9. **Nav bar — landing/login**: Visit `/` or `/login` → no nav bar shown
