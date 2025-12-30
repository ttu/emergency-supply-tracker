# Data Schema - Emergency Supply Tracker

## Overview
This document defines the complete data schema for the Emergency Supply Tracker application, including LocalStorage structure, multilingual support, and data relationships.

## Core Principles
1. **Language Independence**: Core data (user inventory) is language-agnostic using IDs
2. **Translation Separation**: UI text and recommended items are in separate translation files
3. **Extensibility**: Schema supports future additions (pets, locations, etc.)
4. **Backward Compatibility**: Version field allows for data migrations

## LocalStorage Schema

### Main Storage Key: `emergencySupplyTracker`

```typescript
interface AppData {
  version: string;                    // Schema version (e.g., "1.0.0")
  household: HouseholdConfig;
  settings: UserSettings;
  categories: Category[];             // User's custom categories only
  items: InventoryItem[];
  productTemplates: ProductTemplate[]; // User's custom product templates
  lastModified: string;               // ISO 8601 timestamp
}
```

### Household Configuration

```typescript
interface HouseholdConfig {
  adults: number;                     // Default: 2, min: 0
  children: number;                   // Default: 0, min: 0
  supplyDurationDays: number;         // Default: 3, options: 3, 5, 7, 14, 30
  hasFreezer?: boolean;               // Default: true, affects frozen food recommendations
  freezerHoldTimeHours?: number;      // Default: 48, how long freezer holds temp after power outage
  pets?: Pet[];                       // Future feature
}

interface Pet {
  id: string;                         // UUID
  type: 'dog' | 'cat' | 'other';
  size: 'small' | 'medium' | 'large';
  name?: string;
}
```

### User Settings

```typescript
interface UserSettings {
  language: 'en' | 'fi';              // Current UI language
  theme?: 'light' | 'dark' | 'auto'; // Future feature
  notifications?: {
    expirationWarningDays: number;    // Default: 30
    showBrowserNotifications: boolean; // Future feature
  };

  // Optional advanced features (disabled by default)
  advancedFeatures?: {
    calorieTracking: boolean;         // Default: false
    powerManagement: boolean;         // Default: false
    waterTracking: boolean;           // Default: false (separate drinking/hygiene)
  };
}
```

### Categories

```typescript
interface Category {
  id: string;                         // Unique ID (kebab-case for standard, UUID for custom)
  nameKey?: string;                   // Translation key for standard categories
  customName?: string;                // Direct name for custom categories
  isCustom: boolean;
  icon?: string;                      // Icon identifier (Material Icon name or emoji)
  sortOrder?: number;                 // For custom ordering
}

// Standard category IDs (predefined in code, not stored):
// All 9 categories below are included by default in V1
type StandardCategoryId =
  | 'water-beverages'
  | 'food'
  | 'cooking-heat'
  | 'light-power'
  | 'communication'
  | 'medical-first-aid'
  | 'hygiene-sanitation'
  | 'tools-supplies'
  | 'cash-documents';
```

**Note**: All 9 standard categories are included by default and NOT stored in LocalStorage. They are defined in code and translations. Only user-created custom categories are stored.

### Product Templates

Product templates allow users to create reusable product definitions with default values.

