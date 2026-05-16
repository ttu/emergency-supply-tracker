import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { InventorySetsSection } from './InventorySetsSection';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

describe('InventorySetsSection (v2)', () => {
  it('renders the §3 INVENTORY SETS header', () => {
    renderWithProviders(<InventorySetsSection />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(screen.getByText('§3')).toBeInTheDocument();
    expect(screen.getByText('INVENTORY SETS')).toBeInTheDocument();
  });
});
