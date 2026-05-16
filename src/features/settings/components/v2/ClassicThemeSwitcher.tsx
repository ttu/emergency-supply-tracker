import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { SELECTABLE_THEMES, isDesignV2Theme, type Theme } from '@/shared/types';

interface ClassicThemeSwitcherProps {
  value: Theme;
  onChange: (key: Theme) => void;
}

/**
 * Lets the user drop out of the design v2 shell back into the classic app
 * by picking one of the v1 themes (light, dark, midnight, ocean, etc.).
 * Rendered inside the v2 Settings page as an explicit escape hatch.
 */
export function ClassicThemeSwitcher({
  value,
  onChange,
}: ClassicThemeSwitcherProps) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const classicThemes = SELECTABLE_THEMES.filter((k) => !isDesignV2Theme(k));

  const labelStyle: CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text-2)',
    letterSpacing: 'var(--caps-tracking)',
    textTransform: 'var(--caps-transform)' as CSSProperties['textTransform'],
    marginBottom: 8,
    display: 'block',
  };

  const blurb =
    themeKey === 'pantry'
      ? 'Prefer the original layout? Switch to a classic theme — the design v2 shell exits and the previous app comes back.'
      : 'CLASSIC THEMES RESTORE THE V1 APP SHELL. SWITCH BACK TO ANY DESIGN V2 THEME ABOVE TO RETURN.';

  return (
    <div>
      <p
        style={{
          margin: 0,
          marginBottom: 12,
          fontSize: 13,
          color: 'var(--color-text-2)',
          lineHeight: 1.5,
        }}
      >
        {blurb}
      </p>
      <label htmlFor="classic-theme-select" style={labelStyle}>
        {themeKey === 'pantry' ? 'Classic theme' : 'CLASSIC THEME'}
      </label>
      <select
        id="classic-theme-select"
        value={isDesignV2Theme(value) ? '' : value}
        onChange={(e) => {
          const next = e.target.value as Theme;
          if (next) onChange(next);
        }}
        style={{
          width: '100%',
          maxWidth: 320,
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--color-text)',
          background: 'var(--color-panel-2)',
          border: '1px solid var(--color-rule)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
        }}
      >
        <option value="" disabled>
          {themeKey === 'pantry'
            ? 'Pick a classic theme…'
            : 'PICK A CLASSIC THEME…'}
        </option>
        {classicThemes.map((k) => (
          <option key={k} value={k}>
            {t(`settings.theme.${k}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
