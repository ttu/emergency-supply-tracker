import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import type {
  InventorySetSection,
  MultiInventoryExportData,
  MultiInventoryImportSelection,
} from '@/shared/types/exportImport';
import {
  getInventorySetSectionsWithData,
  LEGACY_IMPORT_SET_NAME,
} from '@/shared/types/exportImport';
import { generateUniqueInventorySetName } from '@/shared/utils/storage/localStorage';
import { InventorySetExportSection } from '../InventorySetExportSection';
import styles from './ImportSelectionModal.module.css';

export interface ImportSelectionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onImport: (selection: MultiInventoryImportSelection) => void;
  readonly importData: MultiInventoryExportData;
  readonly existingInventorySetNames: string[];
}

interface InventorySetImportState {
  sections: Set<InventorySetSection>;
  expanded: boolean;
  availableSections: InventorySetSection[];
}

export function ImportSelectionModal({
  isOpen,
  onClose,
  onImport,
  importData,
  existingInventorySetNames,
}: ImportSelectionModalProps) {
  const { t } = useTranslation();

  const hasSettings = importData.settings !== undefined;

  // Settings checkbox state
  const [includeSettings, setIncludeSettings] = useState(hasSettings);

  // Per-inventory-set selection state (keyed by index to support duplicate set names)
  const [inventorySetSelections, setInventorySetSelections] = useState<
    Map<number, InventorySetImportState>
  >(() => {
    const map = new Map<number, InventorySetImportState>();
    importData.inventorySets.forEach((set, index) => {
      const availableSections =
        set.includedSections.length > 0
          ? set.includedSections
          : getInventorySetSectionsWithData(set.data);
      map.set(index, {
        sections: new Set(availableSections),
        expanded: true,
        availableSections,
      });
    });
    return map;
  });

  // Check for name conflicts (keyed by index so duplicate names each get a unique resolved name)
  const conflictingNames = useMemo(() => {
    const conflicts = new Map<number, string>();
    const tempNames = [...existingInventorySetNames];

    importData.inventorySets.forEach((set, index) => {
      if (existingInventorySetNames.includes(set.name)) {
        const uniqueName = generateUniqueInventorySetName(set.name, tempNames);
        conflicts.set(index, uniqueName);
        tempNames.push(uniqueName);
      }
    });
    return conflicts;
  }, [importData.inventorySets, existingInventorySetNames]);

  const handleToggleSettings = useCallback(() => {
    setIncludeSettings((prev) => !prev);
  }, []);

  const handleToggleSetExpanded = useCallback((index: number) => {
    setInventorySetSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(index);
      if (current) {
        next.set(index, { ...current, expanded: !current.expanded });
      }
      return next;
    });
  }, []);

  const handleToggleSetSection = useCallback(
    (index: number, section: InventorySetSection) => {
      setInventorySetSelections((prev) => {
        const next = new Map(prev);
        const current = next.get(index);
        if (current) {
          const newSections = new Set(current.sections);
          if (newSections.has(section)) {
            newSections.delete(section);
          } else {
            newSections.add(section);
          }
          next.set(index, { ...current, sections: newSections });
        }
        return next;
      });
    },
    [],
  );

  const handleToggleSetAll = useCallback((index: number, selected: boolean) => {
    setInventorySetSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(index);
      if (current) {
        const newSections = selected
          ? new Set(current.availableSections)
          : new Set<InventorySetSection>();
        next.set(index, { ...current, sections: newSections });
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setIncludeSettings(hasSettings);
    setInventorySetSelections((prev) => {
      const next = new Map(prev);
      for (const [index, current] of prev) {
        next.set(index, {
          ...current,
          sections: new Set(current.availableSections),
        });
      }
      return next;
    });
  }, [hasSettings]);

  const handleDeselectAll = useCallback(() => {
    setIncludeSettings(false);
    setInventorySetSelections((prev) => {
      const next = new Map(prev);
      for (const [index, current] of prev) {
        next.set(index, { ...current, sections: new Set() });
      }
      return next;
    });
  }, []);

  const hasAnySelection = useMemo(() => {
    if (includeSettings) return true;
    for (const [, state] of inventorySetSelections) {
      if (state.sections.size > 0) return true;
    }
    return false;
  }, [includeSettings, inventorySetSelections]);

  const isAllSelected = useMemo(() => {
    if (hasSettings && !includeSettings) return false;
    for (const [, state] of inventorySetSelections) {
      if (state.sections.size !== state.availableSections.length) return false;
    }
    return true;
  }, [hasSettings, includeSettings, inventorySetSelections]);

  const handleImport = useCallback(() => {
    const selection: MultiInventoryImportSelection = {
      includeSettings,
      inventorySets: [],
    };

    for (const [index, state] of inventorySetSelections) {
      if (state.sections.size > 0) {
        const set = importData.inventorySets[index];
        if (set) {
          selection.inventorySets.push({
            index,
            originalName: set.name,
            sections: Array.from(state.sections),
          });
        }
      }
    }

    onImport(selection);
  }, [
    includeSettings,
    inventorySetSelections,
    importData.inventorySets,
    onImport,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.importSelection.title')}
      size="medium"
    >
      <div className={styles.content}>
        <p className={styles.description}>
          {t('settings.multiImport.description')}
        </p>

        <div className={styles.warning}>
          {t('settings.multiImport.warning')}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={handleSelectAll}
            disabled={isAllSelected}
          >
            {t('settings.exportSelection.selectAll')}
          </button>
          <span className={styles.separator}>|</span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={handleDeselectAll}
            disabled={!hasAnySelection}
          >
            {t('settings.exportSelection.deselectAll')}
          </button>
        </div>

        <div className={styles.sectionList}>
          {/* Global Settings */}
          {hasSettings && (
            <label className={styles.settingsItem}>
              <input
                type="checkbox"
                checked={includeSettings}
                onChange={handleToggleSettings}
                className={styles.checkbox}
              />
              <span className={styles.settingsLabel}>
                {t('settings.exportSelection.sections.settings')}
              </span>
            </label>
          )}

          {/* Inventory Sets */}
          {importData.inventorySets.map((set, index) => {
            const state = inventorySetSelections.get(index);
            if (!state) return null;

            const displayName =
              set.name === LEGACY_IMPORT_SET_NAME
                ? t('settings.import.legacySetName')
                : set.name;
            const conflict = conflictingNames.get(index);
            const conflictWarning = conflict
              ? t('settings.multiImport.conflictWarning', {
                  originalName: displayName,
                  newName: conflict,
                })
              : undefined;

            return (
              <InventorySetExportSection
                key={`${set.name}-${index}`}
                name={displayName}
                isExpanded={state.expanded}
                onToggleExpanded={() => handleToggleSetExpanded(index)}
                selectedSections={state.sections}
                onToggleSection={(section) =>
                  handleToggleSetSection(index, section)
                }
                onToggleAll={(selected) => handleToggleSetAll(index, selected)}
                data={set.data}
                conflictWarning={conflictWarning}
                availableSections={state.availableSections}
              />
            );
          })}
        </div>

        <div className={styles.buttonRow}>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!hasAnySelection}
          >
            {t('settings.importSelection.importButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
