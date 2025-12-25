import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertBanner } from './AlertBanner';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.alerts.title': 'Alerts',
        'actions.dismiss': 'Dismiss',
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
            id: '1',
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
            id: '1',
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
            id: '1',
            type: 'critical',
            message: 'Item has expired',
            itemName: 'First Aid Kit',
          },
          {
            id: '2',
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
    const onDismiss = jest.fn();

    render(
      <AlertBanner
        alerts={[
          {
            id: '1',
            type: 'info',
            message: 'Test alert',
          },
        ]}
        onDismiss={onDismiss}
      />,
    );

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledWith('1');
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(
      <AlertBanner
        alerts={[
          {
            id: '1',
            type: 'info',
            message: 'Test alert',
          },
        ]}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
