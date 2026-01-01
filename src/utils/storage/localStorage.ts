import type { AppData, InventoryItem } from '../../types';
import {
  CUSTOM_ITEM_TYPE,
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '../constants';
import { APP_VERSION } from '../version';

const STORAGE_KEY = 'emergencySupplyTracker';

/**
 * Map of legacy translated item type names to canonical template IDs.
 * Used to migrate old data where itemType stored translated names (e.g., "Bottled Water")
 * instead of template IDs (e.g., "bottled-water").
 *
 * Includes both English and Finnish translations.
 */
const LEGACY_ITEM_TYPE_MAP: Record<string, string> = {
  // English translations
  'bottled water': 'bottled-water',
  'long-life milk': 'long-life-milk',
  'long-life juice': 'long-life-juice',
  'canned soup': 'canned-soup',
  'canned vegetables': 'canned-vegetables',
  'canned beans': 'canned-beans',
  'canned fish': 'canned-fish',
  'canned meat': 'canned-meat',
  pasta: 'pasta',
  rice: 'rice',
  oats: 'oats',
  oatmeal: 'oatmeal',
  crackers: 'crackers',
  'energy bars': 'energy-bars',
  'cookies or energy bars': 'cookies',
  spreads: 'spreads',
  'peanut butter or nut butter': 'peanut-butter',
  'jam or honey': 'jam',
  'dried fruits': 'dried-fruits',
  nuts: 'nuts',
  'salt and sugar': 'salt-sugar',
  'coffee and tea': 'coffee-tea',
  'frozen vegetables': 'frozen-vegetables',
  'frozen meat': 'frozen-meat',
  'frozen meals': 'frozen-meals',
  'frozen bread': 'frozen-bread',
  'instant coffee or tea': 'instant-coffee',
  sugar: 'sugar',
  'camping stove or grill': 'camping-stove',
  'stove fuel (gas canisters, charcoal)': 'stove-fuel',
  matches: 'matches',
  lighter: 'lighter',
  candles: 'candles',
  'fire starter or tinder': 'fire-starter',
  flashlight: 'flashlight',
  headlamp: 'headlamp',
  'batteries aa': 'batteries-aa',
  'batteries aaa': 'batteries-aaa',
  'batteries d': 'batteries-d',
  '9v batteries': 'batteries-9v',
  'power bank': 'power-bank',
  'charging cables (usb-c, lightning, micro-usb)': 'charging-cables',
  'solar charger or hand crank charger': 'solar-charger',
  'gasoline power generator': 'power-generator',
  'gasoline for generator': 'generator-fuel',
  'battery-powered radio': 'battery-radio',
  'hand crank emergency radio': 'hand-crank-radio',
  'first aid kit': 'first-aid-kit',
  'prescription medications': 'prescription-meds',
  'pain relievers (aspirin, ibuprofen)': 'pain-relievers',
  'fever reducers': 'fever-reducers',
  'bandages and gauze': 'bandages',
  disinfectant: 'disinfectant',
  'antiseptic (alcohol, iodine)': 'antiseptic',
  thermometer: 'thermometer',
  antihistamines: 'antihistamines',
  'anti-diarrheal medication': 'diarrhea-meds',
  'tweezers and scissors': 'tweezers-scissors',
  'allergy medication': 'allergy-meds',
  'rehydration salts': 'rehydration-salts',
  'toilet paper': 'toilet-paper',
  'wet wipes': 'wet-wipes',
  'hand sanitizer': 'hand-sanitizer',
  soap: 'soap',
  toothbrush: 'toothbrush',
  toothpaste: 'toothpaste',
  'shampoo and conditioner': 'shampoo',
  deodorant: 'deodorant',
  'feminine hygiene products': 'feminine-hygiene',
  'diapers (if applicable)': 'diapers',
  'garbage bags': 'garbage-bags',
  'paper towels': 'paper-towels',
  'trash bags': 'trash-bags',
  'bucket (with lid, for sanitation)': 'bucket',
  'water container (collapsible or rigid)': 'water-container',
  'water purification tablets or filter': 'water-purification',
  'duct tape': 'duct-tape',
  'multi-tool or swiss army knife': 'multi-tool',
  'manual can opener': 'can-opener',
  'plastic bags': 'plastic-bags',
  'aluminum foil': 'aluminum-foil',
  'plastic wrap': 'plastic-wrap',
  rope: 'rope',
  'plastic sheeting or tarp': 'plastic-sheeting',
  'rope or cord': 'rope-cord',
  whistle: 'whistle',
  'emergency blanket (mylar)': 'emergency-blanket',
  'work gloves': 'work-gloves',
  'dust masks or n95 respirators': 'dust-masks',
  'cash (small bills and coins)': 'cash',
  'copies of important documents': 'document-copies',
  'emergency contact list': 'contact-list',

  // Finnish translations
  pullovesi: 'bottled-water',
  säilyvämaito: 'long-life-milk',
  säilyvämehut: 'long-life-juice',
  'säilykkeet - keitto': 'canned-soup',
  'säilykkeet - vihannekset': 'canned-vegetables',
  'säilykkeet - pavut': 'canned-beans',
  'säilykkeet - kala': 'canned-fish',
  'säilykkeet - liha': 'canned-meat',
  riisi: 'rice',
  kaura: 'oats',
  kaurapuuro: 'oatmeal',
  näkkileipä: 'crackers',
  energiapatukat: 'energy-bars',
  'keksit tai energiapatukat': 'cookies',
  levitteet: 'spreads',
  'maapähkinävoi tai pähkinävoi': 'peanut-butter',
  'hillo tai hunaja': 'jam',
  'kuivatut hedelmät': 'dried-fruits',
  pähkinät: 'nuts',
  'suola ja sokeri': 'salt-sugar',
  'kahvi ja tee': 'coffee-tea',
  pakastevihannekset: 'frozen-vegetables',
  'pakastettu liha': 'frozen-meat',
  pakasteateriat: 'frozen-meals',
  'pakastettu leipä': 'frozen-bread',
  'pikakahvi tai tee': 'instant-coffee',
  sokeri: 'sugar',
  'retkikeitin tai grilli': 'camping-stove',
  'keitinpolttoaine (kaasupatruunat, puuhiilet)': 'stove-fuel',
  tulitikut: 'matches',
  sytytin: 'lighter',
  kynttilät: 'candles',
  'tulukset tai sytyke': 'fire-starter',
  taskulamppu: 'flashlight',
  otsalamppu: 'headlamp',
  'paristot aa': 'batteries-aa',
  'paristot aaa': 'batteries-aaa',
  'paristot d': 'batteries-d',
  '9v paristot': 'batteries-9v',
  varavirtalähde: 'power-bank',
  'latausjohdot (usb-c, lightning, micro-usb)': 'charging-cables',
  'aurinkopaneeli tai kampikäyttöinen laturi': 'solar-charger',
  bensiiniaggregaatti: 'power-generator',
  'bensiini aggregaattiin': 'generator-fuel',
  'paristokäyttöinen radio': 'battery-radio',
  'kampikäyttöinen hätäradio': 'hand-crank-radio',
  ensiapulaukku: 'first-aid-kit',
  reseptilääkkeet: 'prescription-meds',
  'kipulääkkeet (aspiriini, ibuprofeeni)': 'pain-relievers',
  kuumelääkkeet: 'fever-reducers',
  'siteet ja harsot': 'bandages',
  desinfiointiaine: 'disinfectant',
  'antiseptiset aineet (alkoholi, jodi)': 'antiseptic',
  kuumemittari: 'thermometer',
  antihistamiinit: 'antihistamines',
  ripulilääke: 'diarrhea-meds',
  'pinsetti ja sakset': 'tweezers-scissors',
  allergialääke: 'allergy-meds',
  nesteytyssuolat: 'rehydration-salts',
  'wc-paperi': 'toilet-paper',
  kosteuspyyhkeet: 'wet-wipes',
  käsidesi: 'hand-sanitizer',
  saippua: 'soap',
  hammasharja: 'toothbrush',
  hammastahna: 'toothpaste',
  'shampoo ja hoitoaine': 'shampoo',
  deodorantti: 'deodorant',
  'naisten hygieniaturotteet': 'feminine-hygiene',
  'vaipat (tarvittaessa)': 'diapers',
  jätesäkit: 'garbage-bags',
  talouspyyhkeet: 'paper-towels',
  roskapussit: 'trash-bags',
  'ämpäri (kannella, sanitaatioon)': 'bucket',
  'vesisäiliö (kokoontaitettava tai jäykkä)': 'water-container',
  'vedenpuhdistustabletit tai suodatin': 'water-purification',
  ilmastointiteippi: 'duct-tape',
  'monitoimityökalu tai linkkuveitsi': 'multi-tool',
  'käsikäyttöinen purkinavaaja': 'can-opener',
  muovipussit: 'plastic-bags',
  alumiinifolio: 'aluminum-foil',
  kelmukalvo: 'plastic-wrap',
  köysi: 'rope',
  'muovikalvo tai pressu': 'plastic-sheeting',
  'köysi tai naru': 'rope-cord',
  pilli: 'whistle',
  'hätäpeite (mylar)': 'emergency-blanket',
  työkäsineet: 'work-gloves',
  'pölynaamari tai n95 hengityssuojain': 'dust-masks',
  'käteinen (pienet setelit ja kolikot)': 'cash',
  'kopiot tärkeistä asiakirjoista': 'document-copies',
  'hätänumeroiden lista': 'contact-list',
};

/**
 * Checks if a value looks like a valid template ID (kebab-case).
 */
function isTemplateId(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

/**
 * Normalizes an itemType value to a canonical template ID.
 * Handles migration from legacy translated names to template IDs.
 *
 * @param itemType - The current itemType value (may be translated name or template ID)
 * @param itemName - The item name (used as fallback for matching)
 * @returns The canonical template ID, or CUSTOM_ITEM_TYPE if no match found
 */
function normalizeItemType(
  itemType: string | undefined,
  itemName: string,
): string {
  // If itemType is already a valid template ID, use it
  if (itemType && isTemplateId(itemType)) {
    return itemType;
  }

  // Try to find a match in the legacy map using itemType
  if (itemType) {
    const normalizedItemType = itemType.toLowerCase().trim();
    const mappedId = LEGACY_ITEM_TYPE_MAP[normalizedItemType];
    if (mappedId) {
      return mappedId;
    }
  }

  // Try to find a match using item name as fallback
  const normalizedName = itemName.toLowerCase().trim();
  const mappedFromName = LEGACY_ITEM_TYPE_MAP[normalizedName];
  if (mappedFromName) {
    return mappedFromName;
  }

  // No match found - use custom item type
  return CUSTOM_ITEM_TYPE;
}

/**
 * Normalizes inventory items by migrating legacy itemType values.
 */
function normalizeItems(
  items: InventoryItem[] | undefined,
): InventoryItem[] | undefined {
  if (!items) return items;

  return items.map((item) => ({
    ...item,
    itemType: normalizeItemType(item.itemType, item.name),
  }));
}

export function createDefaultAppData(): AppData {
  return {
    version: '1.0.0',
    household: {
      adults: 2,
      children: 0,
      supplyDurationDays: 7,
      useFreezer: false,
    },
    settings: {
      language: 'en',
      theme: 'light',
      highContrast: false,
      advancedFeatures: {
        calorieTracking: false,
        powerManagement: false,
        waterTracking: false,
      },
      dailyCaloriesPerPerson: DAILY_CALORIES_PER_PERSON,
      dailyWaterPerPerson: DAILY_WATER_PER_PERSON,
      childrenRequirementPercentage: CHILDREN_REQUIREMENT_MULTIPLIER * 100,
    },
    customCategories: [],
    items: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    lastModified: new Date().toISOString(),
  };
}

export function getAppData(): AppData | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    const data = JSON.parse(json) as AppData;

    // Normalize items: migrate legacy itemType values to template IDs
    data.items = normalizeItems(data.items) ?? [];

    return data;
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return null;
  }
}

