# Functional Specification - Emergency Supply Tracker

> **Version:** 1.1.0
> **Last Updated:** 2025-12-31
> **Status:** Implementation In Progress

## Project Overview

A web-based emergency supply tracking application that helps households manage their emergency preparedness supplies based on recommendations from 72tuntia.fi (Finnish national preparedness guidelines). The application runs entirely in the browser with no backend storage.

### Target Audience

Households preparing for emergency situations (power outages, service disruptions, natural disasters, etc.)

### Core Value Proposition

- **Simple**: Track emergency supplies without complex setup
- **Guided**: Based on 72tuntia.fi (Finnish national preparedness) recommendations
- **Private**: All data stored locally in browser, no account needed
- **Flexible**: Scales to household size and customizable duration
- **Bilingual**: Full support for English and Finnish

## User Personas

### Primary: Emma (Prepared Parent)

- 35 years old, 2 children
- Wants to be prepared for emergencies
- Prefers mobile access while shopping
- Needs simple, quick updates
- Values privacy (no cloud storage)

### Secondary: Matti (Safety-Conscious Professional)

- 28 years old, lives alone
- Follows 72tuntia.fi guidelines
- Tech-savvy, uses desktop browser
- Wants detailed tracking (calories, power management)
- Exports data for records

---

## Functional Requirements

### 1. Household Configuration

Users configure their household to get personalized supply recommendations.

#### Household Size

- **Number of adults** (default: 2)
  - Each adult scales supplies by 1.0x multiplier
- **Number of children** (default: 0)
  - Each child scales supplies by 0.75x multiplier

#### Supply Duration

- **Days of supplies to maintain** (default: 7 days)
- User-selectable duration
- Affects quantity calculations for scalable items

#### Living Situation

- **Use freezer** (default: false)
  - Shows/hides frozen food recommendations
  - Frozen items only shown when enabled

#### Calculation Model

**Base Formula:**

```
Total Multiplier = (adults × 1.0 + children × 0.75) × (days ÷ 3)
```

**Example:**

- 2 adults + 2 children for 7 days
- = (2.0 + 1.5) × (7 ÷ 3)
- = 3.5 × 2.33
- = 8.16x base recommendations

**Base recommendations** are for 1 person for 3 days.

---

### 2. Supply Categories

#### 10 Standard Categories (based on 72tuntia.fi)

| ID                   | Name                 | Icon             | Description                               |
| -------------------- | -------------------- | ---------------- | ----------------------------------------- |
| `water-beverages`    | Water & Beverages    | :droplet:        | 3L per person per day                     |
| `food`               | Food                 | :fork_and_knife: | Non-perishable, canned, dry goods, frozen |
| `cooking-heat`       | Cooking & Heat       | :fire:           | Camping stove, fuel, matches, candles     |
| `light-power`        | Light & Power        | :bulb:           | Flashlights, batteries, power banks       |
| `communication-info` | Communication & Info | :radio:          | Battery/hand-crank radio                  |
| `medical-health`     | Medical & Health     | :hospital:       | First aid, medications                    |
| `hygiene-sanitation` | Hygiene & Sanitation | :soap:           | Toilet paper, soap, wipes                 |
| `tools-supplies`     | Tools & Supplies     | :wrench:         | Bucket, containers, duct tape             |
| `cash-documents`     | Cash & Documents     | :moneybag:       | Cash, document copies                     |
| `pets`               | Pets                 | :dog:            | Pet food, bowls, carriers, medications    |

#### Custom Categories

- Users can create additional categories
- Useful for pets, hobbies, special needs

---

### 3. Item Management

#### Core Item Attributes

| Attribute             | Required | Description                         |
| --------------------- | -------- | ----------------------------------- |
| `name`                | Yes      | Item name or i18n key reference     |
| `categoryId`          | Yes      | Category reference                  |
| `quantity`            | Yes      | Current quantity owned              |
| `unit`                | Yes      | Measurement unit                    |
| `recommendedQuantity` | Yes      | Calculated recommended amount       |
| `expirationDate`      | No       | ISO date (YYYY-MM-DD)               |
| `neverExpires`        | No       | Boolean flag for non-expiring items |
| `location`            | No       | Storage location                    |
| `notes`               | No       | User notes                          |
| `productTemplateId`   | No       | Reference to product template       |
| `weightGrams`         | No       | Total weight (for calorie calc)     |
| `caloriesPerUnit`     | No       | Calories per unit                   |

