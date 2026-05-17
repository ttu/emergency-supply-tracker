import { ThemePicker } from '@/features/settings/components/v2/ThemePicker';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import type { Theme } from '@/shared/types';
import { OnboardLayout } from './OnboardLayout';

interface OnboardStep02Props {
  onNext: () => void;
  onBack: () => void;
}

/** Step 2: theme picker — switching here reskins the entire flow live. */
function themeLeadTitle(themeKey: string): string {
  if (themeKey === 'pantry') return 'Pick a look.';
  if (themeKey === 'civil') return 'SELECT INTERFACE THEME';
  return 'CHOOSE THEME';
}

export function OnboardStep02Theme({
  onNext,
  onBack,
}: Readonly<OnboardStep02Props>) {
  const { themeKey } = useDesignTheme();
  const { settings, updateSettings } = useSettings();
  return (
    <OnboardLayout
      step={2}
      title={themeKey === 'pantry' ? 'Appearance' : 'APPEARANCE · THEME'}
      lead={{
        title: themeLeadTitle(themeKey),
        sub:
          themeKey === 'pantry'
            ? 'Three looks, same app. You can switch any time in settings — your data and layout stay identical.'
            : 'SAME DATA · SAME LAYOUT · TOKENS, TYPE, AND TONE SWAP',
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
