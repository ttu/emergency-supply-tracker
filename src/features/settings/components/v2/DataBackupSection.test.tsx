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
    expect(screen.getByText('DATA & BACKUP')).toBeInTheDocument();
    expect(screen.getByText(/STORAGE · §9\.1/)).toBeInTheDocument();
    expect(screen.getByText(/BACKUP · §9\.2/)).toBeInTheDocument();
    expect(screen.getByText(/DIAGNOSTICS · §9\.3/)).toBeInTheDocument();
  });
});
