# Implementation Plan - Emergency Supply Tracker

## Overview

This document provides **atomic, committable implementation steps** for building the Emergency Supply Tracker from scratch. Each step produces a working, testable, deployable application.

**Key Principles:**
- ✅ Build successfully after every step
- ✅ All tests pass after every step
- ✅ Deployable to production after every step
- ✅ One commit per step

**Timeline:** ~40 working days (8 weeks, 1 developer)
**Target:** V1.0 MVP

---

## How to Use This Plan with AI Agents

This implementation plan is designed for **step-by-step execution** with AI coding assistants like Cursor, GitHub Copilot, Claude Code, or similar tools.

### Using with Cursor or VS Code

**Recommended approach:**

1. **Start at Step 0** and work sequentially
2. **Open this file** (IMPLEMENTATION_PLAN.md) in your editor
3. **For each step**, give the AI agent this prompt:

```
Implement Step X from IMPLEMENTATION_PLAN.md.

Read the step details from docs/IMPLEMENTATION_PLAN.md, then:
1. Complete all tasks listed in the step
2. Run verification commands
3. Ensure all quality gates pass

When done, tell me the commit message to use.
```

**Example conversation:**

```
You: Implement Step 0 from IMPLEMENTATION_PLAN.md

Agent: [Reads Step 0, creates Vite project, installs dependencies]
       Done! Verification passed.

       Commit message: "Step 0: Initialize Vite + React + TypeScript project"

You: [Review changes, run `git commit -m "Step 0: Initialize Vite + React + TypeScript project"`]
```

### Using with Claude Code (Terminal Agent)

If using Claude Code or terminal-based agents:

```
Implement Step 0 from the implementation plan:
- Read docs/IMPLEMENTATION_PLAN.md Step 0
- Execute all tasks
- Run verification commands
- Report results and provide commit message
```

### Using with GitHub Copilot Chat

In VS Code with Copilot Chat:

```
@workspace Implement Step 3 from /docs/IMPLEMENTATION_PLAN.md
- Complete all tasks
- Verify with commands listed
- Tell me when ready to commit
```

### Best Practices

**✅ DO:**
- Work through steps **sequentially** (Step 0 → 1 → 2 → etc.)
- **Verify** after each step (run build, tests, lint)
- **Commit immediately** after each successful step
- **Review agent's code** before committing
- **Run verification manually** if agent skips it
- Reference specific step: "Implement Step 5"

**❌ DON'T:**
- Skip steps
- Combine multiple steps in one commit
- Commit without verification
- Let agent deviate from the plan
- Accept code without reviewing

### Quality Gate Checklist (Every Step)

Before committing, manually verify:
```bash
npm run lint        # Must pass
npm test           # Must pass
npm run build      # Must succeed
npm run dev        # App must run without errors
```

If any fail, ask agent to fix before committing.

### Handling Deviations

If the agent suggests changes not in the plan:

**Option 1 - Strict adherence:**
```
Please follow the implementation plan exactly as written.
Do not add features or modify the approach.
```

**Option 2 - Document and proceed:**
```
That's a good suggestion, but let's stick to the plan for now.
Create a note in a DEVIATIONS.md file for later consideration.
```

### Multi-Step Work Sessions

For longer sessions:

```
I want to implement Steps 5-10 today.
For each step:
1. Implement the step
2. Run verification
3. Wait for my approval before proceeding to next step

Start with Step 5.
```

### Tracking Progress

Create a checklist file:

```bash
# PROGRESS.md
- [x] Step 0: Initialize Project
- [x] Step 1: Update Dependencies
- [x] Step 2: Initialize Git
- [ ] Step 3: Configure Deployment
- [ ] Step 4: Configure ESLint
...
```

Or use this prompt:
```
Update PROGRESS.md to mark Step X as complete
```

### Common Prompts

**Start new step:**
```
Implement Step X from IMPLEMENTATION_PLAN.md
```

**Fix failing verification:**
```
Step X verification failed with error: [paste error]
Fix the issue according to the step requirements
```