```typescript
interface ProductTemplate {
  id: string;                         // UUID for custom, kebab-case for built-in

  // Language handling (mutually exclusive)
  name?: string;                      // Direct name (ONLY for custom templates)
  i18nKey?: string;                   // Translation key (ONLY for built-in templates, e.g., "products.bottled-water")

  // Classification
  kind?: ProductKind;                 // Type of product (food, water, medicine, etc.)
  category: StandardCategoryId | string; // Primary category reference
  subCategory?: string;               // Finer categorization (e.g., "canned_food", "dry_food")
  tags?: string[];                    // Flexible labels (e.g., "gluten-free", "vegetarian")

  // Quantity & Measurement
  defaultUnit: Unit;                  // Default unit of measurement

  // Packaging information
  packaging?: {
    piecesPerPack?: number;           // Number of items per package
    netWeightG?: number;              // Actual product weight in grams
    volumeL?: number;                 // Volume for liquids in liters
  };

  // Barcode support
  barcode?: {
    ean?: string[];                   // EAN barcodes for scanning
  };

  // Expiration & Shelf Life
  defaultExpirationMonths?: number;   // Default expiration period
  shelfLifeDays?: number;             // Shelf life in days (if not non-perishable)
  nonPerishable?: boolean;            // Items that never expire (tools, etc.)

  // Nutrition information (for food items)
  nutrition?: {
    basis?: 'per100g' | 'perServing'; // Basis for nutrition values
    caloriesPer100g?: number;         // Calories per 100g/ml
    servingSize?: number;             // Typical serving size in grams
    proteinG?: number;                // Protein in grams
    carbsG?: number;                  // Carbohydrates in grams
    sugarsG?: number;                 // Sugars in grams
    fatG?: number;                    // Fat in grams
    satFatG?: number;                 // Saturated fat in grams
    fiberG?: number;                  // Fiber in grams
    sodiumMg?: number;                // Sodium in milligrams
  };

  // Preparation requirements (for food)
  prep?: {
    requiresBoil?: boolean;           // Does food need cooking?
    waterLPer100g?: number;           // Water needed per 100g
    waterLPerServing?: number;        // Water needed per serving
    cookEnergyWhPerServing?: number;  // Energy cost to cook (Wh)
  };

  // Frozen food metadata
  frozen?: {
    bestQualityMonths?: number;       // Optimal frozen storage time
    thawedFridgeLifeDays?: number;    // Shelf life after thawing (in fridge)
  };

  // Battery metadata
  battery?: {
    type?: BatteryType;               // AA, AAA, C, D, 9V, CR123
    voltage?: number;                 // Voltage (V)
    whPerCell?: number;               // Watt-hours per cell
  };

  // Powerbank metadata
  powerbank?: {
    suggestedCapacitiesWh?: number[]; // Common capacities (Wh)
    minCapacityWh?: number;           // Minimum capacity
    maxCapacityWh?: number;           // Maximum capacity
  };

  // Device metadata
  device?: {
    whPerDay?: number;                // Energy consumption per day
    batteryType?: BatteryType;        // Required battery type
    batteriesPerDevice?: number;      // Number of batteries needed
  };

  // Metadata
  sources?: string[];                 // Attribution (e.g., "72tuntia.fi", "manufacturer")
  isBuiltIn: boolean;                 // True for recommended items from 72tuntia.fi
  isCustom: boolean;                  // True for user-created templates

  createdAt?: string;                 // ISO 8601 timestamp (custom only)
  updatedAt?: string;                 // ISO 8601 timestamp (custom only)
}

type ProductKind =
  | 'food'
  | 'water'
  | 'medicine'
  | 'energy'
  | 'hygiene'
  | 'other'
  | 'device';

type BatteryType = 'AA' | 'AAA' | 'C' | 'D' | '9V' | 'CR123';
```

**How Templates Work:**

**Built-in templates** (from 72tuntia.fi recommendations):
- Defined in code with metadata (packaging, nutrition, defaults)
- Translations stored in `products.json` i18n files
- NOT stored in LocalStorage (only referenced by ID)
- Use `i18nKey` to fetch name/aliases/description at runtime
- Example: `bottled-water` → fetches from `en/products.json` or `fi/products.json`

**Custom templates** (user-created):
- Stored in LocalStorage under `productTemplates` array
- Use direct `name` string (not translated)
- User fills in all fields manually
- Can be created from "Save as Template" when adding custom items

**When creating an item from template:**
- Pre-fills name, unit, expiration, nutrition, packaging
- User can override any default value
- Item stores `templateId` for reference

**Storage:**
- Built-in templates: NOT stored in LocalStorage (defined in code + i18n files)
- Custom templates: Stored in LocalStorage `productTemplates` array

### Inventory Items

