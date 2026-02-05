import { useContext } from 'react';
import { InventorySetContext } from '../context';

export function useInventorySet() {
  const context = useContext(InventorySetContext);
  if (context === undefined) {
    throw new Error(
      'useInventorySet must be used within an InventorySetProvider',
    );
  }
  return context;
}
