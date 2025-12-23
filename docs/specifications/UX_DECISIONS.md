# UX & Implementation Decisions

## Overview
This document captures key user experience and implementation decisions made during specification phase.

**Last Updated:** 2025-12-22

---

## 1. Initial Data & Onboarding

### Empty Start with Quick Setup Option

**Decision:** Start with completely empty inventory, but provide "Quick Setup" option.

**Onboarding Flow:**
1. Welcome screen → Language selection
2. Household configuration (adults, children, days, freezer)
3. **Quick Setup Screen:**
   ```
   ┌─────────────────────────────────────────────┐
   │  Get Started Quickly                        │
   │                                             │
   │  ○ Start empty                              │
   │     Build your inventory from scratch       │
   │                                             │
   │  ● Quick setup (recommended)                │
   │     Add all 70 recommended items at qty 0   │
   │     You can update quantities as you check  │
   │                                             │
   │              [Continue]                     │
   └─────────────────────────────────────────────┘
   ```
4. Navigate to Dashboard

**Quick Setup Details:**
- Adds all 70 recommended items with `quantity: 0`
- Sets default expiration dates based on category
- Marks all as status "critical" (missing)
- User can then update quantities as they check their supplies
- Skips frozen food items if `hasFreezer: false`

**Rationale:**
- Empty start prevents clutter for advanced users
- Quick setup helps beginners see complete checklist immediately
- Users can check off items they have rather than adding manually

---

## 2. User Education & Help

### In-App Help System

**Decision:** Add comprehensive help/tooltips throughout the app.

**Help Features:**

#### Tooltips (Hover/Tap)
- **Household multipliers:** "Adults count as 1.0x, children as 0.75x. Example: 2 adults + 1 child = 2.75x supplies"
- **Supply duration:** "Recommended minimum is 3 days. Extend to 7-14 days for rural areas or severe weather risk."
- **Expiration warnings:** "Items expiring within 30 days are marked as warning. Replace before expiration."
- **Status indicators:**
  - ✅ OK: Sufficient quantity, not expiring soon
  - ⚠️ Warning: Low stock or expiring within 30 days
  - ❌ Critical: Missing or already expired

