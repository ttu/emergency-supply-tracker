import type { AppData } from '../../types';

const STORAGE_KEY = 'emergencySupplyTracker';

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

export function importFromJSON(json: string): AppData {
  const data = JSON.parse(json) as Partial<AppData>;

  // Ensure customCategories exists (only user's custom categories)
  if (!data.customCategories) {
    data.customCategories = [];
  }

  // Ensure customTemplates exists
  if (!data.customTemplates) {
    data.customTemplates = [];
  }

  return data as AppData;
}
