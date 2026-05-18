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
 */
export function ClassicThemeSwitcher({
  value,
  onChange,
}: Readonly<ClassicThemeSwitcherProps>) {
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
        {t(`v2.settings.classic.blurb.${themeKey}`)}
      </p>
      <label htmlFor="classic-theme-select" style={labelStyle}>
        {t(`v2.settings.classic.label.${themeKey}`)}
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
          {t(`v2.settings.classic.placeholder.${themeKey}`)}
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
