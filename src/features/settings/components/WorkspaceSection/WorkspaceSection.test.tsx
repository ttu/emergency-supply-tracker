import { describe, it, expect, beforeEach } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceSection } from './WorkspaceSection';
import { WorkspaceProvider } from '@/features/workspace';
import { renderWithProviders } from '@/test/render';
import {
  saveAppData,
  createWorkspace,
  getWorkspaceList,
} from '@/shared/utils/storage/localStorage';
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
    localStorage.clear();
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

  it('creates a workspace when name is entered and add is clicked', async () => {
    const user = userEvent.setup();
    renderWorkspaceSection();
    const input = screen.getByLabelText(
      'settings.workspaces.newNamePlaceholder',
    );
    await user.type(input, 'Car kit');
    await user.click(
      screen.getByRole('button', { name: 'settings.workspaces.addWorkspace' }),
    );
    expect(screen.getByRole('option', { name: 'Car kit' })).toBeInTheDocument();
    expect(getWorkspaceList()).toHaveLength(2);
  });

  it('creates workspace with default name when input is empty', async () => {
    const user = userEvent.setup();
    renderWorkspaceSection();
    await user.click(
      screen.getByRole('button', { name: 'settings.workspaces.addWorkspace' }),
    );
    expect(getWorkspaceList()).toHaveLength(2);
  });

  it('switches active workspace when select is changed', async () => {
    createWorkspace('Second');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderWorkspaceSection();
    const select = screen.getByLabelText('settings.workspaces.activeWorkspace');
    await user.selectOptions(select, getWorkspaceList()[1].id);
    expect(select).toHaveValue(getWorkspaceList()[1].id);
  });

  it('shows rename row when rename is clicked and saves on save button', async () => {
    const user = userEvent.setup();
    renderWorkspaceSection();
    await user.click(
      screen.getAllByRole('button', {
        name: 'settings.workspaces.renameLabel',
      })[0],
    );
    const renameInput = screen.getByLabelText(
      'settings.workspaces.renameLabel',
    ) as HTMLInputElement;
    expect(renameInput).toHaveValue('Home');
    await user.clear(renameInput);
    await user.type(renameInput, 'Main');
    await user.click(screen.getByRole('button', { name: 'common.save' }));
    expect(screen.getByRole('option', { name: 'Main' })).toBeInTheDocument();
  });

  it('cancels rename when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWorkspaceSection();
    await user.click(
      screen.getByRole('button', { name: 'settings.workspaces.renameLabel' }),
    );
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    const section = screen.getByTestId('workspace-section');
    expect(
      within(section).getByRole('option', { name: 'Home' }),
    ).toBeInTheDocument();
  });

  it('opens confirm delete dialog when delete is clicked and closes on cancel', async () => {
    createWorkspace('To remove');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderWorkspaceSection();
    const deleteButtons = screen.getAllByRole('button', {
      name: 'settings.workspaces.deleteLabel',
    });
    await user.click(deleteButtons[0]);
    expect(
      screen.getByTestId('workspace-confirm-delete-dialog'),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId('workspace-confirm-cancel-button'));
    expect(
      screen.queryByTestId('workspace-confirm-delete-dialog'),
    ).not.toBeInTheDocument();
  });

  it('closes confirm delete dialog on Escape', async () => {
    createWorkspace('To remove');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderWorkspaceSection();
    await user.click(
      screen.getAllByRole('button', {
        name: 'settings.workspaces.deleteLabel',
      })[0],
    );
    expect(
      screen.getByTestId('workspace-confirm-delete-dialog'),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(
      screen.queryByTestId('workspace-confirm-delete-dialog'),
    ).not.toBeInTheDocument();
  });

  it('restores focus to trigger button when dialog is closed by cancel', async () => {
    createWorkspace('To remove');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderWorkspaceSection();
    const deleteButtons = screen.getAllByRole('button', {
      name: 'settings.workspaces.deleteLabel',
    });
    const triggerButton = deleteButtons[0];
    await user.click(triggerButton);
    expect(
      screen.getByTestId('workspace-confirm-delete-dialog'),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId('workspace-confirm-cancel-button'));
    await waitFor(() => {
      expect(document.activeElement).toBe(triggerButton);
    });
  });

  it('deletes workspace when confirm delete is clicked', async () => {
    createWorkspace('To remove');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderWorkspaceSection();
    expect(getWorkspaceList()).toHaveLength(2);
    const deleteButtons = screen.getAllByRole('button', {
      name: 'settings.workspaces.deleteLabel',
    });
    await user.click(deleteButtons[1]);
    const dialog = screen.getByTestId('workspace-confirm-delete-dialog');
    const confirmBtn = within(dialog).getByTestId(
      'workspace-confirm-delete-button',
    );
    await user.click(confirmBtn);
    expect(getWorkspaceList()).toHaveLength(1);
    expect(
      screen.queryByRole('option', { name: 'To remove' }),
    ).not.toBeInTheDocument();
  });

  it('focuses primary delete button when confirm dialog opens', async () => {
    createWorkspace('To remove');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderWorkspaceSection();
    await user.click(
      screen.getAllByRole('button', {
        name: 'settings.workspaces.deleteLabel',
      })[0],
    );
    const dialog = screen.getByTestId('workspace-confirm-delete-dialog');
    const confirmBtn = within(dialog).getByTestId(
      'workspace-confirm-delete-button',
    );
    await waitFor(() => {
      expect(document.activeElement).toBe(confirmBtn);
    });
  });

  it('does not show delete button when only one workspace', () => {
    renderWorkspaceSection();
    expect(
      screen.queryByRole('button', { name: 'settings.workspaces.deleteLabel' }),
    ).not.toBeInTheDocument();
  });

  it('shows delete button for each workspace when more than one', async () => {
    const user = userEvent.setup();
    renderWorkspaceSection();
    await user.type(
      screen.getByLabelText('settings.workspaces.newNamePlaceholder'),
      'Second',
    );
    await user.click(
      screen.getByRole('button', { name: 'settings.workspaces.addWorkspace' }),
    );
    const deleteButtons = screen.getAllByRole('button', {
      name: 'settings.workspaces.deleteLabel',
    });
    expect(deleteButtons).toHaveLength(2);
  });
});
