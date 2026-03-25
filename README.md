# 🎵 Totally Vocally — Members Portal

A React web app for Totally Vocally choir members. Password-protected portal with a rehearsal calendar, event attendance, choir information, and a Dropbox files link.

---

## Features

- 🔐 **Password login** — members enter the shared password to access the portal
- 📅 **Calendar** — monthly view showing rehearsals and performances
- 🎤 **Events** — list view with attendance RSVP (Coming / Maybe / Can't make it)
- ℹ️ **Info page** — choir details, director contact, venue, guidelines
- 📁 **Files** — direct link to your shared Dropbox folder

---

## Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or higher
- npm (comes with Node.js)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm start
```

The app will open at **http://localhost:3000**

**Password:** `5inging`

---

## Deploying to GitHub Pages

### First-time setup

**1. Create a GitHub repository**
- Go to [github.com/new](https://github.com/new)
- Name it `totally-vocally` (or anything you like)
- Set it to **Public** (required for free GitHub Pages)
- Click **Create repository**

**2. Push your code to GitHub**

```bash
# Inside the totally-vocally folder:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/totally-vocally.git
git push -u origin main
```

> Replace `YOUR-USERNAME` with your actual GitHub username.

**3. Update `package.json` with your GitHub Pages URL**

Open `package.json` and change the `homepage` line:

```json
"homepage": "https://YOUR-USERNAME.github.io/totally-vocally",
```

**4. Deploy**

```bash
npm run deploy
```

This builds the app and pushes it to a `gh-pages` branch automatically.

**5. Enable GitHub Pages**
- Go to your repo on GitHub → **Settings** → **Pages**
- Under "Source", select **Deploy from a branch**
- Choose branch: `gh-pages`, folder: `/ (root)`
- Click **Save**

Your app will be live at:
**`https://YOUR-USERNAME.github.io/totally-vocally`**

> It may take 1–2 minutes for GitHub Pages to go live the first time.

### Subsequent deployments

Whenever you make changes:

```bash
git add .
git commit -m "Your change description"
git push
npm run deploy
```

---

## Customisation

### Change the password
Open `src/components/Login.js` and change:
```js
const PASSWORD = '5inging';
```

### Add your Dropbox link
Open `src/components/FilesPage.js` and replace:
```js
const DROPBOX_URL = 'https://www.dropbox.com/your-folder-link-here';
```
with your actual Dropbox shared folder URL.

### Update choir information
Open `src/components/InfoPage.js` — the `CARDS` array contains all the info card content. Edit the text fields directly.

### Change rehearsal times / venue on the Info page
The `CARDS` array in `InfoPage.js` has a card with title `'Rehearsal Location'` — update the `text` field there.

---

## Notes on Data Storage

Events and attendance are saved in the browser's **localStorage**. This means:
- Data persists between sessions on the **same device/browser**
- Data is **not shared** between different members' devices

If you want events and attendance to sync across all members in real time, this would require adding a backend database (e.g. Firebase or Supabase). Ask your developer or raise it as a future enhancement.

---

## Tech Stack

- [React 18](https://react.dev/)
- [Create React App](https://create-react-app.dev/)
- [CSS Modules](https://create-react-app.dev/docs/adding-a-css-modules-stylesheet/)
- [gh-pages](https://www.npmjs.com/package/gh-pages) for deployment

---

*Built with ♫ for Totally Vocally*