export function saveAppData(data: AppData): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
  }
}

export function clearAppData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export data structure that extends AppData with export metadata.
 */
export interface ExportData extends AppData {
  exportMetadata: {
    exportedAt: string; // ISO 8601 timestamp
    appVersion: string; // App version that created export
    itemCount: number;
    categoryCount: number;
  };
}

/**
 * Exports app data to JSON format with export metadata.
 * Includes version information and export timestamp for tracking.
 *
 * @param data - AppData to export
 * @returns JSON string with app data and export metadata
 */
export function exportToJSON(data: AppData): string {
  const exportData: ExportData = {
    ...data,
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      itemCount: data.items?.length ?? 0,
      categoryCount:
        (data.customCategories?.length ?? 0) +
        // Standard categories are always available (9 standard categories)
        9,
    },
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Parses and normalizes imported JSON data into AppData format.
 * Ensures required fields exist and sets onboardingCompleted to true
 * since imported data represents an already-configured setup.
 *
 * @param json - JSON string containing app data to import
 * @returns Parsed and normalized AppData object
 * @throws Error if JSON parsing fails (invalid JSON format)
 */
export function importFromJSON(json: string): AppData {
  let data: Partial<AppData>;

  try {
    data = JSON.parse(json) as Partial<AppData>;
  } catch (error) {
    console.error('Failed to parse import JSON:', error);
    throw error;
  }

  // Ensure customCategories exists (only user's custom categories)
  if (!data.customCategories) {
    data.customCategories = [];
  }

  // Ensure customTemplates exists
  if (!data.customTemplates) {
    data.customTemplates = [];
  }

  // Ensure dismissedAlertIds exists
  if (!data.dismissedAlertIds) {
    data.dismissedAlertIds = [];
  }

  // Ensure disabledRecommendedItems exists
  if (!data.disabledRecommendedItems) {
    data.disabledRecommendedItems = [];
  }

  // Normalize items: migrate legacy itemType values and set neverExpires flag
  if (data.items) {
    // First normalize itemType values (migrate legacy translated names to template IDs)
    data.items = normalizeItems(data.items as InventoryItem[]);

    // Then handle neverExpires normalization
    data.items = data.items?.map((item) => ({
      ...item,
      neverExpires: item.expirationDate === null ? true : item.neverExpires,
    }));
  }

  // When importing data, always skip onboarding since user has configured data
  if (data.settings) {
    data.settings.onboardingCompleted = true;
  }

  return data as AppData;
}
