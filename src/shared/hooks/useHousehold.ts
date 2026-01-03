import { useContext } from 'react';
import { HouseholdContext } from '@/shared/contexts/HouseholdContext';

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHousehold must be used within HouseholdProvider');
  }
  return context;
}
