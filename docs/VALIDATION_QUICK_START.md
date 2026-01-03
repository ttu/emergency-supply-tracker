# Validation Improvements - Quick Start Guide

> **Quick reference** for implementing validation improvements to catch agent-generated code issues

---

## Immediate Actions (Do First)

### 1. Add Type Checking to CI

**Why**: Catch TypeScript errors before they reach production.

**Steps**:

1. Add script to `package.json`:

```json
"type-check": "tsc --noEmit"
```

2. Add job to `.github/workflows/ci.yml`:

```yaml
type-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: actions/setup-node@v6
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm run type-check
```

3. Update `build` job to depend on `type-check`:

```yaml
build:
  needs: [lint, type-check, test, storybook, e2e]
```

---

### 2. Type-check in Pre-commit Hook

**Note**: Type-check has been added to the existing pre-commit hook (`.husky/pre-commit`), not as a separate pre-push hook. The pre-commit hook now runs:

1. `npx lint-staged` - ESLint and Prettier on staged files
2. `npm run type-check` - TypeScript type checking
3. `npm test` - Jest tests
4. `npm run build` - Production build

**Current implementation** (`.husky/pre-commit`):

```bash
npx lint-staged
npm run type-check
npm test
npm run build
```

**To modify or test**:

- Edit `.husky/pre-commit` to change the validation flow
- Run a local commit to trigger the hook: `git commit -m "test"`
- Skip hooks if needed: `git commit --no-verify`

**Future**: A separate pre-push hook for full validation (`npm run validate`) is still planned as a separate improvement (see VALIDATION_PROGRESS.md).

---

### 3. Add i18n Validation

**Why**: Ensure all user-facing strings are translated.

**Steps**:

1. Install dependency:

```bash
npm install --save-dev tsx
```

2. Create `scripts/validate-i18n.ts`:

```typescript
import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'public/locales');
const locales = ['en', 'fi'];

// Get all translation keys from a locale
function getKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys.push(...getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Load translation files
const translations: Record<string, Record<string, any>> = {};
for (const locale of locales) {
  const files = fs.readdirSync(path.join(localesDir, locale));
  translations[locale] = {};
  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = JSON.parse(
        fs.readFileSync(path.join(localesDir, locale, file), 'utf-8'),
      );
      translations[locale][file.replace('.json', '')] = content;
    }
  }
}

// Check for missing keys
const baseLocale = 'en';
const baseKeys = new Set<string>();
for (const [namespace, content] of Object.entries(translations[baseLocale])) {
  getKeys(content).forEach((key) => baseKeys.add(`${namespace}.${key}`));
}

let hasErrors = false;
for (const locale of locales) {
  if (locale === baseLocale) continue;

  const localeKeys = new Set<string>();
  for (const [namespace, content] of Object.entries(translations[locale])) {
    getKeys(content).forEach((key) => localeKeys.add(`${namespace}.${key}`));
  }

  const missing = Array.from(baseKeys).filter((key) => !localeKeys.has(key));
  if (missing.length > 0) {
    console.error(`❌ Missing translations in ${locale}:`);
    missing.forEach((key) => console.error(`  - ${key}`));
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log('✅ All translations are complete');
```

3. Add script to `package.json`:

```json
"validate:i18n": "tsx scripts/validate-i18n.ts"
```

4. Add to CI lint job:

```yaml
lint:
  # ... existing steps
  - run: npm run validate:i18n
```

---

### 4. Add Basic Accessibility Testing

**Why**: Catch accessibility issues early.

**Steps**:

1. Install dependencies:

```bash
npm install --save-dev jest-axe @axe-core/playwright
```

2. Create `src/test/a11y-setup.ts`:

```typescript
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

3. Update `src/test/setup.ts`:

```typescript
import './a11y-setup';
// ... existing setup
```

4. Create example a11y test `src/components/common/Button.test.tsx`:

```typescript
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from './Button';

it('should have no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

5. Add E2E a11y test `e2e/a11y.spec.ts`:

```typescript
import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should have no accessibility violations on dashboard', async ({
    page,
    setupApp,
  }) => {
    await setupApp();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

6. Add to CI (as part of e2e job or separate):

```yaml
a11y:
  runs-on: ubuntu-latest
  steps:
    # ... setup steps
    - run: npm run test:e2e -- e2e/a11y.spec.ts
```

---

## Next Steps (After Immediate Actions)

### 5. Visual Regression Testing

**Why**: Catch visual bugs that functional tests miss.

**Steps**:

1. Chromatic is already installed. Add to CI:

```yaml
visual:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: actions/setup-node@v6
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm run build-storybook
    - uses: chromaui/action@v1
      with:
        projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
        buildScriptName: build-storybook
```

2. Get Chromatic token from https://www.chromatic.com/

---

### 6. Bundle Size Monitoring

**Why**: Prevent bundle bloat.

**Steps**:

1. Install:

```bash
npm install --save-dev size-limit
```

2. Create `.size-limit.json`:

```json
[
  {
    "path": "dist/assets/index-*.js",
    "limit": "200 KB"
  },
  {
    "path": "dist/assets/index-*.css",
    "limit": "50 KB"
  }
]
```

3. Add script:

```json
"test:size": "size-limit"
```

4. Add to CI:

```yaml
bundle-size:
  runs-on: ubuntu-latest
  steps:
    # ... setup
    - run: npm run build
    - run: npm run test:size
```

---

### 7. Multi-Browser E2E

**Why**: Catch browser-specific issues.

**Steps**:

1. Update `.github/workflows/ci.yml` e2e job:

```yaml
e2e:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      browser: [chromium, firefox, webkit]
  steps:
    # ... setup
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps ${{ matrix.browser }}
    - run: npm run test:e2e -- --project=${{ matrix.browser }}
```

**Note**: This will increase CI time. Consider running all browsers only on main branch.

---

## Testing the Improvements

After implementing, test each validation:

```bash
# Type checking
npm run type-check

# i18n validation
npm run validate:i18n

# Accessibility (after adding tests)
npm run test -- --testPathPattern=a11y

# Full validation
npm run validate

# Pre-push hook (try pushing)
git push
```

---

## Rollout Strategy

1. **Week 1**: Implement Phase 1 (type-check, pre-push, i18n, basic a11y)
2. **Week 2**: Add visual regression and bundle size
3. **Week 3**: Add multi-browser E2E and performance budgets
4. **Week 4**: Fine-tune thresholds and add remaining checks

---

## Troubleshooting

### Pre-push hook too slow?

Make it optional or only run on certain branches:

```bash
if [ "$(git rev-parse --abbrev-ref HEAD)" = "main" ]; then
  npm run validate
fi
```

### CI taking too long?

- Run fast checks first (lint, type-check)
- Use parallel jobs
- Cache dependencies
- Run expensive checks only on main branch

### False positives?

- Adjust thresholds (bundle size, performance budgets)
- Add exceptions for known issues
- Review and update regularly

---

## Success Metrics

Track these to measure improvement:

- **Time to catch bugs**: Should decrease (faster feedback)
- **Bugs in production**: Should decrease (better validation)
- **CI failure rate**: Monitor for flaky tests
- **CI duration**: Keep under 10 minutes if possible

---

## References

- Full details: `docs/VALIDATION_IMPROVEMENTS.md`
- Testing strategy: `docs/TESTING_STRATEGY.md`
- Code quality: `docs/CODE_QUALITY.md`
