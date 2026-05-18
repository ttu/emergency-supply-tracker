import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { RecommendationsSection } from './RecommendationsSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('RecommendationsSection (v2)', () => {
  it('renders the §7 RECOMMENDATIONS header', () => {
    renderWithProviders(<RecommendationsSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('§7')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.recommendations.title.cockpit'),
    ).toBeInTheDocument();
  });
});
