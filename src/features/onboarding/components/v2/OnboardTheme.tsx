import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ThemePicker } from '@/features/settings/components/v2/ThemePicker';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import type { Theme } from '@/shared/types';
import { OnboardLayout } from './OnboardLayout';

interface OnboardThemeProps {
  onNext: () => void;
  onBack: () => void;
}

function themeLeadTitle(themeKey: string, t: TFunction): string {
  if (themeKey === 'pantry') return t('v2.onboarding.theme.leadTitlePantry');
  if (themeKey === 'civil') return t('v2.onboarding.theme.leadTitleCivil');
  return t('v2.onboarding.theme.leadTitleCockpit');
}

export function OnboardTheme({ onNext, onBack }: Readonly<OnboardThemeProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { settings, updateSettings } = useSettings();
  return (
    <OnboardLayout
      step={2}
      title={t(`v2.voice.onbTheme.${themeKey}`)}
      lead={{
        title: themeLeadTitle(themeKey, t),
        sub: t(`v2.onboarding.theme.leadSub.${themeKey}`),
      }}
      back={onBack}
      onContinue={onNext}
    >
      <div>
        <ThemePicker
          value={settings.theme}
          onChange={(k: Theme) => updateSettings({ theme: k })}
        />
      </div>
    </OnboardLayout>
  );
}
