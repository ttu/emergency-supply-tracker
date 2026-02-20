import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventorySet } from '@/features/inventory-set';
import type { InventorySetId } from '@/shared/types';
import { LEGACY_IMPORT_SET_NAME } from '@/shared/types/exportImport';
import styles from './InventorySetSelector.module.css';

interface InventorySetSelectorProps {
  readonly onManageClick: () => void;
}

export function InventorySetSelector({
  onManageClick,
}: InventorySetSelectorProps) {
  const { t } = useTranslation();
  const { activeInventorySetId, inventorySets, setActiveInventorySet } =
    useInventorySet();

  const getDisplayName = useCallback(
    (name: string) =>
      name === LEGACY_IMPORT_SET_NAME
        ? t('settings.import.legacySetName')
        : name,
    [t],
  );

  const inventorySetsWithDisplayNames = useMemo(
    () =>
      inventorySets.map((set) => ({
        ...set,
        displayName: getDisplayName(set.name),
      })),
    [inventorySets, getDisplayName],
  );

  const hasMultipleSets = inventorySets.length > 1;

  return (
    <section
      className={styles.container}
      data-testid="inventory-set-selector"
      aria-label={t('settings.inventorySetSelector.regionLabel')}
    >
      <div className={styles.selectorRow}>
        <label htmlFor="inventory-set-selector" className={styles.label}>
          {t('settings.inventorySetSelector.label')}
        </label>
        <select
          id="inventory-set-selector"
          value={activeInventorySetId}
          onChange={(e) =>
            setActiveInventorySet(e.target.value as InventorySetId)
          }
          className={styles.select}
          disabled={!hasMultipleSets}
        >
          {inventorySetsWithDisplayNames.map((set) => (
            <option key={set.id} value={set.id}>
              {set.displayName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onManageClick}
          className={styles.manageLink}
          aria-label={t('settings.inventorySetSelector.manageLabel')}
        >
          {t('settings.inventorySetSelector.manage')}
        </button>
      </div>
    </section>
  );
}
