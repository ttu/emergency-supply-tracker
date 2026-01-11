/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider } from './NotificationProvider';
import { useNotification } from '../hooks/useNotification';
import { NotificationBar } from '../components/NotificationBar';

describe('NotificationProvider', () => {
  it('provides notification context to children', () => {
    function TestComponent() {
      const { notifications } = useNotification();
      return <div>{notifications.length} notifications</div>;
    }

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    expect(screen.getByText('0 notifications')).toBeInTheDocument();
  });

  it('allows showing notifications', async () => {
    const user = userEvent.setup();
    function TestComponent() {
      const { showNotification } = useNotification();
      return (
        <div>
          <button onClick={() => showNotification('Test', 'success')}>
            Show
          </button>
          <NotificationBar />
        </div>
      );
    }

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: /show/i }));

    expect(await screen.findByText('Test')).toBeInTheDocument();
  });

  it('allows removing notifications', async () => {
    const user = userEvent.setup();
    function TestComponent() {
      const { showNotification, notifications, removeNotification } =
        useNotification();
      return (
        <div>
          <button onClick={() => showNotification('Test', 'success')}>
            Show
          </button>
          <button
            onClick={() => {
              if (notifications.length > 0) {
                removeNotification(notifications[0].id);
              }
            }}
          >
            Remove
          </button>
          <NotificationBar />
        </div>
      );
    }

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: /show/i }));
    await screen.findByText('Test');

    await user.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });

  it('allows clearing all notifications', async () => {
    const user = userEvent.setup();
    function TestComponent() {
      const { showNotification, clearAll } = useNotification();
      return (
        <div>
          <button
            onClick={() => {
              showNotification('First', 'success');
              showNotification('Second', 'info');
            }}
          >
            Show Multiple
          </button>
          <button onClick={clearAll}>Clear All</button>
          <NotificationBar />
        </div>
      );
    }

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: /show multiple/i }));

    await screen.findByText('First');
    await screen.findByText('Second');

    await user.click(screen.getByRole('button', { name: /clear all/i }));

    await waitFor(() => {
      expect(screen.queryByText('First')).not.toBeInTheDocument();
      expect(screen.queryByText('Second')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses notifications after duration', async () => {
    // Use real timers with shorter duration for faster test
    const user = userEvent.setup();
    function TestComponent() {
      const { showNotification } = useNotification();
      return (
        <div>
          <button onClick={() => showNotification('Test', 'success', 500)}>
            Show
          </button>
          <NotificationBar />
        </div>
      );
    }

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: /show/i }));

    expect(await screen.findByText('Test')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText('Test')).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('does not auto-dismiss when duration is 0', async () => {
    const user = userEvent.setup();
    function TestComponent() {
      const { showNotification } = useNotification();
      return (
        <div>
          <button onClick={() => showNotification('Test', 'success', 0)}>
            Show
          </button>
          <NotificationBar />
        </div>
      );
    }

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: /show/i }));

    // Notification should appear
    expect(await screen.findByText('Test')).toBeInTheDocument();

    // Wait a bit to ensure it doesn't auto-dismiss (since duration is 0, it shouldn't)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Notification should still be visible
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