```typescript
interface InventoryItem {
  id: string;                         // UUID
  categoryId: string;                 // References Category.id or StandardCategoryId

  // Item identification
  recommendedItemId?: string;         // If from recommended list (e.g., "bottled-water")
  customName?: string;                // If custom item or override
  templateId?: string;                // References ProductTemplate.id (if created from template)

  // Quantity
  quantity: number;                   // Current quantity
  unit: Unit;                         // Unit of measurement

  // Recommended quantity (calculated at runtime, not stored)
  // recommendedQuantity is derived from recommendedItemId + household config

  // Expiration
  expirationDate?: string;            // ISO 8601 date (YYYY-MM-DD)
  purchaseDate?: string;              // ISO 8601 date (YYYY-MM-DD)
  defaultExpirationMonths?: number;   // Override category default

  // Optional metadata
  notes?: string;
  location?: string;                  // Storage location in home

  // Tracking
  isCustom: boolean;                  // User-added vs recommended
  createdAt: string;                  // ISO 8601 timestamp
  updatedAt: string;                  // ISO 8601 timestamp

  // Advanced/Optional fields (only present if feature enabled)
  nutrition?: {                       // If calorie tracking enabled
    caloriesPer100g: number;          // Standard: calories per 100g/ml
    servingSize?: number;             // Optional: typical serving size in grams
  };
  powerCapacity?: {                   // If power management enabled
    mAh?: number;                     // Capacity in mAh
    voltage?: number;                 // Voltage (V)
    wh?: number;                      // Calculated Wh (or user-entered)
  };
  waterType?: 'drinking' | 'hygiene' | 'both'; // If advanced water tracking enabled
}

type Unit =
  | 'liters' | 'l' | 'ml'                          // Liquids
  | 'kg' | 'g'                                     // Weight
  | 'pieces' | 'pcs'                               // Count
  | 'cans' | 'bottles' | 'boxes' | 'packages'      // Containers
  | 'days' | 'doses'                               // Medical/time-based
  | 'meters' | 'm'                                 // Length (duct tape, etc.)
  | 'custom';                                      // User-defined
```

### Example LocalStorage Data

```json
{
  "version": "1.0.0",
  "household": {
    "adults": 2,
    "children": 1,
    "supplyDurationDays": 7,
    "hasFreezer": true,
    "freezerHoldTimeHours": 48
  },
  "settings": {
    "language": "fi",
    "advancedFeatures": {
      "calorieTracking": false,
      "powerManagement": false,
      "waterTracking": false
    }
  },
  "categories": [
    {
      "id": "uuid-1",
      "customName": "Lemmikkieläimet",
      "isCustom": true,
      "icon": "pets"
    }
  ],
  "productTemplates": [
    {
      "id": "uuid-template-1",
      "name": "Fazer Blue Chocolate",
      "kind": "food",
      "category": "food",
      "subCategory": "snack",
      "tags": ["chocolate", "finnish"],
      "defaultUnit": "packages",
      "packaging": {
        "piecesPerPack": 1,
        "netWeightG": 200
      },
      "barcode": {
        "ean": ["6416453043763"]
      },
      "defaultExpirationMonths": 12,
      "nutrition": {
        "basis": "per100g",
        "caloriesPer100g": 534,
        "servingSize": 200,
        "proteinG": 7.8,
        "carbsG": 54.0,
        "sugarsG": 53.0,
        "fatG": 30.0,
        "satFatG": 18.0
      },
      "sources": ["manufacturer"],
      "isBuiltIn": false,
      "isCustom": true,
      "createdAt": "2024-12-20T09:00:00Z",
      "updatedAt": "2024-12-20T09:00:00Z"
    }
  ],
  "items": [
    {
      "id": "uuid-item-1",
      "categoryId": "water-beverages",
      "recommendedItemId": "bottled-water",
      "quantity": 18,
      "unit": "liters",
      "expirationDate": "2025-06-15",
      "purchaseDate": "2024-12-20",
      "notes": "Stored in pantry",
      "location": "Pantry",
      "isCustom": false,
      "createdAt": "2024-12-20T10:00:00Z",
      "updatedAt": "2024-12-20T10:00:00Z"
    },
    {
      "id": "uuid-item-2",
      "categoryId": "water-beverages",
      "recommendedItemId": "bottled-water",
      "quantity": 6,
      "unit": "liters",
      "expirationDate": "2026-01-20",
      "purchaseDate": "2024-12-15",
      "location": "Storage room",
      "isCustom": false,
      "createdAt": "2024-12-15T14:30:00Z",
      "updatedAt": "2024-12-15T14:30:00Z"
    },
    {
      "id": "uuid-item-3",
      "categoryId": "uuid-1",
      "customName": "Koiran ruoka",
      "quantity": 10,
      "unit": "kg",
      "expirationDate": "2025-08-01",
      "isCustom": true,
      "createdAt": "2024-12-20T11:00:00Z",
      "updatedAt": "2024-12-20T11:00:00Z"
    }
  ],
  "lastModified": "2024-12-20T11:00:00Z"
}
```

