// Types
export type {
  Alert,
  AlertType,
  AlertCounts,
  TranslationFunction,
} from './types';
export { ALERT_PRIORITY } from './types';

// Constants
export {
  EXPIRING_SOON_ALERT_DAYS,
  CRITICALLY_LOW_STOCK_PERCENTAGE,
  LOW_STOCK_PERCENTAGE,
} from './constants';

// Utils
export { generateDashboardAlerts, countAlerts } from './utils';

// Hooks
export {
  useNotificationPrefs,
  readNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from './hooks/useNotificationPrefs';

// Components
export { AlertBanner, HiddenAlerts } from './components';
export type { AlertBannerProps } from './components';
