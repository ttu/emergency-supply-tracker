import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import type {
  InventorySetSection,
  MultiInventoryExportData,
  MultiInventoryImportSelection,
} from '@/shared/types/exportImport';
import { getInventorySetSectionsWithData } from '@/shared/types/exportImport';
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

  // Per-inventory-set selection state
  const [inventorySetSelections, setInventorySetSelections] = useState<
    Map<string, InventorySetImportState>
  >(() => {
    const map = new Map<string, InventorySetImportState>();
    for (const set of importData.inventorySets) {
      const availableSections =
        set.includedSections.length > 0
          ? set.includedSections
          : getInventorySetSectionsWithData(set.data);
      map.set(set.name, {
        sections: new Set(availableSections),
        expanded: true,
        availableSections,
      });
    }
    return map;
  });

  // Check for name conflicts
  const conflictingNames = useMemo(() => {
    const conflicts = new Map<string, string>();
    const tempNames = [...existingInventorySetNames];

    for (const set of importData.inventorySets) {
      if (existingInventorySetNames.includes(set.name)) {
        const uniqueName = generateUniqueInventorySetName(set.name, tempNames);
        conflicts.set(set.name, uniqueName);
        tempNames.push(uniqueName);
      }
    }
    return conflicts;
  }, [importData.inventorySets, existingInventorySetNames]);

  const handleToggleSettings = useCallback(() => {
    setIncludeSettings((prev) => !prev);
  }, []);

  const handleToggleSetExpanded = useCallback((name: string) => {
    setInventorySetSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(name);
      if (current) {
        next.set(name, { ...current, expanded: !current.expanded });
      }
      return next;
    });
  }, []);

  const handleToggleSetSection = useCallback(
    (name: string, section: InventorySetSection) => {
      setInventorySetSelections((prev) => {
        const next = new Map(prev);
        const current = next.get(name);
        if (current) {
          const newSections = new Set(current.sections);
          if (newSections.has(section)) {
            newSections.delete(section);
          } else {
            newSections.add(section);
          }
          next.set(name, { ...current, sections: newSections });
        }
        return next;
      });
    },
    [],
  );

  const handleToggleSetAll = useCallback((name: string, selected: boolean) => {
    setInventorySetSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(name);
      if (current) {
        const newSections = selected
          ? new Set(current.availableSections)
          : new Set<InventorySetSection>();
        next.set(name, { ...current, sections: newSections });
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setIncludeSettings(hasSettings);
    setInventorySetSelections((prev) => {
      const next = new Map(prev);
      for (const [name, current] of prev) {
        next.set(name, {
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
      for (const [name, current] of prev) {
        next.set(name, { ...current, sections: new Set() });
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

    for (const [name, state] of inventorySetSelections) {
      if (state.sections.size > 0) {
        selection.inventorySets.push({
          originalName: name,
          sections: Array.from(state.sections),
        });
      }
    }

    onImport(selection);
  }, [includeSettings, inventorySetSelections, onImport]);

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
          {importData.inventorySets.map((set) => {
            const state = inventorySetSelections.get(set.name);
            if (!state) return null;

            const conflict = conflictingNames.get(set.name);
            const conflictWarning = conflict
              ? t('settings.multiImport.conflictWarning', {
                  originalName: set.name,
                  newName: conflict,
                })
              : undefined;

            return (
              <InventorySetExportSection
                key={set.name}
                name={set.name}
                isExpanded={state.expanded}
                onToggleExpanded={() => handleToggleSetExpanded(set.name)}
                selectedSections={state.sections}
                onToggleSection={(section) =>
                  handleToggleSetSection(set.name, section)
                }
                onToggleAll={(selected) =>
                  handleToggleSetAll(set.name, selected)
                }
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
