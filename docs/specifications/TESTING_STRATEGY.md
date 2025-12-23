# Testing Strategy - Emergency Supply Tracker

## Overview
This document outlines the testing strategy for the Emergency Supply Tracker application. Since the app is entirely self-contained with no external API dependencies, we can achieve excellent test coverage at all levels.

## Testing Philosophy
- **Test business logic thoroughly** - Calculations and rules are critical
- **E2E tests can run entirely locally** - No mocking needed for external services
- **Fast feedback loop** - All tests run locally without network dependencies
- **Type safety first** - TypeScript catches many issues at compile time
- **Focus on integration tests** - They provide the best ROI (return on investment)

---

## Testing Diamond (Modern Approach)

We use the **Testing Diamond/Trophy** approach instead of the traditional pyramid. This emphasizes integration tests because they:
- Test how components work together (closer to real usage)
- Catch more real bugs than isolated unit tests
- Are more resilient to refactoring
- Provide better confidence

```
         /\
        /  \
       / E2E \         <- Some end-to-end tests for critical flows
      /------\
     /        \
    /Integration\      <- MOST tests here (component + logic)
   /  Tests     \
  /--------------\
 /                \
/  Unit    |  Manual\  <- Targeted unit tests | Manual/Exploratory
\  Tests   | Testing /
 \-------- | -------/
```

### Why Diamond for This App?

1. **No complex backend** - Integration tests are as fast as unit tests
2. **React components + logic** - Best tested together
3. **User-centric** - Integration tests verify real user interactions
4. **Less brittle** - Unit tests can make refactoring harder
5. **Better ROI** - Integration tests catch more bugs per test written

---

## Test Levels

### Distribution Guideline
- **Integration Tests**: ~70% of tests (bulk of coverage)
- **E2E Tests**: ~20% of tests (critical user flows)
- **Unit Tests**: ~10% of tests (pure business logic only)

---

## 1. Unit Tests (Minimal, Targeted)

### What to Test
**Only** pure business logic and utility functions that are:
- Complex calculations
- Independent of React/UI
- Used across multiple components
- Critical to app correctness

**Avoid** testing trivial utilities or things better tested in integration tests.

### Tools
- **Jest** - Test runner and assertion library
- **@testing-library/jest-dom** - Custom matchers for DOM

### Coverage Areas

#### Calculation Functions
```typescript
// src/utils/calculations.test.ts
describe('Household Calculations', () => {
  test('calculates household multiplier correctly', () => {
    const household = { adults: 2, children: 1, supplyDurationDays: 3 };
    // (2 * 1.0) + (1 * 0.75) = 2.75
    expect(calculateHouseholdMultiplier(household)).toBe(2.75);
  });

  test('calculates recommended quantity with scaling', () => {
    const recommendedItem = {
      id: 'bottled-water',
      baseQuantity: 9,
      scaleWithPeople: true,
      scaleWithDays: true
    };
    const household = { adults: 2, children: 0, supplyDurationDays: 7 };
    // 9 * 2.0 * (7/3) = 42
    expect(calculateRecommendedQuantity(recommendedItem, household)).toBe(42);
  });

  test('handles non-scaling items', () => {
    const recommendedItem = {
      id: 'flashlight',
      baseQuantity: 2,
      scaleWithPeople: false,
      scaleWithDays: false
    };
    const household = { adults: 5, children: 3, supplyDurationDays: 14 };
    expect(calculateRecommendedQuantity(recommendedItem, household)).toBe(2);
  });
});
```

