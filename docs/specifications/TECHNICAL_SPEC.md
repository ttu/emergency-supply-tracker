# Technical Specification - Emergency Supply Tracker

## Overview

This document defines the technical architecture, technology stack, development practices, and deployment strategy for the Emergency Supply Tracker application.

## Technology Stack

### Frontend Framework
- **React** 19.x (latest: 19.2.3)
- **TypeScript** 5.x (latest: 5.9.3)
- **Vite** 7.x (latest: 7.3.0)

### State Management
- **React Context API** for global state
- **Custom Hooks** for business logic
- No external state library needed (LocalStorage-first)

### Storage
- **Browser LocalStorage** (5-10 MB)
- No backend/server required
- No database

### Data Format
- **JSON** for all data (import/export)
- **JSON Schema validation** with Ajv + ajv-formats

### Styling
- **CSS Modules** (component-scoped styles)
- No CSS-in-JS library
- Modern CSS features (Grid, Flexbox, CSS Variables)

### Testing
- **Jest** (unit + integration tests - 70%)
- **React Testing Library** (component testing)
- **Playwright** (E2E tests - 20%)
- **Testing Diamond approach** (not pyramid)

### Code Quality
- **ESLint** (linting)
- **Prettier** (formatting)
- **TypeScript** (type checking)
- **Husky** (Git hooks)

### CI/CD
- **GitHub Actions** (CI pipeline)
- **Deployment:** GitHub Pages or Render.com

### Internationalization
- **react-i18next** or similar
- JSON-based translation files
- English and Finnish support

## Architecture Decisions

### Why LocalStorage?

✅ **Pros:**
- No server costs
- Instant reads/writes
- Perfect for 1000+ items
- User data privacy (no cloud)
- Works offline by default
- Simple to implement

❌ **Cons (considered):**
- Limited to ~5-10 MB (sufficient for our use case)
- Browser-specific (no cross-device sync)
- User must export for backup

**Decision:** LocalStorage is perfect for this app. IndexedDB considered but rejected as overkill for hundreds of items.

### Why Testing Diamond?

Traditional pyramid: 70% unit, 20% integration, 10% E2E

Our diamond: 70% integration, 20% E2E, 10% unit

**Rationale:**
- No backend = integration tests are fast
- React components + logic best tested together
- User-centric testing (integration shows real user flows)
- Unit tests only for pure business logic
- Better ROI on integration tests

See [TESTING_STRATEGY.md](TESTING_STRATEGY.md) for details.

### Why React Context (not Redux/Zustand)?

✅ **Pros:**
- Built into React
- Simple for this app's scope
- LocalStorage is source of truth
- No learning curve

**Decision:** Context API + custom hooks sufficient. No global state library needed.

### Why Vite (not Create React App)?

✅ **Pros:**
- Faster dev server (ESBuild)
- Faster builds
- Better tree-shaking
- Modern tooling
- CRA is deprecated

### Why No Backend?

✅ **Pros:**
- No hosting costs
- No maintenance
- Maximum privacy
- Works offline
- Simple deployment (static files)

**Decision:** Client-only app. Users export JSON for backup.

## Project Structure

```
emergency-supply-tracker/
├── src/
│   ├── components/          # React components
│   │   ├── common/         # Reusable UI components
│   │   ├── dashboard/      # Dashboard-specific
│   │   ├── inventory/      # Inventory-specific
│   │   └── settings/       # Settings-specific
│   ├── hooks/              # Custom React hooks
│   │   ├── useInventory.ts
│   │   ├── useHousehold.ts
│   │   └── useLocalStorage.ts
│   ├── contexts/           # React Context providers
│   │   ├── InventoryContext.tsx
│   │   └── SettingsContext.tsx
│   ├── utils/              # Utility functions
│   │   ├── calculations/   # Business logic
│   │   ├── validation/     # Ajv schemas
│   │   └── storage/        # LocalStorage utils
│   ├── types/              # TypeScript types
│   │   ├── InventoryTypes.ts
│   │   ├── HouseholdTypes.ts
│   │   └── index.ts
│   ├── data/               # Built-in data
│   │   ├── builtinTemplates.ts
│   │   └── recommendedItems.ts
│   ├── locales/            # Translation files
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── categories.json
│   │   │   ├── products.json
│   │   │   └── units.json
│   │   └── fi/
│   │       ├── common.json
│   │       ├── categories.json
│   │       ├── products.json
│   │       └── units.json
│   ├── test/               # Test utilities
│   │   └── setup.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── vite-env.d.ts       # Vite type definitions
├── e2e/                    # Playwright E2E tests
│   ├── onboarding.spec.ts
│   ├── inventory.spec.ts
│   └── export-import.spec.ts
├── public/                 # Static assets
├── docs/                   # Documentation
│   └── specifications/     # Spec documents
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI pipeline
│       └── deploy.yml      # GitHub Pages deploy
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
├── jest.config.js          # Jest config
├── playwright.config.ts    # Playwright config
├── eslint.config.js        # ESLint config
├── .prettierrc.json        # Prettier config
└── package.json            # Dependencies
```