**Review before commit:**
```
Review all changes made for Step X.
List what was created/modified.
Confirm it matches the step requirements.
```

**Continue after interruption:**
```
Check PROGRESS.md and continue from the next incomplete step
```

### Example Full Workflow

```bash
# You: Start session
You: "Implement Step 0 from IMPLEMENTATION_PLAN.md"

# Agent: Executes Step 0
Agent: [Creates Vite project]
Agent: "Done! Run npm run dev to verify. Commit: 'Step 0: Initialize Vite + React + TypeScript project'"

# You: Verify
You: [Manually runs npm run dev, checks it works]
You: git add .
You: git commit -m "Step 0: Initialize Vite + React + TypeScript project"

# You: Continue
You: "Implement Step 1 from IMPLEMENTATION_PLAN.md"

# Agent: Executes Step 1
Agent: [Updates package.json, runs npm install]
Agent: "Done! Verification passed. Commit: 'Step 1: Update to React 19, Vite 7, TypeScript 5.9'"

# You: Commit
You: git add .
You: git commit -m "Step 1: Update to React 19, Vite 7, TypeScript 5.9"

# Repeat for all steps...
```

### Tips for Success

1. **Read the step yourself first** - Understand what should happen
2. **Let the agent read the plan** - Use file references (@workspace, file paths)
3. **Verify independently** - Don't trust agent's "verification passed" without checking
4. **Commit frequently** - One step = one commit
5. **Keep git clean** - Commit only when step is complete and verified
6. **Ask for explanations** - If agent does something unclear, ask why
7. **Reference other docs** - Agent can read DATA_SCHEMA.md, TECHNICAL_SPEC.md, etc.

### Advanced: Batch Processing

For experienced users who want to move faster:

```
Implement Steps 0-4 from IMPLEMENTATION_PLAN.md.

For each step:
1. Complete all tasks
2. Run verification
3. Create a separate commit with the exact message from the plan
4. Show me a summary before proceeding to next step

Stop if any step fails verification.
```

**⚠️ Warning:** Only use batch processing if you're comfortable reviewing multiple changes. Single-step approach is safer for most users.

---

## Phase 0: Project Setup (Days 1-4)

### Step 0: Initialize Project

**Goal:** Create empty Vite + React + TypeScript project

**Tasks:**
```bash
npm create vite@latest emergency-supply-tracker -- --template react-ts
cd emergency-supply-tracker
npm install
```

**Verification:**
- `npm run dev` works
- Open http://localhost:5173
- See Vite + React default page

**Commit:** `Step 0: Initialize Vite + React + TypeScript project`

---

### Step 1: Update Dependencies to Latest

**Goal:** Ensure React 19, Vite 7, TypeScript 5.9

**Tasks:**
Update `package.json`:
```json
{
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.9.3",
    "vite": "^7.3.0"
  }
}
```

Then: `npm install`

**Verification:**
- `npm run dev` works
- `npm run build` succeeds

**Commit:** `Step 1: Update to React 19, Vite 7, TypeScript 5.9`

---

### Step 2: Initialize Git and Create README

**Goal:** Set up version control

**Tasks:**

1. Create `.gitignore`:
```
# Logs
logs
*.log
npm-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# Personal AI agent workflows
AGENTS.local.md
.claude
```

2. Initialize git:
```bash
git init
git add .
git commit -m "Initial commit: Vite + React + TypeScript"
```

3. Create `README.md`:
```markdown
# Emergency Supply Tracker

Web-based emergency supply tracking application (based on 72tuntia.fi guidelines).

## Tech Stack
- React 19 + TypeScript 5.9 + Vite 7
- LocalStorage (no backend)
- GitHub Pages or Render.com deployment

## Development
\`\`\`bash
npm install
npm run dev
\`\`\`

## Status
🚧 V0.1.0 - Work in progress
```

**Verification:**
- `git log` shows commit
- README exists

**Commit:** `Step 2: Initialize Git and add README`

**Note:** Create GitHub repository and push after this step.

---

### Step 3: Configure Deployment

