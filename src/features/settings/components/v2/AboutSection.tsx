import { useTranslation } from 'react-i18next';
import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { APP_VERSION } from '@/shared/utils/version';
import { CONTACT_EMAIL } from '@/shared/utils/constants';
import { Caption, PanelHeader, SectionHeader } from './SettingsRows';

/** §10 About: app info, version/license/source, external links. */
export function AboutSection() {
  const { themeKey } = useDesignTheme();
  const { t } = useTranslation();

  const links = [
    {
      href: 'https://github.com/ttu/emergency-supply-tracker',
      label:
        themeKey === 'pantry'
          ? 'Source code (GitHub)'
          : 'GITHUB · ttu/emergency-supply-tracker',
    },
    {
      href: 'https://github.com/ttu/emergency-supply-tracker/issues',
      label: themeKey === 'pantry' ? 'Report an issue' : 'BUG TRACKER',
    },
    {
      href: 'https://72tuntia.fi',
      label:
        themeKey === 'pantry' ? '72tuntia.fi guidance' : '72TUNTIA.FI · SOURCE',
    },
    {
      href: `mailto:${CONTACT_EMAIL}`,
      label: themeKey === 'pantry' ? 'Contact' : 'CONTACT',
    },
  ];

  return (
    <section id="sec-about" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§10"
        title={themeKey === 'pantry' ? 'About' : 'ABOUT'}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 14,
        }}
      >
        <Panel padding={22}>
          <Caption>
            {themeKey === 'pantry'
              ? 'Emergency Supply Tracker'
              : 'EMERGENCY SUPPLY TRACKER · EST'}
          </Caption>
          <p
            style={{
              fontSize: 14,
              color: 'var(--color-text-2)',
              lineHeight: 1.65,
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            {t('app.tagline')}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginTop: 22,
              paddingTop: 18,
              borderTop: '1px solid var(--color-rule-soft)',
            }}
          >
            <AboutStat
              label={themeKey === 'pantry' ? 'Version' : 'BUILD'}
              value={APP_VERSION}
            />
            <AboutStat
              label={themeKey === 'pantry' ? 'License' : 'LICENSE'}
              value="MIT"
            />
            <AboutStat
              label={themeKey === 'pantry' ? 'Source' : 'SOURCE'}
              value="72tuntia.fi"
            />
          </div>
        </Panel>
        <Panel padding={0}>
          <PanelHeader>
            {themeKey === 'pantry' ? 'Links' : 'EXTERNAL'}
          </PanelHeader>
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel={
                l.href.startsWith('http') ? 'noopener noreferrer' : undefined
              }
              style={{
                padding: '12px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'var(--color-text)',
                textDecoration: 'none',
                borderBottom:
                  i < links.length - 1
                    ? '1px solid var(--color-rule-soft)'
                    : 'none',
                fontSize: 13,
              }}
            >
              <span>{l.label}</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--color-text-3)',
                }}
              >
                ↗
              </span>
            </a>
          ))}
        </Panel>
      </div>
    </section>
  );
}

function AboutStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Caption>{label}</Caption>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          marginTop: 4,
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}
