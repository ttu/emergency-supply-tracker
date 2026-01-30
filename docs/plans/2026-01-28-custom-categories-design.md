# Custom Categories in Kit Import + Category Editor

## Overview

Enable users to define custom categories when importing recommendation kits, and provide a Settings UI to manage both standard and custom categories.

## Problem Statement

Currently, recommendation kits can only use the 10 standard categories defined in `VALID_CATEGORIES`. Users who want to organize supplies differently (e.g., separate "Camping Gear" or "Vehicle Emergency Kit") cannot create custom categories through kit imports.

## Solution

1. Extend kit file format to include category definitions
2. Add category editor in Settings for full CRUD of custom categories
3. Allow hiding standard categories users don't need

---

## Kit File Format

### New `categories` Array

The `RecommendedItemsFile` format gains a new optional `categories` array:

```typescript
interface ImportedCategory {
  id: string; // Custom category ID (e.g., "camping-gear")
  names: LocalizedNames; // { en: "Camping Gear", fi: "Retkeilyvarusteet" }
  icon: string; // Single emoji (e.g., "⛺")
  description?: LocalizedNames; // Optional localized description
  sortOrder?: number; // Position in category lists (default: after standard)
  color?: string; // Optional hex color (e.g., "#3498db")
}

interface RecommendedItemsFile {
  meta: RecommendedItemsFileMeta;
  categories?: ImportedCategory[]; // NEW: Custom category definitions
  items: ImportedRecommendedItem[];
}
```

### Item Category Reference

Update `ImportedRecommendedItem.category` to accept custom category IDs:

```typescript
interface ImportedRecommendedItem {
  // ... existing fields ...
  category: StandardCategoryId | string; // Changed from StandardCategoryId only
}
```

### Example Kit File

```json
{
  "meta": {
    "name": "Outdoor Enthusiast Kit",
    "version": "1.0.0",
    "description": "Emergency supplies for outdoor activities",
    "createdAt": "2026-01-28T12:00:00Z"
  },
  "categories": [
    {
      "id": "camping-gear",
      "names": { "en": "Camping Gear", "fi": "Retkeilyvarusteet" },
      "icon": "⛺",
      "description": { "en": "Equipment for outdoor camping" },
      "sortOrder": 100
    },
    {
      "id": "vehicle-kit",
      "names": { "en": "Vehicle Emergency", "fi": "Ajoneuvon hätävarusteet" },
      "icon": "🚗",
      "color": "#e74c3c"
    }
  ],
  "items": [
    {
      "id": "camping-stove",
      "names": { "en": "Camping Stove", "fi": "Retkikeitin" },
      "category": "camping-gear",
      "baseQuantity": 1,
      "unit": "pieces",
      "scaleWithPeople": false,
      "scaleWithDays": false
    }
  ]
}
```

---

## Category Type Updates

### Extended Category Interface

```typescript
interface Category {
  id: CategoryId;
  name: string; // Display name (current language or fallback)
  names?: LocalizedNames; // Localized names for custom categories
  icon?: string;
  isCustom: boolean;
  description?: string; // Current language description
  descriptions?: LocalizedNames; // Localized descriptions
  sortOrder?: number; // Custom categories: explicit order
  color?: string; // Optional hex color
  sourceKitId?: KitId; // Which kit imported this category
}
```

### Storage

- Custom categories stored in existing `AppData.customCategories` array
- `sourceKitId` tracks origin for display purposes ("from Finnish Family Kit")
- Standard categories remain in `STANDARD_CATEGORIES` constant

### Category Resolution Order

1. Standard categories (from `STANDARD_CATEGORIES`, always available)
2. Custom categories (from `customCategories` array)
3. Filter out categories in `disabledCategories` (standard categories only)

---

## Settings UI: Category Editor

### Location

New "Categories" section in Settings page, placed after "Recommended Items & Kits" section.

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Categories                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Standard Categories                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 💧 Water & Beverages              [Visible ✓]  │ │
│ │ 🍽️ Food                           [Visible ✓]  │ │
│ │ 🐕 Pets                           [Hidden  ○]  │ │
│ │ ...                                            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Custom Categories                    [+ Add New]    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🚰 Custom Water                   [Edit][Delete]│ │
│ │    from: Finnish Family Kit                     │ │
│ │ ⛺ Camping Gear                   [Edit][Delete]│ │
│ │    manually created                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Standard Categories Section

- Toggle visibility for each standard category
- Uses existing `disabledCategories` array in AppData
- No edit/delete for standard categories

### Custom Categories Section

- List all custom categories with edit/delete buttons
- Shows source (kit name or "manually created")
- "+ Add New" button opens create form

---

## Category Form (Create/Edit)

### Fields

| Field            | Type         | Required          | Notes                                                   |
| ---------------- | ------------ | ----------------- | ------------------------------------------------------- |
| ID               | text         | Yes (create only) | Kebab-case, auto-generated from name, read-only on edit |
| Name (EN)        | text         | Yes               | English display name                                    |
| Name (FI)        | text         | No                | Finnish display name (falls back to EN)                 |
| Icon             | emoji picker | Yes               | Single emoji, default picker or text input              |
| Description (EN) | textarea     | No                | Optional description                                    |
| Description (FI) | textarea     | No                | Optional Finnish description                            |
| Color            | color picker | No                | Hex color for category accent                           |
| Sort Order       | number       | No                | Position in lists (default: end)                        |