#### Optional Advanced Features

**Calorie Tracking** (disabled by default):

- Calories per 100g for food items
- Adults: 2,200 kcal/day target
- Children: 1,600 kcal/day target
- Dashboard shows calorie coverage

**Power Management** (disabled by default):

- Track batteries and power banks
- Dashboard shows power reserve

**Water Tracking** (disabled by default):

- Detailed water consumption tracking
- Tracks water needed for food preparation (e.g., pasta, rice)
- Calculates total water needs (drinking + preparation)
- Shows water shortfall alerts if preparation water exceeds available water

#### Item Status Indicators

| Status   | Icon               | Meaning                                                           |
| -------- | ------------------ | ----------------------------------------------------------------- |
| OK       | :white_check_mark: | Sufficient quantity AND not expiring within 30 days               |
| Warning  | :warning:          | Low quantity (<50% recommended) OR expiring soon (within 30 days) |
| Critical | :x:                | Missing (quantity = 0) OR already expired                         |

**Important**: Expired items remain in inventory until user removes them.

---

### 4. Recommended Items

81 recommended items across 10 categories. See [RECOMMENDED_ITEMS.md](RECOMMENDED_ITEMS.md) for complete list.

**Key examples:**

- Bottled water: 9L per person (3 days)
- Canned soup: 3 cans per person (scales with days)
- Flashlight: 2 per household (does not scale)
- Headlamp: 1 per person (scales with people only)
- AA batteries: 20 pieces per household
- First aid kit: 1 per household
- Toilet paper: 3 rolls per person (scales with days)

#### Custom Recommendations

Users can import custom recommendation sets from JSON files to replace the built-in 81-item list. This enables:

- **Country-specific recommendations**: Different countries have different preparedness guidelines
- **Organization recommendations**: Companies, municipalities, or groups can share standardized kits
- **Personal customization**: Create and share custom recommendation sets

**Import Behavior:**

- Importing custom recommendations **replaces** all built-in items (not merge)
- User's inventory items are preserved
- Disabled recommendations list is cleared (IDs may no longer exist)

**Export Behavior:**

- Export current recommendations (built-in or custom) as JSON
- Includes all item definitions with scaling rules and metadata

**JSON Format:**

```json
{
  "meta": {
    "name": "Finnish Family Kit",
    "version": "1.0.0",
    "description": "Optional description",
    "source": "https://example.com",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "language": "en"
  },
  "items": [
    {
      "id": "water-example",
      "names": {
        "en": "Drinking Water",
        "fi": "Juomavesi",
        "sv": "Dricksvatten"
      },
      "category": "water-beverages",
      "baseQuantity": 3,
      "unit": "liters",
      "scaleWithPeople": true,
      "scaleWithDays": true
    }
  ]
}
```

**Multi-language Support:**

- Items use `names` object with language codes as keys (e.g., `en`, `fi`, `sv`)
- English (`en`) is required as fallback
- Alternatively, items can use `i18nKey` to reference built-in translation keys

**Sample Files:**

Sample recommendation files are available in `public/samples/`:

- `recommendations-template.json` - Minimal template with 4 example items
- `recommendations-default.json` - Full 81 built-in items exported as JSON

---

### 5. User Workflows

#### First-Time Onboarding (4 Steps)

**Step 1: Welcome**

- Brief app explanation
- Language selection (English/Finnish)
- Continue button

**Step 2: Preset Selection**

- Common household presets:
  - Single person
  - Couple
  - Family with kids
  - Custom
- Quick selection to pre-fill household form

**Step 3: Household Configuration**

- Number of adults
- Number of children
- Supply duration (days)
- Use freezer toggle
- Back/Continue navigation

**Step 4: Quick Setup**

- Option to add all recommended items
- Option to skip and start empty
- Shows summary of what will be added

#### Adding Items

**Method 1: Browse from Recommendations**

1. Navigate to category
2. See recommended items with status
3. Quick Add or Full Add

**Method 2: Quick Add from Dashboard**

1. Dashboard shows critical missing items
2. Single tap adds item with defaults

**Method 3: Add from Product Template**

1. Select template
2. Auto-fill fields
3. Override defaults if needed
4. Save to inventory

**Custom Items**

1. Click "Add Custom Item"
2. Fill in all fields manually
3. Optionally save as template

#### Editing & Managing Items