#### Help Section (Settings → Help)
Topics:
- "What is 72tuntia.fi?" - Explain Finnish emergency preparedness
- "How quantities are calculated" - Show formula with examples
- "Managing expirations" - Best practices
- "Import/Export guide" - How to backup data
- "Keyboard shortcuts" - Accessibility features
- Link to [72tuntia.fi](https://72tuntia.fi) external site

#### Contextual Help Icons
- Question mark icon (?) next to complex features
- Opens modal with explanation + example
- "Don't show again" checkbox

**Rationale:** First-time users need guidance; experienced users can dismiss.

---

## 3. Edge Cases & Validation

### Household Size Constraints

**Decision:** Enforce minimum 1 person, add reasonable maximums.

**Validation Rules:**
```typescript
interface HouseholdValidation {
  adults: {
    min: 1,           // Must have at least 1 adult
    max: 20,          // Reasonable household limit
    default: 2
  },
  children: {
    min: 0,           // Optional
    max: 20,
    default: 0
  },
  totalPeople: {
    min: 1,           // adults + children ≥ 1
    max: 30           // Total household size
  },
  supplyDurationDays: {
    min: 1,
    max: 365,
    options: [3, 5, 7, 14, 30], // Common presets
    default: 3
  }
}
```

**Error Messages:**
- "At least 1 adult is required"
- "Maximum 20 adults allowed"
- "Total household size cannot exceed 30 people"

### Quantity Validation

**Decision:** No negative quantities allowed.

**Rules:**
- Minimum quantity: `0` (item is missing)
- Maximum quantity: `999999` (reasonable upper bound)
- Decimal values: Allowed for liters, kg (e.g., 2.5L)
- Integer only for pieces, cans, bottles

**UI Behavior:**
- Number input with step based on unit
- Validation on blur
- Error message: "Quantity must be 0 or greater"

---

## 4. Expiration Date Handling

### Never Expires Option

**Decision:** Allow users to mark items as "Never expires" explicitly.

**Implementation:**

```typescript
interface InventoryItem {
  expirationDate?: string | null;  // ISO date or null
  neverExpires?: boolean;           // Explicit flag
}
```

**UI:**
```
Expiration Date: [___________] 📅
                 ☐ Never expires

// If neverExpires checked:
// - expirationDate field disabled and cleared
// - No expiration warnings for this item
```

**Default Behavior by Category:**
- Tools, equipment, cash: `neverExpires: true` by default
- Food, water, medical: `neverExpires: false`
- User can override any default

**Display:**
- Never expires items: Show "—" or "Never" in expiration column
- Don't include in "expiring soon" alerts
- Different icon/badge (♾️ or "No expiry")

---

## 5. Import Merge Behavior

### Always Add New Items

**Decision:** When importing in "merge" mode, always create new items (no conflicts).

**Merge Logic:**
```typescript
function mergeImport(existingData: AppData, importData: AppData): AppData {
  return {
    version: importData.version,
    household: importData.household,  // Replace household config
    settings: {
      ...existingData.settings,
      ...importData.settings,          // Merge settings
    },
    categories: [
      ...existingData.categories,
      ...importData.categories.map(cat => ({
        ...cat,
        id: generateNewId(),           // Always new ID
      }))
    ],
    items: [
      ...existingData.items,
      ...importData.items.map(item => ({
        ...item,
        id: generateNewId(),           // Always new ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    ],
    productTemplates: [
      ...existingData.productTemplates,
      ...importData.productTemplates.map(template => ({
        ...template,
        id: generateNewId(),
      }))
    ],
    lastModified: new Date().toISOString(),
  };
}
```

**User Confirmation:**
```
┌─────────────────────────────────────────────┐
│  Import Data                                │
│                                             │
│  Import contains:                           │
│  • 15 items                                 │
│  • 2 custom categories                      │
│  • Household: 2 adults, 1 child             │
│                                             │
│  Import mode:                               │
│  ○ Replace all data                         │
│  ● Add to existing data                     │
│                                             │
│  Note: New items will be created even if    │
│  similar items exist. You can remove        │
│  duplicates later.                          │
│                                             │
│         [Cancel]  [Import]                  │
└─────────────────────────────────────────────┘
```

**Rationale:**
- No complex conflict resolution needed
- User maintains control (can delete duplicates manually)
- Simple, predictable behavior
- Avoids data loss

---

## 6. Shopping List Prioritization

### Critical Items First

**Decision:** Prioritize critical (missing/expired) over low-stock items.

**Sort Order:**
1. **Critical - Missing** (qty = 0, recommended > 0)
2. **Critical - Expired** (past expiration date)
3. **Warning - Expiring Soon** (within 30 days)
4. **Warning - Low Stock** (< 50% recommended)

**Within each priority, sort by:**
- Category (Water → Food → Medical → etc.)
- Then alphabetically by name

**Example Output:**
```markdown
# Emergency Supply Shopping List
Generated: 2025-12-22 | Household: 2 adults, 1 child (7 days)

## 🔴 CRITICAL - Missing Items

### Water & Beverages
- [ ] Bottled Water - Need 21.0 L (currently 0 L)
- [ ] Long-life Milk - Need 2.0 L (currently 0 L)

### Medical & First Aid
- [ ] First Aid Kit - Need 1 piece (currently 0)

## 🔴 CRITICAL - Expired Items

### Food
- [ ] Canned Soup - 3 cans (expired 2024-11-15) ⚠️ REPLACE

## 🟡 WARNING - Expiring Soon

### Food
- [ ] Rice - 1.0 kg (expires 2025-01-05)

## 🟡 WARNING - Low Stock

### Water & Beverages
- [ ] Bottled Water - Need 21.0 L (have 8.0 L - 38%)

---
Total: 6 items | Critical: 4 | Warning: 2
```

---

## 7. Accessibility (a11y)

### Full Accessibility Support

**Decision:** Implement comprehensive accessibility features for WCAG 2.1 Level AA compliance.

**Features:**

#### Screen Reader Support
- Semantic HTML (`<nav>`, `<main>`, `<article>`)
- ARIA labels for all interactive elements
- ARIA live regions for dynamic content (alerts, status updates)
- Skip navigation links
- Form labels properly associated

**Example:**
```html
<button
  aria-label="Add bottled water to inventory"
  aria-describedby="bottled-water-desc">
  Add Item
</button>
```

#### Keyboard Navigation
- All actions keyboard-accessible (Tab, Enter, Escape)
- Focus indicators (visible outline)
- Modal traps (focus stays in modal)
- Keyboard shortcuts:
  - `?` - Show help
  - `Ctrl+E` - Export data
  - `Ctrl+F` - Filter/search items
  - `Esc` - Close modal/cancel

#### Visual Accessibility
- **High Contrast Mode:** Toggle in Settings
  - Stronger borders
  - Higher contrast colors
  - No color-only indicators

- **Color Blindness Support:**
  - Icons + colors (not color alone)
  - Patterns in charts
  - Text labels on status indicators

- **Font Size Control:**
  - Browser zoom respects (responsive design)
  - Minimum 16px base font size
  - Clear hierarchy (headings, body text)

#### Focus Management
- Logical tab order
- Focus returns after modal closes
- Focus on first input when opening forms

**Testing:**
- Lighthouse accessibility score > 95
- Test with screen reader (NVDA/JAWS)
- Keyboard-only navigation test

---

## 8. Analytics & Error Logging

### Privacy-Friendly Local Analytics

**Decision:** Track usage locally with optional error reporting.

**What We Track (LocalStorage only):**

```typescript
interface LocalAnalytics {
  stats: {
    firstUsed: string;              // ISO timestamp
    lastUsed: string;               // ISO timestamp
    totalSessions: number;          // App launches
    itemsAdded: number;             // Total items ever added
    itemsDeleted: number;
    exportsCount: number;
    importsCount: number;
    shoppingListsGenerated: number;
  };

  categoryUsage: {
    [categoryId: string]: {
      itemCount: number;            // Current items in category
      lastUpdated: string;          // When category was last modified
    };
  };

  errors: Array<{
    timestamp: string;
    type: 'localstorage' | 'import' | 'export' | 'validation';
    message: string;
    stack?: string;                 // If JavaScript error
    userAgent: string;
    appVersion: string;
  }>;
}
```

**Error Reporting UI:**

When error occurs:
```
┌─────────────────────────────────────────────┐
│  ⚠️ Something went wrong                    │
│                                             │
│  We encountered an error while saving your  │
│  data. Your inventory is safe.              │
│                                             │
│  Would you like to send an error report to  │
│  help us fix this issue?                    │
│                                             │
│  ☐ Include browser info and error details  │
│     (No personal data or inventory items)   │
│                                             │
│  [View Details] [Don't Send] [Send Report] │
└─────────────────────────────────────────────┘
```

**Settings → Privacy:**
```
☐ Collect anonymous usage statistics locally
   (Helps improve the app, never sent automatically)

☐ Ask before sending error reports
   (Recommended)
```

**Export Analytics:**
- Settings → Help → "Export Debug Log"
- Downloads JSON with errors + stats
- User can attach to GitHub issue

**Privacy Promise:**
- No automatic reporting
- No cookies
- No third-party analytics (Google Analytics, etc.)
- All data stays in browser
- User explicitly opts in to share error reports

---

## 9. Offline Functionality (PWA)

### Service Worker for True Offline Support

**Decision:** Implement Service Worker for Progressive Web App functionality.

**PWA Features:**

#### Service Worker Caching
- Cache static assets (HTML, CSS, JS, images)
- Cache translation files
- Cache-first strategy for assets
- Network-first for dynamic content (but everything is local anyway)

**`sw.js` Strategy:**
```javascript
const CACHE_NAME = 'emergency-supply-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/main.js',
  '/assets/main.css',
  '/locales/en/common.json',
  '/locales/fi/common.json',
  // ... other assets
];

// Cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

#### App Manifest (`manifest.json`)
```json
{
  "name": "Emergency Supply Tracker",
  "short_name": "Supply Tracker",
  "description": "Track emergency supplies for 72-hour preparedness",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196F3",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["lifestyle", "utilities"],
  "lang": "en"
}
```

#### Install Prompt
```
┌─────────────────────────────────────────────┐
│  📱 Install App                             │
│                                             │
│  Add Emergency Supply Tracker to your home  │
│  screen for quick access.                   │
│                                             │
│  ✓ Works offline                            │
│  ✓ Fast loading                             │
│  ✓ No app store needed                      │
│                                             │
│         [Not Now]  [Install]                │
└─────────────────────────────────────────────┘
```

#### Offline Indicator
- Show badge when offline: "📶 Offline Mode"
- Disable import/export from network (local only works)
- Everything else functions normally (LocalStorage)

**Implementation Priority:**
- V1: Basic PWA (manifest, service worker)
- V1.1: Install prompt
- V2: Background sync (future)

---

## 10. Household Presets

### Quick Configuration Templates

**Decision:** Provide common household presets for faster onboarding.

**Presets Offered:**

```typescript
const HOUSEHOLD_PRESETS = [
  {
    id: 'single',
    name: 'Single Person',
    nameKey: 'presets.single',
    icon: '👤',
    config: {
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      hasFreezer: true,
    }
  },
  {
    id: 'couple',
    name: 'Couple',
    nameKey: 'presets.couple',
    icon: '👥',
    config: {
      adults: 2,
      children: 0,
      supplyDurationDays: 5,
      hasFreezer: true,
    }
  },
  {
    id: 'family-small',
    name: 'Small Family',
    nameKey: 'presets.familySmall',
    icon: '👨‍👩‍👧',
    config: {
      adults: 2,
      children: 1,
      supplyDurationDays: 7,
      hasFreezer: true,
    }
  },
  {
    id: 'family-large',
    name: 'Large Family',
    nameKey: 'presets.familyLarge',
    icon: '👨‍👩‍👧‍👦',
    config: {
      adults: 2,
      children: 3,
      supplyDurationDays: 7,
      hasFreezer: true,
    }
  },
  {
    id: 'extended',
    name: 'Extended Family',
    nameKey: 'presets.extended',
    icon: '👨‍👩‍👧‍👦👴👵',
    config: {
      adults: 4,
      children: 2,
      supplyDurationDays: 14,
      hasFreezer: true,
    }
  },
  {
    id: 'custom',
    name: 'Custom',
    nameKey: 'presets.custom',
    icon: '⚙️',
    config: null, // User enters manually
  }
];
```

**Onboarding UI:**
```
┌─────────────────────────────────────────────┐
│  Choose Your Household                      │
│                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐   │
│  │  👤  │  │  👥  │  │ 👨‍👩‍👧 │  │👨‍👩‍👧‍👦 │   │
│  │Single│  │Couple│  │Family│  │Large │   │
│  │1 pers│  │2 pers│  │3 pers│  │5 pers│   │
│  │3 days│  │5 days│  │7 days│  │7 days│   │
│  └──────┘  └──────┘  └──────┘  └──────┘   │
│                                             │
│  ┌──────┐  ┌──────┐                        │
│  │👴👵👦│  │  ⚙️  │                        │
│  │Extend│  │Custom│                        │
│  │6 pers│  │      │                        │
│  │14 day│  │      │                        │
│  └──────┘  └──────┘                        │
│                                             │
│  You can adjust these values later.        │
│                                             │
│              [Continue]                     │
└─────────────────────────────────────────────┘
```

**After Selection:**
- Show confirmation: "2 adults, 1 child, 7 days"
- Allow inline editing before continuing
- Apply preset values to household config

**Settings:**
- User can apply presets anytime in Settings
- Shows current vs preset values
- "Reset to Preset" button

---

## 11. Barcode Scanner

### Future Feature (V2)

**Decision:** Move barcode scanning to V2, but design data schema to support it.

**V1 Implementation:**
- Product templates include `barcode.ean` field
- Manual barcode entry in item form (text input)
- Search by barcode in template browser

**V2 Implementation:**
- Camera-based scanning (QuaggaJS or ZXing library)
- Scan → match EAN → load template → pre-fill item
- Works on mobile devices

**Data Schema (Already Supports):**
```typescript
interface ProductTemplate {
  barcode?: {
    ean?: string[];  // Multiple EAN codes per product
  };
}
```

**UI Placeholder (V1):**
```
Add Item Form:
  Barcode (optional): [___________]
                      📷 Scan (Coming Soon)
```

**Rationale:**
- Core functionality works without scanner
- Camera permissions + library = complexity
- Better to ship V1 sooner, add scanner in V2

---

## 12. Product Template Curation

### Community-Driven with Manual Review

**Decision:** Start with curated templates, expand via GitHub contributions.

**V1 Initial Templates:**
- **Manual curation from 72tuntia.fi:**
  - 70 core recommended items
  - Finnish brands commonly available (Fazer, Valio, etc.)
  - Generic categories (e.g., "AA Batteries" not specific brand)

**V2 Crowdsourcing (GitHub):**

#### Contribution Process:
1. User creates JSON file:
   ```json
   {
     "id": "fazer-blue",
     "i18nKey": "products.fazer-blue",
     "kind": "food",
     "category": "food",
     "subCategory": "snack",
     "barcode": {
       "ean": ["6416453043763"]
     },
     "nutrition": {
       "caloriesPer100g": 534,
       "proteinG": 7.8,
       "carbsG": 54.0,
       "fatG": 30.0
     },
     "packaging": {
       "netWeightG": 200
     },
     "sources": ["manufacturer"]
   }
   ```

2. Add translations:
   ```json
   // locales/en/products.json
   {
     "fazer-blue": {
       "name": "Fazer Blue Chocolate",
       "aliases": ["Fazer chocolate", "Blue chocolate"],
       "description": "Finnish milk chocolate bar"
     }
   }
   ```

3. Submit Pull Request to `product-templates` branch

4. Maintainer reviews:
   - Verify barcode accuracy
   - Check nutrition data source
   - Ensure appropriate category
   - Test translation keys

5. Merge → Next release includes new template

**Quality Standards:**
- Must have accurate barcode
- Nutrition data from official source
- Available in Finland
- Not promotional/advertising

**Community Guidelines:**
```markdown
# Contributing Product Templates

We welcome contributions of common Finnish products!

## Requirements
- Product must be widely available in Finland
- Include accurate EAN barcode
- Nutrition data from manufacturer or packaging
- Appropriate for emergency supplies

## Not Accepted
- Promotional content
- Brand-specific items without clear utility
- Incomplete data
- Duplicate products

See CONTRIBUTING.md for full guidelines.
```

---

## Summary of V1 Implementation Priorities

### Must Have (V1.0)
- ✅ Empty start with Quick Setup
- ✅ In-app help/tooltips
- ✅ Household validation (min 1 person, max 30)
- ✅ No negative quantities
- ✅ "Never expires" option
- ✅ Import merge (always add new)
- ✅ Shopping list prioritization (critical first)
- ✅ Full accessibility (WCAG 2.1 AA)
- ✅ Local analytics + error logging
- ✅ PWA with service worker
- ✅ Household presets

### Nice to Have (V1.1)
- Install prompt optimization
- Advanced keyboard shortcuts
- High contrast mode
- Error reporting UI polish

### Future (V2)
- Barcode camera scanning
- Community product template contributions
- Background sync
- Push notifications

---

**Document Version:** 1.0
**Last Updated:** 2025-12-22
**Status:** Approved for Implementation
