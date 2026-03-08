import { CURRENT_SCHEMA_VERSION } from '../migrations';
import type { PartialExportData } from '@/shared/types/exportImport';

// Helper to create minimal export metadata for tests
export const createTestExportMetadata = (
  sections: string[] = [],
): PartialExportData['exportMetadata'] => ({
  exportedAt: '2024-01-01T00:00:00.000Z',
  appVersion: CURRENT_SCHEMA_VERSION,
  itemCount: 0,
  categoryCount: 0,
  includedSections:
    sections as PartialExportData['exportMetadata']['includedSections'],
});
