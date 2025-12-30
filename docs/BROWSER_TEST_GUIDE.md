# Emergency Supply Tracker - Browser Testing Guide

## Quick Reference for Browser Automation

### Initial Setup Flow

1. **Landing Page** (`/`) → Click "Get Started" button
2. **Household Configuration** → Select preset (Single Person/Couple/Family/Custom) or configure manually
3. **Quick Setup** → Choose to add recommended items or skip
4. **Dashboard** → Main application view

### Navigation Structure

- **Dashboard** - Overview of all categories, alerts, and quick actions
- **Inventory** - Item management by category
- **Settings** - Household configuration, preferences
- **Help** - User guide

### Inventory Page Layout

#### Category Filters (top navigation)

- All
- Water & Beverages (💧)
- Food (🍽️)
- Cooking & Heat (🔥)
- Light & Power (💡)
- Communication & Info (📻)
- Medical & Health (🏥)
- Hygiene & Sanitation (🧼)
- Tools & Supplies (🔧)
- Cash & Documents (💰)

#### Category Status Section

When a category is selected, shows:

- Category name and status badge (Critical/Warning/OK)
- Progress: `X / Y units` (e.g., "13 / 13 liters")
- Progress bar (visual indicator)
- Missing items list (expandable)

#### Item Cards

Each item shows:

- Item name
- Current quantity
- Unit type
- Expiration date (📅)
- Click to open edit modal

### Status Indicators

#### Category Status Badges

- **Critical** (Red) - 0% to ~33% stocked
- **Warning** (Yellow) - ~34% to ~99% stocked
- **OK** (Green) - 100% stocked

#### Dashboard Alerts

- Red alerts: "No items in stock" for critical categories
- Yellow alerts: "Running low" with percentage
- Blue alerts: Info messages (backups, etc.)

### Common Actions

#### Adding/Editing Items

1. Click item card in inventory
2. Modal opens with form fields:
   - Item Name
   - Category (dropdown)
   - Quantity (number input)
   - Unit (dropdown)
   - Never Expires (checkbox)
   - Expiration Date
   - Location
   - Notes
3. Click "Save" to confirm
4. Modal closes, page updates immediately

#### Checking Category Status

- **From Dashboard**: Scroll to "Categories Overview" section
- **From Inventory**: Click category filter, view status section at top

### Key Elements for Testing

#### Water & Beverages Category

- Required for Single Person (3 days): 13 liters total
  - 9 liters Bottled Water
  - 2 liters Long-life Milk
  - 2 liters Long-life Juice
- Status updates immediately when items added
- Progress shown in liters

#### Modal Interactions

- Save button: `type="submit"` - submits form
- Cancel button: `type="button"` - closes without saving
- Close (X) button: Top right of modal
- Modal backdrop: Click outside to close

### Performance Tips

1. **Direct Navigation**: Use category filter buttons instead of scrolling through all items
2. **Status Checks**: Dashboard provides overview faster than checking individual categories
3. **Form Inputs**: Use `form_input` tool for number fields (faster than typing)
4. **Wait Times**: 1 second after save/navigation is usually sufficient
5. **Read Page Strategy**:
   - Use after navigation to understand page structure
   - Not needed after every small action if structure is known

### Test Scenarios

#### Status Validation Pattern

1. Navigate to category in inventory
2. Note initial status (Critical/Warning/OK)
3. Note quantity (X / Y units)
4. Note missing items
5. Add items via edit modals
6. Verify status updates to correct level
7. Check dashboard reflects changes

#### Common Element References

- Add Item button: In inventory header
- Category navigation: Below inventory header
- Item cards: In main content area
- Status section: At top of filtered category view
- Dashboard categories: "Categories Overview" region

### URL Structure

- `/` - Landing page
- Dashboard, Inventory, Settings, Help are client-side routes (no URL change in browser)

### Data Persistence

- All data stored in browser localStorage
- Changes persist across page refreshes
- No server calls for data operations
