# Firebase Storage setup and replication

The app uses the default bucket `totally-vocally.firebasestorage.app` and stores
member resources under `shared/`.

## Admin workflow

The Files section is the single resource-management area. Members see a folder
for each song and a General Resources folder for uploads not linked to a song.
Admins use the same page to:

1. Upload files.
2. Add or edit a song folder under **Manage song folders**.
3. Select every uploaded file that belongs in that folder and optionally add an
   external HTTPS practice link.

A file can be linked to more than one song without uploading another copy. The
separate Songs navigation item is intentionally not shown.

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
- PDF, plain-text, image, audio, and video files can be viewed or played in the
  browser after an authenticated download. Preview blob URLs exist only in the
  current browser session and are revoked when the viewer closes.
- Microsoft Office formats (`.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`)
  remain download-only. Native browsers cannot reliably render them, and using
  a hosted Office/Google viewer would require giving that third party a public
  file URL, bypassing the approved-member access model.

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

## Browser download CORS

Firebase's authenticated `getBlob()` browser downloads require CORS on the
underlying Cloud Storage bucket. In Google Cloud Console open:

**Cloud Storage → Buckets → totally-vocally.firebasestorage.app → Configuration
→ Cross-origin resource sharing → Edit**

Enable CORS and add one configuration:

- Origins: `https://totally-vocally.vercel.app`, `http://localhost:5173`,
  `http://127.0.0.1:5173`
- Methods: `GET`, `HEAD`
- Response headers: `Content-Type`, `Content-Length`, `Content-Range`,
  `Accept-Ranges`
- Cache expiry: `3600` seconds

Without this configuration, file listing and metadata can still work while
audio playback and downloads remain stuck before eventually reporting
`storage/retry-limit-exceeded`.

## Smoke test

1. Sign in as an admin and open Files.
2. Upload a small PDF. Confirm it appears with the original name and size.
3. Download it and compare the downloaded file.
4. Upload an audio file, press Play, and confirm the controls appear and audio
   starts without remaining on Loading.
5. Upload a PDF and a text file, press View, and confirm each opens inside the
   authenticated preview modal without navigating away from the app.
6. Sign in as an approved non-admin. Confirm download works and upload/delete
   controls are absent.
7. Using browser developer tools or the Rules Playground, confirm the member
   cannot create or delete an object directly.
8. Confirm a pending user cannot list or download anything.
9. As admin, try an executable or file over 100 MB and confirm it is rejected.
10. Delete the test PDF and confirm it disappears for all members.

## Migrating from Dropbox

Use the Files page for ordinary uploads. Upload in small batches so failures are
easy to identify. The current list is intentionally flat; folder hierarchies from
Dropbox are not recreated. If the library contains more than 1,000 objects, change
the app from `listAll` to paginated `list` before migration.

Do not make the bucket public and do not upload through Google Cloud Console with
public ACLs. Files uploaded directly in Firebase Console will appear, but they may
show their generated object name unless the `originalName` custom metadata field
is set.
