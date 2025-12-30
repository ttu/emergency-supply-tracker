# Data Schema

> **Version:** 1.0.0
> **Last Updated:** 2025-12-28
> **Source of Truth:** `src/types/index.ts`

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
8. [App Data (Root)](#app-data-root)
9. [Standard Categories](#standard-categories)
10. [Calculation Formulas](#calculation-formulas)

---

## Core Types

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

Identifiers for the 9 standard supply categories:

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
  | 'cash-documents';
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
| `supplyDurationDays` | 7       |
| `useFreezer`         | false   |

---

## User Settings

Application preferences and feature flags:

```typescript
interface UserSettings {
  language: 'en' | 'fi'; // UI language
  theme: 'light' | 'dark' | 'auto'; // Color theme
  advancedFeatures: {
    calorieTracking: boolean; // Enable calorie calculations
    powerManagement: boolean; // Enable power/battery tracking
    waterTracking: boolean; // Enable detailed water tracking
  };
  onboardingCompleted?: boolean; // Has completed initial setup
}
```

### Default Values

| Field                              | Default  |
| ---------------------------------- | -------- |
| `language`                         | `'en'`   |
| `theme`                            | `'auto'` |
| `advancedFeatures.calorieTracking` | `false`  |
| `advancedFeatures.powerManagement` | `false`  |
| `advancedFeatures.waterTracking`   | `false`  |
| `onboardingCompleted`              | `false`  |

---

## Categories

Category definition for organizing items:

```typescript
interface Category {
  id: string; // Unique identifier
  standardCategoryId?: StandardCategoryId; // Reference to standard category
  name: string; // Display name
  icon?: string; // Emoji icon
  isCustom: boolean; // User-created category flag
}
```

---

## Inventory Items

Individual items tracked in the user's inventory:

```typescript
interface InventoryItem {
  id: string; // Unique identifier (UUID)
  name: string; // Item name (or i18n key reference)
  itemType?: string; // Template ID (e.g., "canned-fish") for i18n lookup
  categoryId: string; // Category reference
  quantity: number; // Current quantity owned
  unit: Unit; // Measurement unit
  recommendedQuantity: number; // Calculated recommended amount
  expirationDate?: string; // ISO date string (YYYY-MM-DD)
  neverExpires?: boolean; // Item doesn't expire
  location?: string; // Storage location
  notes?: string; // User notes
  productTemplateId?: string; // Reference to product template
  weightGrams?: number; // Total weight (user can override)
  caloriesPerUnit?: number; // Calories per unit (user can override)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

### Notes

- `recommendedQuantity` is calculated based on household configuration and scaling rules
- Items with `neverExpires: true` don't show expiration warnings
- `weightGrams` and `caloriesPerUnit` are used when calorie tracking is enabled

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
  requiresFreezer?: boolean; // Only applicable if useFreezer
  defaultExpirationMonths?: number; // Default shelf life
  weightGramsPerUnit?: number; // Weight per unit for calorie calc
  caloriesPer100g?: number; // Calories per 100g
  caloriesPerUnit?: number; // Calories per unit (direct value)
}
```

### Scaling Rules

Items can scale based on:

- **People**: `scaleWithPeople: true` - quantity increases with household size
- **Duration**: `scaleWithDays: true` - quantity increases with supply duration

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
  lastModified: string; // ISO timestamp
}
```

### Storage

- **Key:** `emergency-supply-tracker`
- **Format:** JSON string
- **Location:** Browser LocalStorage

---

## Standard Categories

The 9 built-in supply categories:

| ID                   | Name                 | Icon             |
| -------------------- | -------------------- | ---------------- |
| `water-beverages`    | Water & Beverages    | :droplet:        |
| `food`               | Food                 | :fork_and_knife: |
| `cooking-heat`       | Cooking & Heat       | :fire:           |
| `light-power`        | Light & Power        | :bulb:           |
| `communication-info` | Communication & Info | :radio:          |
| `medical-health`     | Medical & Health     | :hospital:       |
| `hygiene-sanitation` | Hygiene & Sanitation | :soap:           |
| `tools-supplies`     | Tools & Supplies     | :wrench:         |
| `cash-documents`     | Cash & Documents     | :moneybag:       |

Standard categories are always available and not stored in `customCategories`. Only user-created categories are persisted.

---

## Calculation Formulas

### Household Multiplier

```
Total Multiplier = (adults × 1.0 + children × 0.75) × (days ÷ 3)
```

**Example:** 2 adults + 2 children for 7 days:

```
(2.0 + 1.5) × (7 ÷ 3) = 3.5 × 2.33 = 8.16×
```

### Recommended Quantity

For each recommended item:

```typescript
let quantity = baseQuantity;

if (scaleWithPeople) {
  quantity *= adults + children; // Note: simplified scaling
}

if (scaleWithDays) {
  quantity *= supplyDurationDays;
}

recommendedQuantity = Math.ceil(quantity);
```

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
