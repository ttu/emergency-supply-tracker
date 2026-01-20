import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { trackAppLaunch } from '@/shared/utils/analytics';
import { SettingsProvider, useSettings } from '@/features/settings';
import { HouseholdProvider, useHousehold } from '@/features/household';
import { InventoryProvider, useInventory } from '@/features/inventory';
import { RecommendedItemsProvider } from '@/features/templates';
import { SettingsEffects } from './components/SettingsEffects';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { Navigation, PageType } from '@/shared/components/Navigation';
import { NotificationBar } from '@/shared/components/NotificationBar';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';
import { composeProviders } from '@/shared/utils/composeProviders';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';
import './App.css';

/**
 * Composed application providers.
 *
 * Order matters - providers are nested from first (outermost) to last (innermost):
 * 1. ErrorBoundary - Catches React errors
 * 2. SettingsProvider - Settings context (theme, language, onboarding)
 * 3. SettingsEffects - Applies theme + document metadata (requires SettingsProvider)
 * 4. NotificationProvider - Toast notifications (required by InventoryProvider)
 * 5. HouseholdProvider - Household configuration
 * 6. RecommendedItemsProvider - Recommended item definitions
 * 7. InventoryProvider - Inventory items and categories (uses NotificationProvider)
 */
const AppProviders = composeProviders([
  ErrorBoundary,
  SettingsProvider,
  SettingsEffects,
  NotificationProvider,
  HouseholdProvider,
  RecommendedItemsProvider,
  InventoryProvider,
]);

// Loading fallback component for lazy-loaded features
function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div
      className="loading-fallback"
      aria-live="polite"
      aria-label={t('common.loading')}
    >
      {t('common.loading')}
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
  // Selected category is lifted to App level so it persists across navigation
  const [selectedCategoryId, setSelectedCategoryId] = useState<
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
      // Update category when explicitly navigating from Dashboard with a category
      if (options?.initialCategoryId !== undefined) {
        setSelectedCategoryId(options.initialCategoryId);
      }
    } else {
      setOpenInventoryModal(false);
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
    // Render dashboard component (reused for default case)
    const dashboardPage = (
      <Suspense fallback={<LoadingFallback />}>
        <Dashboard onNavigate={handleNavigate} />
      </Suspense>
    );

    switch (currentPage) {
      case 'dashboard':
        return dashboardPage;
      case 'inventory':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Inventory
              openAddModal={openInventoryModal}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={setSelectedCategoryId}
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
        return dashboardPage;
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
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
