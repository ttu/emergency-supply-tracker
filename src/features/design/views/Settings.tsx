import { useState, type CSSProperties } from 'react';
import { Button, Caption, Field, Panel, Title } from '../primitives';
import { ThemePicker } from '../ThemePicker';
import { ClassicThemeSwitcher } from '../ClassicThemeSwitcher';
import { useDesignTheme } from '../useDesignTheme';
import {
  useSettings,
  Settings as ClassicSettings,
  ExportButton,
  ImportButton,
  ClearDataButton,
} from '@/features/settings';
import { useHousehold } from '@/features/household';
import type { HouseholdConfig, Theme } from '@/shared/types';

export function Settings() {
  const { themeKey, voice } = useDesignTheme();
  const { settings, updateSettings } = useSettings();
  const { household, updateHousehold } = useHousehold();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const setTheme = (key: Theme) => updateSettings({ theme: key });
  const setNum = (k: keyof HouseholdConfig) => (v: number) =>
    updateHousehold({ [k]: Math.max(0, v) });

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

      {/* APPEARANCE · THEME */}
      <Panel padding={0}>
        <SectionHeader>
          {themeKey === 'pantry' ? 'Appearance · theme' : 'APPEARANCE · THEME'}
        </SectionHeader>
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

      {/* HOUSEHOLD · §2 PROFILE */}
      <Panel padding={0}>
        <SectionHeader>
          {themeKey === 'pantry'
            ? 'Household profile'
            : 'HOUSEHOLD · §2 PROFILE'}
        </SectionHeader>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: '1px solid var(--color-rule-soft)',
          }}
        >
          <NumberField
            label={themeKey === 'pantry' ? 'Adults' : 'ADULTS'}
            value={household.adults}
            onChange={setNum('adults')}
            min={1}
          />
          <NumberField
            label={themeKey === 'pantry' ? 'Children' : 'CHILDREN'}
            value={household.children}
            onChange={setNum('children')}
          />
          <NumberField
            label={themeKey === 'pantry' ? 'Pets' : 'PETS'}
            value={household.pets}
            onChange={setNum('pets')}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <NumberField
            label={
              themeKey === 'pantry'
                ? 'Coverage target (days)'
                : 'COVERAGE TARGET'
            }
            value={household.supplyDurationDays}
            onChange={setNum('supplyDurationDays')}
            min={1}
            suffix={themeKey === 'pantry' ? ' days' : ' D'}
          />
          <ToggleField
            label={themeKey === 'pantry' ? 'Use freezer' : 'FREEZER'}
            value={household.useFreezer}
            onChange={(v) => updateHousehold({ useFreezer: v })}
            onLabel={themeKey === 'pantry' ? 'Yes' : 'ENABLED'}
            offLabel={themeKey === 'pantry' ? 'No' : 'DISABLED'}
          />
        </div>
      </Panel>

      {/* NOTIFICATIONS + DATA · 2-up */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel padding={0}>
          <SectionHeader>
            {themeKey === 'pantry' ? 'Notifications' : 'NOTIFICATIONS'}
          </SectionHeader>
          <Field
            label={
              themeKey === 'pantry'
                ? 'Expiry warning window'
                : 'EXPIRY WARN WINDOW'
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
          <Field
            label={themeKey === 'pantry' ? 'High contrast' : 'HIGH CONTRAST'}
            value={settings.highContrast ? 'On' : 'Off'}
          />
        </Panel>

        <Panel padding={0}>
          <SectionHeader>
            {themeKey === 'pantry' ? 'Data & storage' : 'DATA · §3 STORAGE'}
          </SectionHeader>
          <Field
            label={themeKey === 'pantry' ? 'Storage' : 'STORAGE'}
            value={
              themeKey === 'pantry'
                ? 'Local · this device only'
                : 'LOCAL · BROWSER STORAGE'
            }
          />
          <div
            style={{
              padding: 16,
              borderBottom: '1px solid var(--color-rule-soft)',
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <ExportButton />
            <ImportButton />
          </div>
          <div
            style={{
              padding: 16,
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <ClearDataButton />
          </div>
        </Panel>
      </div>

      {/* ADVANCED — collapsible v1 settings (kits, templates, nutrition…) */}
      <Panel padding={0}>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'inherit',
            color: 'inherit',
            textAlign: 'left',
          }}
        >
          <Caption>
            {themeKey === 'pantry'
              ? 'Advanced settings'
              : 'ADVANCED · KITS · TEMPLATES · NUTRITION · BACKUP'}
          </Caption>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-2)',
            }}
            aria-hidden
          >
            {advancedOpen ? '▾ HIDE' : '▸ SHOW'}
          </span>
        </button>
        {advancedOpen && (
          <div
            style={{
              borderTop: '1px solid var(--color-rule-soft)',
              padding: '4px 0',
            }}
          >
            <ClassicSettings />
          </div>
        )}
      </Panel>

      {!advancedOpen && (
        <Button variant="secondary" onClick={() => setAdvancedOpen(true)}>
          {themeKey === 'pantry' ? 'Open advanced settings' : 'OPEN ADVANCED →'}
        </Button>
      )}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      <Caption>{children}</Caption>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  suffix?: string;
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  suffix = '',
}: NumberFieldProps) {
  const labelStyle: CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: 'var(--caps-tracking)',
    textTransform: 'var(--caps-transform)' as CSSProperties['textTransform'],
    color: 'var(--color-text-3)',
  };
  return (
    <div
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      <label style={labelStyle}>{label}</label>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          style={stepperButtonStyle}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(n);
          }}
          aria-label={label}
          style={{
            flex: 1,
            background: 'transparent',
            border: 0,
            outline: 'none',
            fontSize: 16,
            color: 'var(--color-text)',
            fontWeight: 500,
            fontFamily: 'inherit',
            minWidth: 0,
            width: '100%',
          }}
        />
        {suffix && (
          <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
            {suffix}
          </span>
        )}
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          style={stepperButtonStyle}
        >
          +
        </button>
      </div>
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  onLabel: string;
  offLabel: string;
}

function ToggleField({
  label,
  value,
  onChange,
  onLabel,
  offLabel,
}: ToggleFieldProps) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 'var(--caps-tracking)',
          textTransform:
            'var(--caps-transform)' as CSSProperties['textTransform'],
          color: 'var(--color-text-3)',
        }}
      >
        {label}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        style={{
          marginTop: 4,
          background: 'transparent',
          border: 0,
          padding: 0,
          fontSize: 16,
          color: 'var(--color-text)',
          fontWeight: 500,
          fontFamily: 'inherit',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {value ? onLabel : offLabel}
      </button>
    </div>
  );
}

const stepperButtonStyle: CSSProperties = {
  width: 28,
  height: 28,
  border: '1px solid var(--color-rule)',
  background: 'transparent',
  color: 'var(--color-text)',
  fontSize: 16,
  cursor: 'pointer',
  borderRadius: 'var(--radius-sm)',
};
