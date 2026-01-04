# Design Doc: Internationalization (i18n) System

**Status:** Published  
**Last Updated:** 2025-01-XX  
**Authors:** Development Team

---

## Summary

The Internationalization (i18n) system provides multi-language support for the application. Currently supports English and Finnish, with infrastructure for additional languages. All user-facing text is translatable, including recommended items and custom recommendations.

---

## Background

The application is based on Finnish emergency preparedness guidelines (72tuntia.fi) but should be accessible to English speakers as well. The i18n system:

- Supports multiple languages
- Translates all UI text
- Translates recommended items
- Allows language switching
- Supports URL parameters for language selection

---

## Goals and Non-Goals

### Goals

- ✅ Support English and Finnish
- ✅ Translate all UI text
- ✅ Translate recommended items
- ✅ Language switching (persisted)
- ✅ URL parameter support (`?lang=en`)
- ✅ Translation file organization
- ✅ Fallback to English if translation missing
- ✅ Infrastructure for additional languages

### Non-Goals

- ❌ Automatic language detection (future feature)
- ❌ Right-to-left (RTL) languages (future feature)
- ❌ Language-specific date/number formats (future feature)
- ❌ Translation management UI (future feature)

---

## Design

### Translation File Structure

**Location:** `public/locales/{lang}/`

```
locales/
├── en/
│   ├── common.json      # Common UI text
│   ├── categories.json  # Category names
│   ├── products.json    # Product/item names
│   └── help.json        # Help page content
└── fi/
    ├── common.json
    ├── categories.json
    ├── products.json
    └── help.json
```

### Translation Keys

**Naming Convention:**

- Use dot notation: `category.subcategory.key`
- Group related translations
- Use descriptive keys

**Example:**

```json
{
  "dashboard": {
    "title": "Dashboard",
    "alerts": {
      "expired": "Items expired",
      "expiring": "Items expiring soon"
    }
  }
}
```

### i18n Configuration

**Location:** `src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../../public/locales/en/common.json';
import fiCommon from '../../public/locales/fi/common.json';
// ... more imports

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, categories: enCategories, ... },
      fi: { common: fiCommon, categories: fiCategories, ... },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
```

### Language Switching

**Priority Order:**

1. URL query parameter (`?lang=en`)
2. Stored settings (from LocalStorage)
3. Default language (`en`)

**Implementation:**

```typescript
// Read URL parameter on app load
const urlParams = new URLSearchParams(window.location.search);
const langFromUrl = urlParams.get('lang');

if (langFromUrl && ['en', 'fi'].includes(langFromUrl)) {
  i18n.changeLanguage(langFromUrl);
  // Remove parameter from URL
  window.history.replaceState({}, '', window.location.pathname);
}
```

### Recommended Items Translation

**Built-in Items:**

- Use `i18nKey` in item definition
- Translation in `products.json`
- Example: `i18nKey: "bottled-water"` → `t("bottled-water", { ns: "products" })`

**Custom Recommendations:**

- Use `names` object with language codes
- Example: `names: { en: "Water", fi: "Vesi" }`
- Fallback to English if language missing

### Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');

  return <h1>{t('dashboard.title')}</h1>;
}
```

**With Namespace:**

```typescript
const { t } = useTranslation('products');
return <span>{t('bottled-water')}</span>;
```

---

## Implementation Details

### Translation File Organization

**common.json:**

- UI labels, buttons, messages
- Dashboard, Settings, Inventory text
- Alert messages
- Form labels

**categories.json:**

- Category names
- Category descriptions

**products.json:**

- Recommended item names
- Product template names

**help.json:**

- Help page content
- FAQ sections

### Language Persistence

**Location:** `src/features/settings/provider.tsx`

- Language stored in `UserSettings.language`
- Persisted in LocalStorage
- Applied on app load
- Can be changed in Settings

### URL Parameter Support

**Location:** `src/App.tsx`

- Check URL parameter on mount
- Apply language if valid
- Remove parameter from URL (clean URLs)
- Supports hreflang for SEO

### Fallback Handling

- If translation key missing → Show key itself
- If language missing → Fallback to English
- If namespace missing → Fallback to common
- Log warnings in development

---

## Alternatives Considered

### Alternative 1: Single Translation File

**Approach:** All translations in one file per language.

**Rejected because:**

- Large files are hard to maintain
- Namespaces provide better organization
- Easier to find translations

### Alternative 2: No URL Parameter Support

**Approach:** Only use stored settings for language.

**Rejected because:**

- URL parameters useful for sharing/bookmarking
- Supports hreflang for SEO
- Easy to implement

### Alternative 3: Automatic Language Detection

**Approach:** Detect browser language automatically.

**Rejected because:**

- Not in scope for v1
- Can be added as enhancement
- Explicit selection is clearer

---

## Risks and Mitigations

### Risk 1: Missing Translations

**Risk:** Some translations are missing, show keys.

**Mitigation:**

- Fallback to English
- Validation script checks for missing keys
- Development warnings
- Code review process

### Risk 2: Translation Inconsistency

**Risk:** Translations inconsistent across files.

**Mitigation:**

- Consistent naming conventions
- Translation review process
- Validation scripts
- Documentation

### Risk 3: Performance with Many Languages

**Risk:** Loading many language files could be slow.

**Mitigation:**

- Only load current language
- Lazy load if needed
- Current scope (2 languages) is fine
- Can optimize if adding more languages

---

## Open Questions

1. **Should we support more languages?**
   - Current: English, Finnish
   - Future: Could add Swedish, Norwegian, etc.

2. **Should we support language-specific formatting?**
   - Current: Standard formatting
   - Future: Could add date/number formatting per locale

3. **Should we support translation management?**
   - Current: Manual file editing
   - Future: Could add UI for managing translations

---

## References

- [TRANSLATION_GUIDE.md](../TRANSLATION_GUIDE.md) - Translation guide
- `src/i18n/config.ts` - i18n configuration
- `public/locales/` - Translation files
- `scripts/validate-i18n.ts` - Validation script