- **Edit**: Click item, update fields, save
- **Delete**: Click item, delete, confirm
- **Filter**: By status, category
- **Sort**: By name, expiration, status

---

### 6. Help Page

A comprehensive help page with frequently asked questions and guidance.

**Location:** `/help` (accessible from navigation)

**Features:**

- Expandable FAQ sections:
  - Getting started
  - Household size configuration
  - Recommended items
  - Expiration dates
  - Categories
  - Status colors
  - Export/Import
  - And more...
- Fully translated (English/Finnish)
- Accessible keyboard navigation

### 7. Application Views

#### Dashboard View

**Components:**

- `DashboardHeader`: Household summary, overall preparedness %
- `AlertBanner`: Expired/expiring/missing items
- `CategoryGrid`: 10 category cards with status indicators

**Category Card shows:**

- Category name and icon
- Status indicator (worst item status)
- Progress bar (% items sufficient)
- Item counts

**Quick Actions:**

- Add item button
- Export/Import (in Settings)

#### Inventory View

**Navigation:**

- `CategoryNav`: Horizontal tabs for categories
- `FilterBar`: Status filters (All, OK, Warning, Critical)

**Item List:**

- `ItemList`: Scrollable list of items
- `ItemCard`: Individual item display
  - Name, quantity/recommended
  - Expiration date
  - Status badge
  - Edit/Delete actions

**Sorting:**

- By name (alphabetical)
- By expiration (soonest first)
- By status (critical first)

#### Add/Edit Item Form

**`ItemForm` Component:**

- Category dropdown
- Name input (or template selector)
- Quantity input
- Unit dropdown
- Expiration date picker
- Never expires toggle
- Location input
- Notes textarea
- Advanced fields (if enabled)

**Actions:**

- Save / Cancel / Delete

#### Settings View

**Household Configuration:**

- `HouseholdForm`: Adults, children, duration, freezer

**Nutrition & Requirements:**

- `NutritionSettings`: Customizable nutrition and requirement settings:
  - Daily calories per person (default: 2000 kcal)
  - Daily water per person (default: 3 liters)
  - Children requirement percentage (default: 75%)

**Advanced Features:**

- `AdvancedFeatures`: Toggle switches for:
  - Calorie tracking
  - Power management
  - Water tracking

**Language:**

- `LanguageSelector`: English / Finnish

**Theme:**

- `ThemeSelector`: Light / Dark / Auto
- High contrast mode toggle (separate from theme)

**Hidden Alerts:**

- `HiddenAlerts`: Manage dismissed alerts:
  - View all currently hidden alerts
  - Reactivate individual alerts
  - Reactivate all alerts at once

**Disabled Recommendations:**

- `DisabledRecommendations`: Manage disabled recommended items:
  - View all disabled items
  - Re-enable individual items
  - Re-enable all items at once

**Recommended Items:**

- `RecommendationsStatus`: Shows current recommendations source
  - "Built-in (81 items)" or "Custom: {name} ({count} items)"
  - Reset to default button (when using custom)
- `ImportRecommendationsButton`: Import custom recommendations from JSON
  - File upload
  - Validation with error/warning display
  - Preview before import
- `ExportRecommendationsButton`: Export current recommendations as JSON
- `DisabledRecommendations`: Toggle individual recommendations on/off

**Backup & Transfer (General):**

- `ExportButton`: Export data as JSON
- `ImportButton`: Import data from JSON
- `ShoppingListExport`: Export shopping list (TXT/Markdown/CSV)

**Advanced:**

- `DebugExport`: Export error logs
- `ClearDataButton`: Clear all data with confirmation (Danger Zone)

**About:**

- App version display
- Link to GitHub repository
- App description

---

### 7. Notifications & Alerts

#### In-App Warnings

Displayed via `AlertBanner` component on Dashboard:

- :x: Items already expired (count)
- :warning: Items expiring within 30 days (count)
- :white_circle: Missing critical items (count)
- :yellow_circle: Low quantity items (count)
- :information_source: Backup reminder (if no backup in 30+ days)

#### Alert Management

- **Dismiss alerts**: Users can dismiss individual alerts
- **Hidden alerts**: Dismissed alerts can be reactivated from Settings
- **Backup reminder**: Monthly reminder to export data (can be dismissed until next month)

#### Visual Indicators

- **Badge counts** on category tabs
- **Color coding**:
  - Red = critical
  - Yellow = warning
  - Green = OK

