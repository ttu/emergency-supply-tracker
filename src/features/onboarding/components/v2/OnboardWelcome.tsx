import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Caption } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import { OnboardLayout } from './OnboardLayout';
import styles from './OnboardWelcome.module.css';

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
          <div className={styles.outputList}>
            {outputs.map(([code, text]) => (
              <div key={code} className={styles.outputRow}>
                <span className={styles.outputCode}>{code}</span>
                <div className={styles.outputText}>{text}</div>
              </div>
            ))}
          </div>
          <Caption style={{ marginTop: 32 }}>
            {t(`v2.onboarding.welcome.languageCaption.${themeKey}`)}
          </Caption>
          <div className={styles.langList}>
            {langs.map((l) => {
              const sel = settings.language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  aria-pressed={sel}
                  className={`${styles.langButton} ${sel ? styles.langButtonSelected : ''}`}
                >
                  <span
                    className={`${styles.langCode} ${sel ? styles.langCodeSelected : ''}`}
                  >
                    {l.code.toUpperCase()}
                  </span>
                  <div>
                    <div className={styles.langLabel}>{l.label}</div>
                    <div className={styles.langSub}>{l.sub}</div>
                  </div>
                  <span
                    aria-hidden
                    className={`${styles.langCheck} ${sel ? styles.langCheckSelected : ''}`}
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
