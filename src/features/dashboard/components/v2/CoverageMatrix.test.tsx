import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { CoverageMatrix } from './CoverageMatrix';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createCategoryId, createQuantity } from '@/shared/types';

describe('CoverageMatrix (v2)', () => {
  const setup = (onCategorySelect = vi.fn()) =>
    renderWithProviders(
      <CoverageMatrix onCategorySelect={onCategorySelect} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit', language: 'en' }),
          items: [
            createMockInventoryItem({
              categoryId: createCategoryId('water-beverages'),
              quantity: createQuantity(10),
            }),
          ],
        }),
      },
    );

  it('renders the coverage matrix caption (cockpit voice)', async () => {
    setup();
    await waitFor(() => {
      expect(
        screen.getByText('v2.dashboard.coverageTitle.cockpit'),
      ).toBeInTheDocument();
    });
  });

  it('renders a tile per category with a stable data-testid', async () => {
    setup();
    await waitFor(() => {
      expect(
        screen.getByTestId('v2-category-water-beverages'),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('v2-category-food')).toBeInTheDocument();
  });

  it('clicking a tile calls onCategorySelect with the category id', async () => {
    const onCategorySelect = vi.fn();
    setup(onCategorySelect);
    fireEvent.click(await screen.findByTestId('v2-category-water-beverages'));
    expect(onCategorySelect).toHaveBeenCalledWith('water-beverages');
  });
});
