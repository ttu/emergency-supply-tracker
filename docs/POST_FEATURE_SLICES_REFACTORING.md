# Post Feature Slices Refactoring Opportunities

> **Status:** Feature Slices Migration Complete ✅ | Branded Types Implemented ✅  
> **Created:** 2025-01-XX  
> **Last Updated:** 2026-01-05  
> **Purpose:** Identify refactoring opportunities after feature slices migration is complete

This document outlines potential architectural improvements to consider **after** the feature slices migration is fully completed.

---

## Current State Assessment

### ✅ Feature Slices Migration Complete

- ✅ Phase 2: Shared code migration
- ✅ Phase 3.1: Household feature
- ✅ Phase 3.2: Categories feature
- ✅ Phase 3.3: Templates feature
- ✅ Phase 3.4: Alerts feature
- ✅ Phase 3.5: Inventory feature
- ✅ Phase 3.6: Dashboard feature
- ✅ Phase 3.7: Settings feature
- ✅ Phase 3.8: Onboarding feature

**All features are now organized in `src/features/` with proper feature slice structure:**

- Components, hooks, providers, utils, and types are co-located within each feature
- Pages are using feature slices (importing from `@/features/*`)
- Shared code is properly separated in `src/shared/`

### 🔄 Optional Cleanup (Not Blocking)

