import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardStep01Welcome } from './OnboardStep01Welcome';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderStep = (onNext = vi.fn()) =>
  renderWithProviders(<OnboardStep01Welcome onNext={onNext} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('OnboardStep01Welcome (v2)', () => {
  it('renders the cockpit welcome title and outputs sidebar', () => {
    renderStep();
    expect(screen.getByText(/WELCOME · LANGUAGE/)).toBeInTheDocument();
    expect(screen.getByText('OUTPUTS')).toBeInTheDocument();
  });

  it('continue advances the flow', () => {
    const onNext = vi.fn();
    renderStep(onNext);
    fireEvent.click(screen.getByRole('button', { name: /CONTINUE →/ }));
    expect(onNext).toHaveBeenCalled();
  });
});
