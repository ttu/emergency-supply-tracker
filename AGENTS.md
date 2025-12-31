# AI Agents & Workflows

## Project Context

**Emergency Supply Tracker** - A web-based application to track emergency preparedness supplies based on 72tuntia.fi guidelines.

**Tech Stack:** React 19 + TypeScript 5.9 + Vite 7 | LocalStorage (no backend) | CSS Modules | Storybook | Jest + RTL (70%) | Playwright (20%) | react-i18next (EN + FI)

**Key Features:** 9 supply categories | Household configuration | 70 recommended items | Expiration tracking | Product templates with barcode | Import/Export (JSON) | Shopping list export | PWA with offline support

---

## Conventions

### Component Architecture

- **Presentational**: `ItemCard`, `StatusBadge` → Pure components with props
- **Container**: `ItemCardContainer` → Connect to state/context
- **Pages**: `Dashboard`, `Inventory`, `Settings`
- **Hooks**: `useInventory`, `useHousehold`

### File Organization

```
src/components/[ComponentName]/
  ├── [ComponentName].tsx
  ├── [ComponentName].stories.tsx
  ├── [ComponentName].test.tsx
  └── [ComponentName].module.css
```

### Test Naming

- Component tests: `[Component].test.tsx`
- Utility tests: `[function].test.ts`
- E2E tests: `e2e/[feature].spec.ts`

### Translation Keys

Pattern: `category.subcategory.key`

Files: `public/locales/en/*.json` and `public/locales/fi/*.json`

---

## Version Control Integration

### Commit Message Format

```
type: description

- Detail 1
- Detail 2

Refs: #issue-number
```

> **Note:** Do NOT add "Co-Authored-By" or "Generated with" footers to commit messages or PR descriptions. Keep commits and PRs clean and simple.

**Types:** `feat` | `fix` | `refactor` | `test` | `docs` | `style` | `chore` | `ci` | `build` | `perf`

**Do not** use scopes with types.

### Before Creating PR

Always fetch and rebase to keep branch up to date:

```bash
git fetch origin && git rebase origin/main
```

---

## Documentation Reference

| Document                                                         | Description                          |
| ---------------------------------------------------------------- | ------------------------------------ |
| [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md)                       | TypeScript types and data structures |
| [docs/FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md)               | Features, workflows, UI components   |
| [docs/RECOMMENDED_ITEMS.md](docs/RECOMMENDED_ITEMS.md)           | All 70 recommended items             |
| [docs/COMPONENT_ARCHITECTURE.md](docs/COMPONENT_ARCHITECTURE.md) | React component structure            |
| [docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)                 | Technology stack and configuration   |
| [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)             | Testing approach, Jest, Playwright   |
| [docs/TRANSLATION_GUIDE.md](docs/TRANSLATION_GUIDE.md)           | Internationalization (i18n)          |
| [docs/CODE_QUALITY.md](docs/CODE_QUALITY.md)                     | ESLint, Prettier, CI/CD              |
| [docs/BROWSER_TEST_GUIDE.md](docs/BROWSER_TEST_GUIDE.md)         | Browser automation testing           |

> **Note:** Files in `docs/specifications/` are outdated original specs. Use `docs/` for current implementation.

---

## Quick Commands

```bash
npm run dev              # Start dev server
npm run storybook        # Component explorer
npm test                 # Run Jest tests
npm run test:e2e         # Run Playwright tests
npm run lint             # Run ESLint
npm run build            # Production build
```

**Quality gates before commit:** `npm run lint && npm test && npm run build`

---

## Guidelines

### Do

- Follow component architecture (presentational vs container)
- Write integration tests (70% of test suite)
- Add Storybook stories for presentational components
- Use translations (EN + FI) for all user-facing strings
- Keep code modular and types accurate

### Don't

- Add backend features (frontend-only app)
- Use IndexedDB (we use LocalStorage)
- Use CSS-in-JS or Tailwind (we use CSS Modules)
- Write unit tests for everything (Testing Diamond: 70% integration, 20% E2E, 10% unit)
