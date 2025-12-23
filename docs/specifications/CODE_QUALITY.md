# Code Quality Tools - Emergency Supply Tracker

## Overview
This document defines the code quality standards, tools, and CI/CD configuration for the Emergency Supply Tracker project.

## Code Quality Tools

### ESLint (Linting)

**Configuration** (`eslint.config.js`):
```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
```

**Dependencies**:
```json
{
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "eslint": "^9.17.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.13.0",
    "typescript-eslint": "^8.18.2"
  }
}
```

**Scripts**:
```json
{
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix"
  }
}
```

### Prettier (Formatting)

**Configuration** (`.prettierrc.json`):
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

**Ignore file** (`.prettierignore`):
```
dist
build
coverage
node_modules
*.min.js
*.min.css
package-lock.json
```

**Dependencies**:
```json
{
  "devDependencies": {
    "prettier": "^3.4.2",
    "eslint-config-prettier": "^9.1.0"
  }
}
```

**Scripts**:
```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\""
  }
}
```

### TypeScript (Type Checking)

**Configuration** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

**Scripts**:
```json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

### Husky (Git Hooks)

**Installation**:
```bash
npm install --save-dev husky lint-staged
npx husky install
```

**Configuration** (`.husky/pre-commit`):
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**Lint-Staged Configuration** (`package.json`):
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

**Package.json scripts**:
```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

## Testing

### Jest (Unit/Integration Tests)

**Configuration** (`jest.config.js`):
```javascript
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
    '!src/test/**',
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

**Dependencies**:
```json
{
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "@types/jest": "^29.5.14",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.2.5",
    "identity-obj-proxy": "^3.0.0"
  }
}
```

**Scripts**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Playwright (E2E Tests)

**Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Dependencies**:
```json
{
  "devDependencies": {
    "@playwright/test": "^1.49.1"
  }
}
```

**Scripts**:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

## CI/CD Configuration

### GitHub Actions

**Workflow** (`.github/workflows/ci.yml`):
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
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
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
          retention-days: 30

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

### Deployment

**GitHub Pages** (`.github/workflows/deploy.yml`):
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

**Vite Configuration for GitHub Pages** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production'
    ? '/emergency-supply-tracker/'
    : '/',
});
```

## Code Quality Standards

### File Organization
```
src/
├── components/           # React components
│   ├── common/          # Reusable components
│   ├── dashboard/       # Dashboard-specific components
│   ├── inventory/       # Inventory-specific components
│   └── settings/        # Settings-specific components
├── hooks/               # Custom React hooks
├── contexts/            # React Context providers
├── utils/               # Utility functions
│   ├── calculations/    # Business logic calculations
│   ├── validation/      # Data validation (Ajv schemas)
│   └── storage/         # LocalStorage utilities
├── types/               # TypeScript type definitions
├── locales/             # Translation files
│   ├── en/
│   └── fi/
├── test/                # Test utilities and setup
└── main.tsx             # Entry point
```

### Naming Conventions

**Files**:
- Components: `PascalCase.tsx` (e.g., `ItemCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useInventory.ts`)
- Utilities: `camelCase.ts` (e.g., `calculations.ts`)
- Types: `PascalCase.ts` (e.g., `InventoryTypes.ts`)
- Test files: `*.test.tsx` or `*.spec.tsx`

**Code**:
- Components: `PascalCase` (e.g., `ItemCard`)
- Hooks: `camelCase` with `use` prefix (e.g., `useInventory`)
- Functions: `camelCase` (e.g., `calculateRecommendedQuantity`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_SUPPLY_DAYS`)
- Interfaces/Types: `PascalCase` (e.g., `InventoryItem`)

### Documentation Standards

**JSDoc Comments**:
```typescript
/**
 * Calculates the recommended quantity for an item based on household config
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

**Component Documentation**:
```typescript
/**
 * ItemCard - Displays a single inventory item with status
 *
 * @example
 * <ItemCard
 *   name="Bottled Water"
 *   quantity={18}
 *   recommendedQuantity={21}
 *   unit="liters"
 *   status="warning"
 *   onEdit={() => {}}
 *   onDelete={() => {}}
 * />
 */
export const ItemCard: React.FC<ItemCardProps> = (props) => {
  // Implementation
};
```

## Quality Gates

### Pre-commit
- ESLint (no warnings)
- Prettier formatting
- Type checking (via TypeScript)

### Pre-push (Recommended)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run type-check
npm run test
```

### CI Pipeline
- Linting (ESLint + Prettier)
- Type checking
- Unit/Integration tests (70% coverage minimum)
- E2E tests (critical flows)
- Build verification

### Release Requirements
- All CI checks passing
- Code review approved
- E2E tests passing on all browsers
- No critical security vulnerabilities

## Browser Support

**Target Browsers**:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari (iOS 14+)
- Mobile Chrome (Android 10+)

**Polyfills**: None required (using modern JavaScript features supported by all target browsers)

## Performance Budgets

**Bundle Size**:
- Main bundle: < 200 KB (gzipped)
- Vendor bundle: < 150 KB (gzipped)
- Total initial load: < 350 KB (gzipped)

**Performance Metrics** (Lighthouse):
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

## Security

**Dependencies**:
- Regular `npm audit` checks
- Automated dependency updates (Dependabot)
- No runtime dependencies with known high/critical vulnerabilities

**Code Security**:
- No secrets in code
- CSP headers configured
- XSS protection via React
- Input validation with Ajv

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