## Component Architecture

### Pattern: Presentational vs Container

**Presentational Components** (pure):
- Receive props only
- No business logic
- No hooks (except useTranslation)
- Easy to test
- Storybook-ready

```typescript
// Presentational
interface ItemCardProps {
  name: string;
  quantity: number;
  recommendedQuantity: number;
  status: 'ok' | 'warning' | 'critical';
  onEdit: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = (props) => {
  return <div>...</div>;
};
```

**Container Components** (smart):
- Use hooks
- Business logic
- Data fetching
- Pass props to presentational

```typescript
// Container
export const ItemCardContainer: React.FC<{ itemId: string }> = ({ itemId }) => {
  const { items, updateItem } = useInventory();
  const { household } = useHousehold();

  const item = items.find(i => i.id === itemId);
  const recommendedQty = calculateRecommendedQuantity(item, household);
  const status = getItemStatus(item, recommendedQty, new Date());

  return <ItemCard {...props} />;
};
```

See [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) for full details.

## Data Schema

See [DATA_SCHEMA.md](DATA_SCHEMA.md) for complete schema.

### LocalStorage Structure

**Key:** `emergencySupplyTracker`

**Value:**
```typescript
interface AppData {
  version: string;                    // Schema version
  household: HouseholdConfig;
  settings: UserSettings;
  categories: Category[];             // Custom only
  items: InventoryItem[];
  productTemplates: ProductTemplate[]; // Custom only
  lastModified: string;               // ISO 8601
}
```

**Size estimate:**
- 1 item ≈ 0.5 KB
- 1000 items ≈ 500 KB
- Well within 5-10 MB limit

### Data Validation

**Import validation with Ajv:**

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const importSchema = {
  type: 'object',
  required: ['app', 'version', 'household', 'items'],
  properties: {
    app: { const: 'emergency-supply-tracker' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    household: { /* ... */ },
    items: { /* ... */ }
  }
};

const validate = ajv.compile(importSchema);
const valid = validate(data);
if (!valid) {
  console.error(validate.errors);
}
```

## Code Quality Standards

### ESLint Configuration

```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }
      ],
    },
  },
);
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Git Hooks (Husky)

**Pre-commit** (`.husky/pre-commit`):
```bash
#!/usr/bin/env sh
npx lint-staged
```

**lint-staged** (`package.json`):
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings=0",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

## Testing Strategy

### Testing Tools

- **Jest** 30.x (latest: 30.2.0)
- **React Testing Library** (component tests)
- **Playwright** 1.57.x (latest: 1.57.0)
- **@testing-library/user-event** (user interactions)
- **@testing-library/jest-dom** (DOM matchers)

### Jest Configuration

```javascript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Distribution (Diamond)

- **70% Integration Tests** (Jest + RTL)
  - Component + hook + business logic together
  - Test real user flows
  - Mock LocalStorage

- **20% E2E Tests** (Playwright)
  - Critical user journeys
  - Cross-browser testing
  - LocalStorage persistence

- **10% Unit Tests** (Jest)
  - Pure functions only
  - Calculation utilities
  - Validation functions

### Example Tests

**Integration Test:**
```typescript
describe('Inventory Management', () => {
  it('adds item from recommendation and shows in inventory', () => {
    render(<App />);

    // Navigate to category
    userEvent.click(screen.getByText('Water & Beverages'));

    // Click recommended item
    userEvent.click(screen.getByText('Bottled Water'));

    // Fill form
    userEvent.type(screen.getByLabelText('Quantity'), '12');
    userEvent.click(screen.getByText('Save'));

    // Verify item appears
    expect(screen.getByText('12 / 18 liters')).toBeInTheDocument();
  });
});
```

**E2E Test:**
```typescript
test('complete onboarding flow', async ({ page }) => {
  await page.goto('/');

  // Welcome screen
  await page.click('text=Get Started');

  // Household setup
  await page.fill('[name="adults"]', '2');
  await page.fill('[name="children"]', '1');
  await page.click('text=Next');

  // Verify dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=2 adults, 1 child')).toBeVisible();
});
```

## CI/CD Pipeline

### GitHub Actions Workflow

**CI Pipeline** (`.github/workflows/ci.yml`):

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

**Deploy Pipeline** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Vite Configuration for Deployment

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production'
    ? (process.env.VITE_BASE_PATH || '/emergency-supply-tracker/')
    : '/',
});
```

**Environment Variables:**
- `VITE_BASE_PATH`: Override base path (for Render.com, set to `/`)

## Deployment

