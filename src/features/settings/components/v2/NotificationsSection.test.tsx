import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { NotificationsSection } from './NotificationsSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('NotificationsSection (v2)', () => {
  it('renders the §6 NOTIFICATIONS header', () => {
    renderWithProviders(<NotificationsSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('§6')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.notifications.title.cockpit'),
    ).toBeInTheDocument();
  });
});
