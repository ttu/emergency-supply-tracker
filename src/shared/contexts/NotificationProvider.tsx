import { useState, useCallback, useMemo, ReactNode } from 'react';
import { NotificationContext } from './NotificationContext';
import type { Notification, NotificationVariant } from './NotificationContext';

export function NotificationProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleAutoDismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (
      message: string,
      variant: NotificationVariant = 'success',
      duration: number = 3000,
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      const notification: Notification = {
        id,
        message,
        variant,
        duration,
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-dismiss if duration > 0
      if (duration > 0) {
        setTimeout(() => {
          handleAutoDismiss(id);
        }, duration);
      }
    },
    [handleAutoDismiss],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue = useMemo(
    () => ({
      notifications,
      showNotification,
      removeNotification,
      clearAll,
    }),
    [notifications, showNotification, removeNotification, clearAll],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}
