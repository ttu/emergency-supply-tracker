import { Caption, Panel, Title } from '../primitives';
import { ThemePicker } from '../ThemePicker';
import { ClassicThemeSwitcher } from '../ClassicThemeSwitcher';
import { useDesignTheme } from '../useDesignTheme';
import { useSettings, Settings as ClassicSettings } from '@/features/settings';
import type { Theme } from '@/shared/types';

export function Settings() {
  const { themeKey, voice } = useDesignTheme();
  const { settings, updateSettings } = useSettings();

  const setTheme = (key: Theme) => updateSettings({ theme: key });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 1100,
      }}
    >
      <div>
        <Caption>{voice.settings}</Caption>
        <Title size={32} style={{ marginTop: 4 }}>
          {themeKey === 'pantry' ? 'Settings' : 'SYSTEM CONFIGURATION'}
        </Title>
      </div>

      <Panel padding={0}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-rule-soft)',
          }}
        >
          <Caption>
            {themeKey === 'pantry'
              ? 'Appearance · theme'
              : 'APPEARANCE · THEME'}
          </Caption>
        </div>
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
      </Panel>

      {/* Embed the full classic Settings page so every section (household,
          kits, custom templates, nutrition, backup/transfer, danger zone,
          etc.) is reachable from the v2 shell. The classic page styles itself
          via the existing token bridge. */}
      <Panel padding={0}>
        <ClassicSettings />
      </Panel>
    </div>
  );
}
