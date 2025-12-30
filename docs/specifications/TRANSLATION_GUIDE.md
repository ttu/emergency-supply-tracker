# Translation Guide - Product Templates

## Overview

This guide explains how translations work for product templates in the Emergency Supply Tracker application.

## Two Types of Templates

### 1. Built-in Templates (from 72tuntia.fi)

**Storage**: NOT in LocalStorage
**Definition**: Code + i18n files
**Language**: Fully translatable

```typescript
// Defined in code (src/data/builtinTemplates.ts)
const BUILTIN_TEMPLATES = [
  {
    id: 'bottled-water',
    i18nKey: 'products.bottled-water',  // ← Translation reference
    kind: 'water',
    category: 'water-beverages',
    defaultUnit: 'liters',
    packaging: {
      volumeL: 1.5
    },
    shelfLifeDays: 365,
    isBuiltIn: true,
    isCustom: false
  }
];
```

**Translation files** (`locales/en/products.json`):
```json
{
  "bottled-water": {
    "name": "Bottled Water",
    "aliases": ["Water bottles", "Drinking water"],
    "description": "Clean drinking water in sealed bottles"
  }
}
```

**At Runtime**:
```typescript
// App fetches translation based on current language
const template = getBuiltInTemplate('bottled-water');
const i18n = useTranslation();

// Display name comes from i18n
const displayName = i18n.t(`products.${template.i18nKey}.name`);
// "Bottled Water" (en) or "Pullotettu Vesi" (fi)

// Aliases for search
const aliases = i18n.t(`products.${template.i18nKey}.aliases`);
// ["Water bottles", "Drinking water"] (en)
// ["Vesipullot", "Juomavesi", "Pullovesi"] (fi)
```

### 2. Custom Templates (user-created)

**Storage**: LocalStorage
**Definition**: User input
**Language**: Not translatable (direct string)

```json
{
  "productTemplates": [
    {
      "id": "uuid-abc-123",
      "name": "Fazer Blue Chocolate",  // ← Direct string, no translation
      "kind": "food",
      "category": "food",
      "subCategory": "snack",
      "defaultUnit": "packages",
      "packaging": {
        "netWeightG": 200
      },
      "barcode": {
        "ean": ["6416453043763"]
      },
      "isBuiltIn": false,
      "isCustom": true,
      "createdAt": "2024-12-20T09:00:00Z",
      "updatedAt": "2024-12-20T09:00:00Z"
    }
  ]
}
```

**At Runtime**:
```typescript
// Custom templates use name directly
const customTemplate = getUserTemplate('uuid-abc-123');
const displayName = customTemplate.name;
// Always "Fazer Blue Chocolate" regardless of language
```

## Complete Translation Files

### `locales/en/products.json`

```json
{
  "bottled-water": {
    "name": "Bottled Water",
    "aliases": ["Water bottles", "Drinking water"],
    "description": "Clean drinking water in sealed bottles"
  },
  "canned-soup": {
    "name": "Canned Soup",
    "aliases": ["Soup cans", "Tinned soup"],
    "description": "Ready-to-eat soup in cans"
  },
  "rice": {
    "name": "Rice",
    "aliases": ["White rice", "Long grain rice"],
    "description": "Dry rice that can be stored long-term"
  },
  "pasta": {
    "name": "Pasta",
    "aliases": ["Dried pasta", "Spaghetti", "Macaroni"],
    "description": "Dry pasta that stores well"
  },
  "canned-fish": {
    "name": "Canned Fish",
    "aliases": ["Tinned fish", "Tuna", "Salmon"],
    "description": "Fish preserved in cans"
  },
  "batteries-aa": {
    "name": "Batteries AA",
    "aliases": ["Double-A batteries", "AA cells"],
    "description": "Standard AA batteries for devices"
  },
  "flashlight": {
    "name": "Flashlight",
    "aliases": ["Torch", "Electric torch"],
    "description": "Battery-powered light source"
  },
  "first-aid-kit": {
    "name": "First Aid Kit",
    "aliases": ["Medical kit", "Emergency medical supplies"],
    "description": "Basic first aid supplies for emergencies"
  },
  "camping-stove": {
    "name": "Camping Stove",
    "aliases": ["Portable stove", "Camp stove"],
    "description": "Portable stove for cooking without electricity"
  },
  "toilet-paper": {
    "name": "Toilet Paper",
    "aliases": ["TP", "Bathroom tissue"],
    "description": "Rolls of toilet paper"
  }
}
```

### `locales/fi/products.json`

