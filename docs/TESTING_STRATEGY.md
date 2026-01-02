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
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  // ... browser projects
});
```

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
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:headed   # Run with browser visible
npm run test:e2e:chromium # Chromium only

# Storybook tests
npm run test:storybook    # Vitest Storybook tests

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

We use **Stryker** for mutation testing to validate that our tests actually catch bugs. Mutation testing helps identify weak tests by introducing small bugs (mutations) and checking if tests fail.

### What is Mutation Testing?

Mutation testing works by:

1. **Mutating** the source code (changing operators, conditions, values)
2. **Running tests** against each mutation
3. **Measuring** how many mutations are "killed" (caught by tests)
4. **Reporting** a mutation score (killed / total mutations)

If tests pass on mutated code, it means the mutation wasn't caught - indicating a weak test.

### Running Mutation Tests

```bash
# Full mutation test run (can take 10-30 minutes)
npm run test:mutation

# Incremental run (only tests changed files, faster)
npm run test:mutation:incremental
```

### Configuration

**File:** `stryker.config.js`

- **Focus area**: Business logic in `src/utils/` (calculations, dashboard logic)
- **Test runner**: Jest
- **Thresholds**:
  - High: 80% (excellent)
  - Low: 70% (good)
  - Break: 60% (minimum acceptable)

### Interpreting Results

After running mutation tests, Stryker generates:

- **HTML report**: `reports/mutation/html/index.html` - Visual report showing all mutations
- **Console output**: Summary with mutation score

**Mutation Score Meaning:**

- **80%+**: Excellent - tests are very effective
- **70-79%**: Good - tests catch most bugs
- **60-69%**: Acceptable - some gaps in test coverage
- **<60%**: Poor - tests need improvement

### What Gets Mutated

Currently focused on critical business logic:

- `src/utils/calculations/` - All calculation functions
- `src/utils/dashboard/` - Dashboard calculation logic

**Not mutated:**

- Test files
- Component files (can be added later)
- Type definitions
- Configuration files

### Improving Mutation Scores

When mutation score is low:

1. **Review the HTML report** to see which mutations survived
2. **Identify patterns** - Are certain operators/conditions not tested?
3. **Add test cases** for edge cases and boundary conditions
4. **Test error paths** - Mutations often survive in error handling code
5. **Test all branches** - Ensure both true/false paths are covered

### Example: Improving a Weak Test

**Before (mutation score: 50%):**

```typescript
it('calculates multiplier', () => {
  expect(calculateHouseholdMultiplier({ adults: 2, children: 1 })).toBe(2.75);
});
```

**After (mutation score: 90%):**

```typescript
it('calculates multiplier for adults and children', () => {
  expect(calculateHouseholdMultiplier({ adults: 2, children: 1 })).toBe(2.75);
});

it('handles zero children', () => {
  expect(calculateHouseholdMultiplier({ adults: 2, children: 0 })).toBe(2.0);
});

it('handles zero adults', () => {
  expect(calculateHouseholdMultiplier({ adults: 0, children: 1 })).toBe(0.75);
});

it('handles large household sizes', () => {
  expect(calculateHouseholdMultiplier({ adults: 10, children: 5 })).toBe(13.75);
});
```

### When to Run Mutation Tests

- **Before major releases**: Ensure test quality
- **After refactoring**: Verify tests still catch bugs
- **When adding new business logic**: Validate new tests are effective
- **Periodically**: Run incremental tests during development

**Note:** Full mutation tests are slower (10-30 min) than regular tests. Use incremental mode during development.

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

---

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Stryker Mutation Testing](https://stryker-mutator.io/)
