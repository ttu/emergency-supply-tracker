import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SettingsRail } from './SettingsRail';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const sections = [
  { id: 'appearance', code: '01', label: 'APPEARANCE' },
  { id: 'household', code: '02', label: 'HOUSEHOLD' },
  { id: 'danger', code: '11', label: 'DANGER ZONE', danger: true },
];

const renderRail = (active: string = 'appearance', onSelect = vi.fn()) =>
  renderWithProviders(
    <SettingsRail
      sections={sections}
      activeSection={active}
      onSelect={onSelect}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('SettingsRail (v2)', () => {
  it('renders one button per section with code and label', () => {
    renderRail();
    expect(
      screen.getByRole('button', { name: /01.*APPEARANCE/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /02.*HOUSEHOLD/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /11.*DANGER ZONE/ }),
    ).toBeInTheDocument();
  });

  it('marks the active section with aria-current="true"', () => {
    renderRail('household');
    expect(
      screen.getByRole('button', { name: /02.*HOUSEHOLD/ }),
    ).toHaveAttribute('aria-current', 'true');
    expect(
      screen.getByRole('button', { name: /01.*APPEARANCE/ }),
    ).not.toHaveAttribute('aria-current');
  });

  it('clicking a section forwards its id via onSelect', () => {
    const onSelect = vi.fn();
    renderRail('appearance', onSelect);
    fireEvent.click(screen.getByRole('button', { name: /02.*HOUSEHOLD/ }));
    expect(onSelect).toHaveBeenCalledWith('household');
  });

  it('renders the AUTOSAVE / LOCAL status footer', () => {
    renderRail();
    expect(screen.getByText(/AUTOSAVE · ON/)).toBeInTheDocument();
    expect(screen.getByText('● LOCAL')).toBeInTheDocument();
  });
});
