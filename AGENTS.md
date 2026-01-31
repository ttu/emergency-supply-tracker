# AI Agents & Workflows

Guide for AI-assisted development on Emergency Supply Tracker. All relevant info below; see `docs/` for full specs.

---

## Project Context

**Emergency Supply Tracker** – Web app to track emergency preparedness supplies (72tuntia.fi). React 19 + TypeScript + Vite, LocalStorage, CSS Modules, Storybook, Vitest, Playwright, react-i18next (EN/FI). 10 categories, 81 recommended items, household config, expiration alerts, import/export, PWA. Reference: [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md), [docs/FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md).

---

## Common Workflows

**1. New component** – Feature in `src/features/[feature]/components/` or shared in `src/shared/components/`. TypeScript props, Storybook stories, integration tests (React Testing Library), CSS Modules. Copy-paste example:

```text
Create a new StatusBadge component following our architecture:
- Feature in src/features/[feature]/components/ OR shared in src/shared/components/
- Full TypeScript props (e.g. status: 'ok'|'warning'|'critical', showLabel?, size?)
- Storybook stories with all states/sizes
- Integration tests, CSS Modules
Component should: [one line]. Props: [list]. States in Storybook: [list]
```

**2. Business logic** – Pure utils, full types, unit tests (100% for logic), JSDoc. Reference docs/DATA_SCHEMA.md. Example prompt: "Implement calculateRecommendedQuantity in src/shared/utils/calculations.ts: inputs RecommendedItemDefinition + HouseholdConfig; base for 1 adult 3 days, adults×1.0 children×0.75, scaleWithPeople/scaleWithDays; return Math.ceil. Unit tests + JSDoc."

**3. E2E** – Playwright in `e2e/[feature].spec.ts`. Use localStorage in beforeEach for speed; test desktop + mobile. Example:

```text
Create Playwright E2E tests for [feature]:
- Test file: e2e/[feature].spec.ts
- Use localStorage setup in beforeEach for faster tests
- Test both desktop and mobile viewports
User flows to test: 1. … 2. … 3. …
Reference: docs/TESTING_STRATEGY.md
```

**4. i18n** – Update `public/locales/en/common.json` and `fi/common.json`; use `useTranslation` in component. Keys: `category.subcategory.key`. Example: "Add translations for [Component]: update en/fi common.json (section), use useTranslation. Texts: [list]. Context: [where shown]."

**5. Refactor** – Requirements: keep behavior and coverage; update Storybook/types; run tests. Describe current issues and goal. Template: "Refactor [component/module] to: [goal]. Requirements: maintain functionality, keep/improve coverage, update Storybook/types, run tests. Current issues: [list]."

**6. Debug** – Provide: current vs expected behavior, steps to reproduce, relevant files, error message. Template:

```text
Debug issue: [Brief description]
Current behavior: [What's happening]
Expected behavior: [What should happen]
Steps to reproduce: 1. … 2. …
Relevant files: [File 1], [File 2]
Error message (if any): [Error text]
```

---

## Code Review Checklist

When asking AI to review code, use:

```text
Review the following code for:
✓ TypeScript types correct and complete
✓ Component architecture (presentational vs container)
✓ Test coverage
✓ Accessible (WCAG 2.1 Level AA), responsive
✓ i18n - no hardcoded strings
✓ Performance - memoization where needed
✓ Error handling
✓ Storybook for presentational components
✓ JSDoc for complex logic

Code:
[Paste code here]
```

---

## Conventions

- **Naming:** Feature components (e.g. ItemCard, CategoryGrid) in `src/features/[feature]/components/`; shared (Button, Modal, Badge) in `src/shared/components/`; layout (Header, Footer) in `src/components/layout/`. Pages in `features/…/pages/`, hooks `useInventory`, `useHousehold` in `features/…/hooks/`.
- **Structure:** Feature slice: `components/` (Component.tsx, .stories.tsx, .test.tsx, .module.css), `hooks/`, `utils/`, `context.ts`, `provider.tsx`, `index.ts`. Shared: components, hooks, utils, contexts, types.
- **Tests:** Unit `[function].test.ts`, component `[Component].test.tsx`, E2E `[feature].spec.ts`.
- **i18n keys:** `category.subcategory.key` (e.g. `dashboard.alerts.expiring`). See docs/TRANSLATION_GUIDE.md.

---

## Collaboration

**Tips:** (1) Provide context – which part of the app you're working on. (2) Reference specs – point to DATA_SCHEMA.md, ARCHITECTURE.md, etc. (3) Show examples – "Similar to ItemCard, create…". (4) Be specific about tests – e.g. "Write integration tests that verify the component displays correct data when household changes", not just "add tests". (5) Iterate incrementally – presentational component → container → E2E.

