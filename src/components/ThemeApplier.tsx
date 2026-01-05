import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/features/settings';

export function ThemeApplier({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    // Apply high contrast mode to document root
    document.documentElement.setAttribute(
      'data-high-contrast',
      settings.highContrast ? 'true' : 'false',
    );
  }, [settings.highContrast]);

  useEffect(() => {
    // Apply language to document root for accessibility
    const lang = i18n?.language || 'en';
    document.documentElement.setAttribute('lang', lang);
  }, [i18n?.language]);

  return <>{children}</>;
}
