# Functional Specification - Emergency Supply Tracker

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

## Functional Requirements

### 1. Household Configuration

Users configure their household to get personalized supply recommendations.

#### Household Size
- **Number of adults** (default: 2)
  - Each adult scales supplies by 1.0x multiplier
- **Number of children** (default: 0)
  - Each child scales supplies by 0.75x multiplier
- **Pets** (future feature)
  - Pet-specific recommendations

#### Supply Duration
- **Days of supplies to maintain** (default: 3 days)
- User-selectable: 3, 5, 7, 14, or 30 days
- Affects quantity calculations for scalable items

#### Living Situation
- **Has freezer** (default: true)
  - Shows/hides frozen food recommendations
  - Note: Frozen items remain safe ~48h after power outage (if door kept closed)
- **Freezer hold time** (default: 48 hours)
  - Customizable based on freezer quality
  - Affects frozen food expiration after power loss

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

### 2. Supply Categories

#### 9 Standard Categories (based on 72tuntia.fi)

1. **Water & Beverages**
   - Recommendation: 3 liters per person per day
   - Base: 9L per person for 3 days

2. **Food**
   - Non-perishable items (canned, dry goods)
   - Items that can be eaten without cooking
   - Frozen food (if freezer available)

3. **Cooking & Heat**
   - Camping stove, fuel, matches, lighters, candles

4. **Light & Power**
   - Flashlights, headlamps, batteries, power banks

5. **Communication**
   - Battery-powered radio, hand-crank radio

6. **Medical & First Aid**
   - First aid kit, medications, medical supplies

7. **Hygiene & Sanitation**
   - Toilet paper, soap, wipes, trash bags

8. **Tools & Supplies**
   - Bucket, water containers, duct tape, multi-tool

9. **Cash & Documents**
   - Cash (€200-500), document copies, contact lists

#### Custom Categories
- Users can create additional categories
- Useful for pets, hobbies, special needs

### 3. Item Management

#### Core Item Attributes
- **Name** (required)
- **Category** (required)
- **Quantity** (required, number)
- **Unit** (required: liters, kg, pieces, cans, bottles, etc.)
- **Expiration Date** (optional, ISO date)
- **Purchase Date** (optional, ISO date)
- **Notes** (optional, text field)
- **Location** (optional, string - where stored in home)

#### Optional Advanced Attributes

**Calorie Tracking** (optional feature, disabled by default):
- Calories per 100g for food items
- Adults: 2200 kcal/day target
- Children: 1600 kcal/day target
- Dashboard shows calorie coverage

**Power Management** (optional feature, disabled by default):
- Power bank capacity (Wh)
- Battery capacity (mAh, voltage)
- Formula: Capacity (mAh) × Voltage (V) × 0.85 = Wh
- Dashboard shows "days of power" metric

**Water Tracking** (optional feature, disabled by default):
- Default: 3L per person per day (total)
- Advanced: Separate drinking (3L) vs hygiene (1L) water
- Customizable daily amounts

#### Multiple Item Instances

Users can track the same product with different expiration dates:

**Example:**
- Bottled Water #1: 6L, expires 2025-06-15
- Bottled Water #2: 6L, expires 2025-12-20
- **Total displayed**: 12L bottled water
- **Status**: Individual expiration tracking

**When adding duplicate items:**
- Option 1: Create new instance (different expiration)
- Option 2: Add to existing instance (same expiration)

#### Item Status Indicators

- ✅ **OK**: Sufficient quantity AND not expiring within 30 days
- ⚠️ **Warning**: Low quantity OR expiring soon (within 30 days)
- ❌ **Critical**: Missing (quantity = 0) OR already expired

**Low quantity** = less than 50% of recommended quantity

**Important**: Expired items remain in inventory (not auto-deleted) until user removes them.

### 4. Recommended Items List

See [RECOMMENDED_ITEMS.md](RECOMMENDED_ITEMS.md) for complete list of 70 recommended items across 9 categories.

**Key examples:**
- Bottled water: 9L per person (3 days)
- Canned soup: 3 cans per person (scales with days)
- Flashlight: 2 per household (does not scale)
- Headlamp: 1 per person (scales with people only)
- AA batteries: 20 pieces per household
- First aid kit: 1 per household
- Toilet paper: 1 roll per person per 3 days

### 5. User Workflows

#### First-Time Onboarding

1. **Welcome Screen**
   - Brief app explanation
   - Language selection (English/Finnish)

2. **Household Setup**
   - Number of adults (default: 2)
   - Number of children (default: 0)
   - Supply duration (default: 3 days)
   - Has freezer? (default: yes)
   - Explanation of how recommendations scale

3. **Overview**
   - Show calculated recommendations
   - Brief 72-hour preparedness overview
   - Link to 72tuntia.fi

4. **Start Using App**
   - Navigate to Dashboard

#### Adding Items

