# FVSPA handover — Totally Vocally activity on 22 August 2026

This is the consolidated handover for all work completed on 22 August 2026. It
is intended to give the FVSPA app/team enough context to reproduce, maintain,
test, and extend the implementation without relying on the original chat.

## 1. End-of-day status

- Production app: <https://totally-vocally.vercel.app/>
- Source branch: `main`
- Functional baseline commit: `48882f5` (`Link event songs to file folders`)
- Firebase project: `totally-vocally`
- Storage bucket: `totally-vocally.firebasestorage.app`
- Bucket location: `eu` multi-region
- Firebase plan: Blaze
- Build system: Vite 7
- Runtime requirement: Node.js 20.19+ or 22.12+
- Latest validation: production build passed; all 8 Vitest tests passed.
- Vercel reported the final functional deployment as `READY` and assigned the
  production alias successfully.

The portal is live. Approved members can browse private choir resources, preview
supported documents, play audio, and follow allocated songs from an event to the
correct Files folder. Administrators use the same Files page to upload resources
and manage song folders; there is no separate Songs navigation item.

## 2. Work completed today

### Event entry and display

- Added `arriveBy` and duration handling to event add/edit forms and displays.
- The final behaviour defaults **Arrive By** to 30 minutes before the event start
  time for every event type. It remains editable.
- Event durations are stored in minutes and displayed in a readable form such as
  `2h 30m`.
- HTTP/HTTPS URLs pasted into event descriptions are rendered as clickable links
  using `LinkedText`; links open in a new tab with `noopener noreferrer`.
- Location text continues to open a Google Maps search.

### Repository review and remediation

A repository review was recorded in `REVIEW.md`. The High and Medium findings
were remediated and the deployment procedure was recorded in
`SECURITY_FIX_DEPLOYMENT.md`.

Implemented remediation includes:

- Removed raw member-directory access from the former viewer role. Non-admins
  can read only their own user document; admins can read/manage the directory.
- Changed password reset to use Firebase's complete hosted reset flow rather
  than returning to an unimplemented in-app handler.
- Restricted member attendance writes to the exact keys `status`, `voicePart`,
  and `updatedAt`; status must be `yes`, `maybe`, or `no`, and the voice part
  must match the member profile.
- Constrained stored song resource links to HTTPS and added safe URL validation
  at both write and render time.
- Added Vercel security headers: CSP, clickjacking protection, `nosniff`,
  referrer policy, permissions policy, and service-worker cache control.
- Hoisted the song subscription so Events, Calendar details, and allocation
  modals share one listener instead of creating duplicate Firestore listeners.
- Made song seeding an explicit admin action rather than an automatic read/write
  operation on each admin session.
- Event deletion now removes attendance subcollection documents in batches
  before deleting the event, avoiding orphaned personal attendance data.
- Calendar export blob URLs are revoked after download.
- Migrated from Create React App/react-scripts to Vite 7 and Vitest.
- Removed unused Supabase and obsolete GitHub Pages dependencies.
- Added 8 tests for external URL validation.
- `npm audit` was reduced from the prior Create React App advisory set to zero
  known vulnerabilities at the point of migration.

Known low-priority review item still present: `migrateEventsToFirestore` is a
legacy, unused helper. Do not invoke it against production; move it to a one-off
admin script or remove it in a future cleanup.

### Firebase Storage and Files

- Upgraded/confirmed the Firebase project on Blaze, which is now required to use
  Cloud Storage for Firebase.
- Created/activated the default bucket
  `totally-vocally.firebasestorage.app`.
- Added Firebase Storage initialization to `src/firebase.js`.
- Added `storage.rules` and connected it in `firebase.json`.
- Deployed Firestore and Storage rules to the explicit Firebase project.
- Accepted the Firebase cross-service rules permission needed for Storage Rules
  to read the signed-in user's Firestore profile.
- Built the authenticated Files page with admin upload/delete and member
  list/view/play/download functions.
- Objects are stored under `shared/` with a unique internal name. The original
  filename is stored as custom metadata and shown in the UI.
- Uploads are limited to 100 MB per file.
- Permitted types: PDF, Word, Excel, PowerPoint, plain text, audio, images, and
  video. Executables and unknown types are rejected by both client code and
  Storage Rules.
- Overwriting an existing object is disabled. Deletes are admin-only.
- The app uses authenticated Firebase SDK `getBlob()` calls. It intentionally
  does not expose persistent Firebase download-token URLs.

### Storage access rules

Current `storage.rules` behaviour:

