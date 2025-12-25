import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import styles from './LanguageSelector.module.css';

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value as 'en' | 'fi';
    updateSettings({ language });
    i18n.changeLanguage(language);
  };

  const options = [
    { value: 'en', label: 'English' },
    { value: 'fi', label: 'Suomi' },
  ];

  return (
    <div className={styles.container}>
      <label htmlFor="language-select" className={styles.label}>
        {t('settings.language.label')}
      </label>
      <select
        id="language-select"
        value={settings.language}
        onChange={handleLanguageChange}
        aria-invalid="false"
        className={styles.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