- Move pages from `src/pages/` into their respective feature slices (see item #9 below)
- Remove remaining backward-compatible re-exports (minimal impact)
- Final cleanup of `src/components/` directory (only shared layout components remain)

---

## Recommended Refactoring Opportunities

### 1. Repository Pattern for Data Access ⭐ **HIGH PRIORITY**

**Current Issue:**

- LocalStorage access is scattered across providers
- Direct `getAppData()` / `saveAppData()` calls throughout codebase
- Hard to mock for testing
- No abstraction layer

**Proposed Solution:**
Create a repository layer that abstracts LocalStorage access:

```typescript
// src/shared/repositories/AppDataRepository.ts
export class AppDataRepository {
  async getAppData(): Promise<AppData | null> {
    // LocalStorage access
  }

  async saveAppData(data: AppData): Promise<void> {
    // LocalStorage save
  }

  async clearAll(): Promise<void> {
    // Clear storage
  }
}

// Usage in providers
const repository = new AppDataRepository();
const data = await repository.getAppData();
```

**Benefits:**

- Easier to test (mock repository)
- Can swap LocalStorage for IndexedDB/API later
- Single source of truth for data access
- Better error handling

**Priority:** High (improves testability and maintainability)

---

### 2. Service Layer for Business Logic ⭐ **MEDIUM PRIORITY**

**Current Issue:**

- Business logic mixed with state management in providers
- Calculations called directly from components
- Hard to test business logic in isolation

**Proposed Solution:**
Extract business logic into service classes:

```typescript
// src/features/inventory/services/InventoryService.ts
export class InventoryService {
  constructor(
    private repository: AppDataRepository,
    private householdService: HouseholdService
  ) {}

  calculateRecommendedQuantity(
    item: RecommendedItemDefinition,
    household: HouseholdConfig
  ): number {
    // Business logic here
  }

  async addItem(item: CreateItemInput): Promise<InventoryItem> {
    // Validation + business logic
    const recommendedQty = this.calculateRecommendedQuantity(...);
    const newItem = { ...item, recommendedQuantity: recommendedQty };
    await this.repository.saveItem(newItem);
    return newItem;
  }
}
```

**Benefits:**

- Separates business logic from React
- Easier to test (pure TypeScript classes)
- Can be reused outside React context
- Clearer responsibilities

**Priority:** Medium (improves separation of concerns)

---

### 3. Command/Query Separation (CQRS) ⭐ **LOW PRIORITY**

**Current Issue:**

- Read and write operations mixed together
- No clear distinction between queries and commands

**Proposed Solution:**
Separate read (queries) from write (commands):

```typescript
// Queries (read-only)
export class InventoryQueries {
  getItemsByCategory(categoryId: string): InventoryItem[] {}
  getItemById(id: string): InventoryItem | null {}
  getItemStatus(item: InventoryItem): ItemStatus {}
}

// Commands (write operations)
export class InventoryCommands {
  async addItem(item: CreateItemInput): Promise<void> {}
  async updateItem(
    id: string,
    updates: Partial<InventoryItem>,
  ): Promise<void> {}
  async deleteItem(id: string): Promise<void> {}
}
```

**Benefits:**

- Clearer intent (read vs write)
- Easier to optimize reads separately
- Better for future caching strategies

**Priority:** Low (nice to have, not critical)

---

### 4. Event-Driven Architecture for Cross-Feature Communication ⭐ **MEDIUM PRIORITY**

**Current Issue:**

- Features directly import from other features
- Tight coupling between features
- Hard to track cross-feature dependencies

**Proposed Solution:**
Use an event bus for cross-feature communication:

```typescript
// src/shared/events/EventBus.ts
export class EventBus {
  emit(event: string, payload: unknown): void {}
  on(event: string, handler: (payload: unknown) => void): void {}
}

// Usage
eventBus.emit('inventory:item-added', { item });
eventBus.on('inventory:item-added', (payload) => {
  // Dashboard updates
});
```

**Benefits:**

- Loose coupling between features
- Easier to add new features
- Better testability (mock events)
- Clear event contracts

**Priority:** Medium (reduces coupling, improves scalability)

---

### 5. Dependency Injection Container ⭐ **LOW PRIORITY**

**Current Issue:**

- Dependencies created inline in components/providers
- Hard to swap implementations
- Difficult to test with mocks

**Proposed Solution:**
Use a simple DI container:

```typescript
// src/shared/di/container.ts
export class Container {
  private services = new Map();

  register<T>(key: string, factory: () => T): void {}
  resolve<T>(key: string): T {}
}

// Usage
container.register('repository', () => new AppDataRepository());
const repo = container.resolve<AppDataRepository>('repository');
```

**Benefits:**

- Easier testing (swap implementations)
- Better for future API integration
- Clearer dependencies

**Priority:** Low (may be overkill for current app size)

---

### 6. Value Objects for Domain Concepts ⭐ **MEDIUM PRIORITY**

**Current Issue:**

- Primitive obsession (strings, numbers for domain concepts)
- No validation at type level
- Easy to create invalid states

**Proposed Solution:**
Create value objects for important domain concepts:

```typescript
// src/shared/value-objects/Quantity.ts
export class Quantity {
  private constructor(private value: number) {
    if (value < 0) throw new Error('Quantity cannot be negative');
  }

  static create(value: number): Quantity {
    return new Quantity(value);
  }

  getValue(): number {
    return this.value;
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }
}

// Usage
const qty = Quantity.create(5);
```

**Benefits:**

- Type safety (can't create invalid quantities)
- Encapsulates validation
- Self-documenting code
- Prevents bugs

**Priority:** Medium (improves type safety and prevents bugs)

---

### 7. Factory Pattern for Complex Object Creation ⭐ **MEDIUM PRIORITY**

**Current Issue:**

- InventoryItem creation logic scattered
- Easy to create invalid items
- No centralized validation

**Proposed Solution:**
Create factories for complex object creation:

```typescript
// src/features/inventory/factories/InventoryItemFactory.ts
export class InventoryItemFactory {
  static create(
    data: CreateItemInput,
    household: HouseholdConfig,
  ): InventoryItem {
    // Validate
    if (!data.name.trim()) throw new Error('Name required');
    if (data.quantity < 0) throw new Error('Quantity cannot be negative');

    // Calculate
    const recommendedQty = calculateRecommendedQuantity(data, household);

    // Create
    return {
      id: crypto.randomUUID(),
      ...data,
      recommendedQuantity: recommendedQty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
```

**Benefits:**

- Centralized creation logic
- Enforces invariants
- Easier to test
- Single place to update creation logic

**Priority:** Medium (improves data integrity)

---

### 8. Consolidate Context Providers ⭐ **LOW PRIORITY**

**Current Issue:**

- Multiple context providers nested
- Provider setup is verbose
- Hard to see all providers at once

**Proposed Solution:**
Create a single `AppProviders` component:

```typescript
// src/app/AppProviders.tsx
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeApplier>
          <HouseholdProvider>
            <RecommendedItemsProvider>
              <InventoryProvider>
                {children}
              </InventoryProvider>
            </RecommendedItemsProvider>
          </HouseholdProvider>
        </ThemeApplier>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
```

**Benefits:**

- Cleaner App.tsx
- Easier to see provider hierarchy
- Single place to manage providers

**Priority:** Low (cosmetic improvement)

---

### 9. Extract Page Components to Features ⭐ **HIGH PRIORITY**

**Current Issue:**

- Pages are in `src/pages/` but orchestrate features
- Pages could be part of their respective features
- Unclear ownership

**Proposed Solution:**
Move pages into their feature slices:

```
features/dashboard/
  ├── components/
  ├── pages/
  │   └── DashboardPage.tsx  # Moved from src/pages/Dashboard.tsx
  └── index.ts

features/inventory/
  ├── components/
  ├── pages/
  │   └── InventoryPage.tsx  # Moved from src/pages/Inventory.tsx
  └── index.ts
```

**Benefits:**

- Pages co-located with feature code
- Clearer feature boundaries
- Easier to extract features

**Priority:** High (completes feature slices migration)

---

### 10. Type Safety Improvements ⭐ **COMPLETE** ✅

**Status:** ✅ **IMPLEMENTED** (2026-01-05)

**Implementation:**

- ✅ Created branded types module (`src/shared/types/branded.ts`)
- ✅ Implemented branded types: `ItemId`, `CategoryId`, `ProductTemplateId`, `AlertId`
- ✅ Updated all type definitions to use branded types
- ✅ Updated codebase to use branded type helper functions
- ✅ Fixed all TypeScript compilation errors
- ✅ Build validation passes

**Implementation Details:**

```typescript
// Branded types
type ItemId = string & { readonly __brand: 'ItemId' };
type CategoryId = string & { readonly __brand: 'CategoryId' };
type ProductTemplateId = string & { readonly __brand: 'ProductTemplateId' };
type AlertId = string & { readonly __brand: 'AlertId' };

// Helper functions
function createItemId(id: string): ItemId {
  return id as ItemId;
}
function createCategoryId(id: string): CategoryId {
  return id as CategoryId;
}
function createProductTemplateId(id: string): ProductTemplateId {
  return id as ProductTemplateId;
}
function createAlertId(id: string): AlertId {
  return id as AlertId;
}
```

**Benefits Achieved:**

- ✅ Prevents type errors at compile time
- ✅ Self-documenting code
- ✅ Catches bugs early
- ✅ Type safety for all domain ID concepts

**Priority:** Medium (improves type safety) - **COMPLETE**

---

### 11. Performance Optimizations ⭐ **MEDIUM PRIORITY**

**Current Issue:**

- No code splitting by feature
- Large bundle size
- All features loaded upfront

**Proposed Solution:**
Implement lazy loading for features:

```typescript
// Lazy load features
const Dashboard = lazy(() => import('@/features/dashboard'));
const Inventory = lazy(() => import('@/features/inventory'));
const Settings = lazy(() => import('@/features/settings'));
```

**Benefits:**

- Smaller initial bundle
- Faster page loads
- Better user experience

**Priority:** Medium (improves performance)

---

### 12. Testing Infrastructure Improvements ⭐ **MEDIUM PRIORITY**

**Current Issue:**

- Test utilities scattered
- No consistent testing patterns
- Hard to set up test data

**Proposed Solution:**
Create comprehensive test utilities:

```typescript
// src/shared/test-utils/
export class TestDataBuilder {
  static inventoryItem(overrides?: Partial<InventoryItem>): InventoryItem {}
  static household(overrides?: Partial<HouseholdConfig>): HouseholdConfig {}
}

export function renderWithProviders(ui: ReactNode) {
  // Render with all providers
}
```

**Benefits:**

- Easier to write tests
- Consistent test data
- Less boilerplate

**Priority:** Medium (improves developer experience)

---

## Recommended Refactoring Order

### Phase 1: Feature Slices Migration ✅ **COMPLETE**

1. ✅ Household, Categories, Templates, Alerts, Inventory
2. ✅ Dashboard feature migration
3. ✅ Settings feature migration
4. ✅ Onboarding feature migration
5. ✅ Feature slices structure established
6. 🔲 Move pages into features (optional cleanup - see item #9)

### Phase 2: Data Access Layer (Next Priority)

1. Repository Pattern for LocalStorage
2. Factory Pattern for object creation
3. Value Objects for domain concepts

### Phase 3: Business Logic Separation

1. Service Layer extraction
2. Command/Query Separation (if needed)

### Phase 4: Cross-Feature Communication

1. Event-Driven Architecture
2. Dependency Injection (if needed)

### Phase 5: Polish & Optimization

1. ✅ Type Safety Improvements (Branded Types) - **COMPLETE**
2. Performance Optimizations (code splitting)
3. Testing Infrastructure
4. Consolidate Providers

---

## Decision Matrix

| Refactoring                 | Priority | Effort | Impact | When to Consider                   |
| --------------------------- | -------- | ------ | ------ | ---------------------------------- |
| Repository Pattern          | High     | Medium | High   | After feature slices               |
| Service Layer               | Medium   | High   | Medium | When business logic grows          |
| CQRS                        | Low      | High   | Low    | If read/write patterns diverge     |
| Event Bus                   | Medium   | Medium | Medium | When features need to communicate  |
| DI Container                | Low      | Medium | Low    | If swapping implementations needed |
| Value Objects               | Medium   | Medium | Medium | When validation becomes complex    |
| Factory Pattern             | Medium   | Low    | Medium | After feature slices               |
| Consolidate Providers       | Low      | Low    | Low    | Anytime                            |
| Move Pages to Features      | High     | Low    | High   | Complete feature slices            |
| Type Safety (Branded Types) | Medium   | Medium | Medium | ✅ **COMPLETE** (2026-01-05)       |
| Code Splitting              | Medium   | Low    | High   | When bundle size is an issue       |
| Test Utilities              | Medium   | Low    | Medium | Ongoing                            |

---

## Questions to Consider

Before starting any refactoring, ask:

1. **Does it solve a real problem?** (Not just "best practice")
2. **What's the maintenance cost?** (More complexity = more maintenance)
3. **Will it improve developer experience?** (Easier to work with?)
4. **Is the app large enough?** (Some patterns are overkill for small apps)
5. **What's the migration effort?** (Is it worth it?)

---

## Summary

**Feature Slices Migration Status:** ✅ **COMPLETE**

All features have been successfully migrated to the feature slices architecture. The codebase is now organized with:

- Features in `src/features/` with proper co-location
- Shared code in `src/shared/`
- Pages using feature slices (though still in `src/pages/`)

**Optional Cleanup (Low Priority):**

1. Move pages from `src/pages/` into their respective feature slices (see item #9)
2. Remove remaining backward-compatible re-exports (minimal, mostly in shared utils)

**High-Value Refactorings (Next Steps):**

1. Repository Pattern (improves testability)
2. Factory Pattern (improves data integrity)
3. Value Objects (improves type safety)

**Completed Refactorings:**

1. ✅ Type Safety Improvements - Branded Types (2026-01-05)

**Consider Later:**

1. Service Layer (when business logic grows)
2. Event Bus (when features need to communicate)
3. Code Splitting (when bundle size is an issue)

**Avoid (For Now):**

1. CQRS (overkill for current app)
2. DI Container (may be unnecessary)
3. Rich Domain Models (we decided against this earlier)

---

## References

- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Value Objects](https://martinfowler.com/bliki/ValueObject.html)
- [Factory Pattern](https://refactoring.guru/design-patterns/factory-method)
