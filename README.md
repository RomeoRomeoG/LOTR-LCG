# LOTR LCG Companion

A mobile-first PWA companion app for Lord of the Rings: The Card Game.

## Features

- **Play Log** — Record every quest with result, VP, threat, notes
- **Stats** — Win rate charts, plays by month, cycle breakdown
- **Quest Tracker** — All 128+ quests (Revised + Out-of-print + ALeP), mark beaten
- **Campaigns** — Official campaign progress tracking with quest dots
- **Tale of Years** — Full mega-campaign tracker:
  - XP pool management with spend log
  - Hero damage & threat penalty tracking
  - Dead Pile (unique card tracking)
  - Campaign Pool (boons & burdens)
  - Full ToY quest log with confirmed XP values from the rulebook

## Setup

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Create a GitHub repo named `lotr-lcg-companion`
2. Push this code to the `main` branch
3. Go to Settings → Pages → Source: **GitHub Actions**
4. The workflow in `.github/workflows/deploy.yml` handles the rest

Your app will be live at: `https://YOUR_USERNAME.github.io/lotr-lcg-companion/`

## If your repo has a different name

Update `vite.config.js`:
```js
base: '/YOUR-REPO-NAME/',
```

And `public/manifest.json`:
```json
"start_url": "/YOUR-REPO-NAME/"
```

And `public/sw.js`:
```js
const ASSETS = ['/YOUR-REPO-NAME/', '/YOUR-REPO-NAME/index.html']
```

## Add to Home Screen (Android)

1. Open the app in Chrome
2. Tap the three-dot menu
3. Select "Add to Home Screen"

The app works fully offline after the first load.

## Data

All data is stored in `localStorage` on your device. Nothing is sent anywhere.
To back up your data, open DevTools → Application → Local Storage and copy the values.

## Tech Stack

- React 18
- Vite
- Recharts (charts)
- Lucide React (icons)
- localStorage (persistence)
- Service Worker (offline)
