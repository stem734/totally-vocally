# Bolt's Journal

## 2026-08-23 - Local builds have broken Firebase config (env prefix mismatch)
**Learning:** `.env.local` still uses CRA-era `REACT_APP_FIREBASE_*` names, but `src/firebase.js` reads `import.meta.env.VITE_FIREBASE_*`, so any local `npm run build` bakes in `undefined` config and the app throws `auth/invalid-api-key` at startup. Production works because Vercel has the `VITE_` vars. This is NOT caused by whatever change you're testing.
**Action:** To verify a build locally, export the `VITE_FIREBASE_*` vars mapped from the `REACT_APP_` ones before `npm run build`, then `npm run preview`. Also: vendor chunk hashes (react/firebase via manualChunks in vite.config.js) are stable across app-code changes — that's the caching win, don't "fix" it.