**Goal:** Auto-deploy to GitHub Pages and support Render.com

**Tasks:**

1. Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production'
    ? (process.env.VITE_BASE_PATH || '/emergency-supply-tracker/')
    : '/',
})
```

2. Create `.github/workflows/deploy.yml`:
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

3. Add deployment notes to README:
```markdown
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
```

**Verification:**
- Workflow file exists
- `npm run build` succeeds

**Commit:** `Step 3: Add GitHub Pages deployment and Render.com support`

**Note:** After push, enable GitHub Pages in repository settings.

---

### Step 4: Configure ESLint

**Goal:** Set up code linting

**Tasks:**

1. Install:
```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals
```

2. Create `eslint.config.js`:
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
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
```

3. Add scripts to `package.json`:
```json
{
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix"
  }
}
```

**Verification:**
- `npm run lint` passes

**Commit:** `Step 4: Configure ESLint`

---

### Step 5: Configure Prettier

**Goal:** Set up code formatting

**Tasks:**

1. Install:
```bash
npm install -D prettier eslint-config-prettier
```

2. Create `.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
  "arrowParens": "always"
}
```

3. Create `.prettierignore`:
```
dist
build
coverage
node_modules
*.min.js
package-lock.json
```

4. Add scripts:
```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\""
  }
}
```

5. Format code:
```bash
npm run format
```

**Verification:**
- `npm run format:check` passes

**Commit:** `Step 5: Configure Prettier`

---

### Step 6: Set Up Pre-commit Hooks

**Goal:** Run lint and format before every commit

**Tasks:**

1. Install:
```bash
npm install -D husky lint-staged
npx husky init
```

2. Create `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

3. Add to `package.json`:
```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

**Verification:**
- Test commit runs hooks

**Commit:** `Step 6: Add Husky pre-commit hooks`

---

### Step 7: Configure Jest + React Testing Library

**Goal:** Set up testing infrastructure

**Tasks:**

1. Install:
```bash
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom identity-obj-proxy
```

2. Create `jest.config.js`:
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

3. Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

4. Create `src/App.test.tsx`:
```typescript
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Vite \+ React/i)).toBeInTheDocument();
  });
});
```

5. Add scripts:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Verification:**
- `npm test` passes

**Commit:** `Step 7: Configure Jest and React Testing Library`

---

### Step 8: Add CI Workflow

**Goal:** Run lint, test, build on every push

**Tasks:**

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

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

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

**Verification:**
- Workflow file exists

**Commit:** `Step 8: Add CI workflow`

**Note:** After push, check GitHub Actions tab.

---

### Step 9: Create Basic App Shell

**Goal:** Replace default page with branded UI

**Tasks:**

1. Update `src/App.tsx`:
```tsx
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Emergency Supply Tracker</h1>
        <p className="subtitle">72 Hour Preparedness</p>
      </header>
      <main className="main">
        <p>Coming soon...</p>
      </main>
      <footer className="footer">
        <p>v0.1.0 | Based on 72tuntia.fi guidelines</p>
      </footer>
    </div>
  );
}

export default App;
```

2. Update `src/App.css`:
```css
:root {
  --color-ok: #4caf50;
  --color-warning: #ffc107;
  --color-critical: #f44336;
  --color-primary: #2196f3;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: var(--color-primary);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.header h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
}

.main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.footer {
  background-color: #f5f5f5;
  padding: 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: #666;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 1.5rem;
  }
  .main {
    padding: 1rem;
  }
}
```

