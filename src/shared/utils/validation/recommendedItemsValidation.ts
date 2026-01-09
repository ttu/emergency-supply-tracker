import type {
  StandardCategoryId,
  Unit,
  RecommendedItemsFile,
  ImportedRecommendedItem,
  RecommendedItemDefinition,
} from '@/shared/types';
import {
  createProductTemplateId,
  VALID_CATEGORIES,
  VALID_UNITS,
} from '@/shared/types';

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

function isValidCategory(value: unknown): value is StandardCategoryId {
  return (
    typeof value === 'string' &&
    VALID_CATEGORIES.includes(value as StandardCategoryId)
  );
}

function isValidUnit(value: unknown): value is Unit {
  return typeof value === 'string' && VALID_UNITS.includes(value as Unit);
}

/**
 * Validates the meta object of a recommended items file.
 *
 * Records any validation problems by pushing ValidationError entries onto the provided errors array.
 *
 * Required fields:
 * - meta.name: non-empty string (the name of the recommendations set)
 * - meta.version: non-empty string (version identifier)
 * - meta.createdAt: string (ISO timestamp)
 *
 * Optional fields:
 * - meta.language: if present, must be 'en' or 'fi'
 *
 * @param meta - The meta object to validate (unknown type, validated at runtime)
 * @param errors - Array to push validation errors onto (mutated as side effect)
 * @returns void
 */
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

