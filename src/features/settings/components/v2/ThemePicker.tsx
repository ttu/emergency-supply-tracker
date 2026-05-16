import type { CSSProperties } from 'react';
import {
  DESIGN_V2_THEMES,
  type DesignV2Theme,
  type Theme,
} from '@/shared/types';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';

const PREVIEWS: Record<
  DesignV2Theme,
  {
    name: string;
    description: string;
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
    name: 'Cockpit',
    description: 'Dark operational console',
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
    name: 'Civil Defense',
    description: 'Official document',
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
    name: 'Pantry',
    description: 'Calm, Nordic',
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

interface ThemePickerProps {
  value: Theme;
  onChange: (key: Theme) => void;
  layout?: 'grid' | 'list';
}

export function ThemePicker({
  value,
  onChange,
  layout = 'grid',
}: ThemePickerProps) {
  const { themeKey: activeKey } = useDesignTheme();
  const isList = layout === 'list';
  const containerStyle: CSSProperties = isList
    ? { display: 'flex', flexDirection: 'column', gap: 8 }
    : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 };

  return (
    <div style={containerStyle} role="radiogroup" aria-label="Theme">
      {DESIGN_V2_THEMES.map((key) => {
        const t = PREVIEWS[key];
        const selected = value === key;
        const accent =
          PREVIEWS[activeKey as DesignV2Theme]?.accent ??
          PREVIEWS.cockpit.accent;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            style={{
              border: `1.5px solid ${selected ? accent : t.rule}`,
              borderRadius: t.radius,
              cursor: 'pointer',
              background: t.bg,
              overflow: 'hidden',
              outline: selected ? `2px solid ${accent}` : 'none',
              outlineOffset: -3,
              padding: 0,
              textAlign: 'left',
              fontFamily: 'inherit',
              color: t.text,
            }}
          >
            <div
              style={{
                height: 110,
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
                {t.name}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[t.text, t.accent, t.ok, t.warn, t.crit].map((c, j) => (
                  <div
                    key={j}
                    style={{
                      width: 18,
                      height: 18,
                      background: c,
                      borderRadius: t.radius,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  fontFamily: t.fontMono,
                  fontSize: 9,
                  color: t.text3,
                  letterSpacing: '0.06em',
                }}
              >
                {t.caps
                  ? 'READINESS · 76% · 4.2D · 11 EXP'
                  : 'Readiness · 76% · 4.2d'}
              </div>
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
                  {t.name}
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
                  {t.description.toUpperCase()}
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