## Multilingual Support

### Translation File Structure

Translation files are separate JSON files loaded by the app, not stored in LocalStorage.

**File structure:**
```
/locales
  /en
    common.json
    categories.json
    recommendedItems.json
    products.json              # Built-in product template translations
    subcategories.json         # Subcategory translations (optional)
    units.json
  /fi
    common.json
    categories.json
    recommendedItems.json
    products.json
    subcategories.json
    units.json
```

### Common UI Translations (`common.json`)

```json
{
  "app": {
    "title": "Emergency Supply Tracker",
    "subtitle": "72-hour preparedness"
  },
  "dashboard": {
    "title": "Dashboard",
    "household": "Household",
    "adults": "Adults",
    "children": "Children",
    "days": "Days of supplies",
    "preparedness": "Overall Preparedness",
    "alerts": {
      "expiringSoon": "Items expiring soon",
      "expired": "Expired items",
      "missing": "Missing critical items"
    }
  },
  "inventory": {
    "title": "Inventory",
    "addItem": "Add Item",
    "quickAdd": "Quick Add",
    "customItem": "Custom Item",
    "filters": {
      "all": "All Items",
      "missing": "Missing",
      "expiring": "Expiring Soon",
      "ok": "OK"
    }
  },
  "item": {
    "quantity": "Quantity",
    "recommended": "Recommended",
    "current": "Current",
    "expiration": "Expiration Date",
    "purchase": "Purchase Date",
    "location": "Location",
    "notes": "Notes",
    "unit": "Unit"
  },
  "status": {
    "ok": "OK",
    "warning": "Warning",
    "critical": "Critical",
    "expired": "Expired",
    "expiringSoon": "Expiring Soon"
  },
  "settings": {
    "title": "Settings",
    "household": "Household Configuration",
    "hasFreezer": "Has freezer",
    "language": "Language",
    "data": "Data Management",
    "export": "Export Data",
    "exportShoppingList": "Export Shopping List",
    "import": "Import Data",
    "clear": "Clear All Data",
    "clearConfirm": "Are you sure you want to delete all data? This cannot be undone."
  },
  "onboarding": {
    "welcome": "Welcome to Emergency Supply Tracker",
    "description": "Stay prepared for emergencies by tracking your supplies according to Finnish preparedness guidelines.",
    "setupHousehold": "Set up your household",
    "adultsLabel": "Number of adults",
    "childrenLabel": "Number of children",
    "daysLabel": "Days of supplies to maintain",
    "next": "Next",
    "back": "Back",
    "finish": "Get Started"
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "edit": "Edit",
    "delete": "Delete",
    "add": "Add",
    "close": "Close"
  }
}
```

### Category Translations (`categories.json`)

```json
{
  "water-beverages": {
    "name": "Water & Beverages",
    "description": "Drinking water and long-life beverages"
  },
  "food": {
    "name": "Food",
    "description": "Non-perishable food items"
  },
  "cooking-heat": {
    "name": "Cooking & Heat",
    "description": "Equipment for cooking and staying warm"
  },
  "light-power": {
    "name": "Light & Power",
    "description": "Lighting and power sources"
  },
  "communication": {
    "name": "Communication",
    "description": "Devices for receiving information"
  },
  "medical-first-aid": {
    "name": "Medical & First Aid",
    "description": "Medical supplies and medications"
  },
  "hygiene-sanitation": {
    "name": "Hygiene & Sanitation",
    "description": "Personal hygiene and sanitation items"
  },
  "tools-supplies": {
    "name": "Tools & Supplies",
    "description": "Essential tools and general supplies"
  },
  "cash-documents": {
    "name": "Cash & Documents",
    "description": "Money and important documents"
  }
}
```

