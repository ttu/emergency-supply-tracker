import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CustomKitsSection } from './CustomKitsSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('CustomKitsSection (v2)', () => {
  it('renders the §7.4 CUSTOM KITS header and sub-panels', () => {
    renderWithProviders(<CustomKitsSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('§7.4')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.customKits.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.customKits.overrides.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.customKits.templates.cockpit'),
    ).toBeInTheDocument();
  });
});
