import type {
  StandardCategoryId,
  Unit,
  RecommendedItemsFile,
  ImportedRecommendedItem,
} from '../../types';

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

const VALID_CATEGORIES: StandardCategoryId[] = [
  'water-beverages',
  'food',
  'cooking-heat',
  'light-power',
  'communication-info',
  'medical-health',
  'hygiene-sanitation',
  'tools-supplies',
  'cash-documents',
];

const VALID_UNITS: Unit[] = [
  'pieces',
  'liters',
  'kilograms',
  'grams',
  'cans',
  'bottles',
  'packages',
  'jars',
  'canisters',
  'boxes',
  'days',
  'rolls',
  'tubes',
  'meters',
  'pairs',
  'euros',
  'sets',
];

function isValidCategory(value: unknown): value is StandardCategoryId {
  return (
    typeof value === 'string' &&
    VALID_CATEGORIES.includes(value as StandardCategoryId)
  );
}

function isValidUnit(value: unknown): value is Unit {
  return typeof value === 'string' && VALID_UNITS.includes(value as Unit);
}

function validateMeta(meta: unknown, errors: ValidationError[]): void {
  if (!meta || typeof meta !== 'object') {
    errors.push({
      path: 'meta',
      message: 'Missing meta object',
      code: 'MISSING_META',
    });
    return;
  }

  const m = meta as Record<string, unknown>;

  if (!m.name || typeof m.name !== 'string' || m.name.trim() === '') {
    errors.push({
      path: 'meta.name',
      message: 'Meta name is required',
      code: 'MISSING_META_NAME',
    });
  }

  if (!m.version || typeof m.version !== 'string' || m.version.trim() === '') {
    errors.push({
      path: 'meta.version',
      message: 'Meta version is required',
      code: 'MISSING_META_VERSION',
    });
  }

  if (!m.createdAt || typeof m.createdAt !== 'string') {
    errors.push({
      path: 'meta.createdAt',
      message: 'Meta createdAt is required',
      code: 'MISSING_META_CREATED_AT',
    });
  }

  if (m.language !== undefined && m.language !== 'en' && m.language !== 'fi') {
    errors.push({
      path: 'meta.language',
      message: 'Meta language must be "en" or "fi"',
      code: 'INVALID_META_LANGUAGE',
    });
  }
}

