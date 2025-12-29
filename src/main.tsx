import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/config';
import App from './App.tsx';
import { InventoryProvider } from './contexts/InventoryProvider';
import { HouseholdProvider } from './contexts/HouseholdProvider';
import { SettingsProvider } from './contexts/SettingsProvider';
import * as serviceWorker from './utils/serviceWorker';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      }
    >
      <SettingsProvider>
        <HouseholdProvider>
          <InventoryProvider>
            <App />
          </InventoryProvider>
        </HouseholdProvider>
      </SettingsProvider>
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
