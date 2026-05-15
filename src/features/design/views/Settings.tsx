import { Caption, Field, Panel, Title } from '../primitives';
import { ThemePicker } from '../ThemePicker';
import { ClassicThemeSwitcher } from '../ClassicThemeSwitcher';
import { useDesignTheme } from '../useDesignTheme';
import { useSettings } from '@/features/settings';
import { useHousehold } from '@/features/household';
import type { Theme } from '@/shared/types';

export function Settings() {
  const { themeKey, voice } = useDesignTheme();
  const { settings, updateSettings } = useSettings();
  const { household } = useHousehold();

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
            padding: '20px',
            borderTop: '1px solid var(--color-rule-soft)',
          }}
        >
          <ClassicThemeSwitcher value={settings.theme} onChange={setTheme} />
        </div>
      </Panel>

      <Panel padding={0}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-rule-soft)',
          }}
        >
          <Caption>
            {themeKey === 'pantry'
              ? 'Household profile'
              : 'HOUSEHOLD · §2 PROFILE'}
          </Caption>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: '1px solid var(--color-rule-soft)',
          }}
        >
          <Field
            label={themeKey === 'pantry' ? 'Adults' : 'ADULTS'}
            value={String(household.adults)}
          />
          <Field
            label={themeKey === 'pantry' ? 'Children' : 'CHILDREN'}
            value={String(household.children)}
          />
          <Field
            label={themeKey === 'pantry' ? 'Pets' : 'PETS'}
            value={String(household.pets)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <Field
            label={themeKey === 'pantry' ? 'Target days' : 'COVERAGE TARGET'}
            value={`${household.supplyDurationDays} ${themeKey === 'pantry' ? 'days' : 'D'}`}
          />
          <Field
            label={themeKey === 'pantry' ? 'Freezer' : 'FREEZER'}
            value={
              household.useFreezer
                ? themeKey === 'pantry'
                  ? 'Yes'
                  : 'ENABLED'
                : themeKey === 'pantry'
                  ? 'No'
                  : 'DISABLED'
            }
          />
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel padding={0}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-rule-soft)',
            }}
          >
            <Caption>
              {themeKey === 'pantry' ? 'Notifications' : 'NOTIFICATIONS'}
            </Caption>
          </div>
          <Field
            label={
              themeKey === 'pantry' ? 'Expiry warnings' : 'EXPIRY WARN WINDOW'
            }
            value="30 days"
          />
          <Field
            label={
              themeKey === 'pantry'
                ? 'Low stock threshold'
                : 'LOW-STOCK THRESHOLD'
            }
            value={themeKey === 'pantry' ? '50% of target' : '50% OF TARGET'}
          />
          <Field
            label={themeKey === 'pantry' ? 'Language' : 'LANGUAGE'}
            value={settings.language.toUpperCase()}
          />
        </Panel>
        <Panel padding={0}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-rule-soft)',
            }}
          >
            <Caption>
              {themeKey === 'pantry' ? 'Data & storage' : 'DATA · §3 STORAGE'}
            </Caption>
          </div>
          <Field
            label={themeKey === 'pantry' ? 'Storage' : 'STORAGE'}
            value={
              themeKey === 'pantry'
                ? 'Local · this device only'
                : 'LOCAL · BROWSER STORAGE'
            }
          />
          <Field
            label={themeKey === 'pantry' ? 'Export' : 'EXPORT'}
            value={themeKey === 'pantry' ? 'JSON · CSV' : 'JSON · CSV'}
          />
          <Field
            label={themeKey === 'pantry' ? 'High contrast' : 'HIGH CONTRAST'}
            value={settings.highContrast ? 'On' : 'Off'}
          />
        </Panel>
      </div>
    </div>
  );
}
