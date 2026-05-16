import { useSettings } from '@/features/settings';
import { isDesignV2Theme, type DesignV2Theme } from '@/shared/types';
import { VOICE, type Voice } from '@/shared/i18n/voice';

export interface DesignThemeContext {
  themeKey: DesignV2Theme;
  voice: Voice;
}

/** Returns the active design v2 theme + voice strings. Falls back to cockpit
 *  (which is also the default first-run theme for the new design). */
export function useDesignTheme(): DesignThemeContext {
  const { settings } = useSettings();
  const themeKey: DesignV2Theme = isDesignV2Theme(settings.theme)
    ? settings.theme
    : 'cockpit';
  return { themeKey, voice: VOICE[themeKey] };
}
