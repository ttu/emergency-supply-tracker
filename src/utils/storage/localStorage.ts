import type { AppData } from '../../types';

const STORAGE_KEY = 'emergencySupplyTracker';

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
    return JSON.parse(json) as AppData;
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

export function exportToJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
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

  // When importing data, always skip onboarding since user has configured data
  if (data.settings) {
    data.settings.onboardingCompleted = true;
  }

  return data as AppData;
}
