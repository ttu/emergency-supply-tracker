// Core types
export type Unit =
  | 'pieces'
  | 'liters'
  | 'kilograms'
  | 'grams'
  | 'cans'
  | 'bottles'
  | 'packages'
  | 'jars'
  | 'canisters'
  | 'boxes'
  | 'days'
  | 'rolls'
  | 'tubes'
  | 'meters'
  | 'pairs'
  | 'euros'
  | 'sets';
export type ItemStatus = 'ok' | 'warning' | 'critical';
export type StandardCategoryId =
  | 'water-beverages'
  | 'food'
  | 'cooking-heat'
  | 'light-power'
  | 'communication-info'
  | 'medical-health'
  | 'hygiene-sanitation'
  | 'tools-supplies'
  | 'cash-documents';
export type ProductKind =
  | 'food'
  | 'water'
  | 'medicine'
  | 'energy'
  | 'hygiene'
  | 'device'
  | 'other';
export type BatteryType = 'AAA' | 'AA' | 'C' | 'D' | '9V' | 'CR2032';

// Household Configuration
export interface HouseholdConfig {
  adults: number;
  children: number;
  supplyDurationDays: number;
  hasFreezer: boolean;
  freezerHoldTimeHours?: number;
}

// User Settings
export interface UserSettings {
  language: 'en' | 'fi';
  theme: 'light' | 'dark' | 'auto';
  advancedFeatures: {
    calorieTracking: boolean;
    powerManagement: boolean;
    waterTracking: boolean;
  };
  onboardingCompleted?: boolean;
}

// Category
export interface Category {
  id: string;
  standardCategoryId?: StandardCategoryId;
  name: string;
  icon?: string;
  isCustom: boolean;
}

// Inventory Item
export interface InventoryItem {
  id: string;
  name: string;
  itemType?: string; // Template type (e.g., "Canned Tuna"), read-only from template
  categoryId: string;
  quantity: number;
  unit: Unit;
  recommendedQuantity: number;
  expirationDate?: string;
  neverExpires?: boolean;
  location?: string;
  notes?: string;
  productTemplateId?: string;
  caloriesPerUnit?: number; // Calories per unit for food items
  createdAt: string;
  updatedAt: string;
}

// Product Template
export interface ProductTemplate {
  id: string;
  name?: string;
  i18nKey?: string;
  kind?: ProductKind;
  category: StandardCategoryId | string;
  defaultUnit?: Unit;
  isBuiltIn: boolean;
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Recommended Item Definition
export interface RecommendedItemDefinition {
  id: string;
  i18nKey: string;
  category: StandardCategoryId;
  baseQuantity: number;
  unit: Unit;
  scaleWithPeople: boolean;
  scaleWithDays: boolean;
  requiresFreezer?: boolean;
  defaultExpirationMonths?: number;
  // Calorie tracking for food items
  caloriesPerUnit?: number; // Calories per unit (e.g., per can, per kg)
}

// App Data (root)
export interface AppData {
  version: string;
  household: HouseholdConfig;
  settings: UserSettings;
  customCategories: Category[]; // Only user's custom categories, STANDARD_CATEGORIES are always available
  items: InventoryItem[];
  customTemplates: ProductTemplate[];
  lastModified: string;
}
