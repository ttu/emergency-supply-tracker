import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useRecommendedItems } from '@/features/templates';
import styles from './ExportRecommendationsButton.module.css';

export function ExportRecommendationsButton() {
  const { t } = useTranslation();
  const { exportRecommendedItems, customRecommendationsInfo } =
    useRecommendedItems();

  const handleExport = () => {
    const data = exportRecommendedItems();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Use custom name if available, otherwise use default
    const fileName = customRecommendationsInfo
      ? `recommended-items-${customRecommendationsInfo.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
      : `recommended-items-default-${new Date().toISOString().split('T')[0]}.json`;

    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <Button
        variant="secondary"
        onClick={handleExport}
        data-testid="export-recommendations-button"
      >
        {t('settings.recommendations.export.button')}
      </Button>
      <p className={styles.description}>
        {t('settings.recommendations.export.description')}
      </p>
    </div>
  );
}
