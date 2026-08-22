# Migrating the Members Portal to totallyvocally.com (Freeola)

This documents how to deploy the members portal to a subdomain of the existing
`totallyvocally.com` domain, hosted on Freeola, **without touching the live
public choir website** at the root domain.

Nothing in this document has been actioned — it's a plan to follow when ready.

---

## Why a subdomain, not the root domain

`totallyvocally.com` currently serves the choir's real public marketing site
(show listings, ticket links, "who are we" content). Replacing that would take
it down. Deploying the members portal to a subdomain — e.g.
`members.totallyvocally.com` — lets both sites run side by side with no risk
to the existing one.

## What's different from the current Vercel setup

Freeola is standard shared cPanel hosting: free auto-SSL, FTP/File Manager
access, no git-based CI/CD. That means:

- No automatic redeploy on `git push` — each update is a manual build +
  upload, until/unless a CI step is added later (see [Future: automating
  deploys](#future-automating-deploys)).
- No preview deployments per branch/PR (a Vercel-only feature).
- Everything else — Firebase Auth, Firestore, the app itself — is unaffected;
  only *where the static files are served from* changes.

---

## Steps

### 1. Create the subdomain

In Freeola's cPanel: **Domains → Subdomains** → create `members` (resulting
in `members.totallyvocally.com`). cPanel automatically creates a new document
root folder and wires up DNS within the same account — no separate DNS
changes needed.

### 2. Confirm production Firebase config

Check `.env.local` has the real production Firebase project's values (not a
dev/test project). These get compiled into the static JS bundle at build
time — there's no way to change them after the fact without rebuilding.

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Build

```bash
npm install
npm run build
```

This produces a static `dist/` folder.

### 4. Upload

Upload everything **inside** `dist/` (not the `dist` folder itself) to
`members.totallyvocally.com`'s document root, via cPanel File Manager or
FTP/SFTP (credentials available in cPanel → FTP Accounts).

This app doesn't use React Router — navigation is in-app state, not real
URLs — so there's only one real route. No `.htaccess` rewrite rules are
needed for deep-linking, unlike a typical multi-route single-page app.

### 5. Verify SSL

cPanel's AutoSSL usually issues a free Let's Encrypt certificate for a new
subdomain within minutes to a few hours. Load
`https://members.totallyvocally.com` and confirm it's secure (padlock, no
warning) before moving on. If it doesn't pick up automatically, cPanel has a
manual "Run AutoSSL" option under **SSL/TLS Status**.

### 6. Authorize the domain in Firebase

**Firebase Console → Authentication → Settings → Authorized domains** → add
`members.totallyvocally.com`.

Skipping this step means sign-in will fail for everyone with
`auth/unauthorized-domain` the moment it goes live.

### 7. Smoke-test before sharing the link

- Sign in with a real approved account
- Confirm Calendar/Events/Info/Files load
- Confirm an admin account can reach Attendance/Songs/Members
- Try "Request Access" end to end once

### 8. Point members at the new URL

Once verified, share `https://members.totallyvocally.com` as the app's home.
Consider adding a link to it from the main `totallyvocally.com` site's
existing pages/menu if useful.

---

## Future: automating deploys

Freeola's plain shared hosting has no git integration. If manual
build-and-upload becomes tedious, the standard fix is a GitHub Action that
builds the app and pushes the output to Freeola over FTP/SFTP on every push
to `main` — restoring a "push to deploy" flow similar to what Vercel
currently provides. This is a separate, contained piece of work to set up
later; not required to get the app live on the subdomain.

## Rollback

Because this only adds a new subdomain, rollback is trivial: delete the
subdomain in cPanel (or just stop pointing anyone at it) and the main
`totallyvocally.com` site is completely unaffected throughout.
