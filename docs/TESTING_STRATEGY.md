# Testing Strategy

> **Version:** 1.0.0
> **Last Updated:** 2025-12-28
> **Source of Truth:** `jest.config.js`, `playwright.config.ts`

This document describes the testing approach for the Emergency Supply Tracker application.

---

## Testing Philosophy

- **Test business logic thoroughly** - Calculations and rules are critical
- **E2E tests run entirely locally** - No external API mocking needed
- **Fast feedback loop** - All tests run without network dependencies
- **Type safety first** - TypeScript catches many issues at compile time
- **Focus on integration tests** - They provide the best ROI

---

## Testing Diamond

We use the **Testing Diamond** approach instead of the traditional pyramid:

```
       /\
      /  \
     / E2E \         <- 20% - Critical user flows
    /------\
   /        \
  /Integration\      <- 70% - Component + logic tests
 /   Tests     \
/--------------\
/                \
/  Unit  | Manual \  <- 10% - Pure business logic
\  Tests | Testing /
 \------ | -------/
```

### Why Diamond?

1. **No complex backend** - Integration tests are as fast as unit tests
2. **React components + logic** - Best tested together
3. **User-centric** - Integration tests verify real interactions
4. **Less brittle** - Unit tests can make refactoring harder
5. **Better ROI** - Integration tests catch more bugs per test

---

## Test Distribution

| Type        | Coverage | Tools                        | Location            |
| ----------- | -------- | ---------------------------- | ------------------- |
| Integration | ~70%     | Jest + React Testing Library | `src/**/*.test.tsx` |
| E2E         | ~20%     | Playwright                   | `e2e/*.spec.ts`     |
| Unit        | ~10%     | Jest                         | `src/**/*.test.ts`  |

---

## Jest Configuration

**File:** `jest.config.js`

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(svg|png|jpg|jpeg|gif)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Coverage Thresholds

| Metric     | Minimum |
| ---------- | ------- |
| Branches   | 80%     |
| Functions  | 80%     |
| Lines      | 80%     |
| Statements | 80%     |

---

## Playwright Configuration

**File:** `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  // Exclude a11y tests from default e2e run - they run in separate CI job
  testIgnore: ['**/a11y.spec.ts'],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  // ... browser projects
});
```

### Test Organization

E2E tests are organized by feature:

- `e2e/dashboard.spec.ts` - Dashboard functionality tests
- `e2e/inventory.spec.ts` - Inventory management tests
- `e2e/settings.spec.ts` - Settings page tests
- `e2e/navigation.spec.ts` - Navigation and routing tests
- `e2e/data-management.spec.ts` - Import/export functionality
- `e2e/a11y.spec.ts` - Accessibility tests (excluded from default e2e run)

**Note:** `a11y.spec.ts` is excluded from the default E2E test run (`npm run test:e2e`) to avoid duplication. Accessibility tests run in a separate CI job. To run a11y tests explicitly, use: `npx playwright test e2e/a11y.spec.ts`

### Browser Coverage

| Browser       | Device          |
| ------------- | --------------- |
| Chromium      | Desktop Chrome  |
| Firefox       | Desktop Firefox |
| WebKit        | Desktop Safari  |
| Mobile Chrome | Pixel 5         |
| Mobile Safari | iPhone 12       |

---

## Test Scripts

```bash
# Jest tests
npm run test              # Run all Jest tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# Playwright E2E
npm run test:e2e          # Run all E2E tests (excludes a11y.spec.ts)
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:headed   # Run with browser visible
npm run test:e2e:chromium # Chromium only

# Accessibility tests (run separately)
npx playwright test e2e/a11y.spec.ts --project=chromium

# Storybook tests
npm run test:storybook    # Vitest Storybook tests

# Mutation testing
npm run test:mutation     # Run mutation testing (interactive)
npm run test:mutation:ci  # Run mutation testing (CI mode)

# All tests
npm run test:all          # Jest + Storybook (not E2E)
npm run validate:all      # Full validation including E2E
```

---

## What to Test

### Unit Tests (10%)

Only pure business logic:

```typescript
// src/utils/calculations/household.test.ts
describe('calculateHouseholdMultiplier', () => {
  it('calculates multiplier for adults and children', () => {
    const config = { adults: 2, children: 1, supplyDurationDays: 3 };
    expect(calculateHouseholdMultiplier(config)).toBe(2.75);
  });
});
```

### Integration Tests (70%)

Components with their logic:

```typescript
// src/components/inventory/ItemCard.test.tsx
describe('ItemCard', () => {
  it('displays item with correct status', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toHaveClass('warning');
  });

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = jest.fn();
    render(<ItemCard item={mockItem} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockItem.id);
  });
});
```

### E2E Tests (20%)

Critical user flows:

