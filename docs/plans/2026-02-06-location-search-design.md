# Location Search & Filter Feature

> **Date:** 2026-02-06
> **Status:** Approved

## Overview

Add location autocomplete suggestions to the item form and a location filter to the inventory list.

## Requirements

1. **Location Input Autocomplete**: When entering a location in ItemForm, suggest locations from all existing inventory items
2. **Location Filter**: Add a dropdown filter in FilterBar to filter items by location
3. **No Location Option**: Include option to filter for items without a location assigned

## Design

### 1. AutocompleteInput Component

New reusable shared component extending the existing `Input` component.

```typescript
// src/shared/components/AutocompleteInput.tsx
interface AutocompleteInputProps extends InputProps {
  suggestions: string[]; // List of suggestions to show
  onSelect?: (value: string) => void; // Called when suggestion selected
}
```

**Behavior:**

- Shows dropdown when input is focused and has matching suggestions
- Filters suggestions as user types (case-insensitive)
- Keyboard navigation: Arrow keys to navigate, Enter to select, Escape to close
- Click outside closes dropdown
- Selecting a suggestion fills the input and closes dropdown

### 2. Location Filter in FilterBar

Update FilterBar to include a location filter dropdown.

```typescript
// Updated FilterBarProps
interface FilterBarProps {
  // ... existing props
  locationFilter: string | 'all' | 'none';
  onLocationFilterChange: (location: string | 'all' | 'none') => void;
  locations: string[]; // Unique locations for dropdown options
}
```

**Dropdown Options:**

1. "All locations" (value: `'all'`) - shows all items (default)
2. "No location" (value: `'none'`) - shows items without location
3. Each unique location from inventory items

### 3. useLocationSuggestions Hook

```typescript
// src/features/inventory/hooks/useLocationSuggestions.ts
function useLocationSuggestions(items: InventoryItem[]): string[] {
  return useMemo(() => {
    const locations = items
      .map((item) => item.location)
      .filter((loc): loc is string => !!loc);
    return [...new Set(locations)].sort();
  }, [items]);
}
```

### 4. Filter Logic

In the Inventory page's `filteredItems` calculation:

```typescript
if (locationFilter === 'none') {
  result = result.filter((item) => !item.location);
} else if (locationFilter !== 'all') {
  result = result.filter((item) => item.location === locationFilter);
}
```

## Translations

**English (`public/locales/en/common.json`):**

```json
{
  "inventory": {
    "filter": {
      "location": "Location",
      "allLocations": "All locations",
      "noLocation": "No location"
    },
    "locationPlaceholder": "Enter location..."
  }
}
```

**Finnish (`public/locales/fi/common.json`):**

```json
{
  "inventory": {
    "filter": {
      "location": "Sijainti",
      "allLocations": "Kaikki sijainnit",
      "noLocation": "Ei sijaintia"
    },
    "locationPlaceholder": "Syötä sijainti..."
  }
}
```

## Files to Create/Modify

| File                                                     | Action |
| -------------------------------------------------------- | ------ |
| `src/shared/components/AutocompleteInput.tsx`            | Create |
| `src/shared/components/AutocompleteInput.module.css`     | Create |
| `src/shared/components/AutocompleteInput.test.tsx`       | Create |
| `src/shared/components/AutocompleteInput.stories.tsx`    | Create |
| `src/features/inventory/hooks/useLocationSuggestions.ts` | Create |
| `src/features/inventory/components/FilterBar.tsx`        | Modify |
| `src/features/inventory/components/FilterBar.test.tsx`   | Modify |
| `src/features/inventory/pages/Inventory.tsx`             | Modify |
| `src/features/inventory/components/ItemForm.tsx`         | Modify |
| `public/locales/en/common.json`                          | Modify |
| `public/locales/fi/common.json`                          | Modify |

## Testing Strategy

- **Unit tests**: AutocompleteInput component behavior, useLocationSuggestions hook
- **Integration tests**: FilterBar with location filter, ItemForm with autocomplete
- **Storybook**: AutocompleteInput stories showing various states