- Approved members and admins can list/read `shared/{fileName}`.
- Only admins can create or delete shared files.
- Object updates/overwrites are denied.
- File size and MIME allowlists are enforced server-side.
- Every other bucket path is denied.
- Pending, rejected, signed-out, and deleted-profile users have no access.

The corresponding Firestore profile lookup is part of every relevant Storage
Rules decision, so changes to user approval status take effect at the server
boundary rather than only in the React UI.

### Cloud Storage CORS

Authenticated `getBlob()` calls initially listed metadata successfully but audio
and full file downloads stalled. The underlying bucket CORS configuration was
updated in Google Cloud Console with:

- Origins:
  - `https://totally-vocally.vercel.app`
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
- Methods: `GET`, `HEAD`
- Response headers: `Content-Type`, `Content-Length`, `Content-Range`,
  `Accept-Ranges`
- Cache expiry: `3600` seconds

This is a bucket configuration and is not stored in Git. It must be repeated for
another Firebase/Google Cloud project.

### Audio playback fixes

Audio originally remained on `Loading…`. Three separate causes were addressed:

1. The temporary object URL was being revoked before the audio element finished
   using it. The URL now remains alive for playback and is revoked on close,
   replacement, or component unmount.
2. The CSP now includes `media-src 'self' blob:` so authenticated in-memory media
   can play.
3. Firebase can return downloaded bytes as `application/octet-stream`. The app
   rebuilds the Blob using the trusted content type stored in object metadata and
   renders an explicit `<source type="…">`.

Live verification showed the test MP3 reaching `readyState 4`, a duration of
approximately 290.191 seconds, and an advancing `currentTime` after playback.

### In-browser previews

- PDF, plain text, image, and video resources open in an authenticated modal.
- Audio opens the embedded player.
- Preview/download Blob URLs are session-local and revoked when no longer used.
- Office formats (`.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`) remain
  download-only. A Google/Microsoft hosted viewer was deliberately not used
  because it would require a third party to receive a publicly accessible file
  URL, bypassing the approved-member model.

### Multiple resources per song

- A song can now reference up to 20 uploaded files plus an optional external
  HTTPS resource.
- The current Firestore field is `linkedFiles`, containing objects shaped as:

  ```json
  {
    "fullPath": "shared/internal-object-name.pdf",
    "name": "Lyrics.pdf",
    "contentType": "application/pdf"
  }
  ```

- Legacy single-file fields are still read for compatibility. Editing and saving
  a song writes the new array and clears the old single-file fields.
- One Storage object can be linked to several songs without being uploaded or
  billed several times.
- Admins select resources through checkboxes in the song editor.

### Files folder hierarchy and combined management

- Members no longer see a flat list of individual objects.
- Files is presented as `Files → song folder → resources`.
- Uploaded objects not linked to any song appear under **General Resources**.
- A file linked to more than one song is displayed in each relevant folder but
  remains one Storage object.
- The separate Songs navigation item was removed.
- Administrators see **Manage song folders** below the same member folder view.
- Admins can add/edit/delete songs, assign choir days, select uploaded resources,
  and add an external HTTPS practice link on this page.
- Members do not see the administration section.

### Event-to-folder navigation

- Allocated song names are now buttons in both the Events list and the Calendar
  event detail popup.
- Clicking a song navigates to Files, scrolls to the matching folder, opens it,
  and focuses its summary.
- If the allocated song does not have resources yet, the target folder is still
  shown and displays `No resources have been added to this song yet.`
- Opening Files through the normal navigation does not force a previously linked
  folder to stay open.

## 3. Firebase billing conclusions

As of 22 August 2026, Firebase's published allowance for a default
`*.firebasestorage.app` bucket on Blaze includes:

- 5 GB-months stored
- 100 GB downloaded per month
- 5,000 upload operations per month
- 50,000 download operations per month

The approximately 2 GB currently held in Dropbox is below the 5 GB-month storage
allowance. If downloads and operation counts also remain below the allowances,
the expected Firebase Storage charge is £0/$0. Usage above those amounts is
charged at the applicable Google Cloud Storage regional rates.

