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
    expect(screen.getByText('NUTRITION & REQUIREMENTS')).toBeInTheDocument();
    expect(screen.getByText('KCAL · PERSON · DAY')).toBeInTheDocument();
    expect(screen.getByText('WATER · PERSON · DAY')).toBeInTheDocument();
    expect(screen.getByText('CHILDREN MULTIPLIER')).toBeInTheDocument();
    expect(
      screen.getByText('TRACK HYGIENE WATER SEPARATELY'),
    ).toBeInTheDocument();
  });
});
