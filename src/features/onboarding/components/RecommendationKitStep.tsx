import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { KitSelector } from '@/features/templates/components';
import { useRecommendedItems } from '@/features/templates';
import type { KitId, RecommendedItemsFile } from '@/shared/types';
import styles from './RecommendationKitStep.module.css';

export interface RecommendationKitStepProps {
  readonly onContinue: () => void;
  readonly onBack: () => void;
}

export function RecommendationKitStep({
  onContinue,
  onBack,
}: RecommendationKitStepProps) {
  const { t } = useTranslation();
  const { availableKits, selectedKitId, selectKit, uploadKit } =
    useRecommendedItems();

  const handleSelectKit = (kitId: KitId) => {
    selectKit(kitId);
    onContinue();
  };

  const handleUploadKit = (file: RecommendedItemsFile) => {
    const result = uploadKit(file);
    if (result.valid && result.kitId) {
      // Auto-select the uploaded kit (kitId is already a full KitId)
      selectKit(result.kitId);
    }
  };

  return (
    <div
      className={styles.container}
      data-testid="onboarding-recommendation-kit-step"
    >
      <div className={styles.content}>
        <h2 className={styles.title}>{t('kits.selectTitle')}</h2>
        <p className={styles.description}>{t('kits.selectDescription')}</p>

        <KitSelector
          availableKits={availableKits}
          selectedKitId={selectedKitId}
          onSelectKit={handleSelectKit}
          onUploadKit={handleUploadKit}
          showUpload={true}
          showDelete={false}
        />

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            data-testid="kit-step-back-button"
          >
            {t('actions.back')}
          </Button>
        </div>
      </div>
    </div>
  );
}
