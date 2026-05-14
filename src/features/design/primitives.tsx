import type { CSSProperties, ReactNode } from 'react';
import { useDesignTheme } from './useDesignTheme';

export type Status = 'ok' | 'warn' | 'crit';

const statusVar = (s: Status) =>
  s === 'ok'
    ? 'var(--color-ok)'
    : s === 'warn'
      ? 'var(--color-warn)'
      : 'var(--color-crit)';

interface PanelProps {
  children: ReactNode;
  padding?: number | string;
  noBorder?: boolean;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  role?: string;
  ariaLabel?: string;
}

export function Panel({
  children,
  padding = 16,
  noBorder,
  style,
  className,
  onClick,
  role,
  ariaLabel,
}: PanelProps) {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--color-panel)',
        border: noBorder
          ? 'none'
          : 'var(--border-width) solid var(--color-rule)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Caption({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--color-text-3)',
        textTransform:
          'var(--caps-transform)' as CSSProperties['textTransform'],
        letterSpacing: 'var(--caps-tracking)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Title({
  children,
  size = 32,
  style,
}: {
  children: ReactNode;
  size?: number;
  style?: CSSProperties;
}) {
  const { themeKey } = useDesignTheme();
  return (
    <h1
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: size,
        fontWeight: themeKey === 'pantry' ? 400 : 600,
        letterSpacing: '-0.025em',
        lineHeight: 1.05,
        color: 'var(--color-text)',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function NumberDisplay({
  value,
  suffix,
  size = 56,
  tone,
}: {
  value: string | number;
  suffix?: string;
  size?: number;
  tone?: Status;
}) {
  const color = tone ? statusVar(tone) : 'var(--color-text)';
  return (
    <span
      style={{
        fontFamily: 'var(--display-number-font)',
        fontWeight:
          'var(--display-number-weight)' as unknown as CSSProperties['fontWeight'],
        fontSize: size,
        lineHeight: 0.9,
        color,
        letterSpacing: '-0.02em',
        fontFeatureSettings: '"tnum"',
      }}
    >
      {value}
      {suffix && (
        <span
          style={{
            fontSize: size * 0.4,
            color: 'var(--color-text-2)',
            marginLeft: 4,
          }}
        >
          {suffix}
        </span>
      )}
    </span>
  );
}

export function StatusDot({
  status,
  size = 8,
}: {
  status: Status;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: statusVar(status),
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

export function StatusPill({
  status,
  children,
}: {
  status: Status;
  children?: ReactNode;
}) {
  const { themeKey, voice } = useDesignTheme();
  const color = statusVar(status);
  const label =
    children ??
    (status === 'ok'
      ? voice.statusOk
      : status === 'warn'
        ? voice.statusWarn
        : voice.statusCrit);
  const isCockpit = themeKey === 'cockpit';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: themeKey === 'pantry' ? '3px 10px' : '3px 8px',
        borderRadius: 'var(--radius-pill)',
        background: isCockpit ? 'transparent' : color,
        color: isCockpit
          ? color
          : themeKey === 'civil'
            ? '#fff'
            : 'var(--color-bg-2)',
        border: isCockpit ? `1px solid ${color}` : 'none',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

export function StatusBar({
  ok,
  warn,
  crit,
  total,
  height = 5,
}: {
  ok: number;
  warn: number;
  crit: number;
  total: number;
  height?: number;
}) {
  const t = total <= 0 ? 1 : total;
  return (
    <div
      style={{
        display: 'flex',
        height,
        background: 'var(--color-rule-soft)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{ width: `${(ok / t) * 100}%`, background: 'var(--color-ok)' }}
      />
      <div
        style={{
          width: `${(warn / t) * 100}%`,
          background: 'var(--color-warn)',
        }}
      />
      <div
        style={{
          width: `${(crit / t) * 100}%`,
          background: 'var(--color-crit)',
        }}
      />
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

export function Button({
  children,
  variant = 'primary',
  full,
  onClick,
  type = 'button',
  disabled,
  ariaLabel,
  style,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  full?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
}) {
  const { themeKey } = useDesignTheme();
  const variantStyle: CSSProperties =
    variant === 'primary'
      ? {
          background: 'var(--color-accent)',
          color: 'var(--color-accent-ink)',
          border: 'none',
        }
      : variant === 'secondary'
        ? {
            background: 'transparent',
            color: 'var(--color-text)',
            border: '1px solid var(--color-rule)',
          }
        : variant === 'ghost'
          ? {
              background: 'transparent',
              color: 'var(--color-text-2)',
              border: 'none',
            }
          : variant === 'danger'
            ? { background: 'var(--color-crit)', color: '#fff', border: 'none' }
            : {
                background: 'var(--color-ok)',
                color: themeKey === 'cockpit' ? 'var(--color-bg)' : '#fff',
                border: 'none',
              };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        ...variantStyle,
        padding: '10px 16px',
        borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: 'var(--caps-tracking)',
        textTransform:
          'var(--caps-transform)' as CSSProperties['textTransform'],
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        width: full ? '100%' : 'auto',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  hint,
  focus,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  focus?: boolean;
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        background: focus ? 'var(--color-panel-2)' : 'transparent',
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
        {hint && (
          <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

export function CategoryCode({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        color: 'var(--color-text-3)',
      }}
    >
      {children}
    </span>
  );
}
