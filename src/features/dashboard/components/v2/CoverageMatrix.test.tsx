import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

// Standard categories are named from the `categories` namespace, not from the
// English `name` they carry. Only water is translated here so a component
// reading the wrong source still renders its raw English name and fails.
vi.mock('react-i18next', async () => {
  const { createI18nMock } = await import('@/test/i18n');
  return createI18nMock({
    language: 'fi',
    namespaces: { categories: { 'water-beverages': 'Vesi ja juomat' } },
  });
});

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

  it('counts only fully covered categories in the ratio', async () => {
    // The seeded inventory leaves most categories empty, so the covered
    // count must come out below the total rather than mirroring it.
    setup();

    const ratio = await screen.findByText(/^\d+ \/ \d+$/);
    const [covered, total] = ratio.textContent!.split('/').map((n) => +n);
    expect(total).toBeGreaterThan(0);
    expect(covered).toBeLessThan(total);
  });

  it('translates standard category names into the active language', async () => {
    // Standard categories carry no `names` map — their label comes from the
    // `categories` namespace. Reading `category.name` instead leaves the
    // dashboard in English for a Finnish user.
    renderWithProviders(<CoverageMatrix onCategorySelect={vi.fn()} />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit', language: 'fi' }),
        items: [],
      }),
    });

    const tile = await screen.findByTestId('v2-category-water-beverages');
    expect(tile).toHaveTextContent('Vesi ja juomat');
    expect(tile).not.toHaveTextContent('Water & Beverages');
  });

  it('flags a category holding nothing as critical, not ok', async () => {
    // An empty category has no critical or warning items precisely because it
    // holds no items at all. Reading that as "ok" turns a total gap into a
    // green dot — the one signal the tile exists to give.
    setup();

    const empty = await screen.findByTestId('v2-category-cooking-heat');
    expect(empty).toHaveAttribute('data-status', 'crit');
  });
});
