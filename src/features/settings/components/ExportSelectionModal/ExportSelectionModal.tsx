import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import type { InventorySetId } from '@/shared/types';
import type {
  InventorySetSection,
  MultiInventoryExportSelection,
} from '@/shared/types/exportImport';
import type { InventorySetExportInfo } from '@/shared/utils/storage/localStorage';
import { InventorySetExportSection } from '../InventorySetExportSection';
import styles from './ExportSelectionModal.module.css';

export interface ExportSelectionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onExport: (selection: MultiInventoryExportSelection) => void;
  readonly inventorySets: InventorySetExportInfo[];
  readonly hasSettings: boolean;
}

interface InventorySetSelectionState {
  sections: Set<InventorySetSection>;
  expanded: boolean;
}

export function ExportSelectionModal({
  isOpen,
  onClose,
  onExport,
  inventorySets,
  hasSettings,
}: ExportSelectionModalProps) {
  const { t } = useTranslation();

  // Settings checkbox state
  const [includeSettings, setIncludeSettings] = useState(hasSettings);

  // Per-inventory-set selection state
  const [inventorySetSelections, setInventorySetSelections] = useState<
    Map<InventorySetId, InventorySetSelectionState>
  >(() => {
    const map = new Map<InventorySetId, InventorySetSelectionState>();
    for (const set of inventorySets) {
      map.set(set.id, {
        sections: new Set(set.sectionsWithData),
        expanded: set.isActive,
      });
    }
    return map;
  });

  const handleToggleSettings = useCallback(() => {
    setIncludeSettings((prev) => !prev);
  }, []);

  const handleToggleSetExpanded = useCallback((id: InventorySetId) => {
    setInventorySetSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(id);
      if (current) {
        next.set(id, { ...current, expanded: !current.expanded });
      }
      return next;
    });
  }, []);

  const handleToggleSetSection = useCallback(
    (id: InventorySetId, section: InventorySetSection) => {
      setInventorySetSelections((prev) => {
        const next = new Map(prev);
        const current = next.get(id);
        if (current) {
          const newSections = new Set(current.sections);
          if (newSections.has(section)) {
            newSections.delete(section);
          } else {
            newSections.add(section);
          }
          next.set(id, { ...current, sections: newSections });
        }
        return next;
      });
    },
    [],
  );

  const handleToggleSetAll = useCallback(
    (id: InventorySetId, selected: boolean) => {
      setInventorySetSelections((prev) => {
        const next = new Map(prev);
        const current = next.get(id);
        const setInfo = inventorySets.find((s) => s.id === id);
        if (current && setInfo) {
          const newSections = selected
            ? new Set(setInfo.sectionsWithData)
            : new Set<InventorySetSection>();
          next.set(id, { ...current, sections: newSections });
        }
        return next;
      });
    },
    [inventorySets],
  );

  const handleSelectAll = useCallback(() => {
    setIncludeSettings(hasSettings);
    setInventorySetSelections((prev) => {
      const next = new Map(prev);
      for (const set of inventorySets) {
        const current = next.get(set.id);
        if (current) {
          next.set(set.id, {
            ...current,
            sections: new Set(set.sectionsWithData),
          });
        }
      }
      return next;
    });
  }, [hasSettings, inventorySets]);

  const handleDeselectAll = useCallback(() => {
    setIncludeSettings(false);
    setInventorySetSelections((prev) => {
      const next = new Map(prev);
      for (const [id, current] of prev) {
        next.set(id, { ...current, sections: new Set() });
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
    for (const set of inventorySets) {
      const state = inventorySetSelections.get(set.id);
      if (!state) return false;
      if (state.sections.size !== set.sectionsWithData.length) return false;
    }
    return true;
  }, [hasSettings, includeSettings, inventorySets, inventorySetSelections]);

  const handleExport = useCallback(() => {
    const selection: MultiInventoryExportSelection = {
      includeSettings,
      inventorySets: [],
    };

    for (const [id, state] of inventorySetSelections) {
      if (state.sections.size > 0) {
        selection.inventorySets.push({
          id,
          sections: Array.from(state.sections),
        });
      }
    }

    onExport(selection);
    onClose();
  }, [includeSettings, inventorySetSelections, onExport, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.exportSelection.title')}
      size="medium"
    >
      <div className={styles.content}>
        <p className={styles.description}>
          {t('settings.multiExport.description')}
        </p>

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
          <label
            className={`${styles.settingsItem} ${!hasSettings ? styles.disabled : ''}`}
          >
            <input
              type="checkbox"
              checked={includeSettings}
              onChange={handleToggleSettings}
              disabled={!hasSettings}
              className={styles.checkbox}
            />
            <span className={styles.settingsLabel}>
              {t('settings.exportSelection.sections.settings')}
            </span>
          </label>

          {/* Inventory Sets */}
          {inventorySets.map((set) => {
            const state = inventorySetSelections.get(set.id);
            if (!state) return null;

            return (
              <InventorySetExportSection
                key={set.id}
                name={set.name}
                isActive={set.isActive}
                isExpanded={state.expanded}
                onToggleExpanded={() => handleToggleSetExpanded(set.id)}
                selectedSections={state.sections}
                onToggleSection={(section) =>
                  handleToggleSetSection(set.id, section)
                }
                onToggleAll={(selected) => handleToggleSetAll(set.id, selected)}
                data={set.data}
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
            onClick={handleExport}
            disabled={!hasAnySelection}
          >
            {t('settings.exportSelection.exportButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
