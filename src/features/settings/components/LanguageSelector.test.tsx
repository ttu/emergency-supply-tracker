import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from './LanguageSelector';

// Mock i18next
const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.language.option.en': '🇬🇧 English',
        'settings.language.option.fi': '🇫🇮 Suomi',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: mockChangeLanguage,
    },
  }),
  withTranslation: () => (Component: unknown) => Component,
}));

// Mock settings so persistence can be asserted directly, independent of
// whether a re-render happened to reflect it in the DOM.
const mockUpdateSettings = vi.fn();
vi.mock('@/features/settings', () => ({
  useSettings: () => ({
    settings: { language: 'en' },
    updateSettings: mockUpdateSettings,
  }),
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear();
    mockUpdateSettings.mockClear();
  });

  it('should render language selector', () => {
    render(<LanguageSelector />);

    expect(screen.getByText('settings.language.label')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should show language options', () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Check that English and Finnish options exist (with flag emojis)
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent(/English/);
    expect(options[1]).toHaveTextContent(/Suomi/);
  });

  it('should change language when option selected', () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'fi' } });

    expect(mockChangeLanguage).toHaveBeenCalledWith('fi');
  });

  it('should persist the selected language once changeLanguage resolves', async () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'fi' } });

    await vi.waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({ language: 'fi' });
    });
  });

  it('should not persist the selected language when changeLanguage rejects', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockChangeLanguage.mockRejectedValueOnce(new Error('network error'));

    render(<LanguageSelector />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'fi' } });

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to change language:',
        expect.any(Error),
      );
    });
    expect(mockUpdateSettings).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
