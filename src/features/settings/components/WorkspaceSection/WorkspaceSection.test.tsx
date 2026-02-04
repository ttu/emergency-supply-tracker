import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { WorkspaceSection } from './WorkspaceSection';
import { WorkspaceProvider } from '@/features/workspace';
import { renderWithProviders } from '@/test/render';
import { saveAppData } from '@/shared/utils/storage/localStorage';
import { createMockAppData } from '@/shared/utils/test/factories';

function renderWorkspaceSection() {
  return renderWithProviders(
    <WorkspaceProvider>
      <WorkspaceSection />
    </WorkspaceProvider>,
    {
      providers: { settings: true, household: true, inventory: true },
    },
  );
}

describe('WorkspaceSection', () => {
  beforeEach(() => {
    const data = createMockAppData({
      settings: {
        language: 'en',
        theme: 'light',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
        onboardingCompleted: true,
      },
    });
    saveAppData(data);
  });

  it('renders workspace section with active workspace selector', () => {
    renderWorkspaceSection();
    expect(
      screen.getByLabelText('settings.workspaces.activeWorkspace'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('workspace-section')).toBeInTheDocument();
  });

  it('renders create workspace input and button', () => {
    renderWorkspaceSection();
    expect(
      screen.getByLabelText('settings.workspaces.newNamePlaceholder'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'settings.workspaces.addWorkspace' }),
    ).toBeInTheDocument();
  });
});