**Finnish version (`fi/categories.json`):**
```json
{
  "water-beverages": {
    "name": "Vesi ja Juomat",
    "description": "Juomavesi ja säilyvät juomat"
  },
  "food": {
    "name": "Ruoka",
    "description": "Säilyvät elintarvikkeet"
  },
  "cooking-heat": {
    "name": "Ruoanlaitto ja Lämpö",
    "description": "Ruoanlaitto- ja lämmitysvälineet"
  },
  "light-power": {
    "name": "Valo ja Sähkö",
    "description": "Valaistus ja sähkölähteet"
  },
  "communication": {
    "name": "Viestintä",
    "description": "Laitteet tiedonsaantiin"
  },
  "medical-first-aid": {
    "name": "Lääkkeet ja Ensiapuvälineet",
    "description": "Lääkintätarvikkeet ja lääkkeet"
  },
  "hygiene-sanitation": {
    "name": "Hygienia",
    "description": "Henkilökohtainen hygienia ja sanitaatio"
  },
  "tools-supplies": {
    "name": "Työkalut ja Tarvikkeet",
    "description": "Välttämättömät työkalut ja tarvikkeet"
  },
  "cash-documents": {
    "name": "Käteinen ja Asiakirjat",
    "description": "Raha ja tärkeät asiakirjat"
  }
}
```

### Recommended Items Translations (`recommendedItems.json`)

```typescript
interface RecommendedItemDefinition {
  id: string;
  categoryId: string;
  name: string;
  aliases?: string[];                // Alternative names for search
  description?: string;               // Optional description
  baseQuantity: number;              // Base quantity for 1 person for 3 days
  unit: Unit;
  scaleWithPeople: boolean;          // Does it scale with household size?
  scaleWithDays: boolean;            // Does it scale with duration?
  defaultExpirationMonths?: number;
  notes?: string;
}
```

**English (`en/recommendedItems.json`):**
```json
{
  "bottled-water": {
    "id": "bottled-water",
    "categoryId": "water-beverages",
    "name": "Bottled Water",
    "aliases": ["Water bottles", "Drinking water"],
    "description": "Clean drinking water in sealed bottles",
    "baseQuantity": 9,
    "unit": "liters",
    "scaleWithPeople": true,
    "scaleWithDays": true,
    "defaultExpirationMonths": 12,
    "notes": "3 liters per person per day"
  },
  "long-life-milk": {
    "id": "long-life-milk",
    "categoryId": "water-beverages",
    "name": "Long-life Milk/Juice",
    "aliases": ["UHT milk", "Shelf-stable milk", "Long-life juice"],
    "description": "Ultra-pasteurized milk or juice that doesn't need refrigeration",
    "baseQuantity": 2,
    "unit": "liters",
    "scaleWithPeople": true,
    "scaleWithDays": false,
    "defaultExpirationMonths": 12
  },
  "canned-soup": {
    "id": "canned-soup",
    "categoryId": "food",
    "name": "Canned Soup",
    "baseQuantity": 3,
    "unit": "cans",
    "scaleWithPeople": true,
    "scaleWithDays": true,
    "defaultExpirationMonths": 24
  },
  "flashlight": {
    "id": "flashlight",
    "categoryId": "light-power",
    "name": "Flashlight",
    "baseQuantity": 2,
    "unit": "pieces",
    "scaleWithPeople": false,
    "scaleWithDays": false,
    "defaultExpirationMonths": null,
    "notes": "Per household"
  },
  "headlamp": {
    "id": "headlamp",
    "categoryId": "light-power",
    "name": "Headlamp",
    "baseQuantity": 1,
    "unit": "pieces",
    "scaleWithPeople": true,
    "scaleWithDays": false,
    "defaultExpirationMonths": null,
    "notes": "One per person"
  },
  "batteries-aa": {
    "id": "batteries-aa",
    "categoryId": "light-power",
    "name": "Batteries AA",
    "baseQuantity": 20,
    "unit": "pieces",
    "scaleWithPeople": false,
    "scaleWithDays": false,
    "defaultExpirationMonths": 60
  },
  "camping-stove": {
    "id": "camping-stove",
    "categoryId": "cooking-heat",
    "name": "Camping Stove",
    "baseQuantity": 1,
    "unit": "pieces",
    "scaleWithPeople": false,
    "scaleWithDays": false,
    "defaultExpirationMonths": null
  },
  "first-aid-kit": {
    "id": "first-aid-kit",
    "categoryId": "medical-first-aid",
    "name": "First Aid Kit",
    "baseQuantity": 1,
    "unit": "pieces",
    "scaleWithPeople": false,
    "scaleWithDays": false,
    "defaultExpirationMonths": 36
  },
  "battery-radio": {
    "id": "battery-radio",
    "categoryId": "communication",
    "name": "Battery-powered Radio",
    "baseQuantity": 1,
    "unit": "pieces",
    "scaleWithPeople": false,
    "scaleWithDays": false,
    "defaultExpirationMonths": null
  },
  "bucket": {
    "id": "bucket",
    "categoryId": "tools-supplies",
    "name": "Bucket with Lid",
    "baseQuantity": 1,
    "unit": "pieces",
    "scaleWithPeople": false,
    "scaleWithDays": false,
    "defaultExpirationMonths": null
  },
  "cash": {
    "id": "cash",
    "categoryId": "cash-documents",
    "name": "Cash (EUR)",
    "baseQuantity": 300,
    "unit": "euros",
    "scaleWithPeople": false,
    "scaleWithDays": false,
    "defaultExpirationMonths": null,
    "notes": "€200-500 recommended per household"
  }
}
```