#### Status Determination
```typescript
// src/utils/status.test.ts
describe('Item Status', () => {
  test('returns critical when expired', () => {
    const item = {
      quantity: 10,
      expirationDate: '2024-01-01'
    };
    const status = getItemStatus(item, 10, new Date('2025-01-01'));
    expect(status).toBe('critical');
  });

  test('returns warning when expiring within 30 days', () => {
    const item = {
      quantity: 10,
      expirationDate: '2025-01-15'
    };
    const status = getItemStatus(item, 10, new Date('2025-01-01'));
    expect(status).toBe('warning');
  });

  test('returns critical when quantity is zero', () => {
    const item = {
      quantity: 0,
      expirationDate: '2026-01-01'
    };
    const status = getItemStatus(item, 10, new Date('2025-01-01'));
    expect(status).toBe('critical');
  });

  test('returns warning when low quantity', () => {
    const item = {
      quantity: 3,
      expirationDate: '2026-01-01'
    };
    const status = getItemStatus(item, 10, new Date('2025-01-01'));
    expect(status).toBe('warning');
  });

  test('returns ok when sufficient and not expiring', () => {
    const item = {
      quantity: 10,
      expirationDate: '2026-01-01'
    };
    const status = getItemStatus(item, 10, new Date('2025-01-01'));
    expect(status).toBe('ok');
  });
});
```

#### Aggregation Logic
```typescript
// src/utils/aggregation.test.ts
describe('Quantity Aggregation', () => {
  test('aggregates quantities for same item type', () => {
    const items = [
      { recommendedItemId: 'bottled-water', quantity: 10 },
      { recommendedItemId: 'bottled-water', quantity: 5 },
      { recommendedItemId: 'canned-soup', quantity: 3 }
    ];
    expect(getAggregatedQuantity('bottled-water', items)).toBe(15);
  });

  test('returns 0 for item not in inventory', () => {
    const items = [
      { recommendedItemId: 'bottled-water', quantity: 10 }
    ];
    expect(getAggregatedQuantity('flashlight', items)).toBe(0);
  });
});
```

#### LocalStorage Utilities
```typescript
// src/utils/storage.test.ts
describe('LocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saves and loads app data', () => {
    const data = {
      version: '1.0.0',
      household: { adults: 2, children: 0, supplyDurationDays: 3 },
      items: []
    };
    saveAppData(data);
    expect(loadAppData()).toEqual(data);
  });

  test('handles corrupted data gracefully', () => {
    localStorage.setItem('emergencySupplyTracker', 'invalid json');
    expect(loadAppData()).toBeNull();
  });
});
```

#### Date Utilities
```typescript
// src/utils/dates.test.ts
describe('Date Utilities', () => {
  test('calculates days until expiration', () => {
    const expirationDate = '2025-02-01';
    const currentDate = new Date('2025-01-01');
    expect(getDaysUntilExpiration(expirationDate, currentDate)).toBe(31);
  });

  test('adds months to date for default expiration', () => {
    const purchaseDate = '2025-01-01';
    expect(addMonths(purchaseDate, 12)).toBe('2026-01-01');
  });
});
```

#### Data Validation
```typescript
// src/utils/validation.test.ts
describe('Import Validation', () => {
  test('validates correct import data', () => {
    const validData = {
      version: '1.0.0',
      household: { adults: 2, children: 0, supplyDurationDays: 3 },
      settings: { language: 'en' },
      categories: [],
      items: []
    };
    const result = validateImportData(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('detects missing required fields', () => {
    const invalidData = { version: '1.0.0' };
    const result = validateImportData(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('detects invalid version', () => {
    const invalidData = {
      version: '99.0.0',
      household: { adults: 2, children: 0, supplyDurationDays: 3 }
    };
    const result = validateImportData(invalidData);
    expect(result.warnings).toContain(expect.stringContaining('version'));
  });
});
```

### Target Coverage
- **Critical calculations**: 100%
- **Complex utilities**: 100%
- **Simple utilities**: Skip (test in integration instead)

---

## 2. Integration Tests (Primary Focus - 70% of Tests)

### What to Test
React components WITH their:
- Hooks and state
- User interactions
- Business logic
- Data flow
- Context/state management

**This is where most testing happens.** Integration tests give you the best confidence that features actually work.

### Tools
- **React Testing Library** - Component testing
- **@testing-library/user-event** - Simulate user interactions
- **Jest** - Test runner

### Coverage Areas

