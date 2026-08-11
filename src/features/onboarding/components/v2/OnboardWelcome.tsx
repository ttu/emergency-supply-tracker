import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Caption } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import { OnboardLayout } from './OnboardLayout';

interface OnboardWelcomeProps {
  onNext: () => void;
}

/** Step 1: welcome / outputs preview / language picker. */
function leadTitle(themeKey: string, t: TFunction): string {
  if (themeKey === 'pantry') return t('v2.onboarding.welcome.leadTitlePantry');
  if (themeKey === 'civil') return t('v2.onboarding.welcome.leadTitleCivil');
  return t('v2.onboarding.welcome.leadTitleCockpit');
}

export function OnboardWelcome({ onNext }: Readonly<OnboardWelcomeProps>) {
  const { t, i18n } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { settings, updateSettings } = useSettings();

  const langs: Array<{ code: 'en' | 'fi'; label: string; sub: string }> = [
    { code: 'en', label: 'English', sub: 'United Kingdom' },
    { code: 'fi', label: 'Suomi', sub: 'Suomi' },
  ];

  const setLang = (lang: 'en' | 'fi') => {
    i18n
      .changeLanguage(lang)
      .then(() => {
        updateSettings({ language: lang });
      })
      .catch((error: unknown) => {
        console.error('Failed to switch language', error);
      });
  };

  const outputs: Array<[string, string]> = [
    ['§1', t(`v2.onboarding.welcome.o1.${themeKey}`)],
    ['§2', t(`v2.onboarding.welcome.o2.${themeKey}`)],
    ['§3', t(`v2.onboarding.welcome.o3.${themeKey}`)],
    ['§4', t(`v2.onboarding.welcome.o4.${themeKey}`)],
  ];

  return (
    <OnboardLayout
      step={1}
      title={t(`v2.voice.onbWelcome.${themeKey}`)}
      lead={{
        title: leadTitle(themeKey, t),
        sub: t(`v2.onboarding.welcome.leadSub.${themeKey}`),
      }}
      onContinue={onNext}
      side={
        <div>
          <Caption>
            {t(`v2.onboarding.welcome.outputsCaption.${themeKey}`)}
          </Caption>
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {outputs.map(([code, text]) => (
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
                <div style={{ fontSize: 14, fontWeight: 600 }}>{text}</div>
              </div>
            ))}
          </div>
          <Caption style={{ marginTop: 32 }}>
            {t(`v2.onboarding.welcome.languageCaption.${themeKey}`)}
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
