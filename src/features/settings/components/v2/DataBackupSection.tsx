import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Field, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import {
  ExportButton,
  ImportButton,
  ShoppingListExport,
  DebugExport,
} from '@/features/settings';
import { useInventory } from '@/features/inventory';
import {
  getLocalStorageUsageMB,
  LOCAL_STORAGE_LIMIT_BYTES,
} from '@/shared/utils/storage/storageUsage';
import { getAppData } from '@/shared/utils/storage/localStorage';
import { PanelHeader, SectionHeader } from './SettingsRows';

function backupLabel(
  themeKey: string,
  lastBackup: string | undefined,
  t: TFunction,
): string {
  if (lastBackup) {
    return t(`v2.settings.data.lastBackup.${themeKey}`, { date: lastBackup });
  }
  return t(`v2.settings.data.noBackup.${themeKey}`);
}

export function DataBackupSection() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { items } = useInventory();

  // Read storage-derived values lazily via useMemo so we don't hit
  // localStorage on every parent render (Settings re-renders on keystrokes
  // elsewhere). Inventory changes are the only same-tab event that updates
  // these values, so keying on `items` covers every user-driven mutation
  // this panel surfaces. `items` isn't referenced inside the closure — its
  // identity change is the signal "re-read storage".
  const { storageMB, lastBackup, lastWrite } = useMemo(
    () => {
      const appData = getAppData();
      return {
        storageMB: getLocalStorageUsageMB(),
        lastBackup: appData?.lastBackupDate,
        lastWrite: appData?.lastModified,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );

  const limitMB = Math.round(LOCAL_STORAGE_LIMIT_BYTES / (1024 * 1024));
  const recordsUnit = t(`v2.settings.data.recordsUnit.${themeKey}`);

  return (
    <section id="sec-data" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§9"
        title={t(`v2.settings.data.title.${themeKey}`)}
        sub={t(`v2.settings.data.sub.${themeKey}`)}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        <Panel padding={0}>
          <PanelHeader>
            {t(`v2.settings.data.storageHeader.${themeKey}`)}
          </PanelHeader>
          <Field
            label={t(`v2.settings.data.location.${themeKey}`)}
            value={t(`v2.settings.data.locationValue.${themeKey}`)}
            hint={t(`v2.settings.data.locationHint.${themeKey}`)}
          />
          <Field
            label={t(`v2.settings.data.lastWrite.${themeKey}`)}
            value={lastWrite ? lastWrite.slice(0, 16).replace('T', ' · ') : '—'}
          />
          <Field
            label={t(`v2.settings.data.records.${themeKey}`)}
            value={`${items.length} ${recordsUnit}`}
          />
          <Field
            label={t(`v2.settings.data.storageUsed.${themeKey}`)}
            value={`${storageMB} MB / ~${limitMB} MB`}
            hint={`${Math.round((Number(storageMB) / limitMB) * 100)}%`}
          />
        </Panel>
        <Panel padding={0}>
          <PanelHeader>
            {t(`v2.settings.data.backupHeader.${themeKey}`)}
          </PanelHeader>
          <div
            className="design-v2-embed"
            style={{ padding: 20, display: 'grid', gap: 10 }}
          >
            <ExportButton />
            <ShoppingListExport />
            <ImportButton />
          </div>
          <div
            style={{
              padding: '12px 22px',
              background: 'var(--color-panel-2)',
              borderTop: '1px solid var(--color-rule-soft)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-2)',
              letterSpacing: '0.04em',
            }}
          >
            {backupLabel(themeKey, lastBackup, t)}
          </div>
        </Panel>
      </div>
      <Panel padding={0} style={{ marginTop: 14 }}>
        <PanelHeader>
          {t(`v2.settings.data.diagnosticsHeader.${themeKey}`)}
        </PanelHeader>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <DebugExport />
        </div>
      </Panel>
    </section>
  );
}
