import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trackAppLaunch } from '@/shared/utils/analytics';
import { SettingsProvider, useSettings } from '@/features/settings';
import { HouseholdProvider, useHousehold } from '@/features/household';
import { InventoryProvider, useInventory } from '@/features/inventory';
import { RecommendedItemsProvider } from '@/features/templates';
import { ThemeApplier } from './components/ThemeApplier';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { Navigation, PageType } from '@/shared/components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { Onboarding } from '@/features/onboarding';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';
import './App.css';

function AppContent() {
  const { t } = useTranslation();
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
      <a href="#main-content" className="skip-link">
        {t('accessibility.skipToContent')}
      </a>
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main id="main-content" className="main">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  // Track app launch on mount
  useEffect(() => {
    trackAppLaunch();
  }, []);

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeApplier>
          <HouseholdProvider>
            <RecommendedItemsProvider>
              <InventoryProvider>
                <AppContent />
              </InventoryProvider>
            </RecommendedItemsProvider>
          </HouseholdProvider>
        </ThemeApplier>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
