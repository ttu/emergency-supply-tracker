import type { DesignV2Theme } from '@/shared/types';

export interface Voice {
  appName: string;
  tagline: string;
  greeting: string;
  readiness: string;
  daysCovered: string;
  expiringSoon: string;
  critical: string;
  warning: string;
  ok: string;
  home: string;
  inventory: string;
  alerts: string;
  shopping: string;
  plan: string;
  guide: string;
  settings: string;
  addItem: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  back: string;
  continueAction: string;
  resolveAction: string;
  exportAction: string;
  importAction: string;
  qty: string;
  rec: string;
  expires: string;
  location: string;
  notes: string;
  category: string;
  unit: string;
  statusOk: string;
  statusWarn: string;
  statusCrit: string;
  statusInfo: string;
  onbWelcome: string;
  onbTheme: string;
  onbPreset: string;
  onbHousehold: string;
  onbItems: string;
  onbComplete: string;
}

export const VOICE: Record<DesignV2Theme, Voice> = {
  cockpit: {
    appName: 'EST',
    tagline: 'household.local',
    greeting: 'OVERVIEW',
    readiness: 'READINESS',
    daysCovered: 'DAYS COVERED',
    expiringSoon: 'EXPIRING ≤30D',
    critical: 'CRITICAL',
    warning: 'WARN',
    ok: 'OK',
    home: 'OVERVIEW',
    inventory: 'INVENTORY',
    alerts: 'ALERTS',
    shopping: 'PROCUREMENT',
    plan: 'PLAN',
    guide: 'GUIDE',
    settings: 'SETTINGS',
    addItem: '+ ADD',
    save: 'SAVE',
    cancel: 'CANCEL',
    delete: 'DELETE',
    edit: 'EDIT',
    back: 'BACK',
    continueAction: 'CONTINUE →',
    resolveAction: 'RESOLVE',
    exportAction: 'EXPORT',
    importAction: 'IMPORT',
    qty: 'QTY',
    rec: 'REC',
    expires: 'EXPIRES',
    location: 'LOC',
    notes: 'NOTES',
    category: 'CAT',
    unit: 'UNIT',
    statusOk: 'OK',
    statusWarn: 'WARN',
    statusCrit: 'CRIT',
    statusInfo: 'INFO',
    onbWelcome: 'WELCOME · LANGUAGE',
    onbTheme: 'APPEARANCE · THEME',
    onbPreset: 'PRESET · §3',
    onbHousehold: 'HOUSEHOLD · §4',
    onbItems: 'BASELINE · §5',
    onbComplete: 'PROVISIONING COMPLETE',
  },
  civil: {
    appName: 'EMERGENCY SUPPLY TRACKER',
    tagline: 'Form 72-A · Household Inventory',
    greeting: 'FORM 72-A · DASHBOARD',
    readiness: 'OVERALL READINESS',
    daysCovered: 'DAYS COVERED',
    expiringSoon: 'EXPIRING ≤ 30 DAYS',
    critical: 'CRITICAL',
    warning: 'WARNING',
    ok: 'SUFFICIENT',
    home: 'DASHBOARD',
    inventory: 'INVENTORY',
    alerts: 'ALERTS',
    shopping: 'PROCUREMENT',
    plan: 'OBJECTIVES',
    guide: 'GUIDE',
    settings: 'SETTINGS',
    addItem: '+ ADD ITEM',
    save: 'SAVE',
    cancel: 'CANCEL',
    delete: 'DELETE',
    edit: 'EDIT',
    back: 'BACK',
    continueAction: 'CONTINUE →',
    resolveAction: 'RESOLVE',
    exportAction: 'EXPORT',
    importAction: 'IMPORT',
    qty: 'QUANTITY',
    rec: 'RECOMMENDED',
    expires: 'EXPIRES',
    location: 'LOCATION',
    notes: 'NOTES',
    category: 'CATEGORY',
    unit: 'UNIT',
    statusOk: 'OK',
    statusWarn: 'WARN',
    statusCrit: 'CRIT',
    statusInfo: 'INFO',
    onbWelcome: 'WELCOME · LANGUAGE',
    onbTheme: 'APPEARANCE · THEME',
    onbPreset: 'PRESET · §3 BASELINE',
    onbHousehold: 'HOUSEHOLD · §4 PROFILE',
    onbItems: 'BASELINE · §5 LINE ITEMS',
    onbComplete: 'PROVISIONING COMPLETE',
  },
  pantry: {
    appName: 'Pantry',
    tagline: 'Calm preparedness',
    greeting: 'Good morning',
    readiness: 'Household readiness',
    daysCovered: 'Days covered',
    expiringSoon: 'Expiring soon',
    critical: 'Critical',
    warning: 'Low',
    ok: 'Sufficient',
    home: 'Overview',
    inventory: 'Inventory',
    alerts: 'Alerts',
    shopping: 'Shopping list',
    plan: 'Plan',
    guide: 'Guide',
    settings: 'Settings',
    addItem: '+ Add item',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Remove',
    edit: 'Edit',
    back: 'Back',
    continueAction: 'Continue',
    resolveAction: 'Resolve',
    exportAction: 'Export',
    importAction: 'Import',
    qty: 'You have',
    rec: 'Recommended',
    expires: 'Best before',
    location: 'Where',
    notes: 'Notes',
    category: 'Category',
    unit: 'Unit',
    statusOk: 'OK',
    statusWarn: 'Low',
    statusCrit: 'Out',
    statusInfo: 'Info',
    onbWelcome: 'Welcome',
    onbTheme: 'Appearance',
    onbPreset: 'Household size',
    onbHousehold: 'Details',
    onbItems: 'Starting kit',
    onbComplete: "You're set up",
  },
};

export const CATEGORY_CODES: Record<string, string> = {
  'water-beverages': 'H2O',
  food: 'FUD',
  'cooking-heat': 'CKH',
  'light-power': 'PWR',
  'communication-info': 'CMM',
  'medical-health': 'MED',
  'hygiene-sanitation': 'HYG',
  'tools-supplies': 'TLS',
  'cash-documents': 'DOC',
  pets: 'PET',
};

export function categoryCode(categoryId: string): string {
  return CATEGORY_CODES[categoryId] ?? categoryId.slice(0, 3).toUpperCase();
}
