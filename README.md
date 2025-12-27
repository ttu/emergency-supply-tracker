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

### Example Data

Sample inventory exports are available in [examples/](examples/) directory:

- **sample-inventory-family5-days3.json**: 5-person household (2 adults, 3 children) with 3-day supply
  - Contains 15 items with various states: full stock, low stock, and expiring items
  - Useful for testing alerts, preparedness scores, and expiration tracking

To use an example:

1. Start the app: `npm run dev`
2. Go to Settings → Import Data
3. Upload the example JSON file from the `examples/` directory

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
