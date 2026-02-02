import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { Button } from '@/shared/components/Button';
import styles from './CustomTemplates.module.css';

export function CustomTemplates() {
  const { t } = useTranslation(['common', 'categories']);
  const { customTemplates, deleteCustomTemplate } = useInventory();

  if (customTemplates.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyMessage}>
          {t('settings.customTemplates.empty')}
        </p>
        <p className={styles.hint}>{t('settings.customTemplates.hint')}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        {t('settings.customTemplates.description', {
          count: customTemplates.length,
        })}
      </p>
      <ul className={styles.templatesList} role="list">
        {customTemplates.map((template) => (
          <li key={template.id} className={styles.templateItem}>
            <div className={styles.templateContent}>
              <span className={styles.templateName}>
                <strong>{template.name}</strong>
                <span className={styles.templateCategory}>
                  {' '}
                  ({t(template.category, { ns: 'categories' })})
                </span>
              </span>
              <span className={styles.templateUnit}>
                {t(`units.${template.defaultUnit}`)}
              </span>
            </div>
            <Button
              variant="danger"
              size="small"
              className={styles.deleteButton}
              onClick={() => deleteCustomTemplate(template.id)}
              aria-label={`${t('common.delete')}: ${template.name}`}
            >
              {t('common.delete')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