function validateItem(
  item: unknown,
  index: number,
  errors: ValidationError[],
  warnings: ValidationWarning[],
): void {
  const path = `items[${index}]`;

  if (!item || typeof item !== 'object') {
    errors.push({
      path,
      message: 'Item must be an object',
      code: 'INVALID_ITEM',
    });
    return;
  }

  const i = item as Record<string, unknown>;

  // Required: id
  if (!i.id || typeof i.id !== 'string' || i.id.trim() === '') {
    errors.push({
      path: `${path}.id`,
      message: 'Item ID is required',
      code: 'MISSING_ID',
    });
  }

  // Required: either i18nKey or names with at least 'en' key
  const hasI18nKey = i.i18nKey !== undefined;
  const hasNames =
    i.names && typeof i.names === 'object' && !Array.isArray(i.names);
  const hasEnglishName =
    hasNames &&
    typeof (i.names as Record<string, unknown>).en === 'string' &&
    ((i.names as Record<string, unknown>).en as string).trim() !== '';

  if (!hasI18nKey && !hasEnglishName) {
    errors.push({
      path,
      message: 'Item must have either i18nKey or names.en',
      code: 'MISSING_NAME',
    });
  }

  // Validate i18nKey if present
  if (
    i.i18nKey !== undefined &&
    (typeof i.i18nKey !== 'string' || i.i18nKey.trim() === '')
  ) {
    errors.push({
      path: `${path}.i18nKey`,
      message: 'i18nKey must be a non-empty string',
      code: 'INVALID_I18N_KEY',
    });
  }

  // Validate names object if present
  if (i.names !== undefined) {
    if (!hasNames) {
      errors.push({
        path: `${path}.names`,
        message: 'names must be an object',
        code: 'INVALID_NAMES',
      });
    } else {
      const names = i.names as Record<string, unknown>;
      // Check that all values in names are non-empty strings
      for (const [lang, value] of Object.entries(names)) {
        if (typeof value !== 'string' || value.trim() === '') {
          warnings.push({
            path: `${path}.names.${lang}`,
            message: `names.${lang} should be a non-empty string`,
            code: 'INVALID_NAME_VALUE',
          });
        }
      }
    }
  }

  // Required: category
  if (!isValidCategory(i.category)) {
    errors.push({
      path: `${path}.category`,
      message: `Invalid category: ${String(i.category)}. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      code: 'INVALID_CATEGORY',
    });
  }

  // Required: unit
  if (!isValidUnit(i.unit)) {
    errors.push({
      path: `${path}.unit`,
      message: `Invalid unit: ${String(i.unit)}. Must be one of: ${VALID_UNITS.join(', ')}`,
      code: 'INVALID_UNIT',
    });
  }

  // Required: baseQuantity
  if (
    typeof i.baseQuantity !== 'number' ||
    i.baseQuantity < 0 ||
    !Number.isFinite(i.baseQuantity)
  ) {
    errors.push({
      path: `${path}.baseQuantity`,
      message: 'baseQuantity must be a non-negative number',
      code: 'INVALID_QUANTITY',
    });
  }

  // Required: scaleWithPeople
  if (typeof i.scaleWithPeople !== 'boolean') {
    errors.push({
      path: `${path}.scaleWithPeople`,
      message: 'scaleWithPeople must be a boolean',
      code: 'INVALID_BOOLEAN',
    });
  }

  // Required: scaleWithDays
  if (typeof i.scaleWithDays !== 'boolean') {
    errors.push({
      path: `${path}.scaleWithDays`,
      message: 'scaleWithDays must be a boolean',
      code: 'INVALID_BOOLEAN',
    });
  }

  // Optional: requiresFreezer
  if (
    i.requiresFreezer !== undefined &&
    typeof i.requiresFreezer !== 'boolean'
  ) {
    warnings.push({
      path: `${path}.requiresFreezer`,
      message: 'requiresFreezer should be a boolean',
      code: 'INVALID_OPTIONAL',
    });
  }

  // Optional: defaultExpirationMonths
  if (i.defaultExpirationMonths !== undefined) {
    if (
      typeof i.defaultExpirationMonths !== 'number' ||
      i.defaultExpirationMonths <= 0
    ) {
      warnings.push({
        path: `${path}.defaultExpirationMonths`,
        message: 'defaultExpirationMonths should be a positive number',
        code: 'INVALID_OPTIONAL',
      });
    }
  }

  // Optional: requiresWaterLiters
  if (i.requiresWaterLiters !== undefined) {
    if (
      typeof i.requiresWaterLiters !== 'number' ||
      i.requiresWaterLiters <= 0
    ) {
      warnings.push({
        path: `${path}.requiresWaterLiters`,
        message: 'requiresWaterLiters should be a positive number',
        code: 'INVALID_OPTIONAL',
      });
    }
  }

  // Optional: calorie fields
  if (
    i.caloriesPerUnit !== undefined &&
    (typeof i.caloriesPerUnit !== 'number' || i.caloriesPerUnit < 0)
  ) {
    warnings.push({
      path: `${path}.caloriesPerUnit`,
      message: 'caloriesPerUnit should be a non-negative number',
      code: 'INVALID_OPTIONAL',
    });
  }

  if (
    i.caloriesPer100g !== undefined &&
    (typeof i.caloriesPer100g !== 'number' || i.caloriesPer100g < 0)
  ) {
    warnings.push({
      path: `${path}.caloriesPer100g`,
      message: 'caloriesPer100g should be a non-negative number',
      code: 'INVALID_OPTIONAL',
    });
  }

  if (
    i.weightGramsPerUnit !== undefined &&
    (typeof i.weightGramsPerUnit !== 'number' || i.weightGramsPerUnit <= 0)
  ) {
    warnings.push({
      path: `${path}.weightGramsPerUnit`,
      message: 'weightGramsPerUnit should be a positive number',
      code: 'INVALID_OPTIONAL',
    });
  }

  // Optional: capacityMah (battery capacity in milliamp-hours)
  if (
    i.capacityMah !== undefined &&
    (typeof i.capacityMah !== 'number' || i.capacityMah <= 0)
  ) {
    warnings.push({
      path: `${path}.capacityMah`,
      message: 'capacityMah should be a positive number',
      code: 'INVALID_OPTIONAL',
    });
  }

  // Optional: capacityWh (battery capacity in watt-hours)
  if (
    i.capacityWh !== undefined &&
    (typeof i.capacityWh !== 'number' || i.capacityWh <= 0)
  ) {
    warnings.push({
      path: `${path}.capacityWh`,
      message: 'capacityWh should be a positive number',
      code: 'INVALID_OPTIONAL',
    });
  }
}

export function validateRecommendedItemsFile(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      path: '',
      message: 'Invalid JSON structure',
      code: 'INVALID_STRUCTURE',
    });
    return { valid: false, errors, warnings };
  }

  const d = data as Record<string, unknown>;

  // Validate meta
  validateMeta(d.meta, errors);

  // Validate items array
  if (!Array.isArray(d.items)) {
    errors.push({
      path: 'items',
      message: 'Items must be an array',
      code: 'INVALID_ITEMS',
    });
  } else if (d.items.length === 0) {
    errors.push({
      path: 'items',
      message: 'Items array cannot be empty',
      code: 'EMPTY_ITEMS',
    });
  } else {
    // Check for duplicate IDs
    const seenIds = new Set<string>();
    d.items.forEach((item, index) => {
      if (item && typeof item === 'object') {
        const i = item as Record<string, unknown>;
        if (typeof i.id === 'string' && i.id.trim() !== '') {
          if (seenIds.has(i.id)) {
            errors.push({
              path: `items[${index}].id`,
              message: `Duplicate item ID: ${i.id}`,
              code: 'DUPLICATE_ID',
            });
          } else {
            seenIds.add(i.id);
          }
        }
      }
      validateItem(item, index, errors, warnings);
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function parseRecommendedItemsFile(json: string): RecommendedItemsFile {
  const data = JSON.parse(json);
  const result = validateRecommendedItemsFile(data);

  if (!result.valid) {
    const errorMessages = result.errors
      .map((e) => `${e.path}: ${e.message}`)
      .join('; ');
    throw new Error(`Invalid recommended items file: ${errorMessages}`);
  }

  return data as RecommendedItemsFile;
}

export function convertToRecommendedItemDefinitions(
  items: ImportedRecommendedItem[],
): {
  id: string;
  i18nKey: string;
  category: StandardCategoryId;
  baseQuantity: number;
  unit: Unit;
  scaleWithPeople: boolean;
  scaleWithDays: boolean;
  requiresFreezer?: boolean;
  defaultExpirationMonths?: number;
  weightGramsPerUnit?: number;
  caloriesPer100g?: number;
  caloriesPerUnit?: number;
  capacityMah?: number;
  capacityWh?: number;
  requiresWaterLiters?: number;
}[] {
  return items.map((item) => ({
    id: item.id,
    // Use i18nKey if provided, otherwise create a synthetic key for lookup
    i18nKey: item.i18nKey || `custom.${item.id}`,
    category: item.category,
    baseQuantity: item.baseQuantity,
    unit: item.unit,
    scaleWithPeople: item.scaleWithPeople,
    scaleWithDays: item.scaleWithDays,
    requiresFreezer: item.requiresFreezer,
    defaultExpirationMonths: item.defaultExpirationMonths,
    weightGramsPerUnit: item.weightGramsPerUnit,
    caloriesPer100g: item.caloriesPer100g,
    caloriesPerUnit: item.caloriesPerUnit,
    capacityMah: item.capacityMah,
    capacityWh: item.capacityWh,
    requiresWaterLiters: item.requiresWaterLiters,
  }));
}
