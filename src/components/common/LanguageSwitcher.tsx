import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newLanguage = event.target.value as 'en' | 'fi';
    updateSettings({ language: newLanguage });
    i18n.changeLanguage(newLanguage).catch((error) => {
      console.error('Failed to change language:', error);
    });
  };

  return (
    <div className="language-switcher">
      <select value={settings.language} onChange={handleLanguageChange}>
        <option value="en">English</option>
        <option value="fi">Suomi</option>
      </select>
    </div>
  );
}
