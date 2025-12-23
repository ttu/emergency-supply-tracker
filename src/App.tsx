import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './components/common/LanguageSwitcher';
import './App.css';

function App() {
  const { t } = useTranslation();

  return (
    <div className="app">
      <header className="header">
        <h1>{t('app.title')}</h1>
        <p className="subtitle">{t('app.tagline')}</p>
        <LanguageSwitcher />
      </header>
      <main className="main">
        <p>Coming soon...</p>
      </main>
      <footer className="footer">
        <p>v0.1.0 | Based on 72tuntia.fi guidelines</p>
      </footer>
    </div>
  );
}

export default App;
