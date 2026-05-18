import { useTranslation } from 'react-i18next';
import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import { useDesignPrefs } from '@/features/settings/hooks/useDesignPref';
import type { Theme } from '@/shared/types';
import { ThemePicker } from './ThemePicker';
import { ClassicThemeSwitcher } from './ClassicThemeSwitcher';
import { PanelHeader, SectionHeader, ToggleRow } from './SettingsRows';

/** §1 Appearance: theme picker, classic switcher, language, a11y toggles. */
export function AppearanceSection() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { settings, updateSettings } = useSettings();
  const [designPrefs, setDesignPref] = useDesignPrefs();
  const setTheme = (k: Theme) => updateSettings({ theme: k });

  return (
    <section id="sec-appearance" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§1"
        title={t(`v2.settings.appearance.title.${themeKey}`)}
      />
      <Panel padding={0}>
        <PanelHeader>
          {t(`v2.settings.appearance.themeHeader.${themeKey}`)}
        </PanelHeader>
        <div style={{ padding: 20 }}>
          <ThemePicker value={settings.theme} onChange={setTheme} />
        </div>
        <div
          style={{
            padding: 20,
            borderTop: '1px solid var(--color-rule-soft)',
          }}
        >
          <ClassicThemeSwitcher value={settings.theme} onChange={setTheme} />
        </div>
        <div style={{ borderTop: '1px solid var(--color-rule-soft)' }}>
          <PanelHeader>
            {t(`v2.settings.appearance.languageHeader.${themeKey}`)}
          </PanelHeader>
          <div
            style={{
              padding: 20,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            {[
              { code: 'en', label: 'English' },
              { code: 'fi', label: 'Suomi' },
            ].map((l) => {
              const sel = settings.language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() =>
                    updateSettings({ language: l.code as 'en' | 'fi' })
                  }
                  aria-pressed={sel}
                  style={{
                    padding: '12px 14px',
                    border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                    background: sel ? 'var(--color-panel-2)' : 'transparent',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 18px',
                    alignItems: 'center',
                    gap: 10,
                    fontFamily: 'inherit',
                    color: 'var(--color-text)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: sel
                        ? 'var(--color-accent)'
                        : 'var(--color-text-3)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {l.code.toUpperCase()}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 500, textAlign: 'left' }}
                  >
                    {l.label}
                  </span>
                  <span
                    aria-hidden
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                      background: sel ? 'var(--color-accent)' : 'transparent',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--color-accent-ink)',
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {sel ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <ToggleRow
          label={t(`v2.settings.appearance.highContrast.${themeKey}`)}
          hint={t(`v2.settings.appearance.highContrastHint.${themeKey}`)}
          on={!!settings.highContrast}
          onChange={(v) => updateSettings({ highContrast: v })}
        />
        <ToggleRow
          label={t(`v2.settings.appearance.reduceMotion.${themeKey}`)}
          hint={t(`v2.settings.appearance.reduceMotionHint.${themeKey}`)}
          on={designPrefs.reduceMotion}
          onChange={(v) => setDesignPref('reduceMotion', v)}
          last
        />
      </Panel>
    </section>
  );
}
