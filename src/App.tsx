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
  const [openInventoryModal, setOpenInventoryModal] = useState(false);

  const handleNavigate = (
    page: PageType,
    options?: { openAddModal?: boolean },
  ) => {
    setCurrentPage(page);
    if (page === 'inventory' && options?.openAddModal) {
      setOpenInventoryModal(true);
    } else {
      setOpenInventoryModal(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'inventory':
        return <Inventory openAddModal={openInventoryModal} />;
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
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
