# Sentinel's Journal

## 2026-08-23 - Auth error surfacing is centralized in App.js
**Vulnerability:** `getAuthErrorMessage` in src/App.js fell back to raw Firebase `err.message` for unmapped codes, and the forgot-password flow surfaced `auth/user-not-found` (account enumeration).
**Learning:** `useAuth()` sets its own `error` state internally but no consumer reads it — all user-visible auth errors flow through `getAuthErrorMessage` in App.js. Fix error-message issues there, not in useAuth.js.
**Prevention:** When adding new auth flows, map every expected error code explicitly in `getAuthErrorMessage`; the default case must stay generic. Reset/enumeration-sensitive flows should respond identically whether or not the account exists.
