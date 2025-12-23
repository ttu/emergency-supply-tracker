import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/config';
import App from './App.tsx';
import { InventoryProvider } from './contexts/InventoryProvider';
import { HouseholdProvider } from './contexts/HouseholdProvider';
import { SettingsProvider } from './contexts/SettingsProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <HouseholdProvider>
        <InventoryProvider>
          <App />
        </InventoryProvider>
      </HouseholdProvider>
    </SettingsProvider>
  </StrictMode>,
);
