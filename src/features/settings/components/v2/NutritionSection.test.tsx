import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { NutritionSection } from './NutritionSection';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

describe('NutritionSection (v2)', () => {
  it('renders the §4 NUTRITION & REQUIREMENTS header and stepper labels', () => {
    renderWithProviders(<NutritionSection />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(screen.getByText('§4')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.calories.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.water.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.children.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.hygiene.cockpit'),
    ).toBeInTheDocument();
  });
});
