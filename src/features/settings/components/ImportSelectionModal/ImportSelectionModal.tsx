import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import type {
  ExportSection,
  PartialExportData,
  SectionInfo,
} from '@/shared/types/exportImport';
import {
  ALL_EXPORT_SECTIONS,
  getSectionInfo,
  getSectionsWithData,
} from '@/shared/types/exportImport';
import styles from './ImportSelectionModal.module.css';

export interface ImportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sections: ExportSection[]) => void;
  importData: PartialExportData;
}

export function ImportSelectionModal({
  isOpen,
  onClose,
  onImport,
  importData,
}: ImportSelectionModalProps) {
  const { t } = useTranslation();

  // Get sections that have data in the import file
  const sectionsWithData = useMemo(
    () => getSectionsWithData(importData),
    [importData],
  );

  // Initialize with all available sections selected
  const [selectedSections, setSelectedSections] = useState<Set<ExportSection>>(
    () => new Set(sectionsWithData),
  );

  // Get section info with counts
  const sectionInfoList = useMemo(
    () => getSectionInfo(importData),
    [importData],
  );

  const handleToggleSection = useCallback((section: ExportSection) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedSections(new Set(sectionsWithData));
  }, [sectionsWithData]);

  const handleDeselectAll = useCallback(() => {
    setSelectedSections(new Set());
  }, []);

  const handleImport = useCallback(() => {
    onImport(Array.from(selectedSections));
  }, [selectedSections, onImport]);

  const getSectionLabel = (section: ExportSection): string => {
    return t(`settings.exportSelection.sections.${section}`);
  };

  const formatCount = (info: SectionInfo): string => {
    if (!info.hasData) {
      return t('settings.importSelection.notInFile');
    }
    if (info.section === 'household' || info.section === 'settings') {
      return '';
    }
    return `(${info.count})`;
  };

  const allSelected = selectedSections.size === sectionsWithData.length;
  const noneSelected = selectedSections.size === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.importSelection.title')}
      size="small"
    >
      <div className={styles.content}>
        <p className={styles.description}>
          {t('settings.importSelection.description')}
        </p>

        <div className={styles.warning}>
          {t('settings.importSelection.warning')}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={handleSelectAll}
            disabled={allSelected}
          >
            {t('settings.exportSelection.selectAll')}
          </button>
          <span className={styles.separator}>|</span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={handleDeselectAll}
            disabled={noneSelected}
          >
            {t('settings.exportSelection.deselectAll')}
          </button>
        </div>

        <div className={styles.sectionList}>
          {ALL_EXPORT_SECTIONS.map((section) => {
            const info = sectionInfoList.find((i) => i.section === section)!;
            const hasData = sectionsWithData.includes(section);

            return (
              <label
                key={section}
                className={`${styles.sectionItem} ${!hasData ? styles.disabled : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedSections.has(section)}
                  onChange={() => handleToggleSection(section)}
                  disabled={!hasData}
                  className={styles.checkbox}
                />
                <span className={styles.sectionLabel}>
                  {getSectionLabel(section)}
                  <span
                    className={`${styles.count} ${!hasData ? styles.notAvailable : ''}`}
                  >
                    {formatCount(info)}
                  </span>
                </span>
              </label>
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
            disabled={noneSelected}
          >
            {t('settings.importSelection.importButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
