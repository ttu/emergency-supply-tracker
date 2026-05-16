import { describe, it, expect } from 'vitest';
import { MobileShopping } from './MobileShopping';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('MobileShopping (v2)', () => {
  it('renders without crashing under cockpit', () => {
    renderWithProviders(<MobileShopping />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [],
      }),
    });
    // Sanity check — page produced some text content.
    expect(document.body.textContent).toBeTruthy();
  });
});
