import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { DataBackupSection } from './DataBackupSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('DataBackupSection (v2)', () => {
  it('renders the §9 DATA & BACKUP header and Storage/Backup/Diagnostics panels', () => {
    renderWithProviders(<DataBackupSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('§9')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.data.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.data.storageHeader.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.data.backupHeader.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.data.diagnosticsHeader.cockpit'),
    ).toBeInTheDocument();
  });
});
