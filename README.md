# 🎵 Totally Vocally — Members Portal

A React web app for Totally Vocally choir members. Members sign in with their own
email and password; an administrator approves each account before it can see the
portal. Includes a rehearsal calendar, event attendance, song lists, a member
directory, and choir information.

---

## Features

- 🔐 **Per-member accounts** — email/password sign-in via Firebase Auth, with
  admin approval required before access. Sessions auto-expire after inactivity.
- 📅 **Calendar** — monthly view of rehearsals and performances
- 🎤 **Events** — attendance RSVP (Coming / Maybe / Can't make it)
- 🎶 **Songs** — repertoire per choir night, with allocation to events
- 👥 **Members & attendance** — admin directory and attendance dashboard
- ℹ️ **Info page** — choir details, venue, guidelines
- 📁 **Files** — link to the shared Dropbox folder

---

## Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or higher
- A Firebase project (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md))

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Add your Firebase credentials
#    Create .env.local (see FIREBASE_SETUP.md for the required keys)

# 3. Start the development server
npm start
```

The app opens at **http://localhost:3000**. Sign in with a member account you
have created in Firebase Auth, or request access from the login screen and
approve the account as an admin.

> Configuration lives in `.env.local`, which is git-ignored. Never commit it.
> The Firebase **web** API key is safe to expose in the client bundle; access is
> controlled by Firebase Auth and the Firestore security rules in
> [firestore.rules](firestore.rules), not by hiding the key.

---

## Deployment

The app is deployed on **Vercel**. Set the same `REACT_APP_FIREBASE_*`
environment variables in the Vercel project settings, then push to the
production branch (or run a Vercel deploy) to publish.

Firestore security rules are defined in [firestore.rules](firestore.rules) and
must be deployed to Firebase separately (Firebase console or `firebase deploy
--only firestore:rules`).

---

## Customisation

### Add your Dropbox link
Open `src/components/FilesPage.js` and set the Dropbox shared folder URL.

### Update choir information
Open `src/components/InfoPage.js` — the `CARDS` array holds all info-card
content, including the rehearsal location and director contact.

### Inactivity timeout
The auto-logout window is `INACTIVITY_TIMEOUT_MS` in `src/useAuth.js`
(default 30 minutes).

---

## Data Storage

Events, attendance, songs, member profiles, and portal content are stored in
**Cloud Firestore** and sync across all members in real time. Access is enforced
server-side by the rules in [firestore.rules](firestore.rules): only approved
members can read choir data, and only admins can modify it.

---

## Tech Stack

- [React 18](https://react.dev/)
- [Create React App](https://create-react-app.dev/)
- [Firebase](https://firebase.google.com/) — Authentication + Cloud Firestore
- [CSS Modules](https://create-react-app.dev/docs/adding-a-css-modules-stylesheet/)

---

*Built with ♫ for Totally Vocally*
