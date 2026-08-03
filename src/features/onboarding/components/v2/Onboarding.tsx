import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecommendedItems } from '@/features/templates';
import { useNotification } from '@/shared/hooks';
import { HOUSEHOLD_DEFAULTS } from '@/features/household';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';
import { generateExampleInventory } from '../../utils';
import { OnboardWelcome } from './OnboardWelcome';
import { OnboardTheme } from './OnboardTheme';
import { OnboardPreset } from './OnboardPreset';
import { OnboardHousehold } from './OnboardHousehold';
import { OnboardKit } from './OnboardKit';
import {
  OnboardQuickSetup,
  type QuickSetupSelection,
} from './OnboardQuickSetup';
import { OnboardComplete } from './OnboardComplete';
import { buildOnboardingItems } from './buildOnboardingItems';

interface OnboardingProps {
  onComplete: (household: HouseholdConfig, items: InventoryItem[]) => void;
}

type StepIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Orchestrates the v2 onboarding flow: six numbered steps plus a completion
 * screen. Holds the cross-step state (household, preset, the quick-setup
 * selection) and renders one step at a time.
 */
export function DesignOnboarding({ onComplete }: Readonly<OnboardingProps>) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { recommendedItems } = useRecommendedItems();

  const [step, setStep] = useState<StepIndex>(1);
  const [household, setHousehold] = useState<HouseholdConfig>({
    adults: 2,
    children: 0,
    pets: 0,
    supplyDurationDays: 7,
    useFreezer: false,
  });
  const [presetCode, setPresetCode] = useState<string>('P-02');
  const [seededItems, setSeededItems] = useState<InventoryItem[]>([]);

  const next = () => setStep((s) => Math.min(7, s + 1) as StepIndex);
  const back = () => setStep((s) => Math.max(1, s - 1) as StepIndex);

  const resolveName = (key: string) =>
    t(key.replace('products.', ''), { ns: 'products' });

  const handleAddItems = (selection: QuickSetupSelection) => {
    setSeededItems(
      buildOnboardingItems(recommendedItems, household, selection, resolveName),
    );
    next();
  };

  const handleSkip = () => {
    setSeededItems([]);
    next();
  };

  /**
   * Demo data stands in for the household's own answers, so it finishes the
   * flow outright rather than landing on a summary of a household that is not
   * theirs.
   */
  const handleTryDemoData = () => {
    const demoHousehold: HouseholdConfig = {
      adults: 2,
      children: 2,
      pets: 0,
      supplyDurationDays: HOUSEHOLD_DEFAULTS.supplyDays,
      useFreezer: true,
    };
    showNotification(t('onboarding.tryDemoData.notification'), 'info', 0);
    onComplete(
      demoHousehold,
      generateExampleInventory(recommendedItems, demoHousehold, resolveName),
    );
  };

  if (step === 1) return <OnboardWelcome onNext={next} />;
  if (step === 2) return <OnboardTheme onNext={next} onBack={back} />;
  if (step === 3)
    return (
      <OnboardPreset
        presetCode={presetCode}
        onPresetChange={setPresetCode}
        onApplyPreset={(update) => setHousehold((h) => ({ ...h, ...update }))}
        onNext={next}
        onBack={back}
      />
    );
  if (step === 4)
    return (
      <OnboardHousehold
        household={household}
        onHouseholdChange={setHousehold}
        onNext={next}
        onBack={back}
      />
    );
  if (step === 5) return <OnboardKit onNext={next} onBack={back} />;
  if (step === 6)
    return (
      <OnboardQuickSetup
        household={household}
        onAddItems={handleAddItems}
        onSkip={handleSkip}
        onTryDemoData={handleTryDemoData}
        onBack={back}
      />
    );
  return (
    <OnboardComplete
      household={household}
      items={seededItems}
      onComplete={onComplete}
    />
  );
}
