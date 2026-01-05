/**
 * Alert type indicating severity level
 */
export type AlertType = 'critical' | 'warning' | 'info';

/**
 * Alert priority order for sorting (lower number = higher priority)
 */
export const ALERT_PRIORITY: Record<AlertType, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

import type { AlertId } from '@/shared/types';

/**
 * Alert definition
 */
export interface Alert {
  id: AlertId;
  type: AlertType;
  message: string;
  itemName?: string;
}

/**
 * Alert counts by type
 */
export interface AlertCounts {
  critical: number;
  warning: number;
  info: number;
  total: number;
}

/**
 * Translation function type for generating localized alert messages
 */
export type TranslationFunction = (
  key: string,
  options?: Record<string, string | number>,
) => string;
