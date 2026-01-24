import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertBanner } from './AlertBanner';
import { createAlertId } from '@/shared/types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.alerts.title': 'Alerts',
        'actions.dismiss': 'Dismiss',
        'actions.dismissAll': 'Dismiss all',
      };
      return translations[key] || key;
    },
  }),
}));

describe('AlertBanner', () => {
  it('renders nothing when there are no alerts', () => {
    const { container } = render(<AlertBanner alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders alert message', () => {
    render(
      <AlertBanner
        alerts={[
          {
            id: createAlertId('1'),
            type: 'warning',
            message: 'Running low on stock',
          },
        ]}
      />,
    );

    expect(screen.getByText('Running low on stock')).toBeInTheDocument();
  });

  it('renders item name when provided', () => {
    render(
      <AlertBanner
        alerts={[
          {
            id: createAlertId('1'),
            type: 'critical',
            message: 'Item has expired',
            itemName: 'Bottled Water',
          },
        ]}
      />,
    );

    expect(screen.getByText('Bottled Water:')).toBeInTheDocument();
    expect(screen.getByText('Item has expired')).toBeInTheDocument();
  });

  it('renders multiple alerts', () => {
    render(
      <AlertBanner
        alerts={[
          {
            id: createAlertId('1'),
            type: 'critical',
            message: 'Item has expired',
            itemName: 'First Aid Kit',
          },
          {
            id: createAlertId('2'),
            type: 'warning',
            message: 'Running low',
            itemName: 'Batteries',
          },
        ]}
      />,
    );

    expect(screen.getByText('First Aid Kit:')).toBeInTheDocument();
    expect(screen.getByText('Batteries:')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const alertId = createAlertId('1');

    render(
      <AlertBanner
        alerts={[
          {
            id: alertId,
            type: 'info',
            message: 'Test alert',
          },
        ]}
        onDismiss={onDismiss}
      />,
    );

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledWith(alertId);
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(
      <AlertBanner
        alerts={[
          {
            id: createAlertId('1'),
            type: 'info',
            message: 'Test alert',
          },
        ]}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders Dismiss all button when onDismissAll is provided', () => {
    render(
      <AlertBanner
        alerts={[
          { id: createAlertId('1'), type: 'warning', message: 'Alert 1' },
          { id: createAlertId('2'), type: 'info', message: 'Alert 2' },
        ]}
        onDismiss={vi.fn()}
        onDismissAll={vi.fn()}
      />,
    );

    const dismissAllButton = screen.getByRole('button', {
      name: 'Dismiss all',
    });
    expect(dismissAllButton).toBeInTheDocument();
    expect(dismissAllButton).toHaveAttribute(
      'data-testid',
      'dismiss-all-alerts',
    );
  });

  it('calls onDismissAll when Dismiss all button is clicked', async () => {
    const user = userEvent.setup();
    const onDismissAll = vi.fn();

    render(
      <AlertBanner
        alerts={[
          { id: createAlertId('1'), type: 'warning', message: 'Alert 1' },
          { id: createAlertId('2'), type: 'info', message: 'Alert 2' },
        ]}
        onDismiss={vi.fn()}
        onDismissAll={onDismissAll}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Dismiss all' }));

    expect(onDismissAll).toHaveBeenCalledTimes(1);
  });

  it('does not render Dismiss all button when onDismissAll is not provided', () => {
    render(
      <AlertBanner
        alerts={[
          { id: createAlertId('1'), type: 'warning', message: 'Alert 1' },
          { id: createAlertId('2'), type: 'info', message: 'Alert 2' },
        ]}
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Dismiss all' }),
    ).not.toBeInTheDocument();
  });
});
