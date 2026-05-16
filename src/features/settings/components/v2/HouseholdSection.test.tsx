import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { HouseholdSection } from './HouseholdSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('HouseholdSection (v2)', () => {
  it('renders the §2 HOUSEHOLD header and profile/computed panels', () => {
    renderWithProviders(<HouseholdSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('§2')).toBeInTheDocument();
    expect(screen.getByText('HOUSEHOLD')).toBeInTheDocument();
    expect(screen.getByText(/PROFILE · §2\.1/)).toBeInTheDocument();
    expect(screen.getByText('COMPUTED · LIVE')).toBeInTheDocument();
  });

  it('renders profile steppers: ADULTS, CHILDREN, PETS, COVERAGE TARGET', () => {
    renderWithProviders(<HouseholdSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('ADULTS')).toBeInTheDocument();
    expect(screen.getByText('CHILDREN')).toBeInTheDocument();
    expect(screen.getByText('PETS')).toBeInTheDocument();
    expect(screen.getByText('COVERAGE TARGET')).toBeInTheDocument();
  });
});