```json
{
  "bottled-water": {
    "name": "Pullotettu Vesi",
    "aliases": ["Vesipullot", "Juomavesi", "Pullovesi"],
    "description": "Puhdasta juomavettä suljetuissa pulloissa"
  },
  "canned-soup": {
    "name": "Säilykkeet - Keitto",
    "aliases": ["Keittotölkit", "Keittosäilykkeet"],
    "description": "Valmista syötävää keittoa tölkeissä"
  },
  "rice": {
    "name": "Riisi",
    "aliases": ["Valkoriisi", "Pitkäjyväinen riisi"],
    "description": "Kuivariisi joka säilyy pitkään"
  },
  "pasta": {
    "name": "Pasta",
    "aliases": ["Kuivattu pasta", "Spagetti", "Makaroni"],
    "description": "Kuivapasta joka säilyy hyvin"
  },
  "canned-fish": {
    "name": "Säilykkeet - Kala",
    "aliases": ["Kalasäilykkeet", "Tonnikala", "Lohi"],
    "description": "Säilytettyä kalaa tölkeissä"
  },
  "batteries-aa": {
    "name": "Paristot AA",
    "aliases": ["AA-paristot", "AA-kennot"],
    "description": "Tavalliset AA-paristot laitteisiin"
  },
  "flashlight": {
    "name": "Taskulamppu",
    "aliases": ["Lamppu", "Sähkölamppu"],
    "description": "Paristokäyttöinen valonlähde"
  },
  "first-aid-kit": {
    "name": "Ensiapupakkaus",
    "aliases": ["Ensiapulaukku", "Lääkintälaukku"],
    "description": "Perus ensiapuvälineet hätätilanteisiin"
  },
  "camping-stove": {
    "name": "Retkikeitin",
    "aliases": ["Kaasukeitin", "Campingkeitin"],
    "description": "Kannettava keitin ruoanlaittoon ilman sähköä"
  },
  "toilet-paper": {
    "name": "Vessapaperi",
    "aliases": ["WC-paperi", "Talouspaperi"],
    "description": "Vessapaperipaketti"
  }
}
```

## Implementation Example

### TypeScript Interface

```typescript
interface ProductTemplateTranslation {
  name: string;
  aliases: string[];
  description: string;
}

interface ProductsI18n {
  [productId: string]: ProductTemplateTranslation;
}
```

### Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

function ProductCard({ templateId, isBuiltIn }: Props) {
  const { t } = useTranslation('products');
  const template = getTemplate(templateId);

  // Get display name
  const name = isBuiltIn
    ? t(`${template.i18nKey}.name`)
    : template.name;

  // Get aliases for search
  const aliases = isBuiltIn
    ? t(`${template.i18nKey}.aliases`)
    : [];

  return (
    <div>
      <h3>{name}</h3>
      {aliases.length > 0 && (
        <p className="aliases">
          Also known as: {aliases.join(', ')}
        </p>
      )}
    </div>
  );
}
```

### Search Implementation

```typescript
function searchProducts(query: string, language: string): ProductTemplate[] {
  const builtIn = BUILTIN_TEMPLATES.filter(template => {
    const translation = i18n.t(`products.${template.i18nKey}`, {
      lng: language
    });

    // Search in name and aliases
    const searchText = query.toLowerCase();
    return (
      translation.name.toLowerCase().includes(searchText) ||
      translation.aliases.some(alias =>
        alias.toLowerCase().includes(searchText)
      )
    );
  });

  const custom = customTemplates.filter(template =>
    template.name.toLowerCase().includes(query.toLowerCase())
  );

  return [...builtIn, ...custom];
}
```

## Benefits

### Built-in Templates
✅ Fully translatable to all supported languages
✅ Consistent naming across the app
✅ Aliases improve search in each language
✅ Not stored in LocalStorage (saves space)
✅ Easy to update translations without data migration

### Custom Templates
✅ User controls exact name
✅ Simple to implement
✅ No translation overhead
✅ Stored persistently in LocalStorage
✅ Quick to create

## Migration Strategy

If we later want to add translation support for custom templates:

1. Add optional `i18nKey` to custom templates
2. User can "Publish to Community" to create built-in template
3. Admin reviews and adds to official `products.json`
4. User's custom template can then reference the built-in one

## Summary

- **Built-in templates**: Use `i18nKey` → Translated via `products.json`
- **Custom templates**: Use `name` → Direct string, no translation
- **Search**: Works with aliases in current language
- **Storage**: Built-in not stored, custom in LocalStorage
- **Flexibility**: Users can create custom templates instantly without translation overhead

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