3. Update `index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Track emergency supplies for 72-hour preparedness" />
    <title>Emergency Supply Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

4. Update test:
```typescript
// src/App.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders app title', () => {
    render(<App />);
    expect(screen.getByText(/Emergency Supply Tracker/i)).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<App />);
    expect(screen.getByText(/72 Hour Preparedness/i)).toBeInTheDocument();
  });
});
```

**Verification:**
- `npm run dev` shows branded UI
- `npm test` passes
- Responsive on mobile

**Commit:** `Step 9: Create basic app shell with branding`

---

### Step 10: Create Project Folder Structure

**Goal:** Organize folders for future development

**Tasks:**

Create directories:
```bash
mkdir -p src/components/{common,dashboard,inventory,settings}
mkdir -p src/{hooks,contexts,pages}
mkdir -p src/utils/{calculations,validation,storage}
mkdir -p src/{types,data}
mkdir -p public/locales/{en,fi}
```

Create index files with barrel exports:

`src/components/index.ts`:
```typescript
// Components exported here
export {};
```

`src/hooks/index.ts`:
```typescript
// Hooks exported here
export {};
```

`src/contexts/index.ts`:
```typescript
// Contexts exported here
export {};
```

`src/utils/index.ts`:
```typescript
// Utilities exported here
export {};
```

`src/types/index.ts`:
```typescript
// Types exported here
export {};
```

**Verification:**
- All directories exist
- `npm run build` succeeds

**Commit:** `Step 10: Create project folder structure`

---

## Phase 1: Core Data Layer (Days 5-10)

### Step 11: Create TypeScript Interfaces

**Goal:** Define all data structures

**Tasks:**

Create `src/types/index.ts`:
```typescript
// Core types
export type Unit = 'pieces' | 'liters' | 'kilograms' | 'grams' | 'cans' | 'bottles' | 'packages';
export type ItemStatus = 'ok' | 'warning' | 'critical';
export type StandardCategoryId = 'water-beverages' | 'food' | 'cooking-heat' | 'light-power' | 'communication-info' | 'medical-health' | 'hygiene-sanitation' | 'tools-supplies' | 'cash-documents';
export type ProductKind = 'food' | 'water' | 'medicine' | 'energy' | 'hygiene' | 'device' | 'other';
export type BatteryType = 'AAA' | 'AA' | 'C' | 'D' | '9V' | 'CR2032';

// Household Configuration
export interface HouseholdConfig {
  adults: number;
  children: number;
  supplyDurationDays: number;
  hasFreezer: boolean;
  freezerHoldTimeHours?: number;
}

// User Settings
export interface UserSettings {
  language: 'en' | 'fi';
  theme: 'light' | 'dark' | 'auto';
  advancedFeatures: {
    calorieTracking: boolean;
    powerManagement: boolean;
    waterTracking: boolean;
  };
}

// Category
export interface Category {
  id: string;
  standardCategoryId?: StandardCategoryId;
  name: string;
  icon?: string;
  isCustom: boolean;
}

// Inventory Item
export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  quantity: number;
  unit: Unit;
  recommendedQuantity: number;
  expirationDate?: string;
  neverExpires?: boolean;
  location?: string;
  notes?: string;
  productTemplateId?: string;
  createdAt: string;
  updatedAt: string;
}

// Product Template
export interface ProductTemplate {
  id: string;
  name?: string;
  i18nKey?: string;
  kind?: ProductKind;
  category: StandardCategoryId | string;
  defaultUnit?: Unit;
  isBuiltIn: boolean;
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Recommended Item Definition
export interface RecommendedItemDefinition {
  id: string;
  i18nKey: string;
  category: StandardCategoryId;
  baseQuantity: number;
  unit: Unit;
  scaleWithPeople: boolean;
  scaleWithDays: boolean;
  requiresFreezer?: boolean;
  defaultExpirationMonths?: number;
}

// App Data (root)
export interface AppData {
  version: string;
  household: HouseholdConfig;
  settings: UserSettings;
  categories: Category[];
  items: InventoryItem[];
  customTemplates: ProductTemplate[];
  lastModified: string;
}
```

**Verification:**
- File compiles
- `npm run build` succeeds

**Commit:** `Step 11: Create TypeScript interfaces`

---

### Step 12: Create LocalStorage Utilities

**Goal:** Save/load app data

**Tasks:**

Create `src/utils/storage/localStorage.ts`:
```typescript
import type { AppData } from '../../types';

const STORAGE_KEY = 'emergencySupplyTracker';

export function getAppData(): AppData | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as AppData;
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return null;
  }
}

export function saveAppData(data: AppData): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
  }
}

