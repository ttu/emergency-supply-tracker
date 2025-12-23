import { useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
