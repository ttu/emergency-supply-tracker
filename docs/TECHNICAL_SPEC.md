# Technical Specification

> **Version:** 1.1.0
> **Last Updated:** 2026-01-15
> **Source of Truth:** `package.json`

This document describes the technical architecture and stack of the Emergency Supply Tracker application.

---

## Technology Stack

### Core Framework

| Technology | Version | Purpose                   |
| ---------- | ------- | ------------------------- |
| React      | 19.2.3  | UI framework              |
| TypeScript | 5.9.3   | Type safety               |
| Vite       | 7.3.0   | Build tool and dev server |

### Internationalization

| Technology           | Version | Purpose           |
| -------------------- | ------- | ----------------- |
| i18next              | 25.7.3  | i18n framework    |
| react-i18next        | 16.5.0  | React bindings    |
| i18next-http-backend | 3.0.2   | Load translations |

### Testing

| Technology      | Version | Purpose                                        |
| --------------- | ------- | ---------------------------------------------- |
| Vitest          | 4.0.16  | Unit/Integration testing and Storybook testing |
| Testing Library | 16.3.1  | React component testing                        |
| Playwright      | 1.57.0  | E2E testing                                    |

### Development Tools

| Technology  | Version | Purpose               |
| ----------- | ------- | --------------------- |
| ESLint      | 9.39.2  | Code linting          |
| Prettier    | 3.7.4   | Code formatting       |
| Husky       | 9.1.7   | Git hooks             |
| lint-staged | 16.2.7  | Pre-commit linting    |
| Storybook   | 10.1.10 | Component development |

---

## Project Structure

```
emergency-supply-tracker/
├── .github/
│   ├── workflows/        # CI/CD pipelines
│   └── ISSUE_TEMPLATE/   # Bug/feature templates
├── .husky/               # Git hooks
├── .storybook/           # Storybook config
├── docs/                 # Documentation
├── e2e/                  # Playwright E2E tests
├── public/
│   ├── locales/          # Translation files
│   │   ├── en/           # English translations
│   │   └── fi/           # Finnish translations
│   └── ...               # Static assets
├── src/
│   ├── features/         # Feature slices (domain-driven)
│   │   ├── alerts/       # Alert generation and display
│   │   ├── categories/   # Category definitions
│   │   ├── dashboard/    # Dashboard page and components
│   │   ├── help/         # Help page
│   │   ├── household/    # Household configuration
│   │   ├── inventory/    # Inventory management
│   │   ├── onboarding/   # Onboarding flow
│   │   ├── settings/     # User settings
│   │   └── templates/    # Product templates and recommended items
│   ├── shared/           # Shared code across features
│   │   ├── components/   # Reusable UI primitives
│   │   ├── hooks/        # Shared hooks
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   ├── i18n/             # i18n configuration
│   ├── styles/           # Global CSS
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
└── eslint.config.js
```

---

## Architecture Decisions

### No Backend

- All data stored in browser LocalStorage
- No user accounts required
- Complete privacy - no data leaves the device
- Works offline after initial load

### LocalStorage vs IndexedDB

**Decision:** LocalStorage

**Rationale:**

- Simpler API
- Sufficient for expected data size (<1000 items)
- Synchronous access
- Wide browser support

**Limitations:**

- 5-10MB storage limit (varies by browser)
- Synchronous blocking (not an issue for small data)

### React Context API vs Redux

**Decision:** React Context API

**Rationale:**

- Simpler for small-medium apps
- No additional dependencies
- Sufficient for global state needs
- Easier to understand and maintain

### Testing Strategy: Testing Diamond

**Distribution:**

- 70% Integration tests (React Testing Library)
- 20% E2E tests (Playwright)
- 10% Unit tests (Vitest)

**Rationale:**

- Integration tests provide best coverage/effort ratio
- E2E tests verify critical user flows
- Unit tests for complex business logic

---

## Scripts

### Development

```bash
npm run dev          # Start dev server
npm run storybook    # Start Storybook
```

### Testing

```bash
npm run test         # Run Vitest tests
npm run test:watch   # Vitest watch mode
npm run test:coverage # Vitest with coverage
npm run test:e2e     # Run Playwright tests
npm run test:e2e:ui  # Playwright UI mode
npm run test:storybook # Vitest Storybook tests
npm run test:all     # All tests except E2E
```

### Build & Validation

```bash
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
npm run validate     # Full validation (format, lint, test, build)
npm run validate:all # Full validation including E2E
```

---

## Configuration Files

### TypeScript (`tsconfig.json`)

- Strict mode enabled
- ES2022 target
- React JSX transform

### ESLint (`eslint.config.js`)

- TypeScript ESLint rules
- React Hooks plugin
- React Refresh plugin
- Storybook plugin

### Prettier (`.prettierrc.json`)

- Single quotes
- 2 space indentation
- Trailing commas

### Vitest (`vite.config.ts`)

- jsdom environment
- Native TypeScript support
- Testing Library matchers
- Integrated with Vite build system

### Playwright (`playwright.config.ts`)

- Chromium, Firefox, WebKit browsers
- Base URL: http://localhost:5173
- Screenshots on failure

---

## CI/CD

### GitHub Actions Workflows

**CI (`ci.yml`):**

- Runs on push/PR to main
- Steps: Install, Lint, Test, Build

**Deploy (`deploy.yml`):**

- Deploys to GitHub Pages
- Triggered on main branch push

---

## Browser Compatibility

| Browser       | Version     |
| ------------- | ----------- |
| Chrome        | Latest 2    |
| Edge          | Latest 2    |
| Firefox       | Latest 2    |
| Safari        | Latest 2    |
| iOS Safari    | 14+         |
| Chrome Mobile | Android 10+ |

---

## Performance Targets

| Metric                 | Target  |
| ---------------------- | ------- |
| First Contentful Paint | < 1.5s  |
| Time to Interactive    | < 3s    |
| Lighthouse Performance | > 90    |
| Bundle Size (gzipped)  | < 100KB |

---

## Data Storage

### LocalStorage Key

```
emergency-supply-tracker
```

### Data Format

JSON-serialized `AppData` object (see DATA_SCHEMA.md).

### Storage Limits

- Typical usage: < 100KB
- Maximum practical: ~5MB
- Supports 1000+ items comfortably

---

## Security Considerations

- No external API calls
- No user authentication
- No sensitive data handling
- XSS protection via React
- CSP headers recommended for deployment
