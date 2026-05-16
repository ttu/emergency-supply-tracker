import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AdvancedSection } from './AdvancedSection';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

describe('AdvancedSection (v2)', () => {
  it('renders the §5 ADVANCED FEATURES header', () => {
    renderWithProviders(<AdvancedSection />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(screen.getByText('§5')).toBeInTheDocument();
    expect(screen.getByText('ADVANCED FEATURES')).toBeInTheDocument();
  });

  it('renders the capability toggle labels', () => {
    renderWithProviders(<AdvancedSection />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(screen.getByText('CALORIE TRACKING')).toBeInTheDocument();
    expect(screen.getByText('POWER MANAGEMENT')).toBeInTheDocument();
  });
});
