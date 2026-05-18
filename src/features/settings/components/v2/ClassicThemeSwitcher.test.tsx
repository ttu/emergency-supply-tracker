import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ClassicThemeSwitcher } from './ClassicThemeSwitcher';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';
import { SELECTABLE_THEMES, isDesignV2Theme } from '@/shared/types';

const renderSwitcher = (
  value: Parameters<typeof ClassicThemeSwitcher>[0]['value'] = 'cockpit',
  onChange = vi.fn(),
) =>
  renderWithProviders(
    <ClassicThemeSwitcher value={value} onChange={onChange} />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('ClassicThemeSwitcher (v2)', () => {
  it('renders a CLASSIC THEME label and a select', () => {
    renderSwitcher();
    expect(
      screen.getByText('v2.settings.classic.label.cockpit'),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('lists every classic (non-v2) theme as an option', () => {
    renderSwitcher();
    const classicCount = SELECTABLE_THEMES.filter(
      (t) => !isDesignV2Theme(t),
    ).length;
    // +1 for the disabled placeholder option
    expect(screen.getAllByRole('option')).toHaveLength(classicCount + 1);
  });

  it('changing the selection calls onChange with the picked theme', () => {
    const onChange = vi.fn();
    renderSwitcher('cockpit', onChange);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const firstClassic = SELECTABLE_THEMES.find((t) => !isDesignV2Theme(t))!;
    fireEvent.change(select, { target: { value: firstClassic } });
    expect(onChange).toHaveBeenCalledWith(firstClassic);
  });

  it('shows the placeholder when a v2 theme is active', () => {
    renderSwitcher('cockpit');
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('');
  });
});
