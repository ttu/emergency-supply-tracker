import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/config';
import App from './App.tsx';
import { HouseholdProvider } from '@/features/household';
import { InventoryProvider } from '@/features/inventory';
import { SettingsProvider } from '@/features/settings';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { ThemeApplier } from './components/ThemeApplier';
import * as serviceWorker from '@/shared/utils/serviceWorker';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      }
    >
      <ErrorBoundary>
        <SettingsProvider>
          <ThemeApplier>
            <HouseholdProvider>
              <InventoryProvider>
                <App />
              </InventoryProvider>
            </HouseholdProvider>
          </ThemeApplier>
        </SettingsProvider>
      </ErrorBoundary>
    </Suspense>
  </StrictMode>,
);

// Register service worker for offline support
serviceWorker.register({
  onSuccess: () => {
    console.log(
      'Service worker registered successfully. App is available offline.',
    );
  },
  onUpdate: () => {
    console.log('New version available. Close all tabs to update.');
  },
});