**Don’t ask for:** Entire app in one go; backend; IndexedDB (we use LocalStorage); heavy state libs (Context API); CSS-in-JS/Tailwind (CSS Modules); unit tests for every function (Testing Diamond: 70% integration, 20% E2E, 10% unit).

**Do ask for:** Step-by-step from plans; components per architecture; Storybook for presentational; business logic + tests; integration/E2E; EN+FI translations; PWA features.

---

## Version Control & PR Workflow

**Cursor/agents:** Use `required_permissions: ['all']` for git push and `gh pr create` (sandbox bypass).

**Commits:** `type: description` + optional bullet details + `Refs: #issue`. Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `ci`, `build`, `perf`. No Co-Authored-By/Generated-with; no scopes (use `feat:` not `feat(scope):`). Implementation steps: use types (`chore` setup, `feat` feature, etc.) not "Step X:".

**PR:** Use `/pr-create` and `/pr-fix` (see Commands).

---

## Commands

```bash
npm run dev                        # dev server
npm run build                      # production build
npm run preview                    # preview build
npm run lint                       # ESLint
npm run lint:fix                   # ESLint fix
npm run format                     # Prettier write
npm run format:check               # Prettier check
npm run type-check                 # TS (source)
npm run type-check:test            # TS (test config)
npm run type-check:stories          # TS (storybook config)
npm run type-check:all             # TS (all configs)
npm run test                       # Vitest unit
npm run test:watch                 # Vitest watch
npm run test:coverage              # Vitest coverage
npm run test:mutation               # Stryker mutation
npm run test:mutation:ci           # Stryker mutation CI
npm run test:e2e                   # Playwright (chromium)
npm run test:e2e:all               # Playwright (all browsers)
npm run test:e2e:ui                 # Playwright UI
npm run test:e2e:headed             # Playwright headed
npm run test:e2e:smoke              # Playwright smoke (quick-setup + manual-entry)
npm run test:e2e:smoke:quick-setup # Playwright smoke quick-setup
npm run test:e2e:smoke:manual-entry # Playwright smoke manual-entry
npm run test:e2e:smoke:deployed    # Playwright smoke deployed
npm run test:a11y                   # Playwright a11y
npm run test:storybook              # Vitest storybook
npm run test:all                    # Vitest all projects
npm run validate                    # format + type + lint + test + build
npm run validate:all                # validate + storybook + e2e
npm run validate:i18n               # i18n keys
npm run generate:og-image           # generate OG image
npm run prepare                     # husky
npm run storybook                   # Storybook dev
npm run build-storybook             # Storybook build
```

**Before commit:** `npm run validate:all` (format + type + lint + test + build + storybook + e2e).

**Slash commands (Claude/Cursor):** `/verify` (lint, type-check, tests, build); `/docs-sync` (validate docs vs codebase); `/docs-sync quick` (types, items, categories only); `/pr-create`; `/pr-fix` (CodeRabbit, reviewers, CI); `/issue-implement <number>`; `/issue-refine <number|text>`; `/handoff` (HANDOFF.md).

---

## Documentation

| Doc                                                    | Purpose                                     |
| ------------------------------------------------------ | ------------------------------------------- |
| [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md)             | Types and data structures                   |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)           | Component structure                         |
| [docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)       | Tech stack and config                       |
| [docs/FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md)     | Features and UI                             |
| [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)   | Testing                                     |
| [docs/TRANSLATION_GUIDE.md](docs/TRANSLATION_GUIDE.md) | i18n                                        |
| [docs/CODE_QUALITY.md](docs/CODE_QUALITY.md)           | ESLint, Prettier, CI/CD                     |
| [docs/CODE_COVERAGE.md](docs/CODE_COVERAGE.md)         | Coverage and PR requirements                |
| [docs/RECOMMENDED_ITEMS.md](docs/RECOMMENDED_ITEMS.md) | All recommended items and data              |
| [docs/design-docs/](docs/design-docs/)                 | Feature design docs                         |
| [docs/plans/](docs/plans/)                             | Implementation plans (place new plans here) |

**Keeping docs updated:** When implementing or changing features, update the matching doc (types in DATA_SCHEMA.md, components in ARCHITECTURE.md, etc.). Put new implementation plans in `docs/plans/`. Design docs for features live in `docs/design-docs/`. Extended workflow prompts and examples: [docs/ai-agent/](docs/ai-agent/).

---

## Getting Help

1. Check docs/ (DATA_SCHEMA.md, ARCHITECTURE.md, etc.)
2. Review existing similar components
3. Run Storybook for examples
4. Check test files for usage patterns
5. Ask AI with specific context

**Quick refs:** "How to structure a category component?" → ARCHITECTURE.md. "Recommended quantity calculation?" → DATA_SCHEMA.md. "LocalStorage persistence tests?" → TESTING_STRATEGY.md. "What are the 81 recommended items?" → RECOMMENDED_ITEMS.md.

---

**Version:** 1.2 · **Purpose:** AI-assisted development entry point
