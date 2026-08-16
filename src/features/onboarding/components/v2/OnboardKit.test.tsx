import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardKit } from './OnboardKit';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';
import { DEFAULT_KIT_ID } from '@/features/templates/kits';
import { createValidFile } from '@/shared/utils/validation/__helpers__/recommendedItemsValidation.helpers';

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

  /** A File whose text() resolves only when the test says so. */
  const deferredKitFile = (kitName: string) => {
    let release!: () => void;
    const text = new Promise<string>((resolve) => {
      release = () =>
        resolve(
          JSON.stringify(createValidFile({ meta: { name: kitName } as never })),
        );
    });
    return {
      file: { name: `${kitName}.json`, text: () => text } as unknown as File,
      release,
    };
  };

  it('a slow earlier upload never overrides the kit chosen last', async () => {
    renderStep();
    const input = screen.getByTestId('v2-kit-file-input');

    const first = deferredKitFile('Slow Kit');
    const second = deferredKitFile('Latest Kit');

    fireEvent.change(input, { target: { files: [first.file] } });
    fireEvent.change(input, { target: { files: [second.file] } });

    // The second pick finishes first, then the first one lands late.
    second.release();
    await waitFor(() => expect(screen.getByText('Latest Kit')).toBeVisible());
    first.release();

    await waitFor(() =>
      expect(screen.queryByText('Slow Kit')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Latest Kit').closest('button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('blocks Continue while a kit upload is still being read', async () => {
    const onNext = vi.fn();
    renderStep({ onNext });
    const input = screen.getByTestId('v2-kit-file-input');
    const pending = deferredKitFile('Pending Kit');

    fireEvent.change(input, { target: { files: [pending.file] } });

    const continueButton = screen.getByRole('button', {
      name: 'v2.voice.continueAction.cockpit',
    });
    await waitFor(() => expect(continueButton).toBeDisabled());
    fireEvent.click(continueButton);
    expect(onNext).not.toHaveBeenCalled();

    pending.release();
    await waitFor(() => expect(continueButton).not.toBeDisabled());
    fireEvent.click(continueButton);
    expect(onNext).toHaveBeenCalledTimes(1);
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
