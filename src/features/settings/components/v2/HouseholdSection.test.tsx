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
    expect(
      screen.getByText('v2.settings.household.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.profileHeader.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.calculated.cockpit'),
    ).toBeInTheDocument();
  });

  it('renders profile steppers: ADULTS, CHILDREN, PETS, COVERAGE TARGET', () => {
    renderWithProviders(<HouseholdSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(
      screen.getByText('v2.settings.household.adults.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.children.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.pets.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.days.cockpit'),
    ).toBeInTheDocument();
  });
});