**Finnish (`fi/recommendedItems.json`):**
```json
{
  "bottled-water": {
    "id": "bottled-water",
    "categoryId": "water-beverages",
    "name": "Pullotettu Vesi",
    "aliases": ["Vesipullot", "Juomavesi", "Pullovesi"],
    "description": "Puhdasta juomavettä suljetuissa pulloissa",
    "baseQuantity": 9,
    "unit": "liters",
    "scaleWithPeople": true,
    "scaleWithDays": true,
    "defaultExpirationMonths": 12,
    "notes": "3 litraa per henkilö per päivä"
  },
  "camping-stove": {
    "id": "camping-stove",
    "categoryId": "cooking-heat",
    "name": "Retkikeitin",
    "aliases": ["Kaasukeitin", "Campingkeitin"],
    "description": "Kannettava keitin ruoanlaittoon ilman sähköä",
    "baseQuantity": 1,
    "unit": "pieces",
    "scaleWithPeople": false,
    "scaleWithDays": false,
    "defaultExpirationMonths": null
  },
  "headlamp": {
    "id": "headlamp",
    "categoryId": "light-power",
    "name": "Otsalamppu",
    "aliases": ["Päälamppu", "Otsavalaisin"],
    "description": "Kädet vapauttava valonlähde",
    "baseQuantity": 1,
    "unit": "pieces",
    "scaleWithPeople": true,
    "scaleWithDays": false,
    "defaultExpirationMonths": null,
    "notes": "Yksi per henkilö"
  }
}
```

### Product Template Translations (`products.json`)

Product templates for built-in items use this structure for translations.

**English (`en/products.json`):**
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
  "batteries-aa": {
    "name": "Batteries AA",
    "aliases": ["Double-A batteries", "AA cells"],
    "description": "Standard AA batteries for devices"
  },
  "first-aid-kit": {
    "name": "First Aid Kit",
    "aliases": ["Medical kit", "Emergency medical supplies"],
    "description": "Basic first aid supplies for emergencies"
  }
}
```

**Finnish (`fi/products.json`):**
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
  "batteries-aa": {
    "name": "Paristot AA",
    "aliases": ["AA-paristot", "AA-kennot"],
    "description": "Tavalliset AA-paristot laitteisiin"
  },
  "first-aid-kit": {
    "name": "Ensiapupakkaus",
    "aliases": ["Ensiapulaukku", "Lääkintälaukku"],
    "description": "Perus ensiapuvälineet hätätilanteisiin"
  }
}
```

**Note**: These translations are for built-in product templates only. Custom user-created templates store the name directly in LocalStorage.

### Unit Translations (`units.json`)