**Method 1: Browse and Add from Recommendations**
1. Navigate to category
2. See ALL recommended items (even if not added):
   - Item name
   - Recommended quantity
   - Current quantity (0 if not in inventory)
   - Status indicator
3. Choose adding method:
   - **Quick Add**: One tap, adds with defaults (qty=0, default expiration)
   - **Full Add**: Opens form to enter quantity, expiration, notes

**Method 2: Quick Add from Dashboard**
1. Dashboard shows critical missing items
2. Single tap adds item with defaults
3. Edit details later

**Method 3: Add from Product Template**
1. Click "Add from Template"
2. Search or browse templates (built-in + custom)
3. Select template to auto-fill:
   - Name, category, unit
   - Expiration period
   - Nutrition info (if food)
   - Packaging details
4. Override any defaults
5. Save to inventory

**Method 4: Scan Barcode** (Future Enhancement)
1. Click "Scan Barcode"
2. Scan product EAN code with camera
3. App matches to template
4. Pre-fills item details
5. Confirm and adjust

**Custom Items**
1. Click "Add Custom Item"
2. Fill in all fields manually
3. Optionally set custom recommended quantity
4. **Save as Template**: Save for reuse

#### Editing & Managing Items

- **Edit**: Click item → Update fields → Save
- **Delete**: Click item → Delete → Confirm
- **Bulk actions**: Select multiple → Delete or export
- **History**: View when item was added/updated

### 6. Application Views

#### Dashboard View

**Header:**
- Household configuration summary
- Overall preparedness percentage (% of recommended items sufficient)

**Alert Section:**
- 🔴 Expired items (count + list)
- 🟡 Expiring soon (within 30 days)
- ⚪ Missing critical items (recommended but qty = 0)

**Category Overview:**
- 9 category cards
- Status per category (✅ ⚠️ ❌)
- Progress bar: % of items in category at sufficient levels
- Category status = worst item status in category

**Advanced Metrics** (if enabled):
- Calorie coverage: progress bar showing days of calories
- Power reserve: "X days of power" estimate
- Water breakdown: drinking vs hygiene (if advanced water tracking on)

**Quick Actions:**
- Quick Add button
- Export/Import buttons
- Shopping list generator

#### Inventory View

**Category Navigation:**
- Tabs or sidebar for 9 categories + custom

**Item List (per category):**
- Item name
- Current quantity / Recommended quantity
- Expiration date (if applicable)
- Status indicator (✅ ⚠️ ❌)
- Edit/Delete buttons

**Filters:**
- Show all
- Only missing (qty = 0)
- Only expiring (within 30 days)
- Only OK

**Sort:**
- By name (alphabetical)
- By expiration date (soonest first)
- By status (critical → warning → OK)

**Add Item Button** (per category)

#### Add/Edit Item Form

**Fields:**
- Category (dropdown)
- Name (text or select from recommendations)
- Quantity (number)
- Unit (dropdown)
- Expiration date (date picker, optional)
  - Shows default suggestion based on category
- Purchase date (date picker, optional)
- Location (text, optional)
- Notes (textarea, optional)
- Advanced fields (if features enabled):
  - Calories
  - Power capacity
  - Water type

**Actions:**
- Save
- Cancel
- Delete (if editing)

#### Settings View

**Household Configuration:**
- Adults (number input)
- Children (number input)
- Supply duration (dropdown: 3, 5, 7, 14, 30 days)
- Has freezer (checkbox)
- Freezer hold time (number, hours)

**Advanced Features** (toggles, all off by default):
- ☐ Enable calorie tracking
- ☐ Enable power/energy management
- ☐ Enable advanced water tracking

**Language:**
- English / Suomi (Finnish)

**Product Templates:**
- Browse custom templates
- Edit/delete templates
- Create new template

**Data Management:**
- Export data (JSON)
- Export shopping list (TXT/Markdown/CSV)
- Import data (JSON upload)
- Clear all data (with confirmation)

