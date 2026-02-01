import { createAlertId } from '@/shared/types';
import type { AlertType } from '@/features/alerts';

export interface AppNotificationDefinition {
  id: ReturnType<typeof createAlertId>;
  messageKey: string;
  type: AlertType;
}

/**
 * Hardcoded app notifications shown on the dashboard.
 * User can dismiss (mark as seen); seen state is persisted separately.
 */
export const APP_NOTIFICATIONS: AppNotificationDefinition[] = [
  {
    id: createAlertId('app-notification-release-testing'),
    messageKey: 'alerts.notifications.releaseTesting',
    type: 'info',
  },
  {
    id: createAlertId('app-notification-welcome'),
    messageKey: 'alerts.notifications.welcome',
    type: 'info',
  },
];
