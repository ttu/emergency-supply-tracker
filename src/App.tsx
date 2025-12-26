import { useState } from 'react';
import { SettingsProvider } from './contexts/SettingsProvider';
import { HouseholdProvider } from './contexts/HouseholdProvider';
import { InventoryProvider } from './contexts/InventoryProvider';
import { ThemeApplier } from './components/ThemeApplier';
import { Navigation, PageType } from './components/common/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'inventory':
        return <Inventory />;
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <SettingsProvider>
      <ThemeApplier>
        <HouseholdProvider>
          <InventoryProvider>
            <div className="app">
              <Navigation
                currentPage={currentPage}
                onNavigate={setCurrentPage}
              />
              <main className="main">{renderPage()}</main>
            </div>
          </InventoryProvider>
        </HouseholdProvider>
      </ThemeApplier>
    </SettingsProvider>
  );
}

export default App;
