import type { CSSProperties } from 'react';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { Caption } from './SettingsRows';

export interface SettingsNavItem {
  id: string;
  code: string;
  label: string;
  danger?: boolean;
}

interface SettingsRailProps {
  sections: SettingsNavItem[];
  activeSection: string;
  onSelect: (id: string) => void;
}

/** Sticky sub-nav rail on the left of v2 Settings (desktop only). */
export function SettingsRail({
  sections,
  activeSection,
  onSelect,
}: SettingsRailProps) {
  const { themeKey } = useDesignTheme();
  return (
    <aside style={{ position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
      <Caption style={{ marginBottom: 12 }}>
        {themeKey === 'pantry' ? 'Sections' : 'SECTIONS'}
      </Caption>
      <nav
        aria-label="Settings sections"
        style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {sections.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-current={isActive ? 'true' : undefined}
              data-testid={`v2-settings-section-${s.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: isActive ? 'var(--color-panel)' : 'transparent',
                border: 0,
                borderLeft: isActive
                  ? '3px solid var(--color-accent)'
                  : '3px solid transparent',
                textAlign: 'left',
                color: s.danger
                  ? 'var(--color-crit)'
                  : isActive
                    ? 'var(--color-text)'
                    : 'var(--color-text-2)',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: isActive
                    ? 'var(--color-accent)'
                    : 'var(--color-text-3)',
                  letterSpacing: '0.08em',
                }}
              >
                {s.code}
              </span>
              <span
                style={{
                  letterSpacing: 'var(--caps-tracking)',
                  textTransform:
                    'var(--caps-transform)' as CSSProperties['textTransform'],
                }}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </nav>
      <div
        style={{
          marginTop: 22,
          padding: '12px',
          background: 'var(--color-panel-2)',
          border: '1px solid var(--color-rule-soft)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          lineHeight: 1.6,
          color: 'var(--color-text-3)',
          letterSpacing: '0.06em',
        }}
      >
        AUTOSAVE · ON
        <br />
        <span style={{ color: 'var(--color-ok)' }}>● LOCAL</span>
      </div>
    </aside>
  );
}
