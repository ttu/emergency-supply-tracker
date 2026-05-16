import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ThemePicker } from './ThemePicker';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderPicker = (
  value: Parameters<typeof ThemePicker>[0]['value'] = 'cockpit',
  onChange = vi.fn(),
) =>
  renderWithProviders(<ThemePicker value={value} onChange={onChange} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('ThemePicker (v2)', () => {
  it('renders a radiogroup with one radio per v2 theme', () => {
    renderPicker();
    expect(
      screen.getByRole('radiogroup', { name: 'Theme' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the active theme as aria-checked', () => {
    renderPicker('civil');
    const radios = screen.getAllByRole('radio');
    const civilRadio = radios.find((r) =>
      r.textContent?.toLowerCase().includes('civil'),
    );
    expect(civilRadio).toHaveAttribute('aria-checked', 'true');
  });

  it('clicking a theme calls onChange with its key', () => {
    const onChange = vi.fn();
    renderPicker('cockpit', onChange);
    const radios = screen.getAllByRole('radio');
    const pantry = radios.find((r) =>
      r.textContent?.toLowerCase().includes('pantry'),
    )!;
    fireEvent.click(pantry);
    expect(onChange).toHaveBeenCalledWith('pantry');
  });
});
