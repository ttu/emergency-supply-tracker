import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CategoriesSection } from './CategoriesSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('CategoriesSection (v2)', () => {
  it('renders the §8 CATEGORIES header', () => {
    renderWithProviders(<CategoriesSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('§8')).toBeInTheDocument();
    expect(screen.getByText('CATEGORIES')).toBeInTheDocument();
  });
});
