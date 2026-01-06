# Code Quality

> **Version:** 1.0.0
> **Last Updated:** 2025-12-28
> **Source of Truth:** `eslint.config.js`, `.prettierrc.json`, `.github/workflows/`
>
> **Note:** SonarCloud configuration is managed externally via the [SonarCloud website](https://sonarcloud.io) and is not stored in this repository.

This document describes the code quality tools and CI/CD configuration.

---

## Tools Overview

| Tool                 | Purpose                                | Config File                                        |
| -------------------- | -------------------------------------- | -------------------------------------------------- |
| ESLint               | Linting                                | `eslint.config.js`                                 |
| Prettier             | Formatting                             | `.prettierrc.json`                                 |
| TypeScript           | Type checking                          | `tsconfig.json`                                    |
| Husky                | Git hooks                              | `.husky/`                                          |
| lint-staged          | Pre-commit checks                      | `package.json`                                     |
| jest-axe             | Accessibility testing (Vitest/axe)     | `vite.config.ts` (Vitest configuration)            |
| @axe-core/playwright | Accessibility testing (Playwright/axe) | `playwright.config.ts` (or `playwright.config.js`) |
| SonarCloud           | Code quality analysis                  | Configured via SonarCloud website                  |
| CodeRabbit           | AI code review                         | Configured via CodeRabbit website                  |
| Codecov              | Code coverage tracking                 | `codecov.yml` + GitHub integration                 |
| Vercel               | PR preview environments                | Configured via Vercel website                      |

---

## ESLint Configuration

**File:** `eslint.config.js`

```javascript
import storybook from 'eslint-plugin-storybook';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static'] },
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
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  storybook.configs['flat/recommended'],
);
```

### Key Rules

| Rule                                   | Setting | Purpose                                   |
| -------------------------------------- | ------- | ----------------------------------------- |
| `react-hooks/rules-of-hooks`           | error   | Enforce hooks rules                       |
| `react-hooks/exhaustive-deps`          | warn    | Check effect dependencies                 |
| `@typescript-eslint/no-unused-vars`    | error   | No unused variables (except `_` prefixed) |
| `react-refresh/only-export-components` | warn    | Fast refresh compatibility                |

---

## Prettier Configuration

**File:** `.prettierrc.json`

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

### Formatting Rules

| Option          | Value  | Description                              |
| --------------- | ------ | ---------------------------------------- |
| `semi`          | true   | Always use semicolons                    |
| `singleQuote`   | true   | Use single quotes                        |
| `tabWidth`      | 2      | 2-space indentation                      |
| `trailingComma` | all    | Trailing commas everywhere               |
| `printWidth`    | 80     | Line width limit                         |
| `arrowParens`   | always | Parentheses around arrow function params |

---

## Git Hooks (Husky + lint-staged)

**Pre-commit hook** runs automatically before each commit:

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

### What Happens on Commit

1. Staged `.ts`/`.tsx` files → ESLint fix + Prettier
2. Staged `.json`/`.css`/`.md` files → Prettier
3. If ESLint has errors → commit blocked
4. Changes auto-formatted and re-staged

---

## CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

### Jobs

```
┌─────────┐  ┌─────────┐  ┌───────────┐  ┌─────────┐
│  lint   │  │  test   │  │ storybook │  │   e2e   │
└────┬────┘  └────┬────┘  └─────┬─────┘  └────┬────┘
     └────────────┴─────────────┴─────────────┘
                        │
                   ┌────▼────┐
                   │  build  │
                   └─────────┘
```

| Job         | What It Does                           |
| ----------- | -------------------------------------- |
| `lint`      | ESLint + Prettier check                |
| `test`      | Vitest unit/integration tests          |
| `storybook` | Storybook component tests              |
| `e2e`       | Playwright E2E tests (Chromium)        |
| `build`     | Production build (runs after all pass) |

### Triggers

- Push to `main`
- Pull requests to `main`

---

## External Code Quality Services

### SonarCloud Integration

SonarCloud provides static code analysis, code coverage tracking, and quality gate enforcement.

> **Note:** SonarCloud is configured directly through the [SonarCloud website](https://sonarcloud.io). No local configuration files are required. The integration is set up via the SonarCloud project settings, which automatically connects to the GitHub repository and runs analysis on each push and pull request.

### Configuration Settings

The following SonarCloud settings are configured in the SonarCloud UI (Project Settings → Analysis Scope):

- **Test File Inclusions** (`sonar.test.inclusions`): `**/*.spec.ts,**/*.test.ts`
  - Marks test files for proper analysis and coverage calculation
  - Ensures test files are correctly identified and excluded from main code metrics

- **Code Duplication Exclusions** (`sonar.cpd.exclusions`): `**/*.spec.ts,**/*.test.ts`
  - Excludes test files from duplicate code detection
  - Prevents test code duplication from affecting code quality metrics

These settings ensure that test files are properly handled in SonarCloud analysis and don't skew code quality metrics.

### Quality Gates

SonarCloud quality gates are configured in the SonarCloud project settings and can:

- Enforce minimum code coverage thresholds
- Block PRs with new code smells or security vulnerabilities
- Track technical debt
- Monitor code quality metrics over time

Quality gate status is displayed directly in pull requests via SonarCloud's GitHub integration.

### CodeRabbit Integration

CodeRabbit provides AI-powered automated code reviews on pull requests, offering suggestions for code improvements, best practices, security issues, and accessibility concerns.

> **Note:** CodeRabbit is configured directly through the [CodeRabbit website](https://coderabbit.ai). No local configuration files are required. The integration is set up via the CodeRabbit project settings, which automatically connects to the GitHub repository and reviews pull requests on each push and pull request.

#### Features

- **Automated Code Reviews**: AI analyzes code changes and provides contextual suggestions
- **Best Practices**: Suggests improvements based on industry standards and project patterns
- **Security Scanning**: Identifies potential security vulnerabilities
- **Accessibility Checks**: Reviews code for accessibility issues
- **Documentation**: Suggests improvements to code comments and documentation
- **Performance**: Identifies potential performance optimizations

#### Review Process

- CodeRabbit automatically reviews pull requests when opened or updated
- Reviews appear as PR comments with actionable suggestions
- Resolved issues are marked with "✅ Addressed" for easy tracking
- Reviewers should verify all actionable feedback is addressed before merging

> **Tip:** CodeRabbit resolved issues are marked with "✅ Addressed". Verify all actionable feedback is addressed before re-review.

### Vercel Preview Environments

Vercel automatically creates preview deployments for every pull request, providing a live URL to review changes in a production-like environment.

> **Note:** Vercel is configured through the [Vercel website](https://vercel.com) or GitHub App installation. Configuration is stored in `vercel.json` and managed via Vercel project settings. The integration automatically deploys preview environments for each pull request.

#### Features

- **Automatic PR Previews**: Every PR gets a unique preview URL
- **Production-like Environment**: Preview deployments mirror production settings
- **Fast Deployments**: Changes are deployed automatically on push
- **Visual Testing**: Review UI changes in a real browser environment
- **Shareable Links**: Preview URLs can be shared with team members or stakeholders
- **Build Validation**: Preview builds validate that code compiles and runs correctly

#### Preview URLs

- Preview deployments are automatically created for each pull request
- Preview URLs are posted as comments in pull requests
- Each preview is a full production build, allowing comprehensive testing
- Preview environments are automatically cleaned up when PRs are closed or merged

#### Configuration

Vercel configuration is stored in `vercel.json` and includes:

- Build settings
- Environment variables
- Routing configuration
- Deployment settings

Preview environments help catch issues before merging by allowing visual and functional testing of changes in a production-like environment.

### Codecov Integration

Codecov provides automated code coverage tracking and reporting for pull requests, ensuring that new code maintains adequate test coverage.

> **Note:** Codecov is configured through the [Codecov website](https://codecov.io) and integrated with GitHub via the `codecov/codecov-action` in the CI workflow. Configuration is stored in `codecov.yml` in the repository root.

#### Features

- **Coverage Tracking**: Automatically tracks code coverage for every commit and pull request
- **PR Comments**: Posts detailed coverage reports as PR comments showing coverage changes
- **Coverage Thresholds**: Enforces minimum coverage requirements for new code
- **Coverage Trends**: Tracks coverage trends over time to prevent regression
- **Status Checks**: Can block PRs that don't meet coverage requirements

#### Configuration

Codecov configuration is stored in `codecov.yml` and includes:

- **Project Coverage**: Must not decrease (1% tolerance for fluctuation)
- **Patch Coverage**: New/modified code must have ≥80% coverage
- **Comment Layout**: Configured to show reach, diff, flags, and files in PR comments

#### Integration

Codecov is integrated into the CI pipeline via the `test` job in `.github/workflows/ci.yml`:

1. Vitest runs tests with coverage collection (`npm run test:coverage`)
2. Coverage data is uploaded to Codecov using `codecov/codecov-action@v5`
3. Codecov analyzes coverage and posts a report as a PR comment
4. Status checks validate that coverage requirements are met

For more details on coverage requirements and guidelines, see [CODE_COVERAGE.md](CODE_COVERAGE.md).

---

## Scripts

```bash
# Linting
npm run lint           # Check for ESLint errors
npm run lint:fix       # Auto-fix ESLint errors

# Formatting
npm run format         # Format all files with Prettier
npm run format:check   # Check formatting without changes

# Validation
npm run validate       # format:check + lint + test + build
npm run validate:all   # validate + E2E tests
```

---

## Quality Gates

### Pre-commit (Automatic)

- ESLint passes (no errors)
- Prettier formatting applied

### CI Pipeline (On Push/PR)

| Check      | Requirement               |
| ---------- | ------------------------- |
| Linting    | Zero ESLint warnings      |
| Formatting | Prettier check passes     |
| Tests      | All Vitest tests pass     |
| Storybook  | Component tests pass      |
| E2E        | Playwright tests pass     |
| Build      | Production build succeeds |

### External Quality Gates (On Push/PR)

#### SonarCloud Quality Gates

SonarCloud quality gates run automatically via the SonarCloud GitHub integration. Quality gate status is displayed in pull requests and can block merges if configured to do so. Configure quality gate rules in the SonarCloud project settings.

#### CodeRabbit Code Reviews

CodeRabbit automatically reviews pull requests and provides AI-powered code review feedback. Review comments appear directly in PRs with suggestions for improvements. While CodeRabbit doesn't block merges by default, it's recommended to address actionable feedback before merging.

#### Codecov Coverage Checks

Codecov automatically tracks code coverage and posts coverage reports in pull requests. Coverage requirements are enforced:

- Project coverage must not decrease (1% tolerance)
- New/modified code must have ≥80% coverage
- Coverage status checks can block PRs that don't meet requirements

#### Vercel Preview Environments

Vercel automatically creates preview deployments for each pull request, providing live URLs for visual and functional testing. Preview URLs are posted in PR comments, allowing reviewers to test changes in a production-like environment before merging. Preview environments are automatically cleaned up when PRs are closed or merged.

---

## TypeScript Configuration

**File:** `tsconfig.json`

Key strict mode settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Naming Conventions

### Files

| Type       | Convention         | Example                |
| ---------- | ------------------ | ---------------------- |
| Components | PascalCase         | `ItemCard.tsx`         |
| Hooks      | camelCase + use    | `useInventory.ts`      |
| Utilities  | camelCase          | `calculations.ts`      |
| Tests      | .test.tsx/.spec.ts | `ItemCard.test.tsx`    |
| Stories    | .stories.tsx       | `ItemCard.stories.tsx` |

### Code

| Type       | Convention  | Example             |
| ---------- | ----------- | ------------------- |
| Components | PascalCase  | `ItemCard`          |
| Functions  | camelCase   | `calculateQuantity` |
| Constants  | UPPER_SNAKE | `DEFAULT_DAYS`      |
| Interfaces | PascalCase  | `InventoryItem`     |
| Types      | PascalCase  | `ItemStatus`        |

---

## File Organization

```
src/
├── components/       # React components
│   ├── common/      # Reusable primitives
│   ├── dashboard/   # Dashboard components
│   ├── inventory/   # Inventory components
│   ├── layout/      # Layout components
│   ├── onboarding/  # Onboarding flow
│   └── settings/    # Settings components
├── contexts/        # React Context providers
├── data/            # Static data
├── hooks/           # Custom hooks
├── i18n/            # i18n configuration
├── pages/           # Page components
├── styles/          # Global CSS
├── types/           # TypeScript types
└── utils/           # Utility functions
```

---

## Commit Messages

Use conventional commit format:

```
type(scope): description

- Detail 1
- Detail 2
```

> **Note:** Do NOT add "Co-Authored-By" or "Generated with" footers. Keep commits clean.

### Types

| Type       | Purpose                                  |
| ---------- | ---------------------------------------- |
| `feat`     | New features or functionality            |
| `fix`      | Bug fixes                                |
| `refactor` | Code refactoring without behavior change |
| `test`     | Adding or updating tests                 |
| `docs`     | Documentation changes                    |
| `style`    | Code formatting (Prettier, etc.)         |
| `chore`    | Dependencies, tooling, misc tasks        |
| `ci`       | CI/CD configuration changes              |
| `build`    | Build system or external dependencies    |
| `perf`     | Performance improvements                 |

### Scopes (Optional)

Examples: `dashboard`, `inventory`, `settings`, `types`, `storage`, `utils`, `data`, `ci`, `lint`

### Examples

```
feat: add expiring items alert to dashboard

- Create AlertBanner component
- Add Storybook stories
- Integrate with Dashboard
```

```
fix: correct quantity calculation for children

- Apply 0.75 multiplier for children
- Update tests
```

---

## Best Practices

### Do

- Run `npm run validate` before pushing
- Keep components small and focused
- Use TypeScript strict mode
- Write tests for new features
- Use meaningful commit messages

### Don't

- Disable ESLint rules without good reason
- Skip pre-commit hooks
- Leave console.log statements
- Ignore TypeScript errors
- Push without running tests

---

## Deployment

**File:** `.github/workflows/deploy.yml`

Automatic deployment to GitHub Pages on push to `main`:

1. Build passes
2. Assets uploaded to GitHub Pages
3. Site available at configured URL

---

## Browser Support

| Browser       | Versions    |
| ------------- | ----------- |
| Chrome        | Last 2      |
| Edge          | Last 2      |
| Firefox       | Last 2      |
| Safari        | Last 2      |
| iOS Safari    | 14+         |
| Chrome Mobile | Android 10+ |
