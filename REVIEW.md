# Totally Vocally repository review

Reviewed 22 August 2026. This was a read-only application review; no application
code or Firebase configuration was changed.

> Resolution note: the High and Medium findings were addressed in the subsequent
> remediation change set. Follow `SECURITY_FIX_DEPLOYMENT.md` to publish the web
> app and Firestore rules together. Low-severity findings remain recommendations.

## Executive summary

The production build succeeds and the React effects inspected generally return
their Firestore/listener cleanup functions. No committed private credentials or
obvious raw-HTML/code-execution sink was found. The main issues are a privacy gap
for the read-only viewer role, incomplete password-reset handling, permissive
Firestore write shapes, duplicated Firestore listeners, and aging Create React
App tooling.

## Findings

### TV-001 — Viewer role receives unredacted member personal data

- Severity: High
- Location: `firestore.rules:23-32`; `src/components/MembersPage.js:19-21,95-105`
- Evidence: `allow read: if isOwner(userId) || isAdmin() || isViewer()` permits a
  viewer to query complete user documents. `MembersPage` downloads each complete
  document and only substitutes the name and email while rendering.
- Impact: Any viewer can inspect the Firestore response in browser developer tools
  and recover every member's real name, email, login history, voice part, and
  rehearsal day. UI obfuscation is not a privacy boundary.
- Fix: Do not let viewers read `/users`. Create a separate, deliberately redacted
  collection (or server endpoint) containing only the fields the dashboard needs.
  Alternatively remove the viewer role.
- Mitigation: Treat viewer accounts as trusted administrators until the data model
  is split.
- False-positive note: None if viewers are intended to be unable to identify
  members; the current rules explicitly deliver the raw values.

### TV-002 — Password reset flow is incomplete

- Severity: High (functional/account recovery)
- Location: `src/useAuth.js:165-177`
- Evidence: reset email links return to `?mode=resetPassword` with
  `handleCodeInApp: true`, but the application never reads the reset `oobCode` or
  calls Firebase's reset-code verification/confirmation APIs.
- Impact: A member following a reset email can return to the app without any UI
  that accepts and confirms a new password.
- Fix: Implement the complete in-app reset handler, or remove
  `handleCodeInApp: true` and use Firebase's hosted reset page.
- Mitigation: Verify the configured Firebase Auth email-action handler manually.
- False-positive note: This may work only if Firebase ignores/overrides these
  action settings in the deployed project's template; test the deployed link.

### TV-003 — Attendance writes accept arbitrary status and extra fields

- Severity: Medium
- Location: `firestore.rules:66-82`
- Evidence: member writes only require a matching `voicePart`; they do not restrict
  keys, validate `status` against `yes/maybe/no`, validate timestamps, or cap
  string/document sizes.
- Impact: An approved account can write malformed or unnecessarily large documents,
  corrupt reports, and create avoidable Firestore storage/read costs.
- Fix: Require an exact key allowlist, allowed status values, appropriate types,
  and a server timestamp or bounded timestamp representation.
- Mitigation: Add monitoring/budget alerts and periodically inspect unexpected
  attendance fields.
- False-positive note: Firestore's platform document-size limit bounds each write,
  but does not preserve application invariants or prevent repeated abuse.

### TV-004 — Song links are not scheme-constrained

- Severity: Medium
- Location: `src/components/EventsPage.js:109-118`,
  `src/components/EventDetailModal.js:103-111`, `src/components/SongsPage.js:229`
- Evidence: stored `song.url` is passed directly to `href`.
- Impact: A compromised/mistaken admin can store a non-HTTP URL (including an
  active URL scheme), which members are then invited to click.
- Fix: Normalize at write time and render only URLs whose parsed protocol is
  `https:` (optionally permit `http:` for explicitly accepted destinations).
- Mitigation: Audit existing song URLs and add a restrictive CSP.
- False-positive note: Only admins can currently modify songs, which lowers
  likelihood but does not make stored URLs intrinsically safe.

### TV-005 — Security headers are not configured in the repository

- Severity: Medium
- Location: `public/index.html`; repository root (no `vercel.json`)
- Evidence: no visible CSP, frame protection, `nosniff`, referrer policy, or
  permissions policy configuration.
- Impact: The app lacks useful defense-in-depth against injection, clickjacking,
  content sniffing, and excess browser capabilities if Vercel/project settings do
  not supply them.
- Fix: Define suitable headers in `vercel.json`, beginning with a tested CSP that
  includes the required Firebase and Google Fonts origins.
- Mitigation: Inspect the deployed response headers first; edge/project settings
  may already add some of them.
- False-positive note: This repository cannot prove which headers are configured
  outside source control.

### TV-006 — Multiple components create duplicate live song subscriptions

- Severity: Medium (cost/performance)
- Location: `src/components/EventsPage.js:25-27,184-195`;
  `src/components/EventDetailModal.js:26-34`;
  `src/components/AllocateSongsModal.js:6-30`
- Evidence: each mounted component calls `useSongs()`. Hooks run even when a modal
  later returns `null`, so the Events page alone keeps its own listener plus the
  closed allocation modal's listener. Calendar detail/allocation can do likewise.