### GitHub Pages (Recommended)

**URL:** `https://username.github.io/emergency-supply-tracker/`

**Process:**
1. Push to `main` branch
2. GitHub Actions runs CI (lint, test, build)
3. If all pass, deploys to GitHub Pages
4. Site live in 2-3 minutes

**Configuration:**
- Repository Settings → Pages
- Source: GitHub Actions
- Custom domain: Optional

### Render.com (Alternative)

**URL:** `https://yourapp.onrender.com/`

**User Configuration:**
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variable:** `VITE_BASE_PATH=/`
- Deploy from GitHub repository

**Note:** User handles Render.com configuration. The app supports both deployment targets via the `vite.config.ts` base path configuration.

### Other Platforms

**Netlify:**
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Vercel:**
- Auto-detects Vite
- Zero config needed

## Performance Budgets

### Bundle Size

- **Main bundle:** < 200 KB (gzipped)
- **Vendor bundle:** < 150 KB (gzipped)
- **Total initial load:** < 350 KB (gzipped)

### Lighthouse Metrics

- **Performance:** > 90
- **Accessibility:** > 95
- **Best Practices:** > 90
- **SEO:** > 90

### Loading Performance

- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Cumulative Layout Shift (CLS):** < 0.1

## Browser Support

### Target Browsers

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari (iOS 14+)
- Mobile Chrome (Android 10+)

### Polyfills

**None required** - using only modern JavaScript features supported by all target browsers:
- ES2020 syntax
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- `Promise.allSettled()`

## Security Considerations

### Data Security

- ✅ No server = no server attacks
- ✅ LocalStorage is origin-scoped
- ✅ No XSS (React escapes by default)
- ✅ No CSRF (no server)
- ✅ No SQL injection (no database)

### Input Validation

- ✅ Ajv validates imported JSON
- ✅ TypeScript prevents type errors
- ✅ React prevents XSS in user input
- ✅ No `dangerouslySetInnerHTML` used

### Dependencies

- ✅ Regular `npm audit` checks
- ✅ Dependabot auto-updates
- ✅ No known high/critical vulnerabilities

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';">
```

## Migration Strategy

### Schema Versioning

```typescript
interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: (oldData: any) => AppData;
}

const migrations: Migration[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '1.1.0',
    migrate: (oldData) => ({
      ...oldData,
      version: '1.1.0',
      household: {
        ...oldData.household,
        freezerHoldTimeHours: 48 // New field with default
      }
    })
  }
];
```

### Migration Process

1. Check `data.version` on app load
2. Find migration path
3. Apply migrations sequentially
4. Save updated data
5. Log migration to console

## Development Workflow

### Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "prepare": "husky install"
  }
}
```

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser
http://localhost:5173

# Run tests (watch mode)
npm run test:watch

# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests (UI mode)
npm run test:e2e:ui
```

### Quality Gates

**Pre-commit:**
- ESLint (no warnings)
- Prettier formatting
- Staged files only

**Pre-push (recommended):**
```bash
npm run type-check
npm run test
```

**CI (required for merge):**
- Linting pass
- Type checking pass
- Tests pass (70% coverage)
- E2E tests pass
- Build succeeds

## Naming Conventions

### Files

- Components: `PascalCase.tsx` (e.g., `ItemCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useInventory.ts`)
- Utils: `camelCase.ts` (e.g., `calculations.ts`)
- Types: `PascalCase.ts` (e.g., `InventoryTypes.ts`)
- Tests: `*.test.tsx` or `*.spec.tsx`

### Code

- Components: `PascalCase`
- Hooks: `useCamelCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces/Types: `PascalCase`

## Documentation

### Code Documentation

```typescript
/**
 * Calculates recommended quantity for an item based on household config
 * @param item - The recommended item definition
 * @param household - Current household configuration
 * @returns The recommended quantity for the item
 */
function calculateRecommendedQuantity(
  item: RecommendedItemDefinition,
  household: HouseholdConfig
): number {
  // Implementation
}
```

### Component Documentation

```typescript
/**
 * ItemCard - Displays a single inventory item with status
 *
 * @example
 * <ItemCard
 *   name="Bottled Water"
 *   quantity={18}
 *   recommendedQuantity={21}
 *   status="warning"
 *   onEdit={() => {}}
 * />
 */
export const ItemCard: React.FC<ItemCardProps> = (props) => {
  // Implementation
};
```

## References

- [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - Component patterns
- [DATA_SCHEMA.md](DATA_SCHEMA.md) - Data structures
- [TESTING_STRATEGY.md](TESTING_STRATEGY.md) - Testing approach
- [CODE_QUALITY.md](CODE_QUALITY.md) - Detailed tool configurations
- [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md) - i18n implementation

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
**Status**: Planning Phase - V1 Technical Architecture Complete
