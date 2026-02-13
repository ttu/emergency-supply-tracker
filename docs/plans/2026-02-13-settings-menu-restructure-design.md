# Settings Menu Restructure Design

## Problem

The current settings menu structure is confusing because "Inventory Sets" appears under "General" but it acts as the parent context for most other settings (Household, Recommendations, Categories). Users don't see this relationship clearly.

Current structure:

```
General
├── Appearance
├── Inventory Sets      ← Selects which inventory you're configuring
├── Backup & Transfer
└── About

Household               ← These are per-inventory-set settings
├── Household Config
└── Nutrition           ← (actually global, not per-set)

Recommendations         ← All per-inventory-set
Categories              ← Per-inventory-set
Advanced
```

## Solution

Add a prominent inventory set selector at the top of the settings page, making it clear that "Scenario Settings" below apply to the selected set. Reorganize menu groups to distinguish per-set settings from global app settings.

## Design

### Overall Structure

```
┌─────────────────────────────────────────┐
│  Settings                               │
├─────────────────────────────────────────┤
│  Configuring: [72-hour Kit      ▼]      │
│                              Manage →   │
└─────────────────────────────────────────┘

Scenario Settings          ← For current inventory set
├── Household
├── Recommendation Kits
├── Custom Templates
├── Disabled Recommendations
├── Overridden Recommendations
├── Hidden Alerts
├── Disabled Categories
└── Custom Categories

App Settings               ← Global
├── Appearance
├── Nutrition & Requirements
├── Manage Inventory Sets
├── Backup & Transfer
└── About

Advanced
├── Debug Log
└── Danger Zone
```

### Inventory Set Selector

**Placement:** Fixed at the top of the settings content area (not in the side menu). Stays visible when scrolling.

**Visual design:**

```
┌──────────────────────────────────────────────┐
│  Configuring: ┌─────────────────────┐        │
│               │ 72-hour Kit       ▼ │ Manage │
│               └─────────────────────┘        │
└──────────────────────────────────────────────┘
```

**Behavior:**

- Dropdown shows all inventory sets with the active one checked
- Selecting a different set immediately switches context
- All "Scenario Settings" update to reflect the new set
- "Manage" link navigates to "Manage Inventory Sets" section

**Mobile:**

- Selector remains at top of content area
- Full-width dropdown
- "Manage" becomes an icon button

**Edge case:** If only one inventory set exists, show the selector but disable dropdown.

### Manage Inventory Sets Section

Located under "App Settings", handles creating, renaming, and deleting sets:

```
┌─────────────────────────────────────────────┐
│  Manage Inventory Sets                      │
├─────────────────────────────────────────────┤
│  Your Inventory Sets                        │
│  ┌─────────────────────────────────────────┐│
│  │ 72-hour Kit              ● Active  [✏️] ││
│  │ 2-week Supply                      [✏️] ││
│  │ Car Emergency Kit                  [✏️] ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌─────────────────────────┐                │
│  │ New set name...         │  [+ Create]   │
│  └─────────────────────────┘                │
│                                             │
│  ℹ️ Each inventory set has its own          │
│     household config, items, and settings.  │
└─────────────────────────────────────────────┘
```

**Functionality:**

- List all sets with active indicator
- Rename (inline edit via pencil icon)
- Delete (with confirmation, only if multiple sets exist)
- Create new set
- Brief help text explaining inventory sets

**Removed:** Active set dropdown selector (now in header)

## Implementation

### New Components

- `InventorySetSelector` - Header selector with dropdown and "Manage" link

### Modified Components

- `Settings.tsx` - New menu structure, add selector above content
- `InventorySetSection` - Remove active set dropdown (keep create/rename/delete)

### Menu Group Changes

| Current                  | New                                     |
| ------------------------ | --------------------------------------- |
| General → Inventory Sets | App Settings → Manage Inventory Sets    |
| Household → Nutrition    | App Settings → Nutrition & Requirements |
| Household → Household    | Scenario Settings → Household           |
| Recommendations (group)  | Scenario Settings (merged)              |
| Categories (group)       | Scenario Settings (merged)              |

### Translation Keys

New keys needed:

- `settings.inventorySetSelector.label` ("Configuring:")
- `settings.inventorySetSelector.manage` ("Manage")
- `settings.navigation.groups.scenarioSettings`
- `settings.navigation.groups.appSettings`
- `settings.manageInventorySets.helpText`

### No Data Model Changes

The existing architecture already stores household config per inventory set and nutrition settings globally.
