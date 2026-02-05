import { ReactNode, useState, useCallback, useMemo } from 'react';
import type { InventorySetId } from '@/shared/types';
import {
  getInventorySetList,
  getActiveInventorySetId,
  setActiveInventorySetId,
  createInventorySet as createInventorySetStorage,
  deleteInventorySet as deleteInventorySetStorage,
  renameInventorySet as renameInventorySetStorage,
  getAppData,
  DEFAULT_INVENTORY_SET_ID,
} from '@/shared/utils/storage/localStorage';
import { InventorySetContext } from './context';

function readInventorySetState(): {
  inventorySets: ReturnType<typeof getInventorySetList>;
  activeInventorySetId: InventorySetId;
} {
  const list = getInventorySetList();
  if (list.length === 0) {
    getAppData(); // creates default root and saves
    return {
      inventorySets: getInventorySetList(),
      activeInventorySetId:
        getActiveInventorySetId() ?? DEFAULT_INVENTORY_SET_ID,
    };
  }
  return {
    inventorySets: list,
    activeInventorySetId: getActiveInventorySetId() ?? DEFAULT_INVENTORY_SET_ID,
  };
}

export function InventorySetProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [{ activeInventorySetId, inventorySets }, setState] = useState(
    readInventorySetState,
  );

  const setActiveInventorySet = useCallback((id: InventorySetId) => {
    const list = getInventorySetList();
    const exists = list.some((w) => w.id === id);
    if (!exists) return;
    setActiveInventorySetId(id);
    setState((prev) => ({
      ...prev,
      activeInventorySetId: id,
      inventorySets: list,
    }));
  }, []);

  const createInventorySet = useCallback((name: string) => {
    const id = createInventorySetStorage(name);
    setState((prev) => ({ ...prev, inventorySets: getInventorySetList() }));
    return id;
  }, []);

  const deleteInventorySet = useCallback((id: InventorySetId) => {
    deleteInventorySetStorage(id);
    setState((prev) => ({
      ...prev,
      activeInventorySetId:
        getActiveInventorySetId() ?? DEFAULT_INVENTORY_SET_ID,
      inventorySets: getInventorySetList(),
    }));
  }, []);

  const renameInventorySet = useCallback((id: InventorySetId, name: string) => {
    renameInventorySetStorage(id, name);
    setState((prev) => ({ ...prev, inventorySets: getInventorySetList() }));
  }, []);

  const value = useMemo(
    () => ({
      activeInventorySetId,
      inventorySets,
      setActiveInventorySet,
      createInventorySet,
      renameInventorySet,
      deleteInventorySet,
    }),
    [
      activeInventorySetId,
      inventorySets,
      setActiveInventorySet,
      createInventorySet,
      renameInventorySet,
      deleteInventorySet,
    ],
  );

  return (
    <InventorySetContext.Provider value={value}>
      <div key={activeInventorySetId}>{children}</div>
    </InventorySetContext.Provider>
  );
}
