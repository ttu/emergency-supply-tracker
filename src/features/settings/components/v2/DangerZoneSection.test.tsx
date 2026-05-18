import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { DangerZoneSection } from './DangerZoneSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('DangerZoneSection (v2)', () => {
  it('renders the §11 DANGER ZONE header', () => {
    renderWithProviders(<DangerZoneSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('§11')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.danger.title.cockpit'),
    ).toBeInTheDocument();
  });
});