```json
{
  "liters": "liters",
  "l": "L",
  "ml": "mL",
  "kg": "kg",
  "g": "g",
  "pieces": "pieces",
  "pcs": "pcs",
  "cans": "cans",
  "bottles": "bottles",
  "boxes": "boxes",
  "packages": "packages",
  "days": "days",
  "doses": "doses",
  "meters": "meters",
  "m": "m",
  "euros": "€"
}
```

**Finnish (`fi/units.json`):**
```json
{
  "liters": "litraa",
  "l": "L",
  "ml": "mL",
  "kg": "kg",
  "g": "g",
  "pieces": "kappaletta",
  "pcs": "kpl",
  "cans": "tölkkiä",
  "bottles": "pulloa",
  "boxes": "laatikkoa",
  "packages": "pakettia",
  "days": "päivää",
  "doses": "annosta",
  "meters": "metriä",
  "m": "m",
  "euros": "€"
}
```

## Calculated Fields (Runtime Only)

These are NOT stored but calculated on-the-fly:

### Household Multiplier
```typescript
function calculateHouseholdMultiplier(household: HouseholdConfig): number {
  const peopleMultiplier = (household.adults * 1.0) + (household.children * 0.75);
  const daysMultiplier = household.supplyDurationDays / 3;
  return peopleMultiplier * daysMultiplier;
}
```

### Recommended Quantity for Item
```typescript
function calculateRecommendedQuantity(
  recommendedItem: RecommendedItemDefinition,
  household: HouseholdConfig
): number {
  let multiplier = 1;

  if (recommendedItem.scaleWithPeople) {
    multiplier *= (household.adults * 1.0) + (household.children * 0.75);
  }

  if (recommendedItem.scaleWithDays) {
    multiplier *= household.supplyDurationDays / 3;
  }

  return recommendedItem.baseQuantity * multiplier;
}
```

### Aggregated Quantity
```typescript
// Aggregate quantities for same recommendedItemId
function getAggregatedQuantity(
  recommendedItemId: string,
  items: InventoryItem[]
): number {
  return items
    .filter(item => item.recommendedItemId === recommendedItemId)
    .reduce((sum, item) => sum + item.quantity, 0);
}
```

### Item Status
```typescript
type ItemStatus = 'ok' | 'warning' | 'critical';

function getItemStatus(
  item: InventoryItem,
  recommendedQuantity: number,
  currentDate: Date
): ItemStatus {
  // Check if expired
  if (item.expirationDate && new Date(item.expirationDate) < currentDate) {
    return 'critical';
  }

  // Check if missing
  if (item.quantity === 0) {
    return 'critical';
  }

  // Check if expiring soon (30 days)
  if (item.expirationDate) {
    const daysUntilExpiration = Math.floor(
      (new Date(item.expirationDate).getTime() - currentDate.getTime())
      / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiration <= 30) {
      return 'warning';
    }
  }

  // Check if low quantity
  if (item.quantity < recommendedQuantity * 0.5) {
    return 'warning';
  }

  return 'ok';
}
```

### Category Status
```typescript
function getCategoryStatus(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig
): ItemStatus {
  const categoryItems = items.filter(item => item.categoryId === categoryId);

  // Check each item's status
  const statuses = categoryItems.map(item => {
    const recommendedQty = item.recommendedItemId
      ? calculateRecommendedQuantity(getRecommendedItem(item.recommendedItemId), household)
      : 0;
    return getItemStatus(item, recommendedQty, new Date());
  });

  // Category status is worst of all items
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('warning')) return 'warning';
  return 'ok';
}
```

## Export/Import Format

Same as LocalStorage structure, with additional metadata:

```typescript
interface ExportData extends AppData {
  exportMetadata: {
    exportedAt: string;           // ISO 8601 timestamp
    appVersion: string;            // App version that created export
    itemCount: number;
    categoryCount: number;
  };
}
```

## Data Validation

