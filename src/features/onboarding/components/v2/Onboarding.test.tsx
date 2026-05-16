import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { DesignOnboarding } from './Onboarding';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderFlow = (onComplete = vi.fn()) =>
  renderWithProviders(<DesignOnboarding onComplete={onComplete} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('DesignOnboarding (v2 orchestrator)', () => {
  it('starts on step 1 (welcome)', () => {
    renderFlow();
    expect(screen.getByText(/STEP 01 \/ 05/)).toBeInTheDocument();
    expect(screen.getByText(/WELCOME · LANGUAGE/)).toBeInTheDocument();
  });

  it('advances through every step and finishes on the completion view', () => {
    const onComplete = vi.fn();
    renderFlow(onComplete);

    fireEvent.click(screen.getByRole('button', { name: /CONTINUE →/ })); // → 2
    expect(screen.getByText(/STEP 02 \/ 05/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /CONTINUE →/ })); // → 3
    expect(screen.getByText(/STEP 03 \/ 05/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /CONTINUE →/ })); // → 4
    expect(screen.getByText(/STEP 04 \/ 05/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /CONTINUE →/ })); // → 5
    expect(screen.getByText(/STEP 05 \/ 05/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /COMMIT BASELINE →/ })); // → 6
    expect(screen.getByText('PROVISIONING COMPLETE')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /OPEN OVERVIEW →/ }));
    expect(onComplete).toHaveBeenCalled();
  });

  it('BACK from step 2 returns to step 1', () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: /CONTINUE →/ }));
    fireEvent.click(screen.getByRole('button', { name: 'BACK' }));
    expect(screen.getByText(/STEP 01 \/ 05/)).toBeInTheDocument();
  });
});
