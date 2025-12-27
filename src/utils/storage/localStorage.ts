import type { AppData } from '../../types';
import { STANDARD_CATEGORIES } from '../../data/standardCategories';

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
  // Remove categories from export as they're always STANDARD_CATEGORIES
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { categories, ...dataWithoutCategories } = data;
  return JSON.stringify(dataWithoutCategories, null, 2);
}

export function importFromJSON(json: string): AppData {
  const data = JSON.parse(json) as Partial<AppData>;

  // Always use standard categories (they're app defaults, not user data)
  data.categories = STANDARD_CATEGORIES;

  // Ensure customTemplates exists
  if (!data.customTemplates) {
    data.customTemplates = [];
  }

  return data as AppData;
}
