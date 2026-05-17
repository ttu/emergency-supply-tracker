import { Caption } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import { useTranslation } from 'react-i18next';
import { OnboardLayout } from './OnboardLayout';

interface OnboardStep01Props {
  onNext: () => void;
}

/** Step 1: welcome / outputs preview / language picker. */
function leadTitle(themeKey: string): string {
  if (themeKey === 'pantry') return "Let's set up your kit.";
  if (themeKey === 'civil')
    return 'EMERGENCY SUPPLY TRACKER · INITIAL CONFIGURATION';
  return 'INITIALIZE · HOUSEHOLD PROFILE';
}

export function OnboardStep01Welcome({ onNext }: Readonly<OnboardStep01Props>) {
  const { themeKey } = useDesignTheme();
  const { settings, updateSettings } = useSettings();
  const { i18n } = useTranslation();

  const langs: Array<{ code: 'en' | 'fi'; label: string; sub: string }> = [
    { code: 'en', label: 'English', sub: 'United Kingdom' },
    { code: 'fi', label: 'Suomi', sub: 'Suomi' },
  ];

  const setLang = (lang: 'en' | 'fi') => {
    i18n.changeLanguage(lang).catch(() => {
      /* ignore language switch errors */
    });
    updateSettings({ language: lang });
  };

  const outputs: Array<[string, string]> = [
    [
      '§1',
      themeKey === 'pantry'
        ? 'A baseline shopping list'
        : 'BASELINE PROCUREMENT LIST',
    ],
    [
      '§2',
      themeKey === 'pantry'
        ? 'Tracking by category'
        : 'COVERAGE BY CATEGORY · 10 TIERS',
    ],
    ['§3', themeKey === 'pantry' ? 'Expiry reminders' : 'EXPIRY MONITORING'],
    ['§4', themeKey === 'pantry' ? 'A readiness score' : 'READINESS METRIC'],
  ];

  return (
    <OnboardLayout
      step={1}
      title={themeKey === 'pantry' ? 'Welcome' : 'WELCOME · LANGUAGE'}
      lead={{
        title: leadTitle(themeKey),
        sub:
          themeKey === 'pantry'
            ? "A short, five-step setup. We'll ask who lives with you and what you already have, then build a checklist based on civil-defense guidance."
            : 'FIVE-STEP PROVISIONING · NO ACCOUNT · NO CLOUD · ALL STATE LOCAL · ~90 SECONDS.',
      }}
      onContinue={onNext}
      side={
        <div>
          <Caption>
            {themeKey === 'pantry' ? "What you'll get" : 'OUTPUTS'}
          </Caption>
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {outputs.map(([code, t]) => (
              <div
                key={code}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr',
                  gap: 14,
                  paddingBottom: 14,
                  borderBottom: '1px solid var(--color-rule-soft)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-text-3)',
                    fontWeight: 600,
                  }}
                >
                  {code}
                </span>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t}</div>
              </div>
            ))}
          </div>
          <Caption style={{ marginTop: 32 }}>
            {themeKey === 'pantry' ? 'Language' : 'LANGUAGE · SELECT'}
          </Caption>
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {langs.map((l) => {
              const sel = settings.language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  aria-pressed={sel}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 24px',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                    background: sel ? 'var(--color-panel-2)' : 'transparent',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    color: 'var(--color-text)',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      color: sel
                        ? 'var(--color-accent)'
                        : 'var(--color-text-2)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {l.code.toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {l.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-3)',
                        marginTop: 2,
                      }}
                    >
                      {l.sub}
                    </div>
                  </div>
                  <span
                    aria-hidden
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                      background: sel ? 'var(--color-accent)' : 'transparent',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--color-accent-ink)',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {sel ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      }
    />
  );
}
