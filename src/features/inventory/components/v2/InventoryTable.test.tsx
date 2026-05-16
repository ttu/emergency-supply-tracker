import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { InventoryTable } from './InventoryTable';
import { renderWithProviders } from '@/test/render';
import {
  createMockInventoryItem,
  createMockCategory,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createQuantity } from '@/shared/types';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';

const row = (name: string, code: string): DesignItemRow => ({
  item: createMockInventoryItem({ name, quantity: createQuantity(5) }),
  recommended: 10,
  category: createMockCategory({ name: code }),
  categoryCode: code,
  status: 'ok',
});

const renderTable = (rows: DesignItemRow[], totalRowCount = rows.length) =>
  renderWithProviders(
    <InventoryTable
      rows={rows}
      totalRowCount={totalRowCount}
      onItemSelect={vi.fn()}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('InventoryTable (v2)', () => {
  it('renders header columns in cockpit voice', () => {
    renderTable([]);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText(/QTY\s*\/\s*REC/)).toBeInTheDocument();
    expect(screen.getByText('EXPIRES')).toBeInTheDocument();
    expect(screen.getByText('LOC')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders empty state when there are no rows', () => {
    renderTable([], 0);
    expect(screen.getByText(/EMPTY|No items match/)).toBeInTheDocument();
  });

  it('renders one row per item', () => {
    renderTable([row('A', 'AAA'), row('B', 'BBB')]);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders footer with showing/total count', () => {
    renderTable([row('A', 'AAA')], 5);
    expect(screen.getByText(/Showing\s*1\s*of\s*5/)).toBeInTheDocument();
  });

  it('clicking a row forwards onItemSelect with item id', () => {
    const onItemSelect = vi.fn();
    const r1 = row('A', 'AAA');
    renderWithProviders(
      <InventoryTable
        rows={[r1]}
        totalRowCount={1}
        onItemSelect={onItemSelect}
      />,
      {
        initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
      },
    );
    fireEvent.click(screen.getByText('A'));
    expect(onItemSelect).toHaveBeenCalledWith(String(r1.item.id));
  });
});
