# Testing Strategy

> **Version:** 1.1.0
> **Last Updated:** 2026-01-11
> **Source of Truth:** `vite.config.ts`, `playwright.config.ts`, `src/test/globalSetup.ts`

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

| Type        | Coverage | Tools                          | Location            |
| ----------- | -------- | ------------------------------ | ------------------- |
| Integration | ~70%     | Vitest + React Testing Library | `src/**/*.test.tsx` |
| E2E         | ~20%     | Playwright                     | `e2e/*.spec.ts`     |
| Unit        | ~10%     | Vitest                         | `src/**/*.test.ts`  |

---

## Vitest Configuration

**File:** `vite.config.ts`

Vitest is configured as part of the Vite configuration. The test configuration includes:

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts', './src/test/a11y-setup.ts'],
  exclude: ['**/node_modules/**', '**/e2e/**'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html', 'lcov'],
    include: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.stories.tsx',
      '!src/main.tsx',
      '!src/test/**',
    ],
    thresholds: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  projects: [
    {
      test: {
        name: 'unit',
        environment: 'jsdom',
        include: ['**/*.{test,spec}.{ts,tsx}'],
        exclude: [
          '**/node_modules/**',
          '**/e2e/**',
          '**/.storybook/**',
          '**/*.stories.{ts,tsx}',
        ],
      },
    },
  ],
}
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
  // Use testMatch to conditionally include/exclude a11y tests based on RUN_A11Y_TESTS env var
  testMatch: process.env.RUN_A11Y_TESTS
    ? ['**/a11y.spec.ts']
    : ['**/*.spec.ts', '!**/a11y.spec.ts'],
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
# Vitest tests
npm run test              # Run all Vitest unit/integration tests
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
npm run test:all          # Vitest + Storybook (not E2E)
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
    const onEdit = vi.fn();
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

### Centralized Test Utilities

All test utilities are centralized in `src/test/` and can be imported from `@/test`:

```typescript
import {
  renderWithProviders,
  renderWithSettings,
  renderWithHousehold,
  screen,
  fireEvent,
  createMockInventoryItem,
  createMockAppData,
} from '@/test';
```

**Available utilities:**

| Utility                  | Description                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `renderWithProviders`    | Renders with all standard providers (Settings, Household, RecommendedItems, Inventory) |
| `renderWithSettings`     | Renders with only SettingsProvider                                                     |
| `renderWithHousehold`    | Renders with only HouseholdProvider                                                    |
| `renderWithInventory`    | Renders with only InventoryProvider                                                    |
| `renderWithAllProviders` | Renders with all providers including ErrorBoundary and ThemeApplier                    |
| `createI18nMock`         | Creates custom i18next mock for tests needing specific translations                    |

### Testing with i18n

A global i18next mock is automatically applied via `src/test/setup.ts`. For most tests, you don't need to add any i18n-related code.

**Default behavior** - The mock returns translation keys as-is:

```typescript
// No i18n mock needed - uses global default
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test';

it('displays dashboard', () => {
  renderWithProviders(<Dashboard />);
  expect(screen.getByText('dashboard.title')).toBeInTheDocument();
});
```

**Custom translations** - Override when tests need specific translated values:

```typescript
// For tests that need specific translations
import { vi } from 'vitest';
const mockChangeLanguage = vi.fn();
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.title': 'Dashboard',
        'dashboard.subtitle': 'Welcome!',
      };
      return translations[key] || key;
    },
    i18n: { changeLanguage: mockChangeLanguage },
  }),
}));
```

**Real i18next** - For components using `withTranslation` HOC:

```typescript
// Use real react-i18next when testing class components with withTranslation
import { vi } from 'vitest';
vi.mock('react-i18next', () => vi.importActual('react-i18next'));
```

### Testing Context Providers

Use the centralized `renderWithProviders` function:

```typescript
import { renderWithProviders, screen } from '@/test';

it('renders dashboard with providers', () => {
  renderWithProviders(<Dashboard />);
  expect(screen.getByText('dashboard.title')).toBeInTheDocument();
});

// With initial data
renderWithProviders(<Dashboard />, {
  initialAppData: {
    items: [createMockInventoryItem()],
    household: { adults: 4 },
  },
});

// With specific providers only
renderWithProviders(<HouseholdForm />, {
  providers: {
    settings: false,
    household: true,
    recommendedItems: false,
    inventory: false,
  },
});
```

### Mocking LocalStorage

```typescript
import { vi } from 'vitest';

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
    (key) => mockStorage[key] || null,
  );
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    mockStorage[key] = value;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
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

## Debugging and Reproducing Test Failures

### Faker Seed Management

Our tests use **Faker.js** to generate random test data, which helps with property-based testing and catching edge cases. However, random data can make test failures hard to reproduce.

**How it works:**

- **Default behavior**: Each test run uses a random seed (0-999,999), generating different data each time
- **Seed logging**: The seed is automatically logged to the console when tests run
- **Reproducibility**: You can set a specific seed to reproduce exact test failures

### Reproducing Test Failures

When a test fails, you'll see output like this:

```text
[Faker] Using seed: 123456 (set FAKER_SEED=123456 to reproduce)

FAIL  src/features/household/factories/HouseholdConfigFactory.test.ts
  ✗ creates a valid household config
```

**To reproduce the failure:**

1. **Copy the seed** from the console output (e.g., `123456`)
2. **Run tests with that seed**:

```bash
FAKER_SEED=123456 npm test
```

3. **The test will now use the exact same random values** that caused the failure

### Setting a Fixed Seed for Debugging

If you want to debug with consistent data:

```bash
# Use a specific seed for all tests
FAKER_SEED=42 npm test

# Or for a specific test file
FAKER_SEED=42 npm test src/features/household/factories/HouseholdConfigFactory.test.ts
```

### Why Random Seeds?

**Benefits:**

- **Better coverage**: Different random values each run catch more edge cases
- **Property-based testing**: Tests verify behavior across a wide range of inputs
- **Reproducible**: When failures occur, you can reproduce them exactly

**Trade-offs:**

- Tests are non-deterministic by default (but reproducible when needed)
- Some edge cases might only appear with specific random values

### Best Practices

1. **Don't rely on specific random values** - Tests should work with any valid random input
2. **Use seed for debugging** - When a test fails, use the logged seed to reproduce
3. **Fix flaky tests** - If a test fails with some seeds but not others, the test or code likely has a bug
4. **CI considerations** - In CI, you might want to run tests with multiple seeds for better coverage:

```bash
# Example: Run tests with multiple seeds in CI
for seed in 1 42 999 12345 999999; do
  FAKER_SEED=$seed npm test || exit 1
done
```

### Overriding Seed in Individual Tests

If you need a specific seed for a particular test:

```typescript
import { faker } from '@faker-js/faker';

it('tests with specific seed', () => {
  faker.seed(123); // Override global seed for this test
  const value = faker.number.int({ min: 1, max: 10 });
  // ... test code
});
```

**Note:** This only affects faker calls made after `faker.seed()` in that test.

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

- All Vitest tests pass
- Coverage thresholds met (80%)
- E2E tests pass
- Build succeeds

**Note:** Mutation testing is not part of CI due to long execution time. Run `npm run test:mutation` locally to check mutation scores.

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [StrykerJS Documentation](https://stryker-mutator.io/docs/stryker-js/introduction)
