import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import styles from './AdvancedFeatures.module.css';

export function AdvancedFeatures() {
  const { t } = useTranslation();
  const { settings, toggleAdvancedFeature } = useSettings();

  const features = [
    {
      key: 'calorieTracking' as const,
      label: t('settings.advanced.calorieTracking.label'),
      description: t('settings.advanced.calorieTracking.description'),
    },
    {
      key: 'powerManagement' as const,
      label: t('settings.advanced.powerManagement.label'),
      description: t('settings.advanced.powerManagement.description'),
    },
    {
      key: 'waterTracking' as const,
      label: t('settings.advanced.waterTracking.label'),
      description: t('settings.advanced.waterTracking.description'),
    },
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t('settings.advanced.title')}</h3>
      <div className={styles.features}>
        {features.map((feature) => (
          <div key={feature.key} className={styles.feature}>
            <div className={styles.featureHeader}>
              <input
                type="checkbox"
                id={`feature-${feature.key}`}
                checked={settings.advancedFeatures[feature.key]}
                onChange={() => toggleAdvancedFeature(feature.key)}
                className={styles.checkbox}
              />
              <label
                htmlFor={`feature-${feature.key}`}
                className={styles.label}
              >
                {feature.label}
              </label>
            </div>
            <p className={styles.description}>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
