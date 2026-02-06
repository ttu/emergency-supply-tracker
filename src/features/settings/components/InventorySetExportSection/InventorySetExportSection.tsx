import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  InventorySetSection,
  InventorySetSectionInfo,
} from '@/shared/types/exportImport';
import {
  ALL_INVENTORY_SET_SECTIONS,
  getInventorySetSectionInfo,
} from '@/shared/types/exportImport';
import type { InventorySetData } from '@/shared/types';
import styles from './InventorySetExportSection.module.css';

export interface InventorySetExportSectionProps {
  readonly name: string;
  readonly isActive?: boolean;
  readonly isExpanded: boolean;
  readonly onToggleExpanded: () => void;
  readonly selectedSections: Set<InventorySetSection>;
  readonly onToggleSection: (section: InventorySetSection) => void;
  readonly onToggleAll: (selected: boolean) => void;
  readonly data: Partial<InventorySetData>;
  readonly conflictWarning?: string;
  readonly availableSections?: InventorySetSection[];
}

export function InventorySetExportSection({
  name,
  isActive,
  isExpanded,
  onToggleExpanded,
  selectedSections,
  onToggleSection,
  onToggleAll,
  data,
  conflictWarning,
  availableSections,
}: InventorySetExportSectionProps) {
  const { t } = useTranslation();

  const sectionInfoList = useMemo(
    () => getInventorySetSectionInfo(data),
    [data],
  );

  // Filter sections to only show available ones (for import)
  const displaySections = useMemo(() => {
    if (availableSections) {
      return ALL_INVENTORY_SET_SECTIONS.filter((s) =>
        availableSections.includes(s),
      );
    }
    return ALL_INVENTORY_SET_SECTIONS;
  }, [availableSections]);

  const sectionsWithData = useMemo(
    () =>
      sectionInfoList
        .filter((info) => info.hasData)
        .map((info) => info.section),
    [sectionInfoList],
  );

  const isAllSelected = useMemo(() => {
    const selectableSections = availableSections ?? sectionsWithData;
    return (
      selectableSections.length > 0 &&
      selectableSections.every((s) => selectedSections.has(s))
    );
  }, [availableSections, sectionsWithData, selectedSections]);

  const isPartiallySelected = useMemo(() => {
    const selectableSections = availableSections ?? sectionsWithData;
    const selectedCount = selectableSections.filter((s) =>
      selectedSections.has(s),
    ).length;
    return selectedCount > 0 && selectedCount < selectableSections.length;
  }, [availableSections, sectionsWithData, selectedSections]);

  const handleSetCheckboxChange = useCallback(() => {
    onToggleAll(!isAllSelected);
  }, [isAllSelected, onToggleAll]);

  const getSectionLabel = (section: InventorySetSection): string => {
    return t(`settings.exportSelection.sections.${section}`);
  };

  const formatCount = (info: InventorySetSectionInfo): string => {
    if (!info.hasData) {
      return availableSections ? '' : '(0)';
    }
    if (info.section === 'household') {
      return '';
    }
    return `(${info.count})`;
  };

  const isSectionDisabled = (section: InventorySetSection): boolean => {
    if (availableSections) {
      return !availableSections.includes(section);
    }
    return !sectionsWithData.includes(section);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.expandButton}
          onClick={onToggleExpanded}
          aria-expanded={isExpanded}
          aria-label={
            isExpanded
              ? t('settings.multiExport.collapseSet', { name })
              : t('settings.multiExport.expandSet', { name })
          }
        >
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </button>
        <label className={styles.setLabel}>
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = isPartiallySelected;
              }
            }}
            onChange={handleSetCheckboxChange}
            className={styles.checkbox}
          />
          <span className={styles.setName}>
            {name}
            {isActive && (
              <span className={styles.activeBadge}>
                {t('settings.inventorySets.active')}
              </span>
            )}
          </span>
        </label>
      </div>

      {conflictWarning && (
        <div className={styles.conflictWarning}>{conflictWarning}</div>
      )}

      {isExpanded && (
        <div className={styles.sectionList}>
          {displaySections.map((section) => {
            const info = sectionInfoList.find((i) => i.section === section);
            const disabled = isSectionDisabled(section);

            return (
              <label
                key={section}
                className={`${styles.sectionItem} ${disabled ? styles.disabled : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedSections.has(section)}
                  onChange={() => onToggleSection(section)}
                  disabled={disabled}
                  className={styles.checkbox}
                />
                <span className={styles.sectionLabel}>
                  {getSectionLabel(section)}
                  {info && formatCount(info) && (
                    <span className={styles.count}>{formatCount(info)}</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
