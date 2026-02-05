import { createContext } from 'react';
import type { InventorySetId } from '@/shared/types';
import type { InventorySetListItem } from '@/shared/utils/storage/localStorage';

export interface InventorySetContextValue {
  activeInventorySetId: InventorySetId;
  inventorySets: InventorySetListItem[];
  setActiveInventorySet: (id: InventorySetId) => void;
  createInventorySet: (name: string) => InventorySetId;
  deleteInventorySet: (id: InventorySetId) => void;
  renameInventorySet: (id: InventorySetId, name: string) => void;
}

export const InventorySetContext = createContext<
  InventorySetContextValue | undefined
>(undefined);
