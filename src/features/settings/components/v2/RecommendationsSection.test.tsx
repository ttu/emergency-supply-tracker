import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { RecommendationsSection } from './RecommendationsSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createProductTemplateId, type AppData } from '@/shared/types';

const setup = (overrides: Partial<AppData> = {}) =>
  renderWithProviders(<RecommendationsSection />, {
    initialAppData: createMockAppData({
      settings: createMockSettings({ theme: 'cockpit', language: 'en' }),
      ...overrides,
    }),
  });

const buttonContaining = (fragment: string) =>
  screen.getAllByRole('button').find((b) => b.textContent?.includes(fragment));

describe('RecommendationsSection (v2)', () => {
  it('renders the §7 RECOMMENDATIONS header', () => {
    setup();
    expect(screen.getByText('§7')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.recommendations.title.cockpit'),
    ).toBeInTheDocument();
  });

  describe('disabled products', () => {
    it('lists the products the user turned off', async () => {
      setup({
        disabledRecommendedItems: [
          createProductTemplateId('bottled-water'),
          createProductTemplateId('canned-soup'),
        ],
      });

      // Each row shows the product id and its name; under the test
      // translator both echo the same key, hence getAllByText.
      await waitFor(() =>
        expect(screen.getAllByText('bottled-water').length).toBeGreaterThan(0),
      );
      expect(screen.getAllByText('canned-soup').length).toBeGreaterThan(0);
    });

    it('ignores ids that no longer exist in the recommendation set', async () => {
      setup({
        disabledRecommendedItems: [
          createProductTemplateId('bottled-water'),
          createProductTemplateId('a-product-that-was-removed'),
        ],
      });

      await waitFor(() =>
        expect(screen.getAllByText('bottled-water').length).toBeGreaterThan(0),
      );
      expect(
        screen.queryByText('a-product-that-was-removed'),
      ).not.toBeInTheDocument();
    });
  });

  describe('exporting the active set', () => {
    let createObjectURL: ReturnType<typeof vi.fn>;
    let revokeObjectURL: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // jsdom implements neither static, and the export builds its download
      // link from both. Patch the statics rather than replacing the global —
      // other code still needs `new URL(...)`.
      createObjectURL = vi.fn(() => 'blob:fake');
      revokeObjectURL = vi.fn();
      Object.assign(URL, { createObjectURL, revokeObjectURL });
    });
    afterEach(() => {
      Reflect.deleteProperty(URL, 'createObjectURL');
      Reflect.deleteProperty(URL, 'revokeObjectURL');
      vi.restoreAllMocks();
    });

    it('builds a downloadable file', async () => {
      const click = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});
      setup();

      const exportButton = buttonContaining(
        'v2.settings.recommendations.export',
      );
      expect(exportButton).toBeDefined();
      fireEvent.click(exportButton!);

      await waitFor(() => expect(click).toHaveBeenCalled());
      expect(createObjectURL).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalled();
    });
  });
});
