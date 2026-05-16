import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardStep02Theme } from './OnboardStep02Theme';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderStep = (onNext = vi.fn(), onBack = vi.fn()) =>
  renderWithProviders(<OnboardStep02Theme onNext={onNext} onBack={onBack} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('OnboardStep02Theme (v2)', () => {
  it('renders the appearance lead', () => {
    renderStep();
    expect(screen.getByText('CHOOSE THEME')).toBeInTheDocument();
  });

  it('continue and back trigger their callbacks', () => {
    const onNext = vi.fn();
    const onBack = vi.fn();
    renderStep(onNext, onBack);
    fireEvent.click(screen.getByRole('button', { name: 'BACK' }));
    fireEvent.click(screen.getByRole('button', { name: /CONTINUE →/ }));
    expect(onBack).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });
});
