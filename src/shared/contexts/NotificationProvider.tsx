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
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    timeoutsRef.current.delete(id);
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
        const timeoutId = setTimeout(() => {
          handleAutoDismiss(id);
        }, duration);
        timeoutsRef.current.set(id, timeoutId);
      }
    },
    [handleAutoDismiss],
  );

  const removeNotification = useCallback((id: string) => {
    // Clear timeout if it exists
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    timeoutsRef.current.clear();
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
