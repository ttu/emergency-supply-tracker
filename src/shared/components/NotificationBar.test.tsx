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

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
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

    expect(await screen.findByText('Test notification')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
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
    await screen.findByText('First');
    await screen.findByText('Second');
    await screen.findByText('Third');

    const notifications = screen.getAllByRole('status');
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

    await screen.findByText('Test notification');

    // The close button uses the translation key "accessibility.closeModal"
    const closeButton = screen.getByLabelText('accessibility.closeModal');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
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
    await screen.findByText('Test notification');
    expect(screen.getByText('Test notification')).toBeInTheDocument();

    // Wait for auto-dismiss (500ms duration)
    await waitFor(
      () => {
        expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
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
    await screen.findByText('Test notification');

    // Check that NotificationBar container has proper accessibility attributes
    // The container div has aria-live="polite" and aria-atomic="false"
    const notificationBarContainer = document.querySelector(
      '[aria-live="polite"][aria-atomic="false"]',
    );
    expect(notificationBarContainer).toBeInTheDocument();

    // Also verify notification is visible with role="status"
    expect(screen.getByRole('status')).toBeInTheDocument();
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

    // Wait for all notifications to appear - find by role and check text content
    await waitFor(() => {
      const notifications = screen.getAllByRole('status');
      expect(notifications).toHaveLength(3);

      // Check that each notification contains the expected text
      const notificationTexts = notifications.map((n) => n.textContent);
      expect(notificationTexts.some((text) => text?.includes('Success'))).toBe(
        true,
      );
      expect(notificationTexts.some((text) => text?.includes('Info'))).toBe(
        true,
      );
      expect(notificationTexts.some((text) => text?.includes('Error'))).toBe(
        true,
      );
    });
  });
});
