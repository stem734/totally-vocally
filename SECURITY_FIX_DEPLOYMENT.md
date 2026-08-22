# Security fix deployment and replication checklist

This checklist applies the High and Medium fixes from `REVIEW.md`. Complete the
steps in order. Deploying the web app without the Firestore rules leaves the old
viewer privacy and attendance-validation behaviour in place; deploying the rules
without the new web app can reject old attendance writes.

## 1. Prepare locally

Vite 7 requires Node.js 20.19+ or 22.12+. Check and install dependencies:

```bash
node --version
npm ci
npm test
npm run build
npm audit
```

Expected results:

- 8 URL-validation tests pass.
- The production output is written to `dist/`.
- `npm audit` reports zero known vulnerabilities.

## 2. Rename Firebase web environment variables

The Create React App to Vite migration changes the public variable prefix from
`REACT_APP_` to `VITE_`. Values do not change.

Copy `.env.example` to `.env.local` for local development and insert the Firebase
web-app values from **Firebase Console → Project settings → General → Your apps**.
Do not commit `.env.local`.

Required names:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Firebase web configuration is embedded in the browser bundle and is not a private
server credential. Authorization is enforced by Firestore rules.

## 3. Prepare existing Firebase data

### Viewer accounts

The special viewer role no longer receives the member directory or admin pages.
This closes the raw-name/email leak caused by client-side obfuscation.

In **Firestore Database → Data → users**, find any document whose `role` is
`viewer`:

- To keep normal member access, set `status` to `approved`. It can keep the
  `viewer` role, but it will behave as a normal read-only member.
- To grant genuine administration access, change `role` to `admin` only for a
  trusted administrator.
- Delete obsolete demo accounts from both Firestore and **Authentication → Users**.

### Existing song links

New writes permit only complete `https://` song links. Existing unsafe links are
hidden by the updated UI but are not rewritten automatically. In
**Firestore Database → Data → songs**, replace any `http:`, `javascript:`, `data:`,
or relative URL with an HTTPS URL or an empty string.

### Existing orphan attendance

Firestore does not cascade deletes. The updated app removes attendance before an
event, but previously deleted events may already have orphaned attendance.

In the Firestore data viewer, inspect deleted/missing event parents that still
show an `attendance` subcollection. Delete those attendance documents. For a
large dataset, use a one-off Admin SDK cleanup rather than deleting manually; do
not weaken the production rules to perform cleanup.

## 4. Deploy Firestore rules

Install/use the Firebase CLI, authenticate, and deploy to the explicit project:

```bash
npx firebase-tools@latest login
npx firebase-tools@latest use YOUR_FIREBASE_PROJECT_ID
npx firebase-tools@latest deploy --only firestore:rules,storage --project YOUR_FIREBASE_PROJECT_ID
```

The rules now:

- restrict `/users` collection reads to admins (members retain access to their
  own document);
- validate attendance keys, status values, voice part, and timestamp shape;
- require stored song links to be empty or HTTPS;
- keep all existing admin-only event/song mutation controls.

After deployment, use **Firestore Database → Rules** to confirm the published
rules match `firestore.rules` in this repository.

## 5. Configure and deploy Vercel

In **Vercel → Project → Settings**:

1. Set **Framework Preset** to **Vite**.
2. Set **Build Command** to `npm run build` (or leave the Vite default).
3. Set **Output Directory** to `dist` (or leave the Vite default).
4. Under **Environment Variables**, add all six `VITE_FIREBASE_*` names from
   section 2 for Production and Preview as appropriate.
5. Keep the old `REACT_APP_FIREBASE_*` variables until the first successful
   deployment, then remove them.
6. Deploy the new commit.

`vercel.json` applies CSP, clickjacking, content-type, referrer, permissions, and
service-worker cache headers automatically.

## 6. Confirm Firebase password reset configuration

The app now uses Firebase's complete hosted password-reset handler instead of
redirecting to an unimplemented in-app flow.

1. Open **Firebase Console → Authentication → Templates → Password reset**.
2. Ensure the action URL uses Firebase's hosted handler rather than a custom URL
   pointing directly at this React app. The standard form is
   `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/action`.
3. In **Authentication → Settings → Authorized domains**, confirm the production
   Vercel/custom domain is present.
4. Request a reset from the production sign-in screen, open the email, choose a
   new password, and sign in with it.

## 7. Production smoke test

Use separate admin, approved-member, and former-viewer accounts:

1. Admin can list and edit members, songs, events, and attendance.
2. Approved member can see events and submit `yes`, `maybe`, and `no` attendance.
3. Former viewer cannot open Members, Songs, or Attendance admin pages and cannot
   query all `/users` documents in browser developer tools.
4. Adding an HTTP/non-HTTPS song link shows a validation error; an HTTPS link
   saves and opens normally.
5. Delete a test event containing attendance, then confirm both the event and its
   attendance documents are gone.
6. Open the deployed site and inspect the main document response. Confirm the
   `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`,
   `Referrer-Policy`, and `Permissions-Policy` headers are present.
7. Check the browser console while signing in and loading events. A CSP error means
   a required Firebase origin must be added narrowly to `vercel.json`; do not add
   wildcards or `unsafe-eval` as a blanket workaround.

## 8. Rollback

If the web deployment fails, use Vercel's previous-deployment rollback. If valid
attendance writes are unexpectedly denied, inspect the rejected payload against
the exact three allowed fields in `firestore.rules` before changing rules. Keep
the `/users` viewer restriction in place during troubleshooting so personal data
is not re-exposed.
