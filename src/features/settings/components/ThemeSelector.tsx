import { useTranslation } from 'react-i18next';
import { useSettings } from '@/features/settings';
import { SELECTABLE_THEMES } from '@/shared/types';
import styles from './ThemeSelector.module.css';

export function ThemeSelector() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = e.target.value as
      | 'light'
      | 'dark'
      | 'midnight'
      | 'ocean'
      | 'sunset'
      | 'forest'
      | 'lavender'
      | 'minimal';
    updateSettings({ theme });

    // Apply theme to document
    document.documentElement.dataset.theme = theme;
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
        {SELECTABLE_THEMES.map((theme) => (
          <option key={theme} value={theme}>
            {t(`settings.theme.${theme}`)}
          </option>
        ))}
      </select>
      <p className={styles.description}>{t('settings.theme.description')}</p>

      <div className={styles.checkboxContainer}>
        <label htmlFor="high-contrast-toggle" className={styles.checkboxLabel}>
          <input
            id="high-contrast-toggle"
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
