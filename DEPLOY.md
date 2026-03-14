# Deploying Nightstand to yournightstand.com

**Platform:** Railway + SQLite persistent volume
**Domain:** yournightstand.com
**Email:** Resend (verified domain)

---

## Step 1 — Push code to GitHub

Commit and push all recent changes before starting.

---

## Step 2 — Verify domain in Resend (~5 min)

1. Go to [resend.com/domains](https://resend.com/domains) → **Add Domain**
2. Enter `yournightstand.com`, select region **Tokyo (ap-northeast-1)**
3. Add the 3 DNS records Resend shows into your domain registrar:
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)
4. Click **Verify** — use [dnschecker.org](https://dnschecker.org) to confirm propagation
5. FROM address to use: `Nightstand <hi@yournightstand.com>` ← no inbox needed, Resend sends on behalf of the domain

---

## Step 3 — Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select the `x-article-curator` repo
3. Project settings → **Root Directory** → set to `web`
4. Railway auto-detects Next.js via Nixpacks and runs `npm run build` / `npm run start`

---

## Step 4 — Add persistent volume for SQLite

1. Inside the Railway project → **+ Add** → **Volume**
2. Mount path: `/data`
3. This gives the SQLite database a permanent home that survives redeploys and restarts

---

## Step 5 — Set environment variables in Railway

Go to the Railway project → **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `DB_PATH` | `/data/sqlite.db` |
| `API_SECRET_KEY` | Run `openssl rand -hex 32` locally and paste the output |
| `GOOGLE_CLIENT_ID` | Copy from your local `.env.local` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Copy from your local `.env.local` |
| `RESEND_API_KEY` | Copy from your local `.env.local` |
| `EMAIL_FROM` | `Nightstand <hi@yournightstand.com>` |
| `ALLOWED_ORIGINS` | `https://yournightstand.com` |
| `NODE_ENV` | `production` |

> The `db:push` command runs automatically on every start (see `package.json`) — tables are created on first deploy, no manual migration needed.

---

## Step 6 — Add custom domain

1. Railway project → **Settings** → **Domains** → **Add Custom Domain**
2. Enter `yournightstand.com`
3. Railway gives you a **CNAME record** — add it in your domain registrar
4. Optionally add `www.yournightstand.com` → same CNAME target

---

## Step 7 — Update Google OAuth (for when the full app opens)

In [Google Cloud Console](https://console.cloud.google.com) → your OAuth 2.0 Client ID → add `https://yournightstand.com` to **Authorized JavaScript Origins**. Not needed for waitlist-only mode, but do it now while you remember.

---

## Verification checklist

- [ ] `https://yournightstand.com` loads the landing page
- [ ] Submit your Resend-registered email → "You're in!" message appears
- [ ] Confirmation email arrives from `hi@yournightstand.com`
- [ ] Submit the same email again → "You're already on the list" message
- [ ] Visit `yournightstand.com/login` → redirects to `/`
- [ ] Railway logs show `[waitlist] email sent, id: ...`

---

## Going live with the full app later

When you're ready to open the app to users, update `src/middleware.ts`:

```ts
// Comment out or delete the redirect to re-enable routes:
export function middleware(request: NextRequest) {
  // return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next(); // ← allow all routes
}
```

Then add auth checking logic as needed.
