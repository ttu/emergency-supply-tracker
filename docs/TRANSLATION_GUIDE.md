# Translation Guide

> **Version:** 1.0.0
> **Last Updated:** 2025-12-28
> **Source of Truth:** `src/i18n/config.ts`, `public/locales/`

This document describes how internationalization (i18n) works in the Emergency Supply Tracker.

---

## Overview

The app supports two languages:
- **English** (default)
- **Finnish** (Suomi)

All UI text is translatable. User-created content (custom items, notes) is not translated.

---

## Technology Stack

| Package | Version | Purpose |
|---------|---------|---------|
| i18next | 25.7.3 | Core i18n framework |
| react-i18next | 16.5.0 | React bindings |
| i18next-http-backend | 3.0.2 | Load translation files |

---

## Configuration

**File:** `src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'categories', 'products', 'units'],
    defaultNS: 'common',
    backend: {
      loadPath: `${basePath}locales/{{lng}}/{{ns}}.json`,
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  });
```

---

## Translation Files

**Location:** `public/locales/{lang}/`

```
public/locales/
├── en/
│   ├── common.json      # UI labels, buttons, messages
│   ├── categories.json  # Category names
│   ├── products.json    # Product names and descriptions
│   └── units.json       # Measurement units
└── fi/
    ├── common.json
    ├── categories.json
    ├── products.json
    └── units.json
```

### Namespaces

| Namespace | Content | Example Keys |
|-----------|---------|--------------|
| `common` | UI elements | `dashboard.title`, `buttons.save` |
| `categories` | Category names | `water-beverages`, `food` |
| `products` | Product names | `bottled-water`, `canned-soup` |
| `units` | Units | `liters`, `pieces`, `kilograms` |

---

## Translation Key Patterns

### Common (UI)

```json
{
  "dashboard": {
    "title": "Dashboard",
    "preparedness": "Preparedness"
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "alerts": {
    "expired": "Expired items",
    "expiring": "Expiring soon"
  }
}
```

### Categories

```json
{
  "water-beverages": "Water & Beverages",
  "food": "Food",
  "cooking-heat": "Cooking & Heat",
  "light-power": "Light & Power",
  "communication-info": "Communication & Info",
  "medical-health": "Medical & Health",
  "hygiene-sanitation": "Hygiene & Sanitation",
  "tools-supplies": "Tools & Supplies",
  "cash-documents": "Cash & Documents"
}
```

### Products

```json
{
  "bottled-water": "Bottled Water",
  "canned-soup": "Canned Soup",
  "flashlight": "Flashlight"
}
```

### Units

```json
{
  "pieces": "pieces",
  "liters": "liters",
  "kilograms": "kg",
  "grams": "g",
  "cans": "cans",
  "bottles": "bottles"
}
```

---

## Usage in Components

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { t } = useTranslation();

  return (
    <h1>{t('dashboard.title')}</h1>
  );
}
```

### With Namespace

```tsx
function CategoryLabel({ categoryId }: { categoryId: string }) {
  const { t } = useTranslation('categories');

  return <span>{t(categoryId)}</span>;
}
```

### With Interpolation

```tsx
const { t } = useTranslation();

// Translation: "{{count}} items expiring"
t('alerts.expiringCount', { count: 5 });
// Output: "5 items expiring"
```

### Pluralization

```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

```tsx
t('items', { count: 1 }); // "1 item"
t('items', { count: 5 }); // "5 items"
```

---

## Language Switching

### Current Implementation

```tsx
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: 'en' | 'fi') => {
    i18n.changeLanguage(lang);
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value as 'en' | 'fi')}
    >
      <option value="en">English</option>
      <option value="fi">Suomi</option>
    </select>
  );
}
```

### Persistence

Language preference is stored in `UserSettings.language` and persisted to LocalStorage.

---

## Built-in vs Custom Items

### Built-in Items (Translated)

Recommended items use `i18nKey` for translation:

```typescript
// src/data/recommendedItems.ts
{
  id: 'bottled-water',
  i18nKey: 'products.bottled-water',  // Translation reference
  category: 'water-beverages',
  // ...
}
```

Display:
```tsx
const { t } = useTranslation('products');
const name = t(item.i18nKey); // "Bottled Water" or "Pullotettu vesi"
```

### Custom Items (Not Translated)

User-created items store the name directly:

```typescript
{
  id: 'custom-123',
  name: 'My Custom Item',  // Direct string
  // ...
}
```

Custom items display the same name regardless of language.

---

## Adding New Translations

### 1. Add to English file first

```json
// public/locales/en/common.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

### 2. Add Finnish translation

```json
// public/locales/fi/common.json
{
  "newFeature": {
    "title": "Uusi ominaisuus",
    "description": "Tämä on uusi ominaisuus"
  }
}
```

### 3. Use in component

```tsx
const { t } = useTranslation();
<h2>{t('newFeature.title')}</h2>
```

---

## Best Practices

### Do

- Keep translation keys descriptive: `dashboard.alerts.expiredItems`
- Group related keys: `buttons.save`, `buttons.cancel`
- Use interpolation for dynamic values: `{{count}} items`
- Test both languages after adding translations

### Don't

- Hardcode user-visible text in components
- Use translation keys for custom user content
- Split sentences across multiple keys
- Forget to add translations to both language files

---

## Testing Translations

```typescript
// Mock i18n for tests
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
}));
```

---

## References

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
