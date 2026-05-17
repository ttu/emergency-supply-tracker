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

function backupLabel(themeKey: string, lastBackup: string | undefined): string {
  if (lastBackup) {
    return themeKey === 'pantry'
      ? `Last backup: ${lastBackup}`
      : `LAST BACKUP ${lastBackup}`;
  }
  return themeKey === 'pantry'
    ? 'No backup yet — consider exporting soon.'
    : 'NO BACKUP RECORDED · ▸ EXPORT RECOMMENDED';
}

function storageLocationLabel(themeKey: string): string {
  return themeKey === 'pantry' ? 'This browser only' : 'BROWSER LOCALSTORAGE';
}

/** §9 Data & backup: storage info + export/import + diagnostics. */
export function DataBackupSection() {
  const { themeKey } = useDesignTheme();
  const { items } = useInventory();

  const storageMB = getLocalStorageUsageMB();
  const limitMB = Math.round(LOCAL_STORAGE_LIMIT_BYTES / (1024 * 1024));
  const appData = getAppData();
  const lastBackup = appData?.lastBackupDate;
  const lastWrite = appData?.lastModified;

  return (
    <section id="sec-data" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§9"
        title={themeKey === 'pantry' ? 'Data & backup' : 'DATA & BACKUP'}
        sub={
          themeKey === 'pantry'
            ? 'Everything is stored on this device'
            : 'LOCAL STORAGE · NO ACCOUNT REQUIRED'
        }
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
            {themeKey === 'pantry' ? 'Storage' : 'STORAGE · §9.1'}
          </PanelHeader>
          <Field
            label={themeKey === 'pantry' ? 'Where' : 'LOCATION'}
            value={storageLocationLabel(themeKey)}
            hint={themeKey === 'pantry' ? 'No cloud' : 'OFFLINE-ONLY'}
          />
          <Field
            label={themeKey === 'pantry' ? 'Last save' : 'LAST WRITE'}
            value={lastWrite ? lastWrite.slice(0, 16).replace('T', ' · ') : '—'}
          />
          <Field
            label={themeKey === 'pantry' ? 'Records' : 'RECORD COUNT'}
            value={`${items.length} ${themeKey === 'pantry' ? 'items' : 'ITEMS'}`}
          />
          <Field
            label={themeKey === 'pantry' ? 'Storage used' : 'DISK USAGE'}
            value={`${storageMB} MB / ~${limitMB} MB`}
            hint={`${Math.round((Number(storageMB) / limitMB) * 100)}%`}
          />
        </Panel>
        <Panel padding={0}>
          <PanelHeader>
            {themeKey === 'pantry' ? 'Backup & transfer' : 'BACKUP · §9.2'}
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
            {backupLabel(themeKey, lastBackup)}
          </div>
        </Panel>
      </div>
      <Panel padding={0} style={{ marginTop: 14 }}>
        <PanelHeader>
          {themeKey === 'pantry' ? 'Diagnostics' : 'DIAGNOSTICS · §9.3'}
        </PanelHeader>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <DebugExport />
        </div>
      </Panel>
    </section>
  );
}