Blaze is still required even while usage remains inside the no-cost allowances.
See [Firebase pricing](https://firebase.google.com/pricing) and the
[Firebase Storage Blaze requirement](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

### Billing threshold limitation

- A normal Google Cloud budget sends alerts but does **not** stop usage or create
  a guaranteed maximum bill.
- Spend-cap budgets are currently Preview and cover only eligible API services;
  persistent Cloud Storage is not an eligible hard-stop service. Storage may
  continue accruing fixed storage charges.
- Therefore there is no reliable absolute Blaze spending ceiling for this
  bucket. Configure budget alerts, monitor Storage quotas/usage, preserve the
  100 MB upload limit, keep uploads admin-only, and avoid public download URLs.

Official reference:
[Google Cloud budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets).

## 4. Google Cloud bucket Permissions decision

The bucket Permissions tab was inspected read-only at:

<https://console.cloud.google.com/storage/browser/totally-vocally.firebasestorage.app;tab=permissions?project=totally-vocally>

Observed state:

- Public access summary: `Subject to object ACLs`.
- Access control: fine-grained/object ACLs enabled.
- No actual `allUsers` or `allAuthenticatedUsers` principal row was present.
- Expected Firebase Admin SDK, Firebase Rules, Firebase Management, Cloud Storage
  for Firebase, and Firestore service agents were present.
- Project owner/editor/viewer legacy bucket roles were present as expected.

Decision:

- No additional principal or IAM permission is required for the web app.
- Do not add choir members to bucket IAM.
- Do not remove or edit Google/Firebase service accounts.
- **Prevent public access** is optional defence-in-depth and was not enabled.
- **Switch to uniform** was not required and was left unchanged.
- Member authorization remains in Firebase Storage Rules, not bucket IAM.

## 5. Vercel activity

The first Vite deployment failed after compiling successfully because the Vercel
project was still configured to look for the Create React App output directory
`build`. The build log ended with:

```text
Error: No Output Directory named "build" found after the Build completed.
```

The Vercel project was updated to use Vite output directory `dist`, then
redeployed successfully. Subsequent Git pushes to `main` created production
deployments automatically.

Current Vercel requirements:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Production environment variables: all six `VITE_FIREBASE_*` values
- Production domain: `totally-vocally.vercel.app`
- Security headers are source-controlled in `vercel.json`.

The build continues to report a non-blocking warning that the main JavaScript
chunk is larger than 500 kB after minification. Code splitting is a future
performance improvement, not a release blocker.

## 6. Live verification completed

Verification was performed using logged-in production sessions, including a
member-facing session and an admin session.

Confirmed:

- Latest production deployments reached `READY`.
- Admin navigation no longer contains Songs.
- Member navigation contains Calendar, Events, Info, and Files; no admin pages.
- Files displayed song folders and General Resources rather than a flat list.
- Admin Files displayed `Manage song folders` with the 25-song catalogue.
- Sample live counts observed during final checks:
  - **All My Love**: 2 resources
  - **All these things that i have done**: 3 resources
  - **General Resources**: 6 resources
- Audio downloaded through authenticated Storage Rules and played.
- PDFs/documents supported by the preview matrix opened in the browser.
- The Day Fever event displayed its allocated songs as clickable buttons.
- Clicking **When You're Gone** from Events opened that Files folder and its
  empty-resource message.
- Clicking **Long Train Runnin'** from the Calendar event popup did the same.
- The event-to-folder tests were performed in the member view, confirming the
  behaviour does not depend on admin privileges.

No production data was created, edited, or deleted during the final navigation
checks.

## 7. Commit timeline for 22 August 2026

Times are Europe/London (`+01:00`).

| Time | Commit | Change |
|---|---|---|
| 06:22 | `e735254` | Improve event arrival defaults and description links |
| 06:24 | `3dc3d31` | Correct event arrival default direction |
| 06:29 | `23f5a9b` | Apply the 30-minute-before arrival default to every event |
| 07:36 | `e11fe71` | Security remediation, Vite migration, rules, headers, tests, and initial Firebase Storage implementation |
| 07:55 | `24cfa44` | Add file player and song/file linking |
| 07:59 | `cadb30c` | Fix audio loading and redesign the song editor |
| 08:02 | `0a06951` | Document bucket CORS required for browser playback |
| 08:06 | `0e220ec` | Keep audio Blob URL alive during playback |
| 08:08 | `45a1147` | Permit authenticated Blob audio in CSP |
| 08:09 | `2acd80f` | Preserve explicit MIME type for audio playback |
| 08:12 | `1d8e14a` | Add secure in-browser file previews |
| 08:13 | `daf9573` | Document preview support and security trade-offs |
| 08:17 | `04b2367` | Support multiple resources per song |
| 08:21 | `cf062b9` | Organize member Files into song folders |
| 08:25 | `02638ea` | Combine Files and Song Library into one interface |
| 08:36 | `48882f5` | Link allocated event songs to their Files folders |

## 8. Replication/deployment procedure

### Local preparation

```bash
node --version
npm ci
npm test
npm run build
npm audit
```

Expected output: 8 tests pass, `dist/` is created, and audit reports zero known
vulnerabilities. The chunk-size warning can remain.

### Environment variables

Create `.env.local` locally and set the same values in Vercel Production/Preview:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Do not commit `.env.local`. Firebase web configuration is public client
configuration; authorization is enforced by Firebase Auth and server-side rules.

### Firebase deployment

```bash
npx firebase-tools@latest login
npx firebase-tools@latest use totally-vocally
npx firebase-tools@latest deploy --only firestore:rules,storage --project totally-vocally
```

If the first Storage deployment asks to enable the cross-service Firebase Rules
permission, accept it only for the intended Firebase project.

### Bucket configuration not stored in Git

Reapply the CORS configuration in section 2 through Google Cloud Console. Do not
make the bucket public. No additional bucket principals are needed.

### Vercel deployment

Confirm Vite, `npm run build`, `dist`, and all `VITE_FIREBASE_*` variables, then
push to `main`. Vercel Git integration deploys automatically.

### Production smoke test

1. Sign in as admin and open Files.
2. Upload a small PDF and an audio file.
3. Confirm PDF View and audio Play work without a permanent Loading state.
4. Add/edit a song folder and select several uploaded resources.
5. Confirm the folder count and resources update in the member view.
6. Allocate that song to a test event.
7. Confirm the song name links to the open Files folder from Events and Calendar.
8. Sign in as an approved non-admin and confirm upload, delete, and song-management
   controls are absent.
9. Confirm a pending user cannot list or download objects.
10. Delete test data and confirm event attendance children are also removed.

## 9. Important files

- `REVIEW.md` — original repository findings.
- `SECURITY_FIX_DEPLOYMENT.md` — security deployment/rollback checklist.
- `STORAGE_SETUP.md` — detailed Storage replication and smoke tests.
- `FIREBASE_SETUP.md` — initial Firebase project setup; some historical migration
  sections are obsolete, so prefer this handover and the security/storage guides.
- `firestore.rules` — Firestore authorization and write validation.
- `storage.rules` — private file authorization, limits, and MIME allowlist.
- `firebase.json` — Firestore/Storage rule deployment configuration.
- `vercel.json` — production security headers.
- `src/components/FilesPage.js` — folders, upload, preview, playback, download,
  delete, and Files/Songs combined UI.
- `src/components/SongsPage.js` — embedded admin catalogue and resource editor.
- `src/useSongs.js` — shared song subscription and writes.
- `src/useEventsFirestore.js` — event/attendance data and cleanup.
- `src/components/EventsPage.js` and `EventDetailModal.js` — allocated-song links.
- `src/safeUrl.js` and `src/safeUrl.test.js` — HTTPS validation and tests.

## 10. Follow-up work

1. Migrate the approximately 2 GB Dropbox library in small batches through the
   admin Files page. Preserve meaningful original filenames.
2. Create Google Cloud budget alerts. Treat them as alerts, not a hard cap.
3. Consider enabling bucket-level **Prevent public access** after a dedicated
   playback/upload/download regression test.
4. Add Firestore/Storage Rules emulator tests. Current tests cover URL validation
   but not server rule behaviour.
5. Remove or relocate the stale `migrateEventsToFirestore` helper.
6. Add pagination before the bucket exceeds 1,000 objects; `listAll()` is suitable
   for the current small library but not an unbounded archive.
7. Code-split the client bundle to address Vite's >500 kB warning.
8. Update remaining historical setup/migration wording in `FIREBASE_SETUP.md` as
   part of a documentation cleanup.

## 11. Security invariants to preserve

- Never grant `allUsers` or `allAuthenticatedUsers` bucket access.
- Never add members directly to Google Cloud bucket IAM.
- Never replace authenticated `getBlob()` with shareable token URLs for private
  choir material.
- Keep Files reads limited to approved members and writes limited to admins.
- Keep external song URLs HTTPS-only.
- Update the client and `storage.rules` MIME/size allowlists together.
- Deploy web code and Firebase rules from the same revision.
- Do not weaken `/users` collection rules to restore a viewer dashboard; use a
  deliberately redacted collection or trusted server endpoint instead.

## 12. Post-handover update — 23 August 2026

- Swapped the Files and Info positions in the shared navigation.
- Standard-member order is now **Calendar → Events → Files → Info**, leaving Info
  as the final standard tab.
- Admin-only Attendance and Members tabs continue after the shared tabs.
- Events now shows the next 10 upcoming entries by default, with a **Show next
  10** control for incremental disclosure.
- Past events are collapsed by default and reveal the latest 5 at a time.
- Calendar remains the interface for browsing distant dates. The shared app data
  subscription remains unchanged because Calendar and attendance features also
  use the event collection; this change limits rendering rather than introducing
  a second competing Firestore event source.
