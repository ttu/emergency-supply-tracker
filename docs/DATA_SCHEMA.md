# Data Schema

> **Version:** 1.2.0
> **Last Updated:** 2026-01-15
> **Source of Truth:** `src/shared/types/index.ts`

This document describes the data structures used in the Emergency Supply Tracker application. All types are defined in TypeScript and stored in the browser's LocalStorage.

---

## Table of Contents

1. [Core Types](#core-types)
2. [Household Configuration](#household-configuration)
3. [User Settings](#user-settings)
4. [Categories](#categories)
5. [Inventory Items](#inventory-items)
6. [Product Templates](#product-templates)
7. [Recommended Item Definitions](#recommended-item-definitions)
8. [Custom Recommendations File](#custom-recommendations-file)
9. [App Data (Root)](#app-data-root)
10. [Standard Categories](#standard-categories)
11. [Calculation Formulas](#calculation-formulas)

---

## Core Types

### Branded Types

The application uses branded types (nominal typing) for type safety on string identifiers:

```typescript
// Branded types ensure type safety for string identifiers
type ItemId = string & { readonly __brand: 'ItemId' };
type CategoryId = string & { readonly __brand: 'CategoryId' };
type ProductTemplateId = string & { readonly __brand: 'ProductTemplateId' };
type AlertId = string & { readonly __brand: 'AlertId' };
type DateOnly = string & { readonly __brand: 'DateOnly' }; // YYYY-MM-DD format
```

Factory functions create these branded types:

```typescript
createItemId(id: string): ItemId
createCategoryId(id: string): CategoryId
createProductTemplateId(id: string): ProductTemplateId
createAlertId(id: string): AlertId
createDateOnly(date: string): DateOnly
```

Type guards validate branded types:

```typescript
isItemId(value: unknown): value is ItemId
isCategoryId(value: unknown): value is CategoryId
isDateOnly(value: unknown): value is DateOnly
```

### Unit

Available measurement units for inventory items:

```typescript
type Unit =
  | 'pieces'
  | 'liters'
  | 'kilograms'
  | 'grams'
  | 'cans'
  | 'bottles'
  | 'packages'
  | 'jars'
  | 'canisters'
  | 'boxes'
  | 'days'
  | 'rolls'
  | 'tubes'
  | 'meters'
  | 'pairs'
  | 'euros'
  | 'sets';
```

### ItemStatus

Status indicators for inventory items:

```typescript
type ItemStatus = 'ok' | 'warning' | 'critical';
```

| Status     | Meaning                                                              |
| ---------- | -------------------------------------------------------------------- |
| `ok`       | Sufficient quantity AND not expiring within 30 days                  |
| `warning`  | Low quantity (<50% of recommended) OR expiring soon (within 30 days) |
| `critical` | Missing (quantity = 0) OR already expired                            |

### StandardCategoryId

Identifiers for the 10 standard supply categories:

```typescript
type StandardCategoryId =
  | 'water-beverages'
  | 'food'
  | 'cooking-heat'
  | 'light-power'
  | 'communication-info'
  | 'medical-health'
  | 'hygiene-sanitation'
  | 'tools-supplies'
  | 'cash-documents'
  | 'pets';
```

### ProductKind

Classification for product types:

```typescript
type ProductKind =
  | 'food'
  | 'water'
  | 'medicine'
  | 'energy'
  | 'hygiene'
  | 'device'
  | 'other';
```

### BatteryType

Common battery sizes for power tracking:

```typescript
type BatteryType = 'AAA' | 'AA' | 'C' | 'D' | '9V' | 'CR2032';
```

---

## Household Configuration

Defines the household composition and supply requirements:

```typescript
interface HouseholdConfig {
  adults: number; // Number of adults (default: 2)
  children: number; // Number of children (default: 0)
  pets: number; // Number of pets (default: 0)
  supplyDurationDays: number; // Target supply duration (default: 7)
  useFreezer: boolean; // Use freezer for emergency supplies (default: false)
  freezerHoldTimeHours?: number; // Optional: freezer holdover time
}
```

### Default Values

| Field                | Default |
| -------------------- | ------- |
| `adults`             | 2       |
| `children`           | 0       |
| `pets`               | 0       |
| `supplyDurationDays` | 7       |
| `useFreezer`         | false   |

---

## User Settings

Application preferences and feature flags:

```typescript
interface UserSettings {
  language: 'en' | 'fi'; // UI language
  theme: Theme; // Color theme (see Theme type below)
  highContrast: boolean; // High contrast mode for accessibility
  advancedFeatures: {
    calorieTracking: boolean; // Enable calorie calculations
    powerManagement: boolean; // Enable power/battery tracking
    waterTracking: boolean; // Enable detailed water tracking
  };
  onboardingCompleted?: boolean; // Has completed initial setup
  // Customizable nutrition and requirement settings
  dailyCaloriesPerPerson?: number; // Default: 2000 kcal
  dailyWaterPerPerson?: number; // Default: 3 liters
  childrenRequirementPercentage?: number; // Default: 75 (children need 75% of adult requirements)
}
```

### Theme

Available color themes:

```typescript
type Theme =
  | 'light' // Light mode
  | 'dark' // Dark mode
  | 'auto' // System preference
  | 'midnight' // Dark blue theme
  | 'ocean' // Ocean blue theme
  | 'sunset' // Warm orange theme
  | 'forest' // Green theme
  | 'lavender' // Purple theme
  | 'minimal'; // Minimalist theme
```

### Default Values

| Field                              | Default  |
| ---------------------------------- | -------- |
| `language`                         | `'en'`   |
| `theme`                            | `'auto'` |
| `highContrast`                     | `false`  |
| `advancedFeatures.calorieTracking` | `false`  |
| `advancedFeatures.powerManagement` | `false`  |
| `advancedFeatures.waterTracking`   | `false`  |
| `onboardingCompleted`              | `false`  |
| `dailyCaloriesPerPerson`           | `2000`   |
| `dailyWaterPerPerson`              | `3`      |
| `childrenRequirementPercentage`    | `75`     |

---

## Categories

Category definition for organizing items:

```typescript
interface Category {
  id: CategoryId; // Unique identifier (branded string - StandardCategoryId for standard, UUID for custom)
  name: string; // Display name
  icon?: string; // Emoji icon
  isCustom: boolean; // User-created category flag
}
```

**Notes:**

- For standard categories, `id` is the same as the `StandardCategoryId` (e.g., `"food"`, `"water-beverages"`)
- For custom categories, `id` is a UUID generated at creation time
- The `isCustom` flag distinguishes between built-in and user-created categories

---

## Inventory Items

Individual items tracked in the user's inventory:

```typescript
interface InventoryItem {
  id: ItemId; // Unique identifier (branded string)
  name: string; // Item name (or i18n key reference)
  itemType: ProductTemplateId | 'custom'; // Template ID (e.g., "canned-fish") or "custom" for user-created items, used for i18n lookup
  categoryId: CategoryId; // Category reference (branded string)
  quantity: number; // Current quantity owned
  unit: Unit; // Measurement unit
  expirationDate?: DateOnly; // ISO date string (YYYY-MM-DD)
  purchaseDate?: DateOnly; // ISO date string (YYYY-MM-DD)
  neverExpires?: boolean; // Item doesn't expire
  location?: string; // Storage location
  notes?: string; // User notes
  weightGrams?: number; // Weight per unit in grams (e.g., one can weighs 400g) - Food category only
  caloriesPerUnit?: number; // Calories per unit (e.g., one can has 200 kcal) - Food category only
  capacityMah?: number; // Capacity in milliamp-hours (for powerbanks) - Light-power category only
  capacityWh?: number; // Capacity in watt-hours (for powerbanks) - Light-power category only
  requiresWaterLiters?: number; // Liters of water required per unit for preparation - Food category only
  markedAsEnough?: boolean; // If true, item is considered complete regardless of quantity vs recommended
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

### Notes

- **Optional Properties**: All optional properties use `undefined` when not set (TypeScript convention). In JSON, `undefined` properties are omitted entirely.
- `itemType` is required: use template ID (e.g., "canned-fish") for items from templates, or "custom" for user-created items
- **Recommended quantity is calculated dynamically at runtime** from recommended items based on household configuration and scaling rules. It is not stored in the inventory item. Use `getRecommendedQuantityForItem()` utility function to calculate it.
- Items with `neverExpires: true` don't show expiration warnings
- `expirationDate` should be omitted (not set to `null`) when not applicable - the app normalizes legacy `null` values during import
- `purchaseDate` is optional and tracks when the item was purchased
- `weightGrams` and `caloriesPerUnit` are used when calorie tracking is enabled
- `capacityMah` and `capacityWh` are used for power bank tracking when power management is enabled
- `requiresWaterLiters` tracks water needed for preparation (e.g., pasta, rice)

---

## Product Templates

Templates for creating inventory items:

```typescript
interface ProductTemplate {
  id: string; // Unique identifier
  name?: string; // Display name (for custom templates)
  i18nKey?: string; // Translation key (for built-in)
  kind?: ProductKind; // Product classification
  category: StandardCategoryId | string; // Category reference
  defaultUnit?: Unit; // Default measurement unit
  neverExpires?: boolean; // Items from template default to no expiration
  defaultExpirationMonths?: number; // Default expiration when neverExpires is false
  weightGrams?: number; // Weight per unit (e.g. food)
  caloriesPerUnit?: number; // Calories per unit (e.g. food)
  caloriesPer100g?: number; // For calorie calculation from weight
  requiresWaterLiters?: number; // Water per unit for preparation (food)
  isBuiltIn: boolean; // System-provided template
  isCustom: boolean; // User-created template
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}
```

---

## Recommended Item Definitions

Definitions for recommended emergency supplies:

```typescript
interface RecommendedItemDefinition {
  id: string; // Unique identifier
  i18nKey: string; // Translation key for name
  category: StandardCategoryId; // Category reference
  baseQuantity: number; // Base amount for 1 person, 3 days
  unit: Unit; // Measurement unit
  scaleWithPeople: boolean; // Multiply by household size
  scaleWithDays: boolean; // Multiply by duration
  scaleWithPets?: boolean; // Multiply by pet count (for pet-specific items)
  requiresFreezer?: boolean; // Only applicable if useFreezer
  defaultExpirationMonths?: number; // Default shelf life
  // Weight and calorie tracking for food items
  weightGramsPerUnit?: number; // Weight in grams per unit (e.g., 150g per can)
  caloriesPer100g?: number; // Calories per 100g of weight
  caloriesPerUnit?: number; // Calories per unit (calculated or direct value)
  // Capacity for powerbanks
  capacityMah?: number; // Capacity in milliamp-hours
  capacityWh?: number; // Capacity in watt-hours
  // Water requirement for preparation
  requiresWaterLiters?: number; // Liters of water required per unit for preparation (must be > 0 if set)
}
```

### Scaling Rules

Items can scale based on:

- **People**: `scaleWithPeople: true` - quantity increases with household size
- **Duration**: `scaleWithDays: true` - quantity increases with supply duration
- **Pets**: `scaleWithPets: true` - quantity increases with pet count (for pet-specific items)

---

## Custom Recommendations File

Users can import custom recommendations from JSON files to replace the built-in 81-item list. This enables country-specific or organization-specific recommendation sets.

### LocalizedNames

Multi-language name support for imported items:

```typescript
type LocalizedNames = Record<string, string>;
// e.g., { en: "Drinking Water", fi: "Juomavesi", sv: "Dricksvatten" }
```

### ImportedRecommendedItem

Structure for items in a custom recommendations file:

```typescript
interface ImportedRecommendedItem {
  id: string; // Unique identifier
  i18nKey?: string; // Built-in translation key (e.g., "products.bottled-water")
  names?: LocalizedNames; // OR inline localized names
  category: StandardCategoryId; // Category reference
  baseQuantity: number; // Base amount for 1 person, 3 days
  unit: Unit; // Measurement unit
  scaleWithPeople: boolean; // Multiply by household size
  scaleWithDays: boolean; // Multiply by duration
  scaleWithPets?: boolean; // Multiply by pet count (for pet-specific items)
  requiresFreezer?: boolean; // Only applicable if useFreezer
  defaultExpirationMonths?: number; // Default shelf life
  weightGramsPerUnit?: number; // Weight per unit for calorie calc
  caloriesPer100g?: number; // Calories per 100g
  caloriesPerUnit?: number; // Calories per unit (direct value)
  capacityMah?: number; // Battery capacity in mAh
  capacityWh?: number; // Battery capacity in Wh
  requiresWaterLiters?: number; // Water needed for preparation
}
```

### Notes

- Items must have either `i18nKey` (for built-in translations) OR `names.en` (for inline names)
- The `en` key in `names` is required as a fallback when using inline names
- Language fallback chain: requested language → `en` → first available → item ID

### RecommendedItemsFileMeta

Metadata for a custom recommendations file. Names and descriptions can be shared in multiple languages so uploaded kits display correctly for any user language (fallback to English when a language is missing).

```typescript
type LocalizedMetaString = string | Record<string, string>; // e.g. { en: "...", fi: "..." }

interface RecommendedItemsFileMeta {
  name: LocalizedMetaString; // e.g. "My Kit" or { en: "72 Hours Kit", fi: "72 tunnin paketti" }
  version: string; // e.g., "1.0.0"
  description?: LocalizedMetaString; // Optional; same localization as name
  source?: string; // e.g., "72tuntia.fi", URL
  createdAt: string; // ISO timestamp
  language?: 'en' | 'fi'; // Primary language of inline names
}
```

When `name` or `description` is an object, `en` must be present (used as fallback). Display: current language → `en` → first available value.

### RecommendedItemsFile

Complete structure for import/export:

```typescript
interface RecommendedItemsFile {
  meta: RecommendedItemsFileMeta;
  items: ImportedRecommendedItem[];
}
```

### Sample Files

Sample recommendation files are available in `public/samples/`:

- `recommendations-template.json` - Minimal template with 4 example items
- `recommendations-default.json` - Full 81 built-in items exported as JSON

---

## App Data (Root)

Root structure for all persisted application data:

```typescript
interface AppData {
  version: string; // Schema version
  household: HouseholdConfig; // Household settings
  settings: UserSettings; // App preferences
  customCategories: Category[]; // User's custom categories only
  items: InventoryItem[]; // All inventory items
  customTemplates: ProductTemplate[]; // User's custom templates
  dismissedAlertIds: string[]; // Alert IDs that have been dismissed by the user
  disabledRecommendedItems: string[]; // Recommended item IDs that have been disabled by the user
  customRecommendedItems?: RecommendedItemsFile | null; // Custom imported recommendations (null = explicitly use built-in, undefined = not configured)
  lastModified: string; // ISO timestamp
  lastBackupDate?: string; // ISO date of last export
  backupReminderDismissedUntil?: string; // ISO date (first of next month) - reminder hidden until this date
}
```

### Notes

- **Optional Properties**: All optional properties use `undefined` when not set (TypeScript convention). In JSON, `undefined` properties are omitted entirely. See [CODE_QUALITY.md](CODE_QUALITY.md#null-vs-undefined-standard) for the complete standard.
- **`customRecommendedItems`**:
  - `undefined` = not configured (uses built-in recommendations)
  - `null` = explicitly use built-in recommendations (user choice)
  - `RecommendedItemsFile` = use custom imported recommendations
- **Legacy Data**: The app normalizes legacy `null` values to `undefined` during import for consistency.
- **JSON Serialization**: When exporting/importing data, optional fields should be omitted (not set to `null`) for consistency with the codebase standard.
- `disabledRecommendedItems`: Cleared when custom recommendations are imported (IDs may no longer exist)

### Storage

- **Key:** `emergency-supply-tracker`
- **Format:** JSON string
- **Location:** Browser LocalStorage

---

## Standard Categories

The 10 built-in supply categories:

| ID                   | Name                 | Icon |
| -------------------- | -------------------- | ---- |
| `water-beverages`    | Water & Beverages    | 💧   |
| `food`               | Food                 | 🍽️   |
| `cooking-heat`       | Cooking & Heat       | 🔥   |
| `light-power`        | Light & Power        | 💡   |
| `communication-info` | Communication & Info | 📻   |
| `medical-health`     | Medical & Health     | 🏥   |
| `hygiene-sanitation` | Hygiene & Sanitation | 🧼   |
| `tools-supplies`     | Tools & Supplies     | 🔧   |
| `cash-documents`     | Cash & Documents     | 💰   |
| `pets`               | Pets                 | 🐾   |

Standard categories are always available and not stored in `customCategories`. Only user-created categories are persisted.

---

## Calculation Formulas

### Household Multiplier

```
Total Multiplier = (adults × 1.0 + children × 0.75) × days
```

**Example:** 2 adults + 2 children for 7 days:

```
(2.0 + 1.5) × 7 = 3.5 × 7 = 24.5×
```

**Note:** The multiplier is used for items that scale with both people and days. The base quantities in recommended items are typically for 1 person for a specific duration (often 3 days), so the final calculation depends on the item's `baseQuantity` value.

### Recommended Quantity

For each recommended item:

```typescript
let quantity = baseQuantity;

if (scaleWithPeople) {
  // Adults count as 1.0, children as 0.75 (configurable via childrenRequirementPercentage)
  const peopleMultiplier =
    adults * ADULT_REQUIREMENT_MULTIPLIER + children * childrenMultiplier;
  quantity *= peopleMultiplier;
}

if (scaleWithDays) {
  // Multiply by supply duration in days
  quantity *= supplyDurationDays;
}

if (scaleWithPets) {
  // Multiply by pet count (for pet-specific items)
  quantity *= pets * PET_REQUIREMENT_MULTIPLIER;
}

recommendedQuantity = Math.ceil(quantity);
```

**Note:** The `baseQuantity` in recommended items is typically calculated for 1 person for a specific duration (often 3 days). When `scaleWithDays` is true, the quantity is multiplied directly by `supplyDurationDays`. The exact base duration varies by item - see `RECOMMENDED_ITEMS.md` for specific base quantities.

### Calorie Tracking

When enabled, daily calorie targets:

- **Adults:** 2,200 kcal/day
- **Children:** 1,600 kcal/day

Calorie calculation per item:

```typescript
// If caloriesPerUnit is provided directly
totalCalories = quantity * caloriesPerUnit;

// Or calculated from weight
totalCalories = (weightGrams / 100) * caloriesPer100g;
```

### Category Percentage Calculation

The application uses a unified `calculateCategoryPercentage()` function to ensure consistent percentage calculations across dashboard alerts and category cards.

**Food Category (Calorie-Based):**

```typescript
// Calculate total needed calories
totalNeededCalories = (adults × 1.0 + children × 0.75) × supplyDurationDays × dailyCaloriesPerPerson

// Calculate total actual calories from inventory
totalActualCalories = sum of (item.quantity × item.caloriesPerUnit) for all food items

// Percentage
percentage = (totalActualCalories / totalNeededCalories) × 100
```

**Other Categories (Quantity-Based):**

```typescript
// For each recommended item in category:
recommendedQty = baseQuantity
if (scaleWithPeople) recommendedQty ×= peopleMultiplier
if (scaleWithDays) recommendedQty ×= supplyDurationDays

// Match inventory items by itemType (no name matching)
actualQty = sum of matching items' quantities

// Total across all recommended items
totalNeeded = sum of all recommendedQty
totalActual = sum of all actualQty

// For categories with mixed units (e.g., communication-info):
// Count item types fulfilled instead of quantities
percentage = (itemTypesFulfilled / totalItemTypes) × 100

// For categories with single unit:
percentage = (totalActual / totalNeeded) × 100
```

**Special Cases:**

- **Water & Beverages:** Includes water needed for food preparation in addition to drinking water
- **Mixed Units Categories:** Uses item type counting (e.g., "3 / 5 items" instead of quantity-based)
- **No Recommended Items:** Returns 100% if category has items, 0% if empty

**Key Features:**

- Items are matched **only by `itemType`** (no normalized name matching)
- Disabled recommended items are excluded from calculations
- Custom calculation options can override defaults (children multiplier, daily calories, daily water)

---

## Schema Versioning & Migrations

The application uses semantic versioning for the data schema to handle future changes safely.

### Version Format

Schema versions follow semantic versioning (`major.minor.patch`):

- **Major:** Breaking changes requiring data transformation
- **Minor:** New optional fields (backward compatible)
- **Patch:** Bug fixes in migration logic

### Current Version

The current schema version is defined in `src/shared/utils/storage/migrations.ts`:

```typescript
export const CURRENT_SCHEMA_VERSION = '1.0.0';
```

### Migration System

When the application loads data from localStorage or imports data:

1. **Version Check:** Data version is compared to `CURRENT_SCHEMA_VERSION`
2. **Migration Applied:** If data is older, sequential migrations transform it
3. **Auto-Save:** Migrated data is automatically saved back to localStorage
4. **Error Handling:** If migration fails, original data is preserved

### Adding a New Migration

When making schema changes that require data transformation:

1. Increment `CURRENT_SCHEMA_VERSION` in `migrations.ts`
2. Add a migration function (e.g., `migrateV100ToV110`)
3. Register it in the `MIGRATIONS` array
4. Add tests in `migrations.test.ts`

**Example migration:**

```typescript
// Migration from 1.0.0 to 1.1.0: Add new 'priority' field to items
function migrateV100ToV110(data: AppData): AppData {
  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      priority: item.priority ?? 'normal', // Add default value
    })),
  };
}

// Register in MIGRATIONS array:
const MIGRATIONS: Migration[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '1.1.0',
    migrate: migrateV100ToV110,
  },
];
```

### Migration Rules

- Migrations must be **idempotent** (safe to run multiple times)
- Migrations must handle **missing/undefined fields** gracefully
- **Never delete user data**; transform or archive it
- Each migration should be **small and focused**
- **Test migrations** with real-world data samples

### Import/Export Compatibility

- Exported data includes the schema version
- Imported data is automatically migrated to current version
- Unsupported versions (< `MIN_SUPPORTED_VERSION`) are rejected with an error