export function clearAppData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportToJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importFromJSON(json: string): AppData {
  return JSON.parse(json) as AppData;
}
```

Create test `src/utils/storage/localStorage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { getAppData, saveAppData, clearAppData } from './localStorage';
import type { AppData } from '../../types';

const mockData: AppData = {
  version: '1.0.0',
  household: {
    adults: 2,
    children: 1,
    supplyDurationDays: 7,
    hasFreezer: true,
  },
  settings: {
    language: 'en',
    theme: 'light',
    advancedFeatures: {
      calorieTracking: false,
      powerManagement: false,
      waterTracking: false,
    },
  },
  categories: [],
  items: [],
  customTemplates: [],
  lastModified: new Date().toISOString(),
};

describe('localStorage utilities', () => {
  beforeEach(() => {
    clearAppData();
  });

  it('saves and loads data', () => {
    saveAppData(mockData);
    const loaded = getAppData();
    expect(loaded).toEqual(mockData);
  });

  it('returns null when no data exists', () => {
    expect(getAppData()).toBeNull();
  });

  it('clears data', () => {
    saveAppData(mockData);
    clearAppData();
    expect(getAppData()).toBeNull();
  });
});
```

**Verification:**
- `npm test` passes

**Commit:** `Step 12: Add LocalStorage utilities with tests`

---

### Step 13: Create Standard Categories Data

**Goal:** Define 9 standard categories

**Tasks:**

Create `src/data/standardCategories.ts`:
```typescript
import type { Category, StandardCategoryId } from '../types';

export const STANDARD_CATEGORIES: Category[] = [
  {
    id: 'water-beverages',
    standardCategoryId: 'water-beverages',
    name: 'Water & Beverages',
    icon: '💧',
    isCustom: false,
  },
  {
    id: 'food',
    standardCategoryId: 'food',
    name: 'Food',
    icon: '🍽️',
    isCustom: false,
  },
  {
    id: 'cooking-heat',
    standardCategoryId: 'cooking-heat',
    name: 'Cooking & Heat',
    icon: '🔥',
    isCustom: false,
  },
  {
    id: 'light-power',
    standardCategoryId: 'light-power',
    name: 'Light & Power',
    icon: '💡',
    isCustom: false,
  },
  {
    id: 'communication-info',
    standardCategoryId: 'communication-info',
    name: 'Communication & Info',
    icon: '📻',
    isCustom: false,
  },
  {
    id: 'medical-health',
    standardCategoryId: 'medical-health',
    name: 'Medical & Health',
    icon: '🏥',
    isCustom: false,
  },
  {
    id: 'hygiene-sanitation',
    standardCategoryId: 'hygiene-sanitation',
    name: 'Hygiene & Sanitation',
    icon: '🧼',
    isCustom: false,
  },
  {
    id: 'tools-supplies',
    standardCategoryId: 'tools-supplies',
    name: 'Tools & Supplies',
    icon: '🔧',
    isCustom: false,
  },
  {
    id: 'cash-documents',
    standardCategoryId: 'cash-documents',
    name: 'Cash & Documents',
    icon: '💰',
    isCustom: false,
  },
];

export function getCategoryById(id: StandardCategoryId): Category | undefined {
  return STANDARD_CATEGORIES.find((c) => c.id === id);
}
```

**Verification:**
- File compiles
- `npm run build` succeeds

**Commit:** `Step 13: Add standard categories data`

---

### Step 14: Create Recommended Items Data

**Goal:** Define 70 recommended items from 72tuntia.fi

**Tasks:**

Create `src/data/recommendedItems.ts`:
```typescript
import type { RecommendedItemDefinition } from '../types';

