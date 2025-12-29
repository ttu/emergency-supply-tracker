import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import styles from './ThemeSelector.module.css';

export function ThemeSelector() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = e.target.value as 'light' | 'dark';
    updateSettings({ theme });

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleHighContrastChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ highContrast: e.target.checked });
  };

  return (
    <div className={styles.container}>
      <label htmlFor="theme-select" className={styles.label}>
        {t('settings.theme.label')}
      </label>
      <select
        id="theme-select"
        value={settings.theme}
        onChange={handleThemeChange}
        className={styles.select}
      >
        <option value="light">{t('settings.theme.light')}</option>
        <option value="dark">{t('settings.theme.dark')}</option>
      </select>
      <p className={styles.description}>{t('settings.theme.description')}</p>

      <div className={styles.checkboxContainer}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={settings.highContrast ?? false}
            onChange={handleHighContrastChange}
            className={styles.checkbox}
          />
          <span className={styles.checkboxText}>
            {t('accessibility.highContrast')}
          </span>
        </label>
        <p className={styles.description}>
          {t('accessibility.highContrastDescription')}
        </p>
      </div>
    </div>
  );
}
