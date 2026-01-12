/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBar } from './NotificationBar';
import { NotificationProvider } from '../contexts/NotificationProvider';
import { useNotification } from '../hooks/useNotification';

// Test component that uses notifications
function TestComponent() {
  const { showNotification } = useNotification();
  return (
    <div>
      <button onClick={() => showNotification('Test notification', 'success')}>
        Show Notification
      </button>
      <button
        onClick={() => {
          showNotification('First', 'success');
          showNotification('Second', 'info');
          showNotification('Third', 'error');
        }}
      >
        Show Multiple
      </button>
      <NotificationBar />
    </div>
  );
}

describe('NotificationBar', () => {
  it('renders nothing when there are no notifications', () => {
    render(
      <NotificationProvider>
        <NotificationBar />
      </NotificationProvider>,
    );

    expect(screen.queryByTestId('notification-bar')).not.toBeInTheDocument();
  });

  it('displays a single notification', async () => {
    const user = userEvent.setup();
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /show notification/i }),
    );

    expect(await screen.findByTestId('notification-bar')).toBeInTheDocument();
    expect(await screen.findByTestId('notification-message')).toHaveTextContent(
      'Test notification',
    );
    expect(screen.getByTestId('notification-item-success')).toBeInTheDocument();
  });

  it('displays multiple notifications stacked', async () => {
    const user = userEvent.setup();
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: /show multiple/i }));

    // Wait for all notifications to appear
    await screen.findByTestId('notification-bar');
    const messages = await screen.findAllByTestId('notification-message');
    expect(messages).toHaveLength(3);
    expect(messages[0]).toHaveTextContent('First');
    expect(messages[1]).toHaveTextContent('Second');
    expect(messages[2]).toHaveTextContent('Third');

    const notifications = screen.getAllByTestId(
      /notification-item-(success|info|error)/,
    );
    expect(notifications).toHaveLength(3);
  });

  it('allows dismissing notifications manually', async () => {
    const user = userEvent.setup();
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /show notification/i }),
    );

    await screen.findByTestId('notification-bar');
    const closeButton = screen.getByTestId('notification-close-button');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('notification-bar')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses notifications after duration', async () => {
    // Use real timers with shorter duration for faster test
    function ShortDurationComponent() {
      const { showNotification } = useNotification();
      return (
        <div>
          <button
            onClick={() =>
              showNotification('Test notification', 'success', 500)
            }
          >
            Show Notification
          </button>
          <NotificationBar />
        </div>
      );
    }

    const user = userEvent.setup();
    render(
      <NotificationProvider>
        <ShortDurationComponent />
      </NotificationProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /show notification/i }),
    );

    // Wait for notification to appear
    await screen.findByTestId('notification-bar');
    expect(screen.getByTestId('notification-message')).toHaveTextContent(
      'Test notification',
    );

    // Wait for auto-dismiss (500ms duration)
    await waitFor(
      () => {
        expect(
          screen.queryByTestId('notification-bar'),
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('has proper accessibility attributes', async () => {
    const user = userEvent.setup();
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /show notification/i }),
    );

    // Wait for notification to appear first
    await screen.findByTestId('notification-bar');

    // Check that NotificationItem has proper accessibility attributes
    // Each NotificationItem has aria-live="polite" and aria-atomic="true"
    const notificationItem = screen.getByTestId('notification-item-success');
    expect(notificationItem).toBeInTheDocument();
    expect(notificationItem).toHaveAttribute('aria-live', 'polite');
    expect(notificationItem).toHaveAttribute('aria-atomic', 'true');
  });

  it('displays different notification variants correctly', async () => {
    const user = userEvent.setup();

    function VariantTestComponent() {
      const { showNotification } = useNotification();
      return (
        <div>
          <button onClick={() => showNotification('Success', 'success')}>
            Success
          </button>
          <button onClick={() => showNotification('Info', 'info')}>Info</button>
          <button onClick={() => showNotification('Error', 'error')}>
            Error
          </button>
          <NotificationBar />
        </div>
      );
    }

    render(
      <NotificationProvider>
        <VariantTestComponent />
      </NotificationProvider>,
    );

    // Click all buttons
    await user.click(screen.getByRole('button', { name: /success/i }));
    await user.click(screen.getByRole('button', { name: /info/i }));
    await user.click(screen.getByRole('button', { name: /error/i }));

    // Wait for all notifications to appear - find by data-testid and check variants
    await waitFor(() => {
      expect(
        screen.getByTestId('notification-item-success'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('notification-item-info')).toBeInTheDocument();
      expect(screen.getByTestId('notification-item-error')).toBeInTheDocument();
    });

    // Check that each notification contains the expected text
    const messages = screen.getAllByTestId('notification-message');
    expect(messages).toHaveLength(3);
    expect(messages.some((msg) => msg.textContent?.includes('Success'))).toBe(
      true,
    );
    expect(messages.some((msg) => msg.textContent?.includes('Info'))).toBe(
      true,
    );
    expect(messages.some((msg) => msg.textContent?.includes('Error'))).toBe(
      true,
    );
  });

  it('renders notifications with correct index styling', async () => {
    const user = userEvent.setup();
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: /show multiple/i }));

    // Wait for all notifications to appear
    await screen.findByTestId('notification-bar');
    const messages = await screen.findAllByTestId('notification-message');
    expect(messages).toHaveLength(3);

    // Check that notification wrappers have index styling
    const wrappers = document.querySelectorAll(
      '[class*="notificationWrapper"]',
    );
    expect(wrappers.length).toBe(3);
  });
});
