import { useState, useEffect } from 'react';
import { trackAppLaunch } from './utils/analytics';
import { SettingsProvider } from './contexts/SettingsProvider';
import { HouseholdProvider } from './contexts/HouseholdProvider';
import { InventoryProvider } from './contexts/InventoryProvider';
import { ThemeApplier } from './components/ThemeApplier';
import { Navigation, PageType } from './components/common/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { Onboarding } from './components/onboarding/Onboarding';
import { useSettings } from './hooks/useSettings';
import { useHousehold } from './hooks/useHousehold';
import { useInventory } from './hooks/useInventory';
import type { HouseholdConfig, InventoryItem } from './types';
import './App.css';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [openInventoryModal, setOpenInventoryModal] = useState(false);
  const [initialCategoryId, setInitialCategoryId] = useState<
    string | undefined
  >(undefined);

  const { settings, updateSettings } = useSettings();
  const { updateHousehold } = useHousehold();
  const { addItems } = useInventory();

  const handleNavigate = (
    page: PageType,
    options?: { openAddModal?: boolean; initialCategoryId?: string },
  ) => {
    setCurrentPage(page);
    if (page === 'inventory') {
      setOpenInventoryModal(options?.openAddModal || false);
      setInitialCategoryId(options?.initialCategoryId);
    } else {
      setOpenInventoryModal(false);
      setInitialCategoryId(undefined);
    }
  };

  const handleOnboardingComplete = (
    household: HouseholdConfig,
    items: InventoryItem[],
  ) => {
    updateHousehold(household);
    if (items.length > 0) {
      addItems(items);
    }
    updateSettings({ onboardingCompleted: true });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'inventory':
        return (
          <Inventory
            openAddModal={openInventoryModal}
            initialCategoryId={initialCategoryId}
          />
        );
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (!settings.onboardingCompleted) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="app">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="main">{renderPage()}</main>
    </div>
  );
}

function App() {
  // Track app launch on mount
  useEffect(() => {
    trackAppLaunch();
  }, []);

  return (
    <SettingsProvider>
      <ThemeApplier>
        <HouseholdProvider>
          <InventoryProvider>
            <AppContent />
          </InventoryProvider>
        </HouseholdProvider>
      </ThemeApplier>
    </SettingsProvider>
  );
}

export default App;