```typescript
// e2e/onboarding.spec.ts
test('completes onboarding flow', async ({ page }) => {
  await page.goto('/');

  // Welcome screen
  await expect(page.getByText('Welcome')).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click();

  // Preset selection
  await page.getByText('Family with kids').click();

  // Household form
  await expect(page.getByLabel('Adults')).toHaveValue('2');
  await page.getByRole('button', { name: /continue/i }).click();

  // Quick setup
  await page.getByRole('button', { name: /add recommended/i }).click();

  // Dashboard
  await expect(page.getByText('Dashboard')).toBeVisible();
});
```

---

## Testing Patterns

### Mocking LocalStorage

```typescript
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  jest
    .spyOn(Storage.prototype, 'getItem')
    .mockImplementation((key) => mockStorage[key] || null);
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    mockStorage[key] = value;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### Testing with i18n

```typescript
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/testConfig';

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};
```

### Testing Context Providers

```typescript
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SettingsProvider>
      <InventoryProvider>
        {component}
      </InventoryProvider>
    </SettingsProvider>
  );
};
```

### Test Data Factories

**Always use test factories** from `src/utils/test/factories.ts` instead of creating inline test data objects. This ensures:

- Consistent test data across all tests
- Type-safe mock objects
- Easy maintenance when types change
- Reduced boilerplate in tests

Available factories:

```typescript
import {
  createMockInventoryItem,
  createMockAppData,
  createMockHousehold,
  createMockSettings,
  createMockCategory,
  createMockProductTemplate,
} from '../utils/test/factories';

// Usage examples:
const item = createMockInventoryItem({
  name: 'Test Water',
  quantity: 10,
  categoryId: 'water-beverages',
});

const appData = createMockAppData({
  items: [item],
  settings: { onboardingCompleted: true },
});
```

**Do NOT** create inline objects like this:

```typescript
// ❌ Don't do this
const item: InventoryItem = {
  id: '1',
  name: 'Test',
  itemType: 'custom',
  categoryId: 'food',
  quantity: 5,
  unit: 'pieces',
  // ... many more required fields
};

// ✅ Do this instead
const item = createMockInventoryItem({
  name: 'Test',
  categoryId: 'food',
  quantity: 5,
});
```

---

## Mutation Testing

We use **StrykerJS** to perform mutation testing, which helps identify weak spots in our test suite by introducing small changes (mutations) to the code and checking if tests catch them.

**Note:** Mutation testing is run locally only (not in CI) due to long execution times. Run `npm run test:mutation` periodically to check test quality.

### Configuration

**File:** `stryker.config.json`

Mutation testing runs on all source files except:

- Test files (`*.test.{ts,tsx}`)
- Type definition files (`*.d.ts`)
- Storybook files (`*.stories.tsx`)
- Entry points (`main.tsx`, `serviceWorker.ts`)
- Test utilities (`src/test/**`)
- i18n configuration

### Mutation Score Thresholds

| Threshold | Score | Meaning               |
| --------- | ----- | --------------------- |
| High      | 80%   | Target mutation score |
| Low       | 70%   | Warning threshold     |
| Break     | 70%   | Minimum acceptable    |

### Understanding Mutation Scores

- **Mutation Score = (Killed Mutants / Total Mutants) × 100%**
- **Killed mutants**: Tests failed when code was mutated (good!)
- **Survived mutants**: Tests passed despite mutations (needs better tests)
- **No coverage**: Mutant wasn't covered by any test
- **Timeout**: Tests took too long to run
- **Compile error**: Mutant caused a TypeScript error (filtered out)

### Running Mutation Tests

```bash
# Interactive mode (shows HTML report)
npm run test:mutation

# CI mode (JSON report for artifacts)
npm run test:mutation:ci
```

### Reports

After running mutation tests, you'll find:

- **HTML report**: `reports/mutation/mutation.html` - Interactive dashboard
- **JSON report**: `reports/mutation/mutation.json` - Machine-readable results
- **Clear text**: Console output with summary

### Improving Mutation Scores

If mutants survive (tests pass on mutated code):

1. **Add more assertions** - Test edge cases and boundary conditions
2. **Test error paths** - Ensure error handling is tested
3. **Test return values** - Verify functions return expected results
4. **Test side effects** - Check that mutations to state/behavior are caught

### Example

If a mutant changes `a + b` to `a - b` and tests still pass, it means:

- Tests don't verify the calculation result
- Tests only check that the function runs without error
- Need to add assertions that verify the actual output

---

## Quality Gates

### Pre-commit

- ESLint passes
- Prettier formatting

### CI Pipeline

- All Jest tests pass
- Coverage thresholds met (80%)
- E2E tests pass
- Build succeeds

**Note:** Mutation testing is not part of CI due to long execution time. Run `npm run test:mutation` locally to check mutation scores.

---

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [StrykerJS Documentation](https://stryker-mutator.io/docs/stryker-js/introduction)
