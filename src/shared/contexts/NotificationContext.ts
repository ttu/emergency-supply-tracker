import { createContext } from 'react';

export type NotificationVariant = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  variant: NotificationVariant;
  duration?: number; // Auto-dismiss duration in ms, 0 = no auto-dismiss
}

export interface NotificationContextValue {
  notifications: Notification[];
  showNotification: (
    message: string,
    variant?: NotificationVariant,
    duration?: number,
  ) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const NotificationContext = createContext<
  NotificationContextValue | undefined
>(undefined);
