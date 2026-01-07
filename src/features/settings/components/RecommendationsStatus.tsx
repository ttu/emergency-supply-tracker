import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Toast } from '@/shared/components/Toast';
import { useRecommendedItems } from '@/features/templates';
import styles from './RecommendationsStatus.module.css';

export function RecommendationsStatus() {
  const { t } = useTranslation();
  const {
    recommendedItems,
    customRecommendationsInfo,
    isUsingCustomRecommendations,
    resetToDefaultRecommendations,
  } = useRecommendedItems();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleResetClick = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirmReset = useCallback(async () => {
    setIsResetting(true);
    setError(undefined);

    try {
      resetToDefaultRecommendations();
      setShowSuccessToast(true);
      setShowConfirm(false);
    } catch (err) {
      console.error('Failed to reset recommendations:', err);
      const message =
        err instanceof Error
          ? err.message
          : t(
              'settings.recommendations.reset.error',
              'Failed to reset recommendations',
            );
      setError(message);
    } finally {
      setIsResetting(false);
    }
  }, [resetToDefaultRecommendations, t]);

  const handleCancelReset = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleCloseToast = useCallback(() => {
    setShowSuccessToast(false);
  }, []);

  const handleCloseError = useCallback(() => {
    setError(undefined);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.statusInfo}>
        <span className={styles.label}>
          {t('settings.recommendations.status.label')}
        </span>
        {isUsingCustomRecommendations && customRecommendationsInfo ? (
          <span className={styles.value}>
            {t('settings.recommendations.status.custom', {
              name: customRecommendationsInfo.name,
              count: customRecommendationsInfo.itemCount,
            })}
          </span>
        ) : (
          <span className={styles.value}>
            {t('settings.recommendations.status.default', {
              count: recommendedItems.length,
            })}
          </span>
        )}
      </div>

      {isUsingCustomRecommendations && (
        <Button
          variant="secondary"
          onClick={handleResetClick}
          disabled={isResetting}
          data-testid="reset-recommendations-button"
        >
          {t('settings.recommendations.reset.button')}
        </Button>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title={t('settings.recommendations.reset.button')}
        message={t('settings.recommendations.reset.confirm')}
        confirmLabel={t('settings.recommendations.reset.button')}
        confirmVariant="danger"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
        isLoading={isResetting}
      />

      <Toast
        isVisible={showSuccessToast}
        message={t(
          'settings.recommendations.reset.success',
          'Reset to default recommendations',
        )}
        variant="success"
        onClose={handleCloseToast}
      />

      <Toast
        isVisible={!!error}
        message={error || ''}
        variant="error"
        duration={5000}
        onClose={handleCloseError}
      />
    </div>
  );
}
