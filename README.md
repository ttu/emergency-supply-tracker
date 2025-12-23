# Emergency Supply Tracker

Web-based emergency supply tracking application (based on 72tuntia.fi guidelines).

## Tech Stack
- React 19 + TypeScript 5.9 + Vite 7
- LocalStorage (no backend)
- GitHub Pages or Render.com deployment

## Development
```bash
npm install
npm run dev
```

## Deployment

### GitHub Pages
- Push to main → auto-deploy
- Configure: Settings → Pages → Source: GitHub Actions
- Visit: `https://username.github.io/emergency-supply-tracker/`

### Render.com (Alternative)
- Configure build command: `npm run build`
- Configure publish directory: `dist`
- Set environment variable: `VITE_BASE_PATH=/`
- User handles Render.com configuration

## Status
🚧 V0.1.0 - Work in progress
