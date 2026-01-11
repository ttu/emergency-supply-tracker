import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders nothing when there are no notifications', () => {
    render(
      <NotificationProvider>
        <NotificationBar />
      </NotificationProvider>,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.skip('displays a single notification', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /show notification/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it.skip('displays multiple notifications stacked', async () => {
    const user = userEvent.setup({
      delay: null,
      advanceTimers: vi.advanceTimersByTime,
    });
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: /show multiple/i }));
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    const notifications = screen.getAllByRole('status');
    expect(notifications).toHaveLength(3);
  });

  it.skip('allows dismissing notifications manually', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /show notification/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', {
      name: /close notification/i,
    });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
    });
  });

  it.skip('auto-dismisses notifications after duration', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /show notification/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    // Fast-forward time by 3 seconds (default duration)
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
    });
  });

  it.skip('has proper accessibility attributes', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /show notification/i }),
    );

    await waitFor(() => {
      const container = screen.getByRole('region', { name: '' });
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(container).toHaveAttribute('aria-atomic', 'false');
    });
  });

  it.skip('displays different notification variants correctly', async () => {
    const user = userEvent.setup({
      delay: null,
      advanceTimers: vi.advanceTimersByTime,
    });

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

    await user.click(screen.getByRole('button', { name: /success/i }));
    vi.advanceTimersByTime(0);
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /info/i }));
    vi.advanceTimersByTime(0);
    await waitFor(() => {
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /error/i }));
    vi.advanceTimersByTime(0);
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    const notifications = screen.getAllByRole('status');
    expect(notifications).toHaveLength(3);
  });
});
