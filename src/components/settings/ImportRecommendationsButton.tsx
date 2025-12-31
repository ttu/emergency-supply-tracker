import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { useRecommendedItems } from '../../hooks/useRecommendedItems';
import { parseRecommendedItemsFile } from '../../utils/validation/recommendedItemsValidation';
import styles from './ImportRecommendationsButton.module.css';

export function ImportRecommendationsButton() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importRecommendedItems } = useRecommendedItems();
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const recommendedItemsFile = parseRecommendedItemsFile(json);

        const itemCount = recommendedItemsFile.items.length;
        const confirmMessage = t(
          'settings.recommendations.import.confirmOverwrite',
          {
            name: recommendedItemsFile.meta.name,
            count: itemCount,
          },
        );

        if (window.confirm(confirmMessage)) {
          const result = importRecommendedItems(recommendedItemsFile);
          if (result.valid) {
            alert(t('settings.recommendations.import.success'));
          } else {
            const errorMessages = result.errors
              .map((e) => e.message)
              .join('\n');
            setError(errorMessages);
          }
        }
      } catch (err) {
        console.error('Import recommendations error:', err);
        const message =
          err instanceof Error
            ? err.message
            : t('settings.recommendations.import.error');
        setError(message);
      }
    };

    reader.readAsText(file);

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className={styles.fileInput}
        aria-label={t('settings.recommendations.import.button')}
      />
      <Button variant="secondary" onClick={handleClick}>
        {t('settings.recommendations.import.button')}
      </Button>
      <p className={styles.description}>
        {t('settings.recommendations.import.description')}
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
