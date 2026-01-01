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
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Coverage Thresholds

| Metric     | Minimum |
| ---------- | ------- |
| Branches   | 70%     |
| Functions  | 70%     |
| Lines      | 70%     |
| Statements | 70%     |

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

## Quality Gates

### Pre-commit

- ESLint passes
- Prettier formatting

### CI Pipeline

- All Jest tests pass
- Coverage thresholds met (70%)
- E2E tests pass
- Build succeeds

---

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
