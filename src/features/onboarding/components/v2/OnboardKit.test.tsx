import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardKit } from './OnboardKit';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';
import { DEFAULT_KIT_ID } from '@/features/templates/kits';

const renderStep = (props: Partial<Parameters<typeof OnboardKit>[0]> = {}) =>
  renderWithProviders(
    <OnboardKit onNext={vi.fn()} onBack={vi.fn()} {...props} />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('OnboardKit', () => {
  it('offers the built-in kits', () => {
    renderStep();
    expect(screen.getByTestId(`v2-kit-${DEFAULT_KIT_ID}`)).toBeVisible();
  });

  it('marks the active kit as chosen', () => {
    renderStep();
    expect(screen.getByTestId(`v2-kit-${DEFAULT_KIT_ID}`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('switching kit does not skip ahead — the step still has to be confirmed', () => {
    const onNext = vi.fn();
    renderStep({ onNext });

    const kits = screen.getAllByTestId(/^v2-kit-(?!upload)/);
    const other = kits.find((k) => k.getAttribute('aria-pressed') === 'false');
    expect(other).toBeDefined();
    fireEvent.click(other!);

    expect(other).toHaveAttribute('aria-pressed', 'true');
    expect(onNext).not.toHaveBeenCalled();
  });

  it('continues to the item list', () => {
    const onNext = vi.fn();
    renderStep({ onNext });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    );
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('goes back', () => {
    const onBack = vi.fn();
    renderStep({ onBack });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.back.cockpit' }),
    );
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('offers an upload for a kit of your own', () => {
    renderStep();
    expect(screen.getByTestId('v2-kit-upload')).toBeVisible();
    expect(screen.getByTestId('v2-kit-file-input')).toHaveAttribute(
      'accept',
      'application/json,.json',
    );
  });
});