- Impact: Each snapshot is read and billed multiple times and causes redundant
  state updates. The effect cleanups are correct, so this is duplication rather
  than an unbounded listener leak.
- Fix: Subscribe once in an approved top-level data provider and pass songs down,
  or only mount subscriber components when open.
- Mitigation: For a small song list the absolute cost is low, but it scales with
  users, documents, and updates.
- False-positive note: None; React invokes hooks before an early component return.

### TV-007 — Calendar downloads leak blob URLs for the page lifetime

- Severity: Low
- Location: `src/calendarSubscription.js:52-65`
- Evidence: each download calls `URL.createObjectURL(blob)` without a matching
  `URL.revokeObjectURL(url)`.
- Impact: Repeated exports retain blob memory until the tab closes.
- Fix: Revoke the URL after the click (normally in a zero-delay callback).
- Mitigation: The generated calendars are small, so user-visible impact is limited.
- False-positive note: Browsers eventually release the data when the document is
  destroyed, but not necessarily after each download.

### TV-008 — Seed operation is race-prone and runs on every admin session

- Severity: Medium (data integrity/cost)
- Location: `src/App.js:51-53`; `src/seedSongs.js:32-52`
- Evidence: every admin mount performs a collection read and, if empty, adds 25
  documents individually. Two simultaneous first sessions can both observe an
  empty collection and create duplicates.
- Impact: Duplicate repertoire entries and unnecessary reads/writes.
- Fix: Remove runtime seeding after initial setup, or use deterministic document
  IDs and idempotent batch writes in a controlled admin migration.
- Mitigation: Check the live collection for duplicates and restrict seeding to an
  explicit setup action.
- False-positive note: The race is limited to an empty/cleared collection, but the
  read cost occurs on every admin app start.

### TV-009 — Event deletion leaves attendance subcollections behind

- Severity: Medium (data retention/cost)
- Location: `src/useEventsFirestore.js:101-108`; Firestore data model
- Evidence: deleting an event document with `deleteDoc` does not recursively delete
  its attendance subcollection.
- Impact: Orphaned personal attendance records remain stored and continue to appear
  in the global `collectionGroup('attendance')` subscription, increasing retention,
  reads, and possible privacy exposure.
- Fix: Use a trusted server-side callable function/admin process to recursively
  delete the event and attendance records, or explicitly batch-delete known child
  documents with appropriate limits and retry handling.
- Mitigation: Run an orphan audit and document the retention policy.
- False-positive note: Firestore does not cascade deletes to subcollections.

### TV-010 — Legacy migration helper is stale, callable client code

- Severity: Low
- Location: `src/useEventsFirestore.js:200-230`
- Evidence: `migrateEventsToFirestore` is exported but unused by the application;
  it maps `event.desc` to `description` while current UI reads `desc`, omits
  `createdBy`, and is documented as a one-time migration.
- Impact: Reusing it can silently produce partly incompatible/duplicated events.
- Fix: Remove it from the production bundle after migration, or move a corrected,
  idempotent migration into an admin-only script.
- Mitigation: Do not invoke the README/Firebase setup snippet against production.
- False-positive note: It is dormant unless imported and called.

### TV-011 — Create React App toolchain carries known transitive advisories

- Severity: Medium
- Location: `package.json:17`, `package-lock.json`
- Evidence: `npm audit` reports 28 advisories (14 high, 5 moderate, 9 low), rooted
  largely in `react-scripts@5.0.1` build/dev dependencies. The production build
  succeeds; no critical advisory was reported.
- Impact: Most exposure is in development/build-time tooling, but the abandoned
  stack makes remediation and future upgrades increasingly difficult.
- Fix: Plan a migration from Create React App to a maintained toolchain (for this
  static client, Vite is the simplest likely target), then rerun the audit.
- Mitigation: Do not expose the development server to untrusted networks, use
  reproducible `npm ci`, and keep CI isolated.
- False-positive note: Audit severity does not equal exploitable production risk;
  each advisory's reachable code path should be assessed during migration.

## Unused/redundant items

- `@supabase/supabase-js` is an unused direct dependency (confirmed by static
  dependency analysis). Removing it reduces install surface and lockfile size.
- `migrateEventsToFirestore` is unused legacy code and should be removed or moved
  to a controlled migration script.
- The `gh-pages` deployment dependency/script appears obsolete because the README
  says production deploys on Vercel. Remove it if GitHub Pages is no longer a
  supported fallback.
- Documentation is out of sync: `FIREBASE_SETUP.md` describes passwordless email
  links and future integration steps, while the application currently uses
  email/password and is already integrated.
- No application tests were found. At minimum, add Firestore rules emulator tests
  and tests for auth recovery, role access, event deletion, and URL validation.

## Verification performed

- `npm run build`: passed.
- `npm audit --json`: 28 advisories (0 critical, 14 high, 5 moderate, 9 low),
  predominantly in the Create React App toolchain.
- Static dependency check: identified unused `@supabase/supabase-js`.
- Manual inspection: React effect cleanup, Firebase Auth, Firestore listeners and
  rules, external links, service worker, storage/migration code, and deployment
  security configuration.