/**
 * Validates a single item in the recommended items array.
 *
 * Records validation problems by pushing entries onto the provided errors and warnings arrays.
 *
 * Validation rules:
 * - Required fields: id (non-empty string), category (valid StandardCategoryId),
 *   unit (valid Unit), baseQuantity (positive finite number > 0),
 *   scaleWithPeople (boolean), scaleWithDays (boolean)
 * - Name requirement: must have either i18nKey (non-empty string) or names.en (non-empty string)
 * - Optional fields (generate warnings if invalid):
 *   - requiresFreezer: boolean
 *   - defaultExpirationMonths: positive finite number
 *   - requiresWaterLiters: positive finite number
 *   - caloriesPerUnit: non-negative finite number
 *   - caloriesPer100g: non-negative finite number
 *   - weightGramsPerUnit: positive finite number
 *   - capacityMah: positive finite number
 *   - capacityWh: positive finite number
 *
 * @param item - The item object to validate (unknown type, validated at runtime)
 * @param index - The index of the item in the items array (used for error paths)
 * @param errors - Array to push validation errors onto (mutated as side effect)
 * @param warnings - Array to push validation warnings onto (mutated as side effect)
 * @returns void
 */
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

  // Required: baseQuantity (must be a positive finite number)
  if (
    typeof i.baseQuantity !== 'number' ||
    !Number.isFinite(i.baseQuantity) ||
    i.baseQuantity <= 0
  ) {
    errors.push({
      path: `${path}.baseQuantity`,
      message: 'baseQuantity must be a positive finite number',
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

  // Optional: defaultExpirationMonths (positive finite number)
  if (i.defaultExpirationMonths !== undefined) {
    if (
      typeof i.defaultExpirationMonths !== 'number' ||
      !Number.isFinite(i.defaultExpirationMonths) ||
      i.defaultExpirationMonths <= 0
    ) {
      warnings.push({
        path: `${path}.defaultExpirationMonths`,
        message: 'defaultExpirationMonths should be a positive finite number',
        code: 'INVALID_OPTIONAL',
      });
    }
  }

  // Optional: requiresWaterLiters (positive finite number)
  if (i.requiresWaterLiters !== undefined) {
    if (
      typeof i.requiresWaterLiters !== 'number' ||
      !Number.isFinite(i.requiresWaterLiters) ||
      i.requiresWaterLiters <= 0
    ) {
      warnings.push({
        path: `${path}.requiresWaterLiters`,
        message: 'requiresWaterLiters should be a positive finite number',
        code: 'INVALID_OPTIONAL',
      });
    }
  }

  // Optional: caloriesPerUnit (non-negative finite number)
  if (
    i.caloriesPerUnit !== undefined &&
    (typeof i.caloriesPerUnit !== 'number' ||
      !Number.isFinite(i.caloriesPerUnit) ||
      i.caloriesPerUnit < 0)
  ) {
    warnings.push({
      path: `${path}.caloriesPerUnit`,
      message: 'caloriesPerUnit should be a non-negative finite number',
      code: 'INVALID_OPTIONAL',
    });
  }

  // Optional: caloriesPer100g (non-negative finite number)
  if (
    i.caloriesPer100g !== undefined &&
    (typeof i.caloriesPer100g !== 'number' ||
      !Number.isFinite(i.caloriesPer100g) ||
      i.caloriesPer100g < 0)
  ) {
    warnings.push({
      path: `${path}.caloriesPer100g`,
      message: 'caloriesPer100g should be a non-negative finite number',
      code: 'INVALID_OPTIONAL',
    });
  }

  // Optional: weightGramsPerUnit (positive finite number)
  if (
    i.weightGramsPerUnit !== undefined &&
    (typeof i.weightGramsPerUnit !== 'number' ||
      !Number.isFinite(i.weightGramsPerUnit) ||
      i.weightGramsPerUnit <= 0)
  ) {
    warnings.push({
      path: `${path}.weightGramsPerUnit`,
      message: 'weightGramsPerUnit should be a positive finite number',
      code: 'INVALID_OPTIONAL',
    });
  }

  // Optional: capacityMah (positive finite number, battery capacity in milliamp-hours)
  if (
    i.capacityMah !== undefined &&
    (typeof i.capacityMah !== 'number' ||
      !Number.isFinite(i.capacityMah) ||
      i.capacityMah <= 0)
  ) {
    warnings.push({
      path: `${path}.capacityMah`,
      message: 'capacityMah should be a positive finite number',
      code: 'INVALID_OPTIONAL',
    });
  }

  // Optional: capacityWh (positive finite number, battery capacity in watt-hours)
  if (
    i.capacityWh !== undefined &&
    (typeof i.capacityWh !== 'number' ||
      !Number.isFinite(i.capacityWh) ||
      i.capacityWh <= 0)
  ) {
    warnings.push({
      path: `${path}.capacityWh`,
      message: 'capacityWh should be a positive finite number',
      code: 'INVALID_OPTIONAL',
    });
  }
}

/**
 * Validates a recommended items JSON structure.
 *
 * Checks that the provided data conforms to the expected RecommendedItemsFile schema,
 * including a valid meta object and an array of valid items.
 *
 * Expected input shape:
 * - meta: object with name, version, createdAt (required), and language (optional)
 * - items: non-empty array of item objects with required fields (id, category, unit,
 *   baseQuantity, scaleWithPeople, scaleWithDays) and optional fields
 *
 * Validation outcomes:
 * - errors: Critical issues that make the file invalid (missing required fields,
 *   invalid types, duplicate IDs, empty items array)
 * - warnings: Non-critical issues (invalid optional fields) that don't prevent import
 *
 * @param data - The parsed JSON data to validate (unknown type, validated at runtime)
 * @returns ValidationResult with valid boolean, errors array, and warnings array
 *
 * @example
 * const result = validateRecommendedItemsFile(parsedJson);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 */
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

/**
 * Parses and validates a recommended items JSON string.
 *
 * Parses the JSON string and validates it against the RecommendedItemsFile schema.
 * Throws an error if parsing fails or validation fails.
 *
 * @param json - The JSON string to parse
 * @returns The parsed and validated RecommendedItemsFile object
 * @throws Error if JSON parsing fails with message "Failed to parse recommended items JSON: ..."
 * @throws Error if validation fails with message "Invalid recommended items file: ..."
 *
 * @example
 * try {
 *   const file = parseRecommendedItemsFile(jsonString);
 *   console.log('Loaded', file.items.length, 'items');
 * } catch (err) {
 *   console.error('Failed to load:', err.message);
 * }
 */
export function parseRecommendedItemsFile(json: string): RecommendedItemsFile {
  let data: unknown;

  try {
    data = JSON.parse(json);
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : String(err);
    throw new Error(`Failed to parse recommended items JSON: ${message}`);
  }

  const result = validateRecommendedItemsFile(data);

  if (!result.valid) {
    const errorMessages = result.errors
      .map((e) => `${e.path}: ${e.message}`)
      .join('; ');
    throw new Error(`Invalid recommended items file: ${errorMessages}`);
  }

  return data as RecommendedItemsFile;
}

/**
 * Transforms ImportedRecommendedItem entries into the internal RecommendedItemDefinition shape.
 *
 * When an item lacks an i18nKey, a synthetic key is generated using the pattern `custom.${item.id}`.
 * These synthetic keys are intended for lookup fallback only and may require special localization
 * handling by callers (e.g., using inline names from the item instead of translation lookups).
 *
 * @param items - Array of ImportedRecommendedItem objects containing id, category, baseQuantity,
 *   unit, scaling flags, and optional properties like names, i18nKey, and nutrition data.
 * @returns Array of objects matching RecommendedItemDefinition shape with:
 *   - id: Unique identifier for the item
 *   - i18nKey: Translation key (provided or synthetic `custom.${id}`)
 *   - category: StandardCategoryId for the item's category
 *   - baseQuantity: Base quantity for calculations
 *   - unit: Unit of measurement
 *   - scaleWithPeople: Whether quantity scales with household size
 *   - scaleWithDays: Whether quantity scales with supply duration
 *   - requiresFreezer?: Whether item requires freezer storage
 *   - defaultExpirationMonths?: Default shelf life in months
 *   - weightGramsPerUnit?: Weight per unit for calculations
 *   - caloriesPer100g?: Caloric density for nutrition calculations
 *   - caloriesPerUnit?: Calories per unit for nutrition calculations
 *   - capacityMah?: Battery capacity in mAh (for power banks)
 *   - capacityWh?: Battery capacity in Wh (for power banks)
 *   - requiresWaterLiters?: Water required for preparation
 */
export function convertToRecommendedItemDefinitions(
  items: ImportedRecommendedItem[],
): RecommendedItemDefinition[] {
  return items.map((item) => ({
    id: createProductTemplateId(item.id),
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