### Validation Rules

- **ID**: Unique across all categories (standard + custom), kebab-case format, 3-50 characters
- **Name**: Required, 1-50 characters
- **Icon**: Single emoji character
- **Color**: Valid hex format (#RGB or #RRGGBB) if provided
- **Sort Order**: Positive integer if provided

### Form Layout

```
┌──────────────────────────────────────┐
│ Create Custom Category               │
├──────────────────────────────────────┤
│ Icon     [🚰]  Color [  #3498db  ]   │
│                                      │
│ Name (English) *                     │
│ [Custom Water Category          ]    │
│                                      │
│ Name (Finnish)                       │
│ [Mukautettu vesikategoria       ]    │
│                                      │
│ ID: custom-water-category (auto)     │
│                                      │
│ Description (optional)               │
│ [                               ]    │
│                                      │
│           [Cancel]  [Save]           │
└──────────────────────────────────────┘
```

---

## Kit Import Flow

### Process Steps

1. **Parse & validate kit file** - Check JSON structure, required fields
2. **Validate category references** - Every item's `category` must be in `VALID_CATEGORIES` OR in kit's `categories` array
3. **Check for conflicts** - Does any imported category ID already exist in `customCategories`?
4. **Handle conflicts** (if any) - Prompt user with options
5. **Merge categories** - Add new categories to `customCategories`
6. **Import items** - Existing item import logic

### Conflict Resolution

When an imported category ID already exists:

```
┌──────────────────────────────────────────────────┐
│ Category Conflict                                │
├──────────────────────────────────────────────────┤
│ Category "camping-gear" already exists.          │
│                                                  │
│ Existing: ⛺ Camping Gear                        │
│ Imported: 🏕️ Camping Equipment                  │
│                                                  │
│ What would you like to do?                       │
│                                                  │
│ [Keep Existing] [Replace with Imported] [Cancel] │
└──────────────────────────────────────────────────┘
```

### Error Messages

**Missing category definition:**

```
Import failed: Item 'camping-stove' references category
'camping-gear' which is not defined. Add it to the
'categories' array in your kit file.
```

**Invalid icon:**

```
Import failed: Category 'camping-gear' has invalid icon.
Icon must be a single emoji character.
```

**Duplicate ID in kit:**

```
Import failed: Category ID 'camping-gear' is defined
multiple times in the kit file.
```

---

## Deletion Rules

### Custom Categories

- **Block deletion if category has items**
- Show error with list of items using the category
- User must move or delete items first

```
┌──────────────────────────────────────────────────┐
│ Cannot Delete Category                           │
├──────────────────────────────────────────────────┤
│ Category "Camping Gear" cannot be deleted        │
│ because it contains 3 items:                     │
│                                                  │
│ • Camping Stove                                  │
│ • Sleeping Bag                                   │
│ • Portable Water Filter                          │
│                                                  │
│ Move or delete these items first.                │
│                                                  │
│                              [OK]                │
└──────────────────────────────────────────────────┘
```

### Standard Categories

- Cannot be deleted
- Can only be hidden via visibility toggle
- Hiding a category with items shows warning but allows it

---

## Integration Points

### Affected Locations

| Location                    | Change Needed                              |
| --------------------------- | ------------------------------------------ |
| Dashboard                   | Category cards include custom categories   |
| Inventory sidebar           | Custom categories in category list         |
| Item form category dropdown | Custom categories as options               |
| Shopping list export        | Group by category includes custom          |
| Data export                 | `customCategories` already exported        |
| Alerts                      | Items in custom categories generate alerts |

### New Helper Functions

```typescript
// Get all active categories (standard + custom, minus disabled)
function getAllCategories(appData: AppData): Category[];

// Get category by ID from any source
function getCategoryById(
  id: CategoryId,
  appData: AppData,
): Category | undefined;

// Check if category can be deleted
function canDeleteCategory(
  id: CategoryId,
  items: InventoryItem[],
): {
  canDelete: boolean;
  blockingItems?: InventoryItem[];
};

// Get localized category name
function getCategoryDisplayName(
  category: Category,
  language: 'en' | 'fi',
): string;
```

### i18n Approach

- Standard categories: Use translation keys (`categories.water-beverages`)
- Custom categories: Use `names` object directly, fallback to English if current language missing

---

## Out of Scope

- Editing standard category names/icons (only hide/show)
- Category-specific recommended quantities for custom categories
- Category icons from image files (emoji only)
- Category grouping/nesting (flat list only)

---

## File Changes Summary

### Types

- `src/shared/types/index.ts` - Update `Category`, add `ImportedCategory`

### Data/Validation

- `src/shared/utils/validation/recommendedItemsValidation.ts` - Validate categories array
- `src/features/categories/data.ts` - Add helper functions

### Components (New)

- `src/features/settings/components/CategoriesSection/` - Settings section
- `src/features/settings/components/CategoryForm/` - Create/edit form
- `src/features/settings/components/CategoryList/` - List with actions

### Components (Update)

- `src/features/settings/components/SettingsPage/` - Add Categories section
- `src/features/inventory/components/ItemForm/` - Include custom categories in dropdown
- `src/features/dashboard/` - Include custom categories in cards

### Translations

- `public/locales/en/common.json` - Category editor strings
- `public/locales/fi/common.json` - Finnish translations

---

## Document Info

- **Created**: 2026-01-28
- **Status**: Ready for implementation
- **Author**: Brainstorming session
