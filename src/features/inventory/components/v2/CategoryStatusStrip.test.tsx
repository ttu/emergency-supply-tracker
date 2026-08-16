import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CategoryStatusStrip } from './CategoryStatusStrip';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderStrip = (
  overrides: Partial<Parameters<typeof CategoryStatusStrip>[0]> = {},
) =>
  renderWithProviders(
    <CategoryStatusStrip
      label="Water & Beverages"
      status="ok"
      coverage={100}
      shortCount={0}
      {...overrides}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

const coverage = () => screen.getByTestId('v2-category-strip-coverage');
const shortCount = () => screen.getByTestId('v2-category-strip-short');

describe('CategoryStatusStrip', () => {
  it('names what it is summarising', () => {
    renderStrip();
    expect(screen.getByText('Water & Beverages')).toBeInTheDocument();
  });

  it('reports the coverage it is given', () => {
    renderStrip({ coverage: 77 });
    expect(coverage()).toHaveTextContent('77%');
  });

  it('reports how many items are short', () => {
    renderStrip({ shortCount: 2 });
    expect(shortCount()).toHaveTextContent('2');
  });

  it('shows a critical pill when the category is critical', () => {
    renderStrip({ status: 'crit' });
    expect(screen.getByText('v2.voice.statusCrit.cockpit')).toBeInTheDocument();
  });

  it('shows a warning pill when the category is low', () => {
    renderStrip({ status: 'warn' });
    expect(screen.getByText('v2.voice.statusWarn.cockpit')).toBeInTheDocument();
  });

  it('shows an ok pill when the category is stocked', () => {
    renderStrip();
    expect(screen.getByText('v2.voice.statusOk.cockpit')).toBeInTheDocument();
  });

  it('draws the coverage bar to the reported percentage', () => {
    const { container } = renderStrip({ coverage: 42 });
    expect(container.querySelector('div[style*="width: 42%"]')).not.toBeNull();
  });

  it('stays readable with nothing stocked', () => {
    renderStrip({ coverage: 0, shortCount: 0, status: 'crit' });
    expect(coverage()).toHaveTextContent('0%');
    expect(shortCount()).toHaveTextContent('0');
  });

  it('reports the same figures in the stacked phone layout', () => {
    renderStrip({ stacked: true, coverage: 60, shortCount: 3 });
    expect(coverage()).toHaveTextContent('60%');
    expect(shortCount()).toHaveTextContent('3');
    expect(screen.getByText('Water & Beverages')).toBeInTheDocument();
  });
});
