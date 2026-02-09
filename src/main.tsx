import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/config';
import App from './App.tsx';
import { AllProviders } from '@/shared/components/AllProviders';
import * as serviceWorker from '@/shared/utils/serviceWorker';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      }
    >
      <AllProviders>
        <App />
      </AllProviders>
    </Suspense>
  </StrictMode>,
);

// Register service worker for offline support
serviceWorker.register({
  onSuccess: () => {
    if (import.meta.env.DEV) {
      console.log(
        'Service worker registered successfully. App is available offline.',
      );
    }
  },
  onUpdate: () => {
    if (import.meta.env.DEV) {
      console.log('New version available. Close all tabs to update.');
    }
  },
});
