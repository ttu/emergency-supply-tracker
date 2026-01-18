import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WelcomeScreen } from './WelcomeScreen';
import { HouseholdPresetSelector } from './HouseholdPresetSelector';
import { HouseholdForm } from './HouseholdForm';
import type { HouseholdData } from './HouseholdForm';
import { QuickSetupScreen } from './QuickSetupScreen';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';
import type { HouseholdPreset } from './HouseholdPresetSelector';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import { HOUSEHOLD_DEFAULTS } from '@/features/household';
import { InventoryItemFactory } from '@/features/inventory/factories/InventoryItemFactory';

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
      pets: data.pets,
      supplyDurationDays: data.supplyDays,
      useFreezer: data.useFreezer,
    };
    setHouseholdConfig(config);
    setCurrentStep('quickSetup');
  };

  const handleAddItems = (selectedItemIds: Set<string>) => {
    if (!householdConfig) return;

    // Calculate total available items (after filtering for freezer requirements)
    const availableItems = RECOMMENDED_ITEMS.filter((item) => {
      // Skip frozen items if not using freezer
      if (item.requiresFreezer && !householdConfig.useFreezer) {
        return false;
      }
      return true;
    });

    // Determine quantity: 0 if all items are selected, 1 if some are selected
    const allItemsSelected = selectedItemIds.size === availableItems.length;
    const quantity = allItemsSelected ? 0 : 1;

    // Calculate and create inventory items from selected recommended items
    const items: InventoryItem[] = RECOMMENDED_ITEMS.filter((item) => {
      // Only include selected items
      if (!selectedItemIds.has(item.id)) {
        return false;
      }
      // Skip frozen items if not using freezer
      if (item.requiresFreezer && !householdConfig.useFreezer) {
        return false;
      }
      return true;
    }).map((item) => {
      // Translate item name
      const itemName = t(item.i18nKey.replace('products.', ''));

      // Create item using factory with determined quantity
      return InventoryItemFactory.createFromTemplate(item, householdConfig, {
        name: itemName,
        quantity,
      });
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
          onBack={() => setCurrentStep('welcome')}
        />
      )}

      {currentStep === 'household' && (
        <HouseholdForm
          initialData={
            selectedPreset
              ? {
                  adults: selectedPreset.adults,
                  children: selectedPreset.children,
                  pets: HOUSEHOLD_DEFAULTS.pets,
                  supplyDays: HOUSEHOLD_DEFAULTS.supplyDays,
                  useFreezer: HOUSEHOLD_DEFAULTS.useFreezer,
                }
              : undefined
          }
          onSubmit={handleHouseholdSubmit}
          onBack={() => setCurrentStep('preset')}
        />
      )}

      {currentStep === 'quickSetup' && householdConfig && (
        <QuickSetupScreen
          household={householdConfig}
          onAddItems={handleAddItems}
          onSkip={handleSkip}
          onBack={() => setCurrentStep('household')}
        />
      )}
    </>
  );
};
