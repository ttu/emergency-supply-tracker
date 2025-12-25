import { useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

export function ThemeApplier({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  return <>{children}</>;
}
