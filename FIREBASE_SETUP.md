# Firebase Setup Guide for Totally Vocally

## Phase 2: Shared Backend + Real Accounts

This guide walks through setting up Firebase for the Totally Vocally choir portal.

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project"
3. Name it: `totally-vocally`
4. You can enable Google Analytics (optional)
5. Click "Create project"

### 2. Register Web App

1. In the Firebase console, click the web icon (`</>`)
2. App nickname: `totally-vocally-web`
3. Firebase will show your config object with these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### 3. Set Environment Variables

Create `.env.local` in the project root (copy from `.env.local.example`):

```bash
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

Replace with values from Step 2.

### 4. Enable Email Link Authentication

1. Go to **Authentication** > **Sign-in method** tab
2. Click "Email/Password"
3. Enable "Email link (passwordless sign-in)"
4. Set "Link expires after": 24 hours (default is fine)
5. Save

### 5. Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode** (we'll update rules in step 6)
4. Choose region closest to your users (e.g., `europe-west2` for UK)
5. Click "Create"

### 6. Deploy Security Rules

1. In Firestore console, go to **Rules** tab
2. Copy the contents of `firestore.rules` from this repo
3. Paste into the Rules editor
4. Click "Publish"

### 7. Create Firestore Collections

Collections will be auto-created when data is written, but you can pre-create them:

1. Go to **Firestore Database** > **Data** tab
2. Click "Create collection"
3. Collection ID: `users`
4. Click "Next"
5. Click "Save" (empty collection is fine)

Repeat for:
- `events` collection
- (Attendance documents will be auto-created under events)

### 8. Set Up Initial Admin User

1. Go to **Authentication** > **Users** tab
2. Click "Create user"
3. Email: Abi's email (the choir director)
4. Password: generate a temporary one
5. Create user
6. Note the UID

Then manually create an admin entry in Firestore:
1. Go to Firestore Data tab
2. Click `users` collection
3. Click "Add document"
4. Document ID: paste the UID from step 5
5. Add these fields:
   - `email`: (string) Abi's email
   - `displayName`: (string) "Abi Moore"
   - `role`: (string) "admin"
6. Save

Later, Abi will sign in with the magic link flow and promote other admins as needed.

### 9. Install Dependencies

Dependencies are already installed:
```bash
npm install firebase
```

### 10. Migrate Existing Data

When you're ready to go live:

1. Run the migration function (one-time):
   ```javascript
   import { migrateEventsToFirestore } from './useEventsFirestore';
   // In your app, once, after Firebase is loaded:
   migrateEventsToFirestore();
   ```

2. After migration completes, you can delete the old localStorage by running:
   ```javascript
   localStorage.removeItem('tv_events_v4');
   ```

### 11. Update App.js to Use Firebase Auth

The App component needs to be updated to:
1. Use `useAuth()` instead of local state for login
2. Use `useEventsFirestore(user.uid)` instead of `useEvents()`
3. Replace Login component with LoginFirebase + AuthModal flow

(Coming in next step)

### Cost Estimate (100 users)

With ~100 members, 25-30 rehearsals per month:

- **Monthly reads/writes**: ~5,000 (way under Firebase's 50k/month free tier)
- **Cost**: $0 (stays on free tier forever)

Even if every member checks the app 10× per day:
- 100 users × 10 checks × 30 days = 30k reads/month
- Still free tier ($1.06/month if we exceeded)

## Troubleshooting

**"Permission denied" errors?**
- Check firestore.rules are deployed (step 6)
- Verify user is authenticated before accessing data
- Check user's role in Firestore (admin vs member)

**"CORS error" on localhost?**
- This is normal in development. Firebase handles this.
- Ensure `.env.local` has correct values

**"Email link expired"?**
- Default is 24 hours. User can request a new link.
- You can adjust in Authentication settings.

**Getting 0 events after migration?**
- Check Firestore Data tab — events collection should exist
- Check browser console for errors
- Verify user is signed in (user != null)

## Next Steps

1. Complete Firebase setup above
2. Update App.js to use Firebase auth + Firestore
3. Test sign-in flow locally
4. Migrate events from localStorage
5. Invite pilot users to test
