# Example Import Data

These example JSON files demonstrate supported data formats for the Emergency Supply Tracker: **full app import** (household, settings, custom categories, items) and **recommendation kits** (uploadable kit files with optional custom categories and multi-language names).

---

## Full App Import (Backup & Transfer)

### `import-with-custom-categories.json`

A complete example with:

- Household configuration (2 adults, 1 child, 1 pet)
- User settings (English, light theme, calorie tracking enabled)
- 3 custom categories: Baby Supplies, Vehicle Emergency, Outdoor Gear
- 6 inventory items assigned to the custom categories

### `custom-categories-only.json`

A minimal example containing only custom categories (no items):

- Garden Supplies
- Winter Gear

Use this to add custom categories to your existing data without overwriting items.

### `finnish-family-example.json`

A Finnish language example with:

- Household configuration for a family of 4
- Finnish language settings
- 2 Finnish-named custom categories: Mökkitarvikkeet (Cottage Supplies), Talvivalmius (Winter Preparedness)
- 4 items with Finnish names

---

## Recommendation Kits (Settings → Recommendation Kits → Upload)

Kit files use the **RecommendedItemsFile** format. Meta and item names support **multiple languages** so kits display correctly for any user language (fallback: English).

### `recommendation-kit-72tuntia-standard.json`

Full 72tuntia.fi-style kit: standard categories only, meta with `name` and `description` as `{ "en": "...", "fi": "..." }`.

### `recommendation-kit-minimal-essentials.json`

Minimal kit (water, food, can opener) with localized meta.

### `recommendation-kit-nordic-winter.json`

Nordic winter–focused kit: built-in items plus custom items with `names: { en, fi }`. Localized meta.

### `recommendation-kit-vehicle-emergency.json`

Vehicle/roadside kit with mix of `i18nKey` (built-in) and `names` (custom). Localized meta.

### `recommendation-kit-outdoor-cottage.json`

Example with **custom categories**: defines `categories` (Garden Supplies, Winter Gear) with multi-language `names` and optional `description`, `sortOrder`, `color`. Items reference both standard categories and custom category IDs. Use this as a template for kits that add their own categories.

### Recommendation kit format (summary)

- **meta**: `name` and `description` can be a string or `{ "en": "...", "fi": "..." }` (and other language codes). `en` is required when using an object (used as fallback).
- **categories** (optional): Array of custom category definitions. Each has `id`, `names` (object with at least `en`), `icon` (emoji). Optional: `description`, `sortOrder`, `color`. IDs must not conflict with standard category IDs.
- **items**: Each item has `id`, `category` (standard or custom category ID from this file), `baseQuantity`, `unit`, `scaleWithPeople`, `scaleWithDays`, and optional fields. Use either `i18nKey` (built-in translation) or `names: { "en": "...", "fi": "..." }` for display; `en` is required when using `names`.

See **docs/DATA_SCHEMA.md** (Custom Recommendations File, RecommendedItemsFileMeta, ImportedRecommendedItem, ImportedCategory) for the full schema.

---

## How to Import (Full App Data)

1. Go to **Settings** in the app
2. Open **General** → **Backup & Transfer**
3. Click **Import Data**
4. Select one of these JSON files
5. Confirm the import

## Custom Category Structure

Each custom category requires:

- `id`: Unique identifier (lowercase, use hyphens for spaces)
- `name`: Display name (used as fallback)
- `names`: Localized names (`en` and `fi`)
- `icon`: Emoji icon
- `isCustom`: Must be `true`

Optional fields:

- `descriptions`: Localized descriptions
- `sortOrder`: Position in category list (lower = earlier)
- `color`: Hex color for accent (e.g., `#FFB6C1`)

## Creating Your Own Import File

**Full app import:** Copy `import-with-custom-categories.json` or `finnish-family-example.json` and modify:

1. Update the `customCategories` array with your categories
2. Update the `items` array with items assigned to your category IDs
3. Adjust `household` and `settings` as needed
4. Update `exportMetadata.itemCount` and `categoryCount`

**Recommendation kit:** Copy `recommendation-kit-outdoor-cottage.json` (for custom categories) or `recommendation-kit-nordic-winter.json` (standard categories only). Use localized `meta.name` and `meta.description` for multi-language display; use `names` on items for custom item names in multiple languages.
