import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WelcomeScreen } from './WelcomeScreen';
import { HouseholdPresetSelector } from './HouseholdPresetSelector';
import { HouseholdForm } from './HouseholdForm';
import type { HouseholdData } from './HouseholdForm';
import { QuickSetupScreen } from './QuickSetupScreen';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';
import type { HouseholdPreset } from './HouseholdPresetSelector';
import { RECOMMENDED_ITEMS } from '@/data/recommendedItems';
import { HOUSEHOLD_DEFAULTS } from '@/features/household';

export interface OnboardingProps {
  onComplete: (household: HouseholdConfig, items: InventoryItem[]) => void;
}

type OnboardingStep = 'welcome' | 'preset' | 'household' | 'quickSetup';

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { t } = useTranslation('products');
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedPreset, setSelectedPreset] = useState<HouseholdPreset | null>(
    null,
  );
  const [householdConfig, setHouseholdConfig] =
    useState<HouseholdConfig | null>(null);

  const handleWelcomeContinue = () => {
    setCurrentStep('preset');
  };

  const handlePresetSelect = (preset: HouseholdPreset) => {
    setSelectedPreset(preset);
    setCurrentStep('household');
  };

  const handleHouseholdSubmit = (data: HouseholdData) => {
    const config: HouseholdConfig = {
      adults: data.adults,
      children: data.children,
      supplyDurationDays: data.supplyDays,
      useFreezer: data.useFreezer,
    };
    setHouseholdConfig(config);
    setCurrentStep('quickSetup');
  };

  const handleAddItems = () => {
    if (!householdConfig) return;

    // Calculate and create inventory items from recommended items
    const items: InventoryItem[] = RECOMMENDED_ITEMS.filter((item) => {
      // Skip frozen items if not using freezer
      if (item.requiresFreezer && !householdConfig.useFreezer) {
        return false;
      }
      return true;
    }).map((item) => {
      // Calculate quantity
      let quantity = item.baseQuantity;

      if (item.scaleWithPeople) {
        const totalPeople = householdConfig.adults + householdConfig.children;
        quantity *= totalPeople;
      }

      if (item.scaleWithDays) {
        quantity *= householdConfig.supplyDurationDays;
      }

      quantity = Math.ceil(quantity);

      // Calculate expiration date if applicable
      let expirationDate: string | undefined;
      if (item.defaultExpirationMonths) {
        const expDate = new Date();
        expDate.setMonth(expDate.getMonth() + item.defaultExpirationMonths);
        expirationDate = expDate.toISOString().split('T')[0];
      }

      const now = new Date().toISOString();

      const itemName = t(item.i18nKey.replace('products.', ''));

      return {
        id: crypto.randomUUID(),
        name: itemName,
        itemType: item.id, // Store template ID for i18n lookup
        categoryId: item.category,
        quantity: 0, // Start with 0, user needs to add them
        unit: item.unit,
        recommendedQuantity: quantity,
        expirationDate,
        neverExpires: !item.defaultExpirationMonths,
        productTemplateId: item.id,
        weightGrams: item.weightGramsPerUnit, // Store template weight per unit for calculations
        caloriesPerUnit: item.caloriesPerUnit, // Store template calories per unit
        createdAt: now,
        updatedAt: now,
      };
    });

    onComplete(householdConfig, items);
  };

  const handleSkip = () => {
    if (!householdConfig) return;
    onComplete(householdConfig, []);
  };

  return (
    <>
      {currentStep === 'welcome' && (
        <WelcomeScreen onContinue={handleWelcomeContinue} />
      )}

      {currentStep === 'preset' && (
        <HouseholdPresetSelector
          selectedPreset={selectedPreset?.id}
          onSelectPreset={handlePresetSelect}
        />
      )}

      {currentStep === 'household' && (
        <HouseholdForm
          initialData={
            selectedPreset
              ? {
                  adults: selectedPreset.adults,
                  children: selectedPreset.children,
                  supplyDays: HOUSEHOLD_DEFAULTS.supplyDays,
                  useFreezer: HOUSEHOLD_DEFAULTS.useFreezer,
                }
              : undefined
          }
          onSubmit={handleHouseholdSubmit}
          onCancel={() => setCurrentStep('preset')}
        />
      )}

      {currentStep === 'quickSetup' && householdConfig && (
        <QuickSetupScreen
          household={householdConfig}
          onAddItems={handleAddItems}
          onSkip={handleSkip}
        />
      )}
    </>
  );
};
