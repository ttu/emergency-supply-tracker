import { useSettings } from '@/features/settings';
import { isDesignV2Theme, type DesignV2Theme } from '@/shared/types';

export interface DesignThemeContext {
  themeKey: DesignV2Theme;
}

/**
 * Returns the active design v2 theme key.
 *
 * String content per theme lives in i18n (`v2.voice.*` in common.json) and
 * is read by components via `useTranslation()` — this hook intentionally no
 * longer returns a `voice` object. Falls back to `cockpit` (the default
 * first-run theme) when the stored theme is not a v2 theme.
 */
export function useDesignTheme(): DesignThemeContext {
  const { settings } = useSettings();
  const themeKey: DesignV2Theme = isDesignV2Theme(settings.theme)
    ? settings.theme
    : 'cockpit';
  return { themeKey };
}
