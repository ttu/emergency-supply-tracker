import { useRef, type KeyboardEvent } from 'react';
import {
  DESIGN_V2_THEMES,
  type DesignV2Theme,
  type Theme,
} from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import styles from './ThemePicker.module.css';

const PREVIEWS: Record<
  DesignV2Theme,
  {
    bg: string;
    text: string;
    text3: string;
    accent: string;
    ok: string;
    warn: string;
    crit: string;
    panel: string;
    rule: string;
    fontDisplay: string;
    fontMono: string;
    radius: number;
    pillRadius: number;
    caps: boolean;
    monoNumbers: boolean;
  }
> = {
  cockpit: {
    bg: '#0d141a',
    text: '#e6ecf0',
    text3: '#5a6975',
    accent: '#7dd3fc',
    ok: '#4ade80',
    warn: '#facc15',
    crit: '#f87171',
    panel: '#172129',
    rule: '#26333d',
    fontDisplay: "'JetBrains Mono', ui-monospace, monospace",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    radius: 4,
    pillRadius: 4,
    caps: true,
    monoNumbers: true,
  },
  civil: {
    bg: '#f4f1ea',
    text: '#0b1d2a',
    text3: '#5b6b62',
    accent: '#d94e1f',
    ok: '#2f6b3a',
    warn: '#b9851b',
    crit: '#a3340d',
    panel: '#ffffff',
    rule: '#0b1d2a',
    fontDisplay: "'Inter Tight', sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    radius: 0,
    pillRadius: 0,
    caps: true,
    monoNumbers: true,
  },
  pantry: {
    bg: '#eef0ea',
    text: '#1a2620',
    text3: '#6c7a72',
    accent: '#b35d3a',
    ok: '#506b53',
    warn: '#8a6428',
    crit: '#a14637',
    panel: '#fbfaf5',
    rule: '#d8dbcf',
    fontDisplay: "'Fraunces', Georgia, serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    radius: 12,
    pillRadius: 999,
    caps: false,
    monoNumbers: false,
  },
};

/** The household's own headline figures, shown in each theme's own voice. */
export interface ThemePreviewStats {
  readiness: number;
  daysCovered: number;
  expiringCount: number;
}

interface ThemePickerProps {
  value: Theme;
  onChange: (key: Theme) => void;
  layout?: 'grid' | 'list';
  /**
   * Real figures to render on each card. Omitted where there is no inventory
   * to describe yet — onboarding, chiefly — in which case the line is left
   * out rather than filled with numbers the household does not have.
   */
  preview?: ThemePreviewStats;
}

export function ThemePicker({
  value,
  onChange,
  layout = 'grid',
  preview,
}: Readonly<ThemePickerProps>) {
  const { t: translate } = useTranslation();
  const { themeKey: activeKey } = useDesignTheme();
  const isList = layout === 'list';

  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Roving tabindex: only the checked radio sits in the tab order, and the
  // arrow keys move both focus and the selection between the others —
  // standard keyboard behavior for a radiogroup (WAI-ARIA APG).
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next: number | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (i + 1) % DESIGN_V2_THEMES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (i - 1 + DESIGN_V2_THEMES.length) % DESIGN_V2_THEMES.length;
    }
    if (next === undefined) return;
    e.preventDefault();
    onChange(DESIGN_V2_THEMES[next]);
    buttonRefs.current[next]?.focus();
  };

  return (
    <div
      className={isList ? styles.list : styles.grid}
      role="radiogroup"
      aria-label={translate('v2.settings.appearance.themeGroupLabel')}
    >
      {DESIGN_V2_THEMES.map((key, i) => {
        const t = PREVIEWS[key];
        const name = translate(`v2.settings.appearance.themeName.${key}`);
        const selected = value === key;
        const accent = PREVIEWS[activeKey]?.accent ?? PREVIEWS.cockpit.accent;
        return (
          <button
            key={key}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(key)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            style={{
              // The selected state is carried by the border and the
              // checkmark badge below, not by an inline outline — an
              // outline set here (in either state) would win over the
              // global :focus-visible ring regardless of value, leaving
              // keyboard users without a focus indicator.
              border: `1.5px solid ${selected ? accent : t.rule}`,
              borderRadius: t.radius,
              cursor: 'pointer',
              background: t.bg,
              overflow: 'hidden',
              padding: 0,
              textAlign: 'left',
              fontFamily: 'inherit',
              color: t.text,
            }}
          >
            <div
              style={{
                // min, not a fixed height: the preview line's translated
                // text varies in length across languages and themes, and a
                // fixed box let a wrapped line spill into the info panel
                // below rather than growing to fit it.
                minHeight: 110,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: t.fontDisplay,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: t.caps ? '0.1em' : '-0.01em',
                  textTransform: t.caps ? 'uppercase' : 'none',
                  color: t.text,
                }}
              >
                {name}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['text', 'accent', 'ok', 'warn', 'crit'] as const).map(
                  (slot) => (
                    <div
                      key={slot}
                      style={{
                        width: 18,
                        height: 18,
                        background: t[slot],
                        borderRadius: t.radius,
                      }}
                    />
                  ),
                )}
              </div>
              {preview && (
                <div
                  style={{
                    fontFamily: t.fontMono,
                    fontSize: 9,
                    color: t.text3,
                    letterSpacing: '0.06em',
                  }}
                >
                  {translate(`v2.settings.appearance.themePreview.${key}`, {
                    readiness: preview.readiness,
                    days: preview.daysCovered.toFixed(1),
                    expiring: preview.expiringCount,
                  })}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  height: 4,
                  marginTop: 'auto',
                  borderRadius: t.radius,
                  overflow: 'hidden',
                }}
              >
                <div style={{ flex: 6, background: t.ok }} />
                <div style={{ flex: 3, background: t.warn }} />
                <div style={{ flex: 1, background: t.crit }} />
              </div>
            </div>
            <div
              style={{
                borderTop: `1px solid ${t.rule}`,
                padding: '10px 14px',
                background: t.panel,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: t.fontDisplay,
                    fontSize: 13,
                    fontWeight: 600,
                    color: t.text,
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontFamily: t.fontMono,
                    fontSize: 9,
                    color: t.text3,
                    marginTop: 2,
                    letterSpacing: '0.06em',
                  }}
                >
                  {translate(`v2.settings.appearance.themeDesc.${key}`)}
                </div>
              </div>
              <span
                aria-hidden
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  border: `1.5px solid ${selected ? accent : t.rule}`,
                  background: selected ? accent : 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {selected ? '✓' : ''}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