---

### 8. Backup Reminder System

Automatic reminder to export/backup data:

- **Trigger**: Shows if no backup in 30+ days AND data has been modified
- **Display**: Info alert on Dashboard
- **Dismissal**: Can be dismissed until first day of next month
- **Tracking**: `lastBackupDate` recorded on export, `backupReminderDismissedUntil` tracks dismissal

### 9. Disabled Recommendations

Users can disable recommended items they don't need:

- **Purpose**: Hide items that don't apply to user's situation
- **Storage**: `disabledRecommendedItems` array in AppData
- **Effect**: Disabled items don't appear in recommendations or shortage calculations
- **Management**: Settings page allows re-enabling disabled items

### 10. Backup & Transfer

Import/export lives under **Settings → General → Backup & Transfer**. Debug log and clear data are under **Settings → Advanced**.

#### Export Data (JSON)

**Format:**

```json
{
  "version": "1.0.0",
  "household": { ... },
  "settings": { ... },
  "customCategories": [ ... ],
  "items": [ ... ],
  "customTemplates": [ ... ],
  "customRecommendedItems": { ... } | null,
  "disabledRecommendedItems": [ ... ],
  "lastModified": "2025-12-28T12:00:00Z"
}
```

#### Import Data (JSON)

**Process:**

1. Upload JSON file
2. Validate structure
3. Preview data
4. Replace existing data
5. Reload application

#### Export/Import Recommendations (JSON)

Separate from full data export, users can export/import just the recommendation definitions.

**Export:**

- Downloads current recommendations (built-in or custom) as JSON
- Includes metadata and all item definitions
- Can be shared with others

**Import:**

1. Upload recommendations JSON file
2. Validate structure and items
3. Show validation errors/warnings
4. Preview item count and metadata
5. Confirm to replace current recommendations

**Validation:**

- Required fields: `meta.name`, `meta.version`, `meta.createdAt`, `items` array
- Each item requires: `id`, `category`, `baseQuantity`, `unit`, `scaleWithPeople`, `scaleWithDays`
- Each item requires either `i18nKey` or `names.en`
- Warnings for empty name values, missing optional fields

#### Export Shopping List

**Status:** ✅ Implemented

Features:

- Export items needing restock (quantity < recommended)
- Format options: Plain Text, Markdown, CSV
- Grouping by category
- Shows category icons and names
- Includes quantity needed (recommended - current)
- Generated timestamp included

---

### 11. Debug & Error Logging

**Debug Export:**

- Export error logs and debug information
- Useful for troubleshooting issues
- Includes error boundary catches, analytics events
- All data stays local (no external tracking)

**Error Logging:**

- Automatic error boundary logging
- Local storage of error events
- No external services used
- Privacy-focused

### 12. Internationalization (i18n)

#### Supported Languages

- **English** (default)
- **Finnish** (Suomi)

#### Implementation

- react-i18next library
- Translation files in `public/locales/{lang}/`
- All UI text translatable
- Recommended items have i18n keys

#### URL Language Parameter

The app supports URL query parameters for language selection (hreflang support):

- `?lang=en` - Switch to English
- `?lang=fi` - Switch to Finnish

**Language Priority:**

1. URL query parameter (`?lang=xx`)
2. Stored settings (from localStorage)
3. Default language (`en`)

The URL parameter is automatically removed after reading to keep URLs clean.

---

## Design Considerations

### Color Scheme

**Status Colors:**

- Green (#4CAF50): OK / Sufficient
- Yellow (#FFC107): Warning / Low / Expiring
- Red (#F44336): Critical / Missing / Expired

**Theme Support:**

- Light mode
- Dark mode
- Auto (system preference)

### Typography

- System fonts (native appearance)
- Minimum 16px for mobile
- WCAG 2.1 Level AA contrast

### Responsiveness

- Mobile-first design
- Touch-friendly (min 44x44px targets)
- Works on phones, tablets, desktop

---

## Browser Compatibility

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- iOS Safari (iOS 14+)
- Chrome Mobile (Android 10+)

---

## Privacy & Security

- No user accounts required
- No data sent to servers
- All data in browser LocalStorage
- User controls export/import
- No tracking or analytics
- Open source

---

## References

- [72tuntia.fi](https://72tuntia.fi/) - Finnish emergency preparedness guidelines
- Finnish civil defense recommendations
