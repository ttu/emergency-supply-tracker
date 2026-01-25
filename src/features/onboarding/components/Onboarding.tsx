import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WelcomeScreen } from './WelcomeScreen';
import { HouseholdPresetSelector } from './HouseholdPresetSelector';
import { HouseholdForm } from './HouseholdForm';
import type { HouseholdData } from './HouseholdForm';
import { RecommendationKitStep } from './RecommendationKitStep';
import { QuickSetupScreen } from './QuickSetupScreen';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';
import type { HouseholdPreset } from './HouseholdPresetSelector';
import { useRecommendedItems } from '@/features/templates';
import { HOUSEHOLD_DEFAULTS, HOUSEHOLD_PRESETS } from '@/features/household';
import { InventoryItemFactory } from '@/features/inventory/factories/InventoryItemFactory';

function getHouseholdInitialData(
  preset: HouseholdPreset,
): Partial<HouseholdData> {
  if (preset.id === 'custom') {
    return {
      adults: preset.adults,
      children: preset.children,
      pets: preset.pets,
      supplyDays: HOUSEHOLD_DEFAULTS.supplyDays,
      useFreezer: HOUSEHOLD_DEFAULTS.useFreezer,
    };
  }
  const p = HOUSEHOLD_PRESETS[preset.id];
  return {
    adults: p.adults,
    children: p.children,
    pets: p.pets,
    supplyDays: p.supplyDurationDays,
    useFreezer: p.useFreezer,
  };
}

export interface OnboardingProps {
  onComplete: (household: HouseholdConfig, items: InventoryItem[]) => void;
}

type OnboardingStep =
  | 'welcome'
  | 'preset'
  | 'household'
  | 'kitSelection'
  | 'quickSetup';

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { t } = useTranslation('products');
  const { recommendedItems } = useRecommendedItems();
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
    setCurrentStep('kitSelection');
  };

  const handleKitSelectionContinue = () => {
    setCurrentStep('quickSetup');
  };

  const handleAddItems = (selectedItemIds: Set<string>) => {
    if (!householdConfig) return;

    // Calculate total available items (after filtering for freezer and pet requirements)
    const availableItems = recommendedItems.filter((item) => {
      // Skip frozen items if not using freezer
      if (item.requiresFreezer && !householdConfig.useFreezer) {
        return false;
      }
      // Skip pet items if pets is 0
      if (item.scaleWithPets && householdConfig.pets === 0) {
        return false;
      }
      return true;
    });

    // Determine quantity: 0 if all items are selected, 1 if some are selected
    const allItemsSelected = selectedItemIds.size === availableItems.length;
    const quantity = allItemsSelected ? 0 : 1;

    // Calculate and create inventory items from selected recommended items
    const items: InventoryItem[] = recommendedItems
      .filter((item) => {
        // Only include selected items
        if (!selectedItemIds.has(item.id)) {
          return false;
        }
        // Skip frozen items if not using freezer
        if (item.requiresFreezer && !householdConfig.useFreezer) {
          return false;
        }
        return true;
      })
      .map((item) => {
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
            selectedPreset ? getHouseholdInitialData(selectedPreset) : undefined
          }
          onSubmit={handleHouseholdSubmit}
          onBack={() => setCurrentStep('preset')}
        />
      )}

      {currentStep === 'kitSelection' && (
        <RecommendationKitStep
          onContinue={handleKitSelectionContinue}
          onBack={() => setCurrentStep('household')}
        />
      )}

      {currentStep === 'quickSetup' && householdConfig && (
        <QuickSetupScreen
          household={householdConfig}
          onAddItems={handleAddItems}
          onSkip={handleSkip}
          onBack={() => setCurrentStep('kitSelection')}
        />
      )}
    </>
  );
};