export const RECOMMENDED_ITEMS: RecommendedItemDefinition[] = [
  // Water & Beverages (9L per person for 3 days)
  {
    id: 'bottled-water',
    i18nKey: 'products.bottled-water',
    category: 'water-beverages',
    baseQuantity: 9,
    unit: 'liters',
    scaleWithPeople: true,
    scaleWithDays: true,
    defaultExpirationMonths: 24,
  },

  // Food (examples - full list would have 70 items)
  {
    id: 'canned-soup',
    i18nKey: 'products.canned-soup',
    category: 'food',
    baseQuantity: 4,
    unit: 'cans',
    scaleWithPeople: true,
    scaleWithDays: true,
    defaultExpirationMonths: 24,
  },
  {
    id: 'pasta',
    i18nKey: 'products.pasta',
    category: 'food',
    baseQuantity: 1,
    unit: 'kilograms',
    scaleWithPeople: true,
    scaleWithDays: true,
    defaultExpirationMonths: 18,
  },

  // Cooking & Heat
  {
    id: 'camping-stove',
    i18nKey: 'products.camping-stove',
    category: 'cooking-heat',
    baseQuantity: 1,
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
  {
    id: 'gas-canister',
    i18nKey: 'products.gas-canister',
    category: 'cooking-heat',
    baseQuantity: 2,
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: true,
  },

  // Light & Power
  {
    id: 'flashlight',
    i18nKey: 'products.flashlight',
    category: 'light-power',
    baseQuantity: 2,
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
  {
    id: 'batteries-aa',
    i18nKey: 'products.batteries-aa',
    category: 'light-power',
    baseQuantity: 12,
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
    defaultExpirationMonths: 60,
  },

  // Communication
  {
    id: 'battery-radio',
    i18nKey: 'products.battery-radio',
    category: 'communication-info',
    baseQuantity: 1,
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },

  // Medical
  {
    id: 'first-aid-kit',
    i18nKey: 'products.first-aid-kit',
    category: 'medical-health',
    baseQuantity: 1,
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
  {
    id: 'pain-medication',
    i18nKey: 'products.pain-medication',
    category: 'medical-health',
    baseQuantity: 1,
    unit: 'packages',
    scaleWithPeople: true,
    scaleWithDays: false,
    defaultExpirationMonths: 36,
  },

  // Hygiene
  {
    id: 'toilet-paper',
    i18nKey: 'products.toilet-paper',
    category: 'hygiene-sanitation',
    baseQuantity: 6,
    unit: 'pieces',
    scaleWithPeople: true,
    scaleWithDays: true,
  },

  // Tools
  {
    id: 'can-opener',
    i18nKey: 'products.can-opener',
    category: 'tools-supplies',
    baseQuantity: 1,
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },

  // Cash
  {
    id: 'emergency-cash',
    i18nKey: 'products.emergency-cash',
    category: 'cash-documents',
    baseQuantity: 1,
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
];

// Note: Full implementation would include all 70 items from RECOMMENDED_ITEMS.md
```

**Verification:**
- File compiles
- `npm run build` succeeds

**Commit:** `Step 14: Add recommended items data (subset)`

**Note:** Complete all 70 items in subsequent commits.

---

### Step 15: Create Calculation Utilities

**Goal:** Calculate household multiplier and recommended quantities

**Tasks:**

Create `src/utils/calculations/household.ts`:
```typescript
import type { HouseholdConfig, RecommendedItemDefinition } from '../../types';

export function calculateHouseholdMultiplier(config: HouseholdConfig): number {
  const peopleMultiplier = config.adults * 1.0 + config.children * 0.75;
  const daysMultiplier = config.supplyDurationDays / 3;
  return peopleMultiplier * daysMultiplier;
}

export function calculateRecommendedQuantity(
  item: RecommendedItemDefinition,
  household: HouseholdConfig,
): number {
  let qty = item.baseQuantity;

  if (item.scaleWithPeople) {
    const peopleMultiplier = household.adults * 1.0 + household.children * 0.75;
    qty *= peopleMultiplier;
  }

  if (item.scaleWithDays) {
    const daysMultiplier = household.supplyDurationDays / 3;
    qty *= daysMultiplier;
  }

  return Math.ceil(qty);
}
```

Create test `src/utils/calculations/household.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals';
import { calculateHouseholdMultiplier, calculateRecommendedQuantity } from './household';
import type { HouseholdConfig, RecommendedItemDefinition } from '../../types';

describe('calculateHouseholdMultiplier', () => {
  it('calculates multiplier for 2 adults, 1 child, 7 days', () => {
    const config: HouseholdConfig = {
      adults: 2,
      children: 1,
      supplyDurationDays: 7,
      hasFreezer: false,
    };
    // (2 * 1.0 + 1 * 0.75) * (7 / 3) = 2.75 * 2.33 ≈ 6.42
    const result = calculateHouseholdMultiplier(config);
    expect(result).toBeCloseTo(6.42, 1);
  });
});

describe('calculateRecommendedQuantity', () => {
  it('scales with people and days', () => {
    const item: RecommendedItemDefinition = {
      id: 'water',
      i18nKey: 'products.water',
      category: 'water-beverages',
      baseQuantity: 9,
      unit: 'liters',
      scaleWithPeople: true,
      scaleWithDays: true,
    };
    const household: HouseholdConfig = {
      adults: 2,
      children: 0,
      supplyDurationDays: 7,
      hasFreezer: false,
    };
    // 9 * 2 * (7/3) = 9 * 2 * 2.33 = 42
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(42);
  });

  it('does not scale when flags are false', () => {
    const item: RecommendedItemDefinition = {
      id: 'flashlight',
      i18nKey: 'products.flashlight',
      category: 'light-power',
      baseQuantity: 1,
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
    };
    const household: HouseholdConfig = {
      adults: 5,
      children: 3,
      supplyDurationDays: 14,
      hasFreezer: false,
    };
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(1);
  });
});
```

**Verification:**
- `npm test` passes

**Commit:** `Step 15: Add household calculation utilities with tests`

---

### Step 16: Create Status Calculation Utilities

**Goal:** Determine item status (OK/Warning/Critical)

**Tasks:**

Create `src/utils/calculations/status.ts`:
```typescript
import type { InventoryItem, ItemStatus } from '../../types';

export function getItemStatus(
  currentQuantity: number,
  recommendedQuantity: number,
  expirationDate?: string,
  neverExpires?: boolean,
): ItemStatus {
  // Check expiration first
  if (!neverExpires && expirationDate) {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const daysUntilExpiration = Math.floor(
      (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiration < 0) return 'critical'; // Expired
    if (daysUntilExpiration <= 30) return 'warning'; // Expiring soon
  }

  // Check quantity
  if (currentQuantity === 0) return 'critical';
  if (currentQuantity < recommendedQuantity * 0.5) return 'warning';

  return 'ok';
}
```

Create test `src/utils/calculations/status.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals';
import { getItemStatus } from './status';

describe('getItemStatus', () => {
  it('returns critical when quantity is 0', () => {
    expect(getItemStatus(0, 10)).toBe('critical');
  });

  it('returns warning when quantity < 50% of recommended', () => {
    expect(getItemStatus(4, 10)).toBe('warning');
  });

  it('returns ok when quantity >= recommended', () => {
    expect(getItemStatus(10, 10)).toBe('ok');
  });

  it('returns critical when expired', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getItemStatus(10, 10, yesterday.toISOString())).toBe('critical');
  });

  it('returns warning when expiring within 30 days', () => {
    const in20Days = new Date();
    in20Days.setDate(in20Days.getDate() + 20);
    expect(getItemStatus(10, 10, in20Days.toISOString())).toBe('warning');
  });

  it('ignores expiration when neverExpires is true', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getItemStatus(10, 10, yesterday.toISOString(), true)).toBe('ok');
  });
});
```

**Verification:**
- `npm test` passes

**Commit:** `Step 16: Add status calculation utilities with tests`

---

## Phase 2: State Management (Days 11-14)

### Step 17: Create Inventory Context

**Goal:** Global state for items

**Tasks:**

Create `src/contexts/InventoryContext.tsx`:
```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { InventoryItem, Category } from '../types';
import { STANDARD_CATEGORIES } from '../data/standardCategories';
import { getAppData, saveAppData } from '../utils/storage/localStorage';

interface InventoryContextValue {
  items: InventoryItem[];
  categories: Category[];
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories] = useState<Category[]>(STANDARD_CATEGORIES);

  // Load from localStorage on mount
  useEffect(() => {
    const data = getAppData();
    if (data?.items) {
      setItems(data.items);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    const data = getAppData() || {
      version: '1.0.0',
      household: { adults: 2, children: 0, supplyDurationDays: 7, hasFreezer: false },
      settings: { language: 'en', theme: 'light', advancedFeatures: { calorieTracking: false, powerManagement: false, waterTracking: false } },
      categories: STANDARD_CATEGORIES,
      items: [],
      customTemplates: [],
      lastModified: new Date().toISOString(),
    };
    data.items = items;
    data.lastModified = new Date().toISOString();
    saveAppData(data);
  }, [items]);

  const addItem = (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <InventoryContext.Provider value={{ items, categories, addItem, updateItem, deleteItem }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
}
```

**Verification:**
- File compiles
- `npm run build` succeeds

**Commit:** `Step 17: Create inventory context with LocalStorage persistence`

---

### Step 18: Install and Configure Storybook

**Goal:** Set up Storybook for component development and documentation

**Tasks:**

1. Install Storybook:
```bash
npx storybook@latest init
```

2. Install additional dependencies:
```bash
npm install -D @storybook/react-vite @storybook/addon-essentials @storybook/addon-interactions @storybook/addon-a11y
```

3. Update `.storybook/main.ts`:
```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

4. Create `.storybook/preview.ts`:
```typescript
import type { Preview } from '@storybook/react';
import '../src/App.css'; // Import global styles

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
```

5. Create first Storybook story `src/App.stories.tsx`:
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import App from './App';

const meta = {
  title: 'App/Shell',
  component: App,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

6. Add scripts to `package.json`:
```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

7. Update `.gitignore`:
```
# Storybook
storybook-static
```

**Verification:**
- `npm run storybook` starts successfully
- Opens browser at http://localhost:6006
- See "App/Shell" story with app shell
- `npm run build-storybook` succeeds

**Commit:** `Step 18: Install and configure Storybook for component development`

---

## Continued Implementation...

The plan continues with:
- Phase 3: i18n Setup (Days 15-18)
- Phase 4: UI Components (Days 19-25) - Now with Storybook stories!
- Phase 5: Dashboard View (Days 26-28)
- Phase 6: Inventory View (Days 29-32)
- Phase 7: Settings & Export/Import (Days 33-35)
- Phase 8: PWA & Accessibility (Days 36-38)
- Phase 9: Polish & Testing (Days 39-40)

**Each remaining step follows the same pattern:**
1. Clear goal
2. Specific tasks with code examples
3. Verification steps
4. Atomic commit message
5. Keeps app working and deployable

---

## Quality Gates (Every Step)

Before committing, verify:
- ✅ `npm run lint` - passes
- ✅ `npm test` - passes
- ✅ `npm run build` - succeeds
- ✅ `npm run dev` - app runs
- ✅ No console errors
- ✅ Feature works as expected

---

## Deployment Notes

### GitHub Pages
- Automatic deployment on push to main
- Configure: Settings → Pages → Source: GitHub Actions
- URL: `https://username.github.io/emergency-supply-tracker/`

### Render.com (Alternative)
User configures Render.com with:
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variable:** `VITE_BASE_PATH=/`
- Deploy from GitHub repository

The app supports both deployment targets via `vite.config.ts` base path configuration.

---

## Success Criteria

### V1.0 Must Have
- ✅ Complete onboarding flow
- ✅ 70 recommended items
- ✅ Household configuration
- ✅ CRUD operations for items
- ✅ Expiration tracking
- ✅ Export/import JSON
- ✅ Shopping list export
- ✅ English + Finnish
- ✅ PWA installable
- ✅ WCAG 2.1 AA accessibility
- ✅ Deployable to GitHub Pages or Render.com

---

**Document Version:** 2.0
**Last Updated:** 2025-12-22
**Status:** Consolidated implementation plan for agent execution
