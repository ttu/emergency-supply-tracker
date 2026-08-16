import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Caption, Title } from '@/shared/components/design-v2/primitives';
import styles from './SettingsRows.module.css';

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
    <div className={styles.sectionHeader}>
      <span className={styles.sectionHeaderCode}>{code}</span>
      <Title size={22}>{title}</Title>
      {sub && <span className={styles.sectionHeaderSub}>{sub}</span>}
    </div>
  );
}

interface PanelHeaderProps {
  children: ReactNode;
}

export function PanelHeader({ children }: Readonly<PanelHeaderProps>) {
  return (
    <div className={styles.panelHeader}>
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
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
    >
      <div
        className={`${styles.toggleThumb} ${on ? styles.toggleThumbOn : ''}`}
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
    <div className={`${styles.row} ${last ? styles.rowLast : ''}`}>
      <div>
        <div className={styles.rowLabel}>{label}</div>
        {hint && <div className={styles.rowHint}>{hint}</div>}
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
      className={`${styles.stepperRow} ${last ? styles.stepperRowLast : ''}`}
    >
      <div>
        <Caption>{label}</Caption>
        {hint && <div className={styles.stepperHint}>{hint}</div>}
      </div>
      <div className={styles.stepperControls}>
        <button
          type="button"
          aria-label={t('v2.settings.stepperDecreaseAria', { label })}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className={styles.stepperButton}
        >
          −
        </button>
        <span className={styles.stepperValue}>
          {display}
          {suffix && <span className={styles.stepperSuffix}>{suffix}</span>}
        </span>
        <button
          type="button"
          aria-label={t('v2.settings.stepperIncreaseAria', { label })}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          className={`${styles.stepperButton} ${styles.stepperButtonPrimary}`}
        >
          +
        </button>
      </div>
    </div>
  );
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
    <div className={`${styles.readField} ${last ? styles.readFieldLast : ''}`}>
      <Caption>{label}</Caption>
      <div className={styles.readFieldRow}>
        <span className={styles.readFieldValue}>{value}</span>
        {hint &&
          (onAction ? (
            <button
              type="button"
              onClick={onAction}
              className={styles.readFieldActionButton}
            >
              {hint}
            </button>
          ) : (
            <span className={styles.readFieldHintText}>{hint}</span>
          ))}
      </div>
    </div>
  );
}
