import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { CAPS_STYLE } from './primitives';

export type DesignNavId =
  | 'home'
  | 'inv'
  | 'alerts'
  | 'shop'
  | 'plan'
  | 'help'
  | 'settings';

interface NavDef {
  id: DesignNavId;
  icon: string;
  label: { cockpit: string; civil: string; pantry: string };
}

const NAV: NavDef[] = [
  {
    id: 'home',
    icon: '◇',
    label: { cockpit: 'OVERVIEW', civil: 'DASHBOARD', pantry: 'Overview' },
  },
  {
    id: 'inv',
    icon: '▦',
    label: { cockpit: 'INVENTORY', civil: 'INVENTORY', pantry: 'Inventory' },
  },
  {
    id: 'alerts',
    icon: '!',
    label: { cockpit: 'ALERTS', civil: 'ALERTS', pantry: 'Alerts' },
  },
  {
    id: 'shop',
    icon: '+',
    label: {
      cockpit: 'SHOPPING',
      civil: 'PROCUREMENT',
      pantry: 'Shopping list',
    },
  },
  {
    id: 'plan',
    icon: '◌',
    label: { cockpit: 'PLAN', civil: 'PLAN', pantry: 'Plan' },
  },
  {
    id: 'help',
    icon: '?',
    label: { cockpit: 'GUIDE', civil: 'GUIDE', pantry: 'Guide' },
  },
  {
    id: 'settings',
    icon: '⚙',
    label: { cockpit: 'SETTINGS', civil: 'SETTINGS', pantry: 'Settings' },
  },
];

const MOBILE_NAV: DesignNavId[] = ['home', 'inv', 'alerts', 'shop', 'settings'];

interface MobileShellProps {
  active: DesignNavId;
  onNav: (id: DesignNavId) => void;
  title: string;
  alertCount?: number;
  children: ReactNode;
}

interface DesktopShellProps extends MobileShellProps {
  breadcrumb?: string;
}

export function DesktopShell({
  active,
  onNav,
  title,
  breadcrumb,
  alertCount,
  children,
}: Readonly<DesktopShellProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '232px 1fr',
        height: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
      }}
    >
      <aside
        aria-label="Primary"
        style={{
          background: 'var(--color-bg-2)',
          borderRight: '1px solid var(--color-rule)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--color-rule)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: themeKey === 'pantry' ? '-0.02em' : '0.1em',
              color: 'var(--color-text)',
            }}
          >
            {t(`v2.voice.appName.${themeKey}`)}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-3)',
              marginTop: 4,
              ...CAPS_STYLE,
            }}
          >
            {t(`v2.voice.tagline.${themeKey}`)}
          </div>
        </div>
        <nav aria-label="Main" style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map((n) => {
            const isActive = active === n.id;
            const badge =
              n.id === 'alerts' && alertCount ? alertCount : undefined;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onNav(n.id)}
                aria-current={isActive ? 'page' : undefined}
                data-testid={`v2-nav-${n.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: isActive ? 'var(--color-panel)' : 'transparent',
                  color: isActive ? 'var(--color-text)' : 'var(--color-text-2)',
                  borderLeft:
                    isActive && themeKey === 'civil'
                      ? '3px solid var(--color-accent)'
                      : '3px solid transparent',
                  borderRight: 0,
                  borderTop: 0,
                  borderBottom: 0,
                  marginBottom: 2,
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    width: 16,
                    textAlign: 'center',
                    color: isActive
                      ? 'var(--color-accent)'
                      : 'var(--color-text-3)',
                  }}
                  aria-hidden
                >
                  {n.icon}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    flex: 1,
                    ...CAPS_STYLE,
                  }}
                >
                  {n.label[themeKey]}
                </span>
                {badge !== undefined && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--color-crit)',
                      border:
                        themeKey === 'cockpit'
                          ? '1px solid var(--color-crit)'
                          : 'none',
                      padding: themeKey === 'cockpit' ? '1px 5px' : '0',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--color-rule)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-3)',
            display: 'flex',
            justifyContent: 'space-between',
            ...CAPS_STYLE,
          }}
        >
          <span>v0.4.2</span>
          <span style={{ color: 'var(--color-ok)' }}>● LOCAL</span>
        </div>
      </aside>

      <div
        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <header
          style={{
            height: 56,
            borderBottom: '1px solid var(--color-rule)',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: themeKey === 'pantry' ? '-0.01em' : '0.04em',
              }}
            >
              {title}
            </span>
            {breadcrumb && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-3)',
                  ...CAPS_STYLE,
                }}
              >
                · {breadcrumb}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                padding: '4px 8px',
                border: '1px solid var(--color-ok)',
                color: 'var(--color-ok)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              ● LOCAL
            </span>
          </div>
        </header>
        <main
          id="main-content"
          style={{ flex: 1, overflow: 'auto', padding: 28 }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function MobileShell({
  active,
  onNav,
  title,
  alertCount,
  children,
}: Readonly<MobileShellProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <header
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-rule)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-bg-2)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: themeKey === 'pantry' ? '-0.01em' : '0.06em',
          }}
        >
          {title || t(`v2.voice.appName.${themeKey}`)}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--color-ok)',
            border: '1px solid var(--color-ok)',
            padding: '2px 5px',
            letterSpacing: '0.08em',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          ● LIVE
        </span>
      </header>
      <main id="main-content" style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
      <nav
        aria-label="Primary"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          borderTop: '1px solid var(--color-rule)',
          background: 'var(--color-bg-2)',
          paddingBottom: 16,
        }}
      >
        {MOBILE_NAV.map((id) => {
          const n = NAV.find((x) => x.id === id)!;
          const isActive = active === id;
          const badge = id === 'alerts' && alertCount ? alertCount : undefined;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNav(id)}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`v2-nav-${id}`}
              style={{
                padding: '10px 4px 6px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                borderTop: isActive
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
                marginTop: -1,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  color: isActive
                    ? 'var(--color-accent)'
                    : 'var(--color-text-3)',
                  position: 'relative',
                  display: 'inline-block',
                }}
                aria-hidden
              >
                {n.icon}
                {badge !== undefined && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -10,
                      fontSize: 8,
                      color: 'var(--color-crit)',
                      fontWeight: 700,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 9,
                  marginTop: 2,
                  color: isActive ? 'var(--color-text)' : 'var(--color-text-3)',
                  ...CAPS_STYLE,
                  fontWeight: 600,
                }}
              >
                {n.label[themeKey]}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
