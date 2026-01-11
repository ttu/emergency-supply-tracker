import { useNotification } from '../hooks/useNotification';
import { NotificationItem } from './NotificationItem';
import styles from './NotificationBar.module.css';

/**
 * NotificationBar component that displays multiple notifications.
 * Notifications are stacked vertically and auto-dismiss based on their duration.
 * Meets WCAG 2.1 AA accessibility requirements.
 */
export function NotificationBar() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="false">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={styles.notificationWrapper}
          style={
            {
              '--index': index,
            } as React.CSSProperties
          }
        >
          <NotificationItem
            message={notification.message}
            variant={notification.variant}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}