**About:**
- App version
- Link to [72tuntia.fi](https://72tuntia.fi/)
- Credits
- Privacy policy (no data collected)

### 7. Notifications & Alerts

#### In-App Warnings (checked on app start)

- ⚠️ Items expiring within 30 days
- ❌ Items already expired
- ⚪ Missing critical items (recommended but qty = 0)
- 🟡 Low quantity (< 50% of recommended)

#### Notification Display

- **Alert banner** at top of Dashboard
- **Badge counts** on category tabs
- **Color coding**:
  - Red = critical (missing or expired)
  - Yellow = warning (low or expiring soon)
  - Green = OK

### 8. Data Management

#### Export Data (JSON)

**Format:**
- Same as LocalStorage structure
- Includes metadata:
  - App name: "emergency-supply-tracker"
  - Version: "1.0.0"
  - Export timestamp
  - Household config
  - All categories
  - All items

**Use cases:**
- Backup data
- Transfer to another device
- Share with family member

#### Import Data (JSON)

**Process:**
1. Upload JSON file
2. **Validate with Ajv JSON Schema**:
   - Check required fields
   - Validate version compatibility
   - Validate dates (ISO 8601)
   - Validate enums (units, categories, statuses)
   - Show clear error messages if invalid
3. Choose merge strategy:
   - Replace all data (clear + import)
   - Merge with existing (warn about conflicts)
4. Show preview before confirming
5. Atomic operation (rollback on error)

#### Export Shopping List

**Export Options:**
- Missing items (qty = 0, recommended > 0)
- Low quantity items (< 50% recommended)
- Expiring items (within 30 days)
- All of the above ✅ (recommended)

**Format Options:**
- Plain text checklist
- Markdown checklist (GitHub/Notion)
- CSV (Excel/Google Sheets)

**Grouping:**
- By category (default)
- Alphabetical

**Example (Markdown):**
```markdown
# Emergency Supply Shopping List
Generated: 2025-12-22
Household: 2 adults, 1 child (7 days)

## Water & Beverages
- [ ] Bottled Water - Need 12.0 L (have 6.0 L)
- [ ] Long-life Milk - Need 2.0 L (missing)

## Food
- [ ] Canned Soup - Need 8 cans (missing)

---
Total items: 3
Categories: 2
```

**Example (CSV):**
```csv
Category,Item,Need,Have,Unit,Status,Expires
Water & Beverages,Bottled Water,12.0,6.0,liters,Low,
Water & Beverages,Long-life Milk,2.0,0.0,liters,Missing,
Food,Canned Soup,8,0,cans,Missing,
```

### 9. Internationalization (i18n)

#### Supported Languages

- **English** (default)
- **Finnish** (Suomi)
- Extensible for more languages

#### Translatable Content

- All UI labels and buttons
- Category names
- Recommended item names and aliases
- Product template names (built-in only)
- Help text and instructions
- Alert messages
- Unit names
- Error messages

#### Language Switching

- User selects language in Settings
- App immediately updates all text
- User data (custom items, notes) NOT translated
- Recommended items and built-in templates fully translated

See [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md) for technical details.

## Design Considerations

### Color Scheme

**Status Colors:**
- 🟢 Green (#4CAF50): OK / Sufficient
- 🟡 Yellow (#FFC107): Warning / Low / Expiring
- 🔴 Red (#F44336): Critical / Missing / Expired

**Primary Color:** Blue (trustworthy, calm)

**Design Style:** Clean, minimalist, modern

### Typography

- Clear, readable fonts (system fonts preferred)
- Minimum 16px font size for mobile
- Good contrast ratios (WCAG 2.1 Level AA)
- Adequate line spacing

### Icons

- Material Design icon set
- Clear, universally understood icons
- Icon per category for quick recognition
- Accessible (not color-only indicators)

### Responsiveness

- **Mobile-first design**
- Touch-friendly tap targets (min 44x44px)
- Optimized for phones, tablets, desktop
- Horizontal scrolling where appropriate (category tabs)

## Non-Functional Requirements

### Performance

- ✅ Load time: < 2 seconds on 3G
- ✅ Smooth 60fps animations
- ✅ Efficient LocalStorage operations
- ✅ Minimal bundle size

### Usability

- ✅ Intuitive UI/UX
- ✅ Clear visual hierarchy
- ✅ Accessible (WCAG 2.1 Level AA)
- ✅ Touch-friendly for mobile
- ✅ Keyboard navigation support

### Browser Compatibility

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- iOS Safari (iOS 14+)
- Chrome Mobile (Android 10+)

### Data Limits

- LocalStorage: 5-10 MB (sufficient for 1000+ items)
- JSON export: < 1 MB typical usage
- No server storage required

### Privacy & Security

- ✅ No user accounts
- ✅ No data sent to servers
- ✅ All data stored in browser LocalStorage
- ✅ User controls export/import
- ✅ No tracking or analytics
- ✅ Open source (transparent)

## Success Metrics

1. **Onboarding**: User completes setup in < 2 minutes
2. **Item Entry**: User adds an item in < 30 seconds
3. **Clarity**: Preparedness status visible at a glance
4. **Reliability**: Zero data loss (robust LocalStorage)
5. **Adoption**: Users track at least 20 items
6. **Retention**: Users check app at least quarterly

## Future Enhancements (V2)

### Multi-Location Support
- Track supplies at home, cabin, car
- Switch between locations
- Aggregate view

### Pet Support
- Pet types (dog, cat, other)
- Pet food recommendations
- Pet medication tracking

### Additional Features
- Sharing with family members (QR code)
- Recurring check reminders (quarterly)
- PWA with offline support
- Print-friendly checklist
- Item history (consumption patterns)
- Product catalog (crowdsourced data)
- Native mobile apps (iOS/Android)

## References

- [72tuntia.fi](https://72tuntia.fi/) - Finnish emergency preparedness guidelines
- Finnish civil defense recommendations
- Red Cross emergency preparedness
- FEMA preparedness resources

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
**Status**: Planning Phase - V1 Specification Complete
