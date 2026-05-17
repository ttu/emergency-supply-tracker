import { useState } from 'react';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';
import { OnboardStep01Welcome } from './OnboardStep01Welcome';
import { OnboardStep02Theme } from './OnboardStep02Theme';
import { OnboardStep03Preset } from './OnboardStep03Preset';
import { OnboardStep04Household } from './OnboardStep04Household';
import { OnboardStep05Items } from './OnboardStep05Items';
import { OnboardStep06Complete } from './OnboardStep06Complete';

interface OnboardingProps {
  onComplete: (household: HouseholdConfig, items: InventoryItem[]) => void;
}

type StepIndex = 1 | 2 | 3 | 4 | 5 | 6;

const DEFAULT_ENABLED_CATEGORIES = [
  'water-beverages',
  'food',
  'cooking-heat',
  'light-power',
  'communication-info',
  'medical-health',
  'hygiene-sanitation',
  'tools-supplies',
  'cash-documents',
];

/**
 * Orchestrates the 6-step v2 onboarding flow. Holds the cross-step state
 * (household, enabled categories, preset selection) and renders one step
 * component at a time.
 */
export function DesignOnboarding({ onComplete }: Readonly<OnboardingProps>) {
  const [step, setStep] = useState<StepIndex>(1);
  const [household, setHousehold] = useState<HouseholdConfig>({
    adults: 2,
    children: 0,
    pets: 0,
    supplyDurationDays: 7,
    useFreezer: false,
  });
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    new Set(DEFAULT_ENABLED_CATEGORIES),
  );
  const [presetCode, setPresetCode] = useState<string>('P-02');

  const next = () => setStep((s) => Math.min(6, s + 1) as StepIndex);
  const back = () => setStep((s) => Math.max(1, s - 1) as StepIndex);

  const toggleCategory = (id: string) => {
    setEnabledCategories((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  };

  if (step === 1) return <OnboardStep01Welcome onNext={next} />;
  if (step === 2) return <OnboardStep02Theme onNext={next} onBack={back} />;
  if (step === 3)
    return (
      <OnboardStep03Preset
        presetCode={presetCode}
        onPresetChange={setPresetCode}
        onApplyPreset={(update) => setHousehold((h) => ({ ...h, ...update }))}
        onNext={next}
        onBack={back}
      />
    );
  if (step === 4)
    return (
      <OnboardStep04Household
        household={household}
        onHouseholdChange={setHousehold}
        onNext={next}
        onBack={back}
      />
    );
  if (step === 5)
    return (
      <OnboardStep05Items
        enabledCategories={enabledCategories}
        onToggleCategory={toggleCategory}
        onNext={next}
        onBack={back}
      />
    );
  return (
    <OnboardStep06Complete
      household={household}
      enabledCategories={enabledCategories}
      onComplete={onComplete}
    />
  );
}
