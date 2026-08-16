import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';

export type Status = 'ok' | 'warn' | 'crit';

/**
 * Shared caps-style fragment for v2 surfaces that need to honour the
 * theme's caps tokens. CSS variables aren't valid `textTransform`
 * values to TypeScript, so the cast is wrapped here once instead of
 * inlining the same workaround at every call site.
 *
 * Spread into a `style` prop:
 *
 *     <span style={{ ...CAPS_STYLE, color: 'var(--color-text-3)' }}>
 */
export const CAPS_STYLE = {
  textTransform: 'var(--caps-transform)' as CSSProperties['textTransform'],
  letterSpacing: 'var(--caps-tracking)',
} as const satisfies CSSProperties;

const STATUS_VAR: Record<Status, string> = {
  ok: 'var(--color-ok)',
  warn: 'var(--color-warn)',
  crit: 'var(--color-crit)',
};

const statusVar = (s: Status) => STATUS_VAR[s];

interface PanelProps {
  children: ReactNode;
  padding?: number | string;
  noBorder?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function Panel({
  children,
  padding = 16,
  noBorder,
  style,
  className,
}: Readonly<PanelProps>) {
  return (
    <div
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

interface CaptionProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Caption({ children, style }: Readonly<CaptionProps>) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--color-text-3)',
        ...CAPS_STYLE,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface TitleProps {
  children: ReactNode;
  size?: number;
  style?: CSSProperties;
}

export function Title({ children, size = 32, style }: Readonly<TitleProps>) {
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
        // At larger sizes (e.g. the 44px onboarding heading), a single long
        // word (e.g. "RECOMMENDATION") can exceed the mobile content
        // column's width; without this it overflows past the edge of the
        // screen instead of breaking.
        overflowWrap: 'break-word',
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

interface NumberDisplayProps {
  value: string | number;
  suffix?: string;
  size?: number;
  tone?: Status;
}

export function NumberDisplay({
  value,
  suffix,
  size = 56,
  tone,
}: Readonly<NumberDisplayProps>) {
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

interface StatusDotProps {
  status: Status;
  size?: number;
}

export function StatusDot({ status, size = 8 }: Readonly<StatusDotProps>) {
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

interface StatusPillProps {
  status: Status;
  children?: ReactNode;
}

function defaultStatusLabel(
  status: Status,
  themeKey: string,
  t: TFunction,
): string {
  if (status === 'ok') return t(`v2.voice.statusOk.${themeKey}`);
  if (status === 'warn') return t(`v2.voice.statusWarn.${themeKey}`);
  return t(`v2.voice.statusCrit.${themeKey}`);
}

function statusPillTextColor(
  themeKey: string,
  isCockpit: boolean,
  color: string,
): string {
  if (isCockpit) return color;
  if (themeKey === 'civil') return '#fff';
  return 'var(--color-bg-2)';
}

export function StatusPill({ status, children }: Readonly<StatusPillProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const color = statusVar(status);
  const label = children ?? defaultStatusLabel(status, themeKey, t);
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
        color: statusPillTextColor(themeKey, isCockpit, color),
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

interface StatusBarProps {
  ok: number;
  warn: number;
  crit: number;
  total: number;
  height?: number;
}

export function StatusBar({
  ok,
  warn,
  crit,
  total,
  height = 5,
}: Readonly<StatusBarProps>) {
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

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  full?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
}

function buttonVariantStyle(
  variant: ButtonVariant,
  themeKey: string,
): CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        background: 'var(--color-accent)',
        color: 'var(--color-accent-ink)',
        border: 'none',
      };
    case 'secondary':
      return {
        background: 'transparent',
        color: 'var(--color-text)',
        border: '1px solid var(--color-rule)',
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--color-text-2)',
        border: 'none',
      };
    case 'danger':
      return { background: 'var(--color-crit)', color: '#fff', border: 'none' };
    case 'success':
      return {
        background: 'var(--color-ok)',
        color: themeKey === 'cockpit' ? 'var(--color-bg)' : '#fff',
        border: 'none',
      };
  }
}

export function Button({
  children,
  variant = 'primary',
  full,
  onClick,
  type = 'button',
  disabled,
  ariaLabel,
  style,
}: Readonly<ButtonProps>) {
  const { themeKey } = useDesignTheme();
  const variantStyle = buttonVariantStyle(variant, themeKey);
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
        ...CAPS_STYLE,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        width: full ? '100%' : 'auto',
        // Without this, letter-spacing on bold caps labels (e.g. "CONTINUE
        // →") can push the shrink-to-fit width calculation just past a line
        // break even with ample room in the flex row beside it, wrapping
        // the button onto two lines.
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

interface FieldProps {
  label: string;
  value: ReactNode;
  hint?: string;
  focus?: boolean;
}

export function Field({ label, value, hint, focus }: Readonly<FieldProps>) {
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
          ...CAPS_STYLE,
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

interface AccentTextButtonProps {
  children: ReactNode;
  onClick: () => void;
  fontSize?: number;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  'data-testid'?: string;
}

/**
 * Small accent-coloured text button used for inline "Dismiss all" /
 * "Restore all" / "Enable all" actions inside panel headers and footers.
 * Mono caps, accent text, no chrome — matches the v2 panel language.
 */
export function AccentTextButton({
  children,
  onClick,
  fontSize = 10,
  'aria-label': ariaLabel,
  'aria-expanded': ariaExpanded,
  'data-testid': testId,
}: Readonly<AccentTextButtonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      data-testid={testId}
      style={{
        background: 'transparent',
        border: 0,
        color: 'var(--color-accent)',
        fontFamily: 'var(--font-mono)',
        fontSize,
        padding: 0,
        cursor: 'pointer',
        letterSpacing: '0.08em',
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

interface StatusBadgeProps {
  /** Text after the leading bullet ("LOCAL", "LIVE", …). */
  children: ReactNode;
  /** Pill outline + text colour. Defaults to the OK status colour. */
  tone?: Status;
  /** Outline / text font size. Defaults to 10. */
  fontSize?: number;
  /** Inner padding shorthand. */
  padding?: string;
}

/**
 * Small pill-shaped indicator used by the v2 Shell to show app state
 * (e.g. `● LOCAL`, `● LIVE`). Outlined, mono caps, status-tinted.
 */
export function StatusBadge({
  children,
  tone = 'ok',
  fontSize = 10,
  padding = '4px 8px',
}: Readonly<StatusBadgeProps>) {
  const color = statusVar(tone);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        border: `1px solid ${color}`,
        color,
        fontFamily: 'var(--font-mono)',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.08em',
        borderRadius: 'var(--radius-pill)',
      }}
    >
      ● {children}
    </span>
  );
}

interface CategoryCodeProps {
  children: ReactNode;
}

export function CategoryCode({ children }: Readonly<CategoryCodeProps>) {
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
