import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { useRecommendedItems } from '../../hooks/useRecommendedItems';
import styles from './RecommendationsStatus.module.css';

export function RecommendationsStatus() {
  const { t } = useTranslation();
  const {
    recommendedItems,
    customRecommendationsInfo,
    isUsingCustomRecommendations,
    resetToDefaultRecommendations,
  } = useRecommendedItems();

  const handleReset = () => {
    if (window.confirm(t('settings.recommendations.reset.confirm'))) {
      resetToDefaultRecommendations();
    }
  };

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
          onClick={handleReset}
          data-testid="reset-recommendations-button"
        >
          {t('settings.recommendations.reset.button')}
        </Button>
      )}
    </div>
  );
}
