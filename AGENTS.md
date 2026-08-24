# Totally Vocally repository guidance

This is the Totally Vocally members portal, deployed at
<https://totally-vocally.vercel.app/>.

Before changing code:

- Read this file and inspect the existing implementation.
- Read `FVSPA_HANDOVER_2026-08-22.md` when working on Firebase Storage, Files,
  songs, events, deployment, or production configuration.
- Preserve existing behaviour and avoid unrelated redesigns or refactors.
- Never commit API keys, credentials, Firebase secrets, or personal member data.

Implementation rules:

- Access to member content must remain restricted to authenticated, approved
  users. Administrative writes and member-management functions must remain
  admin-only.
- Files in Firebase Storage must remain protected by Firebase Authentication and
  Storage Rules.
- Do not replace authenticated `getBlob()` downloads with public or
  token-bearing download URLs.
- Audio playback uses an authenticated Blob URL. Keep the object URL alive until
  the player closes, the file changes, or the component unmounts.
- Preserve the file metadata MIME type when creating playable Blob objects.
- The CSP must continue to permit `media-src 'self' blob:`.
- Storage bucket CORS is external Google Cloud configuration and is not stored
  in this repository.
- The production bucket is `totally-vocally.firebasestorage.app` and must allow
  `https://totally-vocally.vercel.app` for `GET` and `HEAD` requests, together
  with the upload-related CORS headers documented in `STORAGE_SETUP.md`.
- Files use Firebase Storage's non-resumable `uploadBytes` flow. Normalise
  stored filenames safely while preserving the original display name in
  metadata.
- Keep the Files and song-library experience combined. Members browse song
  folders; administrators manage song folders and linked resources from Files.
- A song may link to multiple stored resources. Do not duplicate a Storage
  object merely because it is linked to more than one song.
- Allocated songs in Events and Calendar must continue to open their matching
  Files folder.
- Keep external resource links HTTPS-only and update client and server-side
  validation together.
- Do not add choir members to Google Cloud bucket IAM or grant access to
  `allUsers` or `allAuthenticatedUsers`.
- Deploy web code and Firebase rules from the same revision when a change
  affects both.

Current product baseline:

- Non-admin members automatically see events assigned to their choir sections.
  Admins retain an explicit section filter with an **All sections** option.
- Calendar and Events show a visible **NEW** indicator when new events are
  available.
- Event section and song selectors use grouped checkbox styling in add/edit
  dialogs. Event filtering and section matching are covered by tests.
- Audio files are detected from both MIME type and file extension.
- Files shows **NEW** when files were added since the member last opened it;
  new files are labelled inside folders and folder summaries show new-file
  counts. Refresh this state on sign-in, window focus, visibility changes, and
  the periodic poll.
- Members shows a live numeric badge for pending access approvals. Pending
  requests are separated from approved, rejected, and administrator accounts.
- Authentication errors must be user-friendly: duplicate-email errors provide
  Sign in and Reset password actions, and weak-password errors explain the
  minimum requirement.

Verification:

- Run `npm test` and `npm run build` after material changes.
- For UI changes, verify the affected workflow in a browser using an approved
  non-admin account where member permissions are relevant.
- For admin changes, also verify that the corresponding controls remain absent
  for standard members.
- For audio changes, confirm the player exits Loading, reaches a playable
  `readyState`, and `currentTime` advances.
- For Files changes, verify authenticated view/play/download behaviour and that
  pending or unapproved users cannot access stored objects.
- The current baseline is 15 passing tests and a passing production build.
- Report any checks that could not be run.

Code-review style:

- Prioritise correctness, security, authentication, authorization, data loss,
  regressions, and accessibility.
- Report concrete findings with file and line references.
- Distinguish confirmed defects from suggestions.
- Do not modify, publish, or merge a branch unless explicitly requested.
