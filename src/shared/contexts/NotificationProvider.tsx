import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { NotificationContext } from './NotificationContext';
import type { Notification, NotificationVariant } from './NotificationContext';

export function NotificationProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsRef = useRef<Notification[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
      timeouts.clear();
    };
  }, []);

  const handleAutoDismiss = useCallback((id: string) => {
    notificationsRef.current = notificationsRef.current.filter(
      (n) => n.id !== id,
    );
    setNotifications(notificationsRef.current);
    timeoutsRef.current.delete(id);
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      const existingTimeout = timeoutsRef.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          handleAutoDismiss(id);
        }, duration);
        timeoutsRef.current.set(id, timeoutId);
      } else {
        timeoutsRef.current.delete(id);
      }
    },
    [handleAutoDismiss],
  );

  const showNotification = useCallback(
    (
      message: string,
      variant: NotificationVariant = 'success',
      duration: number = 3000,
    ) => {
      // If the same message is already showing, extend its timer instead of
      // stacking a duplicate toast (e.g. rapid quick-quantity button clicks).
      const existing = notificationsRef.current.find(
        (n) => n.message === message,
      );
      if (existing) {
        scheduleDismiss(existing.id, duration);
        return;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const notification: Notification = {
        id,
        message,
        variant,
        duration,
      };

      notificationsRef.current = [...notificationsRef.current, notification];
      setNotifications(notificationsRef.current);
      scheduleDismiss(id, duration);
    },
    [scheduleDismiss],
  );

  const removeNotification = useCallback((id: string) => {
    // Clear timeout if it exists
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    notificationsRef.current = notificationsRef.current.filter(
      (n) => n.id !== id,
    );
    setNotifications(notificationsRef.current);
  }, []);

  const clearAll = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    timeoutsRef.current.clear();
    notificationsRef.current = [];
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
