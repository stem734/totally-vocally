# Firebase Storage setup and replication

The app uses the default bucket `totally-vocally.firebasestorage.app` and stores
member resources under `shared/`.

## Access model

- Approved members and admins can list and download files.
- Only admins can upload and delete files.
- Pending, rejected, signed-out, and deleted-profile accounts have no access.
- Uploads are limited to 100 MB per file.
- Allowed uploads: PDF, Microsoft Office documents, plain text, audio, images,
  and video.
- Overwriting objects is disabled. Each upload receives a unique internal name;
  its original filename is retained in metadata and displayed to members.
- Files are downloaded through the authenticated Firebase SDK. The app does not
  generate persistent download-token links that could be shared outside the
  membership.

## Files involved

- `storage.rules` — server-side access, file-size, and MIME-type enforcement.
- `firebase.json` — deploys both Firestore and Storage rules.
- `src/firebase.js` — initializes Firebase Storage.
- `src/components/FilesPage.js` — list, upload, download, and deletion UI.

The client and server rule allowlists intentionally match. If you change the
100 MB limit or supported file types, update both `FilesPage.js` and
`storage.rules`, then test both permitted and rejected uploads.

## Deploy

Deploy the web app and rules from the same revision:

```bash
npm ci
npm test
npm run build
npx firebase-tools@latest deploy --only firestore:rules,storage --project totally-vocally
```

Deploy the Vite `dist/` build through Vercel after confirming all
`VITE_FIREBASE_*` environment variables, especially:

```text
VITE_FIREBASE_STORAGE_BUCKET=totally-vocally.firebasestorage.app
```

The first Storage rules deployment that reads Firestore may ask to enable the
cross-service rules permission. Accept it only for this Firebase project.

## Smoke test

1. Sign in as an admin and open Files.
2. Upload a small PDF. Confirm it appears with the original name and size.
3. Download it and compare the downloaded file.
4. Sign in as an approved non-admin. Confirm download works and upload/delete
   controls are absent.
5. Using browser developer tools or the Rules Playground, confirm the member
   cannot create or delete an object directly.
6. Confirm a pending user cannot list or download anything.
7. As admin, try an executable or file over 100 MB and confirm it is rejected.
8. Delete the test PDF and confirm it disappears for all members.

## Migrating from Dropbox

Use the Files page for ordinary uploads. Upload in small batches so failures are
easy to identify. The current list is intentionally flat; folder hierarchies from
Dropbox are not recreated. If the library contains more than 1,000 objects, change
the app from `listAll` to paginated `list` before migration.

Do not make the bucket public and do not upload through Google Cloud Console with
public ACLs. Files uploaded directly in Firebase Console will appear, but they may
show their generated object name unless the `originalName` custom metadata field
is set.
