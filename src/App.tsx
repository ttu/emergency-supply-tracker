import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { trackAppLaunch } from '@/shared/utils/analytics';
import { SettingsProvider, useSettings } from '@/features/settings';
import { HouseholdProvider, useHousehold } from '@/features/household';
import { InventoryProvider, useInventory } from '@/features/inventory';
import { RecommendedItemsProvider } from '@/features/templates';
import { ThemeApplier } from './components/ThemeApplier';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { Navigation, PageType } from '@/shared/components/Navigation';
import { NotificationBar } from '@/shared/components/NotificationBar';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';
import { DocumentMetadata } from '@/shared/components/DocumentMetadata';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';
import './App.css';

// Loading fallback component for lazy-loaded features
function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div
      style={{
        padding: '2rem',
        textAlign: 'center',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-live="polite"
      aria-label={t('common.loading', { defaultValue: 'Loading...' })}
    >
      {t('common.loading', { defaultValue: 'Loading...' })}
    </div>
  );
}

// Lazy load feature pages for code splitting
const Dashboard = lazy(() =>
  import('@/features/dashboard').then((module) => ({
    default: module.Dashboard,
  })),
);
const Inventory = lazy(() =>
  import('@/features/inventory').then((module) => ({
    default: module.Inventory,
  })),
);
const Settings = lazy(() =>
  import('@/features/settings').then((module) => ({
    default: module.Settings,
  })),
);
const Help = lazy(() =>
  import('@/features/help').then((module) => ({
    default: module.Help,
  })),
);
const Onboarding = lazy(() =>
  import('@/features/onboarding').then((module) => ({
    default: module.Onboarding,
  })),
);

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
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard onNavigate={handleNavigate} />
          </Suspense>
        );
      case 'inventory':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Inventory
              openAddModal={openInventoryModal}
              initialCategoryId={initialCategoryId}
            />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Settings />
          </Suspense>
        );
      case 'help':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Help />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard onNavigate={handleNavigate} />
          </Suspense>
        );
    }
  };

  if (!settings.onboardingCompleted) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Onboarding onComplete={handleOnboardingComplete} />
      </Suspense>
    );
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
      <NotificationBar />
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
          <DocumentMetadata />
          <NotificationProvider>
            <HouseholdProvider>
              <RecommendedItemsProvider>
                <InventoryProvider>
                  <AppContent />
                </InventoryProvider>
              </RecommendedItemsProvider>
            </HouseholdProvider>
          </NotificationProvider>
        </ThemeApplier>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