### On Import
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateImportData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check version compatibility
  if (!data.version || !isCompatibleVersion(data.version)) {
    errors.push('Incompatible data version');
  }

  // Validate household config
  if (!data.household || typeof data.household.adults !== 'number') {
    errors.push('Invalid household configuration');
  }

  // Validate items
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item: any, index: number) => {
      if (!item.id || !item.categoryId) {
        errors.push(`Item ${index}: Missing required fields`);
      }
      if (item.expirationDate && !isValidDate(item.expirationDate)) {
        warnings.push(`Item ${index}: Invalid expiration date`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

## Migration Strategy

When schema changes occur:

```typescript
interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: (oldData: any) => AppData;
}

const migrations: Migration[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '1.1.0',
    migrate: (oldData) => {
      // Example: Add new field with default value
      return {
        ...oldData,
        version: '1.1.0',
        household: {
          ...oldData.household,
          pets: oldData.household.pets || []
        }
      };
    }
  }
];

function migrateData(data: any): AppData {
  let currentData = data;
  let currentVersion = data.version;

  while (currentVersion !== CURRENT_VERSION) {
    const migration = migrations.find(m => m.fromVersion === currentVersion);
    if (!migration) {
      throw new Error(`No migration path from ${currentVersion}`);
    }
    currentData = migration.migrate(currentData);
    currentVersion = migration.toVersion;
  }

  return currentData;
}
```

## Summary

### Key Design Decisions

1. **Language-Independent Core Data**:
   - User inventory uses IDs, not translated strings
   - Allows language switching without data loss

2. **Separation of Concerns**:
   - LocalStorage: User's data only
   - Translation files: All UI text and recommended items
   - Code: Standard categories and business logic

3. **Flexible Scaling**:
   - Items can scale with people, days, both, or neither
   - Custom items work alongside recommended items

4. **Multiple Item Instances**:
   - Same item type with different expirations tracked separately
   - Aggregated for display purposes

5. **Version Control**:
   - Schema versioning enables safe migrations
   - Export includes version metadata

6. **Minimal Storage**:
   - Only user-entered data stored
   - Calculated values computed at runtime
   - Efficient use of LocalStorage limits

---

**Document Version**: 1.6
**Last Updated**: 2025-12-22
**Schema Version**: 1.0.0
**Changes from v1.5**:
- Clarified ProductTemplate language handling:
  - Built-in templates: Use `i18nKey` (e.g., "products.bottled-water"), NOT stored in LocalStorage
  - Custom templates: Use `name` string, stored in LocalStorage
  - Made `name` and `i18nKey` mutually exclusive
- Added `products.json` translation file structure for built-in product templates
- Added examples of product template translations (English and Finnish)
- Updated file structure to include `products.json` and `subcategories.json`
- Clarified storage model: built-in templates defined in code + i18n, custom templates in LocalStorage

**Previous changes (v1.5)**:
- Enhanced RecommendedItemDefinition with search-friendly fields from old i18n schema:
  - Added `aliases` array for alternative product names (improves search)
  - Added `description` field for product descriptions
  - Updated examples with English and Finnish aliases/descriptions

**Previous changes (v1.4)**:
- Enhanced ProductTemplate with comprehensive fields from old products schema:
  - Added product classification (kind, subCategory, tags)
  - Added packaging information (piecesPerPack, netWeightG, volumeL)
  - Added barcode support (EAN codes for scanning)
  - Added detailed nutrition (macros: protein, carbs, fat, fiber, sodium)
  - Added preparation requirements (requiresBoil, water/energy needed)
  - Added frozen food metadata (bestQualityMonths, thawedFridgeLifeDays)
  - Added battery/powerbank/device metadata for energy tracking
  - Added shelf life options (shelfLifeDays, nonPerishable flag)
  - Added sources attribution and i18nKey for built-in items
- Added ProductKind and BatteryType type definitions

**Previous changes (v1.3)**:
- Added ProductTemplate interface for reusable product definitions
- Added productTemplates array to AppData
- Added templateId field to InventoryItem
- Added freezerHoldTimeHours to HouseholdConfig (default: 48h)
- Standardized calorie format to caloriesPer100g in nutrition object

**Previous changes (v1.2)**:
- Added hasFreezer to HouseholdConfig
- Added optional advanced features (calorie tracking, power management, water tracking)
- Added optional fields to InventoryItem (calories, powerCapacity, waterType)
- Added advancedFeatures to UserSettings
