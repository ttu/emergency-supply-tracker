import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { APP_VERSION } from '@/shared/utils/version';
import { CAPS_STYLE, StatusBadge } from './primitives';
import styles from './Shell.module.css';

/**
 * Navigation mirrors the real app: four pages only. Alerts live on the
 * dashboard (banner); the shopping list is an export under Settings.
 */
export type DesignNavId = 'home' | 'inv' | 'help' | 'settings';

interface NavDef {
  id: DesignNavId;
  icon: string;
  /** Voice key under `v2.voice`; the theme picks the wording. */
  labelKey: string;
}

const NAV: NavDef[] = [
  { id: 'home', icon: '◇', labelKey: 'navHome' },
  { id: 'inv', icon: '▦', labelKey: 'navInventory' },
  { id: 'help', icon: '?', labelKey: 'navHelp' },
  { id: 'settings', icon: '⚙', labelKey: 'navSettings' },
];

interface MobileShellProps {
  active: DesignNavId;
  onNav: (id: DesignNavId) => void;
  title: string;
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
  children,
}: Readonly<DesktopShellProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <div className={`v2-viewport-height ${styles.desktopRoot}`}>
      <aside
        aria-label={t('v2.voice.navPrimaryAria')}
        className={styles.sidebar}
      >
        <div className={styles.sidebarHeader}>
          <div
            className={styles.brandName}
            style={{
              letterSpacing: themeKey === 'pantry' ? '-0.02em' : '0.1em',
            }}
          >
            {t(`v2.voice.appName.${themeKey}`)}
          </div>
          <div className={styles.tagline} style={CAPS_STYLE}>
            {t(`v2.voice.tagline.${themeKey}`)}
          </div>
        </div>
        <nav aria-label={t('v2.voice.navMainAria')} className={styles.nav}>
          {NAV.map((n) => {
            const isActive = active === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onNav(n.id)}
                aria-current={isActive ? 'page' : undefined}
                data-testid={`v2-nav-${n.id}`}
                className={`${styles.navButton} ${isActive ? styles.navButtonActive : ''} ${isActive && themeKey === 'civil' ? styles.navButtonActiveCivilAccent : ''}`}
              >
                <span
                  className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`}
                  aria-hidden
                >
                  {n.icon}
                </span>
                <span className={styles.navLabel} style={CAPS_STYLE}>
                  {t(`v2.voice.${n.labelKey}.${themeKey}`)}
                </span>
              </button>
            );
          })}
        </nav>
        <div className={styles.footer} style={CAPS_STYLE}>
          <span>{APP_VERSION}</span>
          <span className={styles.footerStatus}>
            ● {t('v2.voice.storageLocal')}
          </span>
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span
              className={styles.headerTitle}
              style={{
                letterSpacing: themeKey === 'pantry' ? '-0.01em' : '0.04em',
              }}
            >
              {title}
            </span>
            {breadcrumb && (
              <span className={styles.headerBreadcrumb} style={CAPS_STYLE}>
                · {breadcrumb}
              </span>
            )}
          </div>
          <div className={styles.headerRight}>
            <StatusBadge>{t('v2.voice.storageLocal')}</StatusBadge>
          </div>
        </header>
        <main id="main-content" className={styles.main}>
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
  children,
}: Readonly<MobileShellProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <div className={`v2-viewport-height ${styles.mobileRoot}`}>
      <header className={styles.mobileHeader}>
        <div
          className={styles.mobileTitle}
          style={{
            letterSpacing: themeKey === 'pantry' ? '-0.01em' : '0.06em',
          }}
        >
          {title || t(`v2.voice.appName.${themeKey}`)}
        </div>
        <StatusBadge fontSize={9} padding="2px 5px">
          {t('v2.voice.statusLive')}
        </StatusBadge>
      </header>
      <main id="main-content" className={styles.mobileMain}>
        {children}
      </main>
      <nav
        aria-label={t('v2.voice.navPrimaryAria')}
        className={styles.mobileNav}
      >
        {NAV.map((n) => {
          const id = n.id;
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNav(id)}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`v2-nav-${id}`}
              className={`${styles.mobileNavButton} ${isActive ? styles.mobileNavButtonActive : ''}`}
            >
              <div
                className={`${styles.mobileNavIcon} ${isActive ? styles.mobileNavIconActive : ''}`}
                aria-hidden
              >
                {n.icon}
              </div>
              <div
                className={`${styles.mobileNavLabel} ${isActive ? styles.mobileNavLabelActive : ''}`}
                style={CAPS_STYLE}
              >
                {t(`v2.voice.${n.labelKey}.${themeKey}`)}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
