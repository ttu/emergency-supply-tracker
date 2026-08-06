import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Caption, Title } from '@/shared/components/design-v2/primitives';

// Re-export so existing imports from './SettingsRows' keep working.
export { Caption };

interface SectionHeaderProps {
  code: string;
  title: string;
  sub?: string;
}

/** Compact section header used in the sectioned Settings page. */
export function SectionHeader({
  code,
  title,
  sub,
}: Readonly<SectionHeaderProps>) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        marginBottom: 14,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-3)',
          fontWeight: 600,
          letterSpacing: '0.08em',
        }}
      >
        {code}
      </span>
      <Title size={22}>{title}</Title>
      {sub && (
        <span
          style={{
            fontSize: 13,
            color: 'var(--color-text-2)',
            marginLeft: 'auto',
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

interface PanelHeaderProps {
  children: ReactNode;
}

export function PanelHeader({ children }: Readonly<PanelHeaderProps>) {
  return (
    <div
      style={{
        padding: '14px 22px',
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      <Caption>{children}</Caption>
    </div>
  );
}

interface ToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

export function Toggle({ on, onChange, ariaLabel }: Readonly<ToggleProps>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: on ? 'var(--color-accent)' : 'var(--color-rule)',
        position: 'relative',
        flexShrink: 0,
        border: 0,
        padding: 0,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: 999,
          background: 'var(--color-bg-2)',
          transition: 'left 150ms',
        }}
      />
    </button>
  );
}

interface ToggleRowProps {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}

export function ToggleRow({
  label,
  hint,
  on,
  onChange,
  last,
}: Readonly<ToggleRowProps>) {
  return (
    <div
      style={{
        padding: '16px 22px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 16,
        alignItems: 'center',
        borderBottom: last ? 'none' : '1px solid var(--color-rule-soft)',
      }}
    >
      <div>
        <div
          style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}
        >
          {label}
        </div>
        {hint && (
          <div
            style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 3 }}
          >
            {hint}
          </div>
        )}
      </div>
      <Toggle on={on} onChange={onChange} ariaLabel={label} />
    </div>
  );
}

interface StepperRowProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  decimals?: number;
  last?: boolean;
}

export function StepperRow({
  label,
  hint,
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  suffix,
  decimals = 0,
  last,
}: Readonly<StepperRowProps>) {
  const { t } = useTranslation();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const display =
    decimals > 0 ? value.toFixed(decimals) : value.toLocaleString();
  return (
    <div
      style={{
        padding: '14px 22px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 16,
        alignItems: 'center',
        borderBottom: last ? 'none' : '1px solid var(--color-rule-soft)',
      }}
    >
      <div>
        <Caption>{label}</Caption>
        {hint && (
          <div
            style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 4 }}
          >
            {hint}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          aria-label={t('v2.settings.stepperDecreaseAria', { label })}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          style={stepperButtonStyle(false)}
        >
          −
        </button>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 20,
            fontWeight: 600,
            minWidth: 64,
            textAlign: 'center',
            color: 'var(--color-text)',
            fontFeatureSettings: '"tnum"',
          }}
        >
          {display}
          {suffix && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--color-text-2)',
                marginLeft: 4,
              }}
            >
              {suffix}
            </span>
          )}
        </span>
        <button
          type="button"
          aria-label={t('v2.settings.stepperIncreaseAria', { label })}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          style={stepperButtonStyle(true)}
        >
          +
        </button>
      </div>
    </div>
  );
}

function stepperButtonStyle(primary: boolean): CSSProperties {
  return primary
    ? {
        width: 32,
        height: 32,
        background: 'var(--color-accent)',
        color: 'var(--color-accent-ink)',
        border: 'none',
        fontSize: 16,
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
      }
    : {
        width: 32,
        height: 32,
        border: '1px solid var(--color-rule)',
        background: 'transparent',
        color: 'var(--color-text)',
        fontSize: 16,
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
      };
}

interface ReadFieldProps {
  label: string;
  value: ReactNode;
  hint?: string;
  onAction?: () => void;
  last?: boolean;
}

export function ReadField({
  label,
  value,
  hint,
  onAction,
  last,
}: Readonly<ReadFieldProps>) {
  return (
    <div
      style={{
        padding: '14px 22px',
        borderBottom: last ? 'none' : '1px solid var(--color-rule-soft)',
      }}
    >
      <Caption>{label}</Caption>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: 4,
        }}
      >
        <span
          style={{ fontSize: 16, color: 'var(--color-text)', fontWeight: 500 }}
        >
          {value}
        </span>
        {hint &&
          (onAction ? (
            <button
              type="button"
              onClick={onAction}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {hint}
            </button>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
              {hint}
            </span>
          ))}
      </div>
    </div>
  );
}