#### Custom Hooks
```typescript
// src/hooks/useInventory.test.ts
import { renderHook, act } from '@testing-library/react';

describe('useInventory', () => {
  test('adds item to inventory', () => {
    const { result } = renderHook(() => useInventory());

    act(() => {
      result.current.addItem({
        categoryId: 'water-beverages',
        recommendedItemId: 'bottled-water',
        quantity: 10,
        unit: 'liters'
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(10);
  });

  test('updates item quantity', () => {
    const { result } = renderHook(() => useInventory());

    act(() => {
      result.current.addItem({ id: 'item-1', quantity: 10 });
    });

    act(() => {
      result.current.updateItem('item-1', { quantity: 15 });
    });

    expect(result.current.items[0].quantity).toBe(15);
  });

  test('deletes item from inventory', () => {
    const { result } = renderHook(() => useInventory());

    act(() => {
      result.current.addItem({ id: 'item-1', quantity: 10 });
    });

    act(() => {
      result.current.deleteItem('item-1');
    });

    expect(result.current.items).toHaveLength(0);
  });
});
```

#### Component Integration
```typescript
// src/components/ItemList.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ItemList', () => {
  test('displays items in category', () => {
    const items = [
      { id: '1', name: 'Bottled Water', quantity: 10, unit: 'liters' },
      { id: '2', name: 'Canned Soup', quantity: 5, unit: 'cans' }
    ];

    render(<ItemList categoryId="food" items={items} />);

    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
    expect(screen.getByText('10 liters')).toBeInTheDocument();
  });

  test('filters items by status', async () => {
    const items = [
      { id: '1', status: 'ok' },
      { id: '2', status: 'critical' }
    ];

    render(<ItemList items={items} />);

    await userEvent.selectOptions(screen.getByLabelText('Filter'), 'critical');

    expect(screen.queryByTestId('item-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
  });

  test('calls onEdit when edit button clicked', async () => {
    const onEdit = jest.fn();
    const items = [{ id: '1', name: 'Test Item' }];

    render(<ItemList items={items} onEdit={onEdit} />);

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

#### State Management / Context
```typescript
// src/context/AppContext.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('AppContext', () => {
  test('provides household configuration', () => {
    const TestComponent = () => {
      const { household } = useApp();
      return <div>{household.adults} adults</div>;
    };

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByText('2 adults')).toBeInTheDocument();
  });

  test('updates household configuration', async () => {
    const TestComponent = () => {
      const { household, updateHousehold } = useApp();
      return (
        <>
          <div>{household.adults} adults</div>
          <button onClick={() => updateHousehold({ adults: 4 })}>
            Update
          </button>
        </>
      );
    };

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: /update/i }));

    expect(screen.getByText('4 adults')).toBeInTheDocument();
  });

  test('persists to localStorage on update', async () => {
    // Test that changes are saved
  });
});
```

#### Form Components
```typescript
// src/components/ItemForm.test.tsx
describe('ItemForm', () => {
  test('submits form with valid data', async () => {
    const onSubmit = jest.fn();

    render(<ItemForm onSubmit={onSubmit} categoryId="food" />);

    await userEvent.type(screen.getByLabelText(/quantity/i), '10');
    await userEvent.selectOptions(screen.getByLabelText(/unit/i), 'liters');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 10,
        unit: 'liters'
      })
    );
  });

  test('shows validation errors', async () => {
    render(<ItemForm onSubmit={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText(/quantity is required/i)).toBeInTheDocument();
  });

  test('populates form with initial values', () => {
    const item = {
      quantity: 10,
      unit: 'liters',
      expirationDate: '2025-06-01'
    };

    render(<ItemForm initialValues={item} onSubmit={jest.fn()} />);

    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025-06-01')).toBeInTheDocument();
  });
});
```

#### Example: Test Component with Calculations
```typescript
// src/components/Dashboard.test.tsx
describe('Dashboard', () => {
  test('shows correct recommended quantities for household', () => {
    const household = { adults: 2, children: 1, supplyDurationDays: 3 };

    render(
      <AppProvider initialHousehold={household}>
        <Dashboard />
      </AppProvider>
    );

    // Test calculation AND display together
    // (2 * 1.0 + 1 * 0.75) * 9L = 24.75L
    expect(screen.getByText(/24.75.*liters.*water/i)).toBeInTheDocument();
  });

  test('updates recommendations when household changes', async () => {
    render(<App />);

    // Navigate to settings
    await userEvent.click(screen.getByRole('link', { name: /settings/i }));

    // Change household
    await userEvent.clear(screen.getByLabelText(/adults/i));
    await userEvent.type(screen.getByLabelText(/adults/i), '4');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    // Go back to dashboard
    await userEvent.click(screen.getByRole('link', { name: /dashboard/i }));

    // Calculations should update
    // (4 * 1.0) * 9L = 36L
    expect(screen.getByText(/36.*liters.*water/i)).toBeInTheDocument();
  });
});
```

### Why Integration Tests Are Better Here
- ✅ Tests calculation + rendering + user interaction together
- ✅ Catches integration bugs (e.g., forgot to recalculate on household change)
- ✅ More resilient to refactoring (can change how calculation is done)
- ✅ Tests actual user experience
- ❌ Unit testing the calculation alone wouldn't catch display bugs
- ❌ Unit testing the component alone wouldn't catch calculation bugs

### Target Coverage
- **All components with logic**: 90%+
- **Form components**: 95%+
- **Custom hooks**: 90%+
- **State management**: 95%+

---

## 3. End-to-End Tests (Critical Flows - 20% of Tests)

### What to Test
Complete user journeys that exercise the full stack, including:
- LocalStorage persistence
- Multi-step workflows
- Cross-page navigation
- Import/Export functionality

**Keep these focused on critical happy paths and important edge cases.**

### Tools
**Playwright** (Strongly Recommended)

**Why Playwright for this project:**
- ✅ **Perfect for LocalStorage** - Easy to manipulate and test browser storage
- ✅ **No network mocking needed** - Our app has no backend, so Playwright's simplicity wins
- ✅ **TypeScript-native** - First-class TS support matches our codebase
- ✅ **Multi-browser out of the box** - Chrome, Firefox, Safari (important for iOS users)
- ✅ **Fast parallel execution** - Tests run quickly
- ✅ **Amazing debugging** - Trace viewer, UI mode, codegen
- ✅ **Auto-waiting** - Smart element waiting reduces flaky tests
- ✅ **Visual testing** - Built-in screenshot comparison

**Quick Start:**
```bash
npm install -D @playwright/test
npx playwright install
npx playwright test              # Run tests
npx playwright test --ui         # Interactive UI mode
npx playwright test --debug      # Debug mode
npx playwright codegen localhost:5173  # Generate tests by recording
npx playwright show-report       # View HTML report
```

**Alternative:** Cypress is also excellent if you prefer it, but Playwright is better suited for this specific project.

### Coverage Areas

#### Onboarding Flow
```typescript
// e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Onboarding', () => {
  test('completes onboarding flow', async ({ page }) => {
    await page.goto('/');

    // Should show welcome screen
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

    // Select language
    await page.getByRole('button', { name: /english/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Configure household
    await page.getByLabel(/adults/i).fill('2');
    await page.getByLabel(/children/i).fill('1');
    await page.getByLabel(/days/i).fill('7');
    await page.getByRole('button', { name: /next/i }).click();

    // See recommendations
    await expect(page.getByText(/recommended supplies/i)).toBeVisible();
    await page.getByRole('button', { name: /get started/i }).click();

    // Should land on dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Household config should be saved
    await expect(page.getByText(/2 adults, 1 child/i)).toBeVisible();
  });

  test('persists onboarding data after refresh', async ({ page }) => {
    await page.goto('/');
    // Complete onboarding...

    await page.reload();

    // Should not show onboarding again
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});
```

#### Add and Manage Items
```typescript
// e2e/inventory.spec.ts
test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set up household config in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('emergencySupplyTracker', JSON.stringify({
        version: '1.0.0',
        household: { adults: 2, children: 0, supplyDurationDays: 3 },
        settings: { language: 'en' },
        categories: [],
        items: []
      }));
    });
    await page.reload();
  });

  test('adds item from recommendations', async ({ page }) => {
    await page.goto('/inventory/water-beverages');

    // Click quick add on bottled water
    await page.getByTestId('quick-add-bottled-water').click();

    // Item should appear in list with 0 quantity
    await expect(page.getByText(/bottled water/i)).toBeVisible();
    await expect(page.getByText(/0 \/ 18 liters/i)).toBeVisible();

    // Edit to add quantity
    await page.getByRole('button', { name: /edit/i }).first().click();
    await page.getByLabel(/quantity/i).fill('15');
    await page.getByLabel(/expiration date/i).fill('2025-06-15');
    await page.getByRole('button', { name: /save/i }).click();

    // Should show updated quantity
    await expect(page.getByText(/15 \/ 18 liters/i)).toBeVisible();
  });

  test('adds multiple instances of same item', async ({ page }) => {
    await page.goto('/inventory/water-beverages');

    // Add first water bottle
    await page.getByTestId('add-bottled-water').click();
    await page.getByLabel(/quantity/i).fill('10');
    await page.getByLabel(/expiration date/i).fill('2025-06-01');
    await page.getByRole('button', { name: /save/i }).click();

    // Add second water bottle with different expiration
    await page.getByTestId('add-bottled-water').click();
    await page.getByLabel(/quantity/i).fill('8');
    await page.getByLabel(/expiration date/i).fill('2025-12-01');
    await page.getByRole('button', { name: /save/i }).click();

    // Should show aggregated quantity
    await expect(page.getByText(/18 \/ 18 liters/i)).toBeVisible();

    // Should show both instances in expanded view
    await page.getByRole('button', { name: /expand/i }).click();
    await expect(page.getByText(/10 L.*2025-06-01/)).toBeVisible();
    await expect(page.getByText(/8 L.*2025-12-01/)).toBeVisible();
  });

  test('deletes item', async ({ page }) => {
    // Add item first
    await page.goto('/inventory/food');
    await page.getByTestId('add-canned-soup').click();
    await page.getByLabel(/quantity/i).fill('5');
    await page.getByRole('button', { name: /save/i }).click();

    // Delete it
    await page.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Should be gone
    await expect(page.getByText(/canned soup.*5/i)).not.toBeVisible();
  });

  test('adds custom item', async ({ page }) => {
    await page.goto('/inventory/food');

    await page.getByRole('button', { name: /add custom item/i }).click();
    await page.getByLabel(/name/i).fill('Homemade Jerky');
    await page.getByLabel(/quantity/i).fill('0.5');
    await page.getByLabel(/unit/i).selectOption('kg');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText(/homemade jerky/i)).toBeVisible();
  });
});
```

#### Dashboard and Alerts
```typescript
// e2e/dashboard.spec.ts
test.describe('Dashboard', () => {
  test('shows expiring items alert', async ({ page }) => {
    // Set up item expiring in 15 days
    await page.goto('/');
    await page.evaluate(() => {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 15);

      localStorage.setItem('emergencySupplyTracker', JSON.stringify({
        version: '1.0.0',
        household: { adults: 2, children: 0, supplyDurationDays: 3 },
        settings: { language: 'en' },
        categories: [],
        items: [{
          id: '1',
          categoryId: 'water-beverages',
          recommendedItemId: 'bottled-water',
          quantity: 18,
          unit: 'liters',
          expirationDate: expirationDate.toISOString().split('T')[0]
        }]
      }));
    });
    await page.reload();

    // Should show expiring alert
    await expect(page.getByText(/expiring soon/i)).toBeVisible();
    await expect(page.getByText(/bottled water/i)).toBeVisible();
  });

  test('shows missing items alert', async ({ page }) => {
    // Set up with no items
    await page.goto('/');

    await expect(page.getByText(/missing critical items/i)).toBeVisible();
  });

  test('shows category status', async ({ page }) => {
    await page.goto('/');

    // Water category should show critical (missing)
    const waterCategory = page.getByTestId('category-water-beverages');
    await expect(waterCategory.getByTestId('status-critical')).toBeVisible();
  });

  test('calculates preparedness percentage', async ({ page }) => {
    // Add some items and check percentage updates
    await page.goto('/');

    await expect(page.getByText(/0% prepared/i)).toBeVisible();

    // Add items...

    await expect(page.getByText(/25% prepared/i)).toBeVisible();
  });
});
```

#### Settings and Data Management
```typescript
// e2e/settings.spec.ts
test.describe('Settings', () => {
  test('changes household configuration', async ({ page }) => {
    await page.goto('/settings');

    await page.getByLabel(/adults/i).fill('4');
    await page.getByLabel(/children/i).fill('2');
    await page.getByRole('button', { name: /save/i }).click();

    await page.goto('/');
    await expect(page.getByText(/4 adults, 2 children/i)).toBeVisible();

    // Recommended quantities should update
    // (4 * 1.0 + 2 * 0.75) * 3 days = 5.5 * 9L = 49.5L water
    await page.goto('/inventory/water-beverages');
    await expect(page.getByText(/49.5 liters/i)).toBeVisible();
  });

  test('changes language', async ({ page }) => {
    await page.goto('/settings');

    await page.getByLabel(/language/i).selectOption('fi');

    // UI should update to Finnish
    await expect(page.getByText(/asetukset/i)).toBeVisible();
  });

  test('exports data', async ({ page }) => {
    await page.goto('/settings');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/emergency-supplies.*\.json/);

    // Verify file contents
    const path = await download.path();
    const content = JSON.parse(await fs.readFile(path, 'utf-8'));
    expect(content.version).toBe('1.0.0');
  });

  test('imports data', async ({ page }) => {
    await page.goto('/settings');

    // Create test file
    const testData = {
      version: '1.0.0',
      household: { adults: 3, children: 1, supplyDurationDays: 7 },
      settings: { language: 'en' },
      categories: [],
      items: [
        {
          id: '1',
          categoryId: 'food',
          recommendedItemId: 'canned-soup',
          quantity: 10,
          unit: 'cans'
        }
      ]
    };

    await page.setInputFiles(
      'input[type="file"]',
      {
        name: 'import.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(testData))
      }
    );

    await page.getByRole('button', { name: /import/i }).click();

    // Should show imported data
    await page.goto('/');
    await expect(page.getByText(/3 adults, 1 child/i)).toBeVisible();
    await expect(page.getByText(/7 days/i)).toBeVisible();

    await page.goto('/inventory/food');
    await expect(page.getByText(/canned soup.*10/i)).toBeVisible();
  });

  test('clears all data', async ({ page }) => {
    await page.goto('/settings');

    await page.getByRole('button', { name: /clear all data/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Should return to onboarding
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  });
});
```

#### LocalStorage Persistence
```typescript
// e2e/persistence.spec.ts
test.describe('Data Persistence', () => {
  test('persists items after page reload', async ({ page }) => {
    await page.goto('/inventory/food');

    // Add item
    await page.getByTestId('add-canned-soup').click();
    await page.getByLabel(/quantity/i).fill('10');
    await page.getByRole('button', { name: /save/i }).click();

    // Reload page
    await page.reload();

    // Item should still be there
    await expect(page.getByText(/canned soup.*10/i)).toBeVisible();
  });

  test('persists settings after page reload', async ({ page }) => {
    await page.goto('/settings');

    await page.getByLabel(/language/i).selectOption('fi');

    await page.reload();

    // Should still be in Finnish
    await expect(page.getByText(/asetukset/i)).toBeVisible();
  });
});
```

### Target Coverage
- **Critical user journeys**: 100%
- **Main features**: 80%+

---

## 4. Visual Regression Testing (Optional but Recommended)

### Tools
- **Playwright Screenshots** - Built into Playwright
- **Percy** or **Chromatic** - Cloud-based visual testing

### Coverage
```typescript
// e2e/visual.spec.ts
test.describe('Visual Regression', () => {
  test('dashboard matches snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('dashboard.png');
  });

  test('inventory view matches snapshot', async ({ page }) => {
    await page.goto('/inventory/water-beverages');
    await expect(page).toHaveScreenshot('inventory-water.png');
  });

  test('mobile view matches snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page).toHaveScreenshot('dashboard-mobile.png');
  });
});
```

---

## 5. Accessibility Testing

### Tools
- **jest-axe** - Automated accessibility testing
- **Playwright accessibility checks** - Built-in
- **Manual testing** with screen readers

### Coverage
```typescript
// src/components/Dashboard.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Dashboard has no accessibility violations', async () => {
  const { container } = render(<Dashboard />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Test Organization

```
emergency-supply-tracker/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   └── Dashboard.test.tsx          # Component tests
│   ├── hooks/
│   │   ├── useInventory.ts
│   │   └── useInventory.test.ts        # Hook tests
│   ├── utils/
│   │   ├── calculations.ts
│   │   └── calculations.test.ts        # Unit tests
│   └── types/
│       └── index.ts
├── e2e/
│   ├── onboarding.spec.ts              # E2E tests
│   ├── inventory.spec.ts
│   ├── dashboard.spec.ts
│   ├── settings.spec.ts
│   └── helpers/
│       └── test-data.ts                # Test fixtures
└── playwright.config.ts
```

---

## Testing Tools Setup

### Package.json
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "jest-axe": "^8.0.0",
    "ts-jest": "^29.1.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Playwright Configuration
```typescript
// playwright.config.ts
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
    screenshot: 'only-on-failure',
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

---

## CI/CD Integration

### GitHub Actions Example
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Testing Best Practices

### 1. Test Behavior, Not Implementation
```typescript
// ❌ Bad - Testing implementation details
test('calls useState hook', () => {
  const spy = jest.spyOn(React, 'useState');
  render(<Component />);
  expect(spy).toHaveBeenCalled();
});

// ✅ Good - Testing behavior
test('updates quantity when user enters value', async () => {
  render(<ItemForm />);
  await userEvent.type(screen.getByLabelText(/quantity/i), '10');
  expect(screen.getByDisplayValue('10')).toBeInTheDocument();
});
```

### 2. Use Test Data Builders
```typescript
// e2e/helpers/test-data.ts
export function createHousehold(overrides = {}) {
  return {
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    ...overrides
  };
}

export function createItem(overrides = {}) {
  return {
    id: uuid(),
    categoryId: 'food',
    recommendedItemId: 'canned-soup',
    quantity: 5,
    unit: 'cans',
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}
```

### 3. Keep E2E Tests Fast
- Use `beforeEach` to set up localStorage directly instead of clicking through UI
- Run only critical paths in E2E
- Test edge cases in unit/integration tests

### 4. Test in Multiple Languages
```typescript
test.describe('Internationalization', () => {
  test('displays Finnish translations', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel(/language/i).selectOption('fi');
    await page.goto('/');
    await expect(page.getByText('Kojelauta')).toBeVisible();
  });
});
```

---

## Coverage Goals (Testing Diamond Approach)

| Test Type | Target Coverage | % of Test Suite | Priority |
|-----------|----------------|-----------------|----------|
| Integration Tests | 90%+ | ~70% | **Highest** |
| E2E Tests | Critical paths (100%) | ~20% | High |
| Unit Tests | 100% (critical only) | ~10% | Medium |
| Visual Regression | Key screens | N/A | Medium |
| Accessibility | 100% (no violations) | N/A | High |

---

## Summary

### Recommended Approach (Testing Diamond)
1. **Focus on integration tests first** - Test components with their logic together
2. **Write targeted unit tests** - Only for complex pure functions
3. **Add E2E tests** for critical user journeys and persistence
4. **Run all tests in CI/CD** before merging

### Why This Works Better
- **More realistic tests** - Integration tests use components as users do
- **Less brittleness** - Don't break when refactoring implementation
- **Better ROI** - Catch more bugs with fewer tests
- **Faster development** - Less time mocking, more time building

### Key Benefits
- ✅ **No external dependencies** - All tests run locally and fast
- ✅ **High confidence** - Business logic fully tested
- ✅ **Catch regressions** - E2E tests verify complete workflows
- ✅ **Great DX** - Fast feedback loop
- ✅ **Type safety** - TypeScript + tests = robust code

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
