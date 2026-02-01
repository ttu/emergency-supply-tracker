# Example Import Data

These example JSON files demonstrate how to import data with custom categories into the Emergency Supply Tracker.

## Files

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

## How to Import

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

Copy one of these examples and modify:

1. Update the `customCategories` array with your categories
2. Update the `items` array with items assigned to your category IDs
3. Adjust `household` and `settings` as needed
4. Update `exportMetadata.itemCount` and `categoryCount`
