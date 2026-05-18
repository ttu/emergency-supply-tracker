import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardStep05Items } from './OnboardStep05Items';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const ALL_CATEGORIES = new Set([
  'water-beverages',
  'food',
  'cooking-heat',
  'light-power',
  'communication-info',
  'medical-health',
  'hygiene-sanitation',
  'tools-supplies',
  'cash-documents',
  'pets',
]);

const renderStep = (
  enabled: Set<string> = ALL_CATEGORIES,
  onToggleCategory = vi.fn(),
) =>
  renderWithProviders(
    <OnboardStep05Items
      enabledCategories={enabled}
      onToggleCategory={onToggleCategory}
      onNext={vi.fn()}
      onBack={vi.fn()}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('OnboardStep05Items (v2)', () => {
  it('renders one row per category with the cockpit codes', () => {
    renderStep();
    expect(screen.getByText('H2O')).toBeInTheDocument();
    expect(screen.getByText('FUD')).toBeInTheDocument();
    expect(screen.getByText('PET')).toBeInTheDocument();
  });

  it('shows enabled / total count in the header', () => {
    renderStep();
    expect(
      screen.getByText('v2.onboarding.step05.enabledCount.cockpit'),
    ).toBeInTheDocument();
  });

  it('clicking a row toggles the category', () => {
    const onToggleCategory = vi.fn();
    renderStep(ALL_CATEGORIES, onToggleCategory);
    fireEvent.click(screen.getByRole('button', { name: /FUD/ }));
    expect(onToggleCategory).toHaveBeenCalledWith('food');
  });

  it('uses COMMIT BASELINE → as the continue label', () => {
    renderStep();
    expect(
      screen.getByRole('button', {
        name: 'v2.onboarding.step05.primaryLabel.cockpit',
      }),
    ).toBeInTheDocument();
  });
});
