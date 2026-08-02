import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardLayout, StepBar } from './OnboardLayout';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

describe('StepBar (v2)', () => {
  it('renders one segment per step', () => {
    const { container } = render(<StepBar step={2} total={5} />);
    expect(container.firstChild?.childNodes).toHaveLength(5);
  });
});

const renderLayout = (
  props: Partial<Parameters<typeof OnboardLayout>[0]> = {},
) =>
  renderWithProviders(
    <OnboardLayout
      step={2}
      title="TITLE"
      lead={{ title: 'LEAD', sub: 'SUB' }}
      onContinue={vi.fn()}
      {...props}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('OnboardLayout (v2)', () => {
  it('renders step indicator, lead title and footer text', () => {
    renderLayout();
    expect(screen.getByText('v2.onboarding.stepLabel')).toBeInTheDocument();
    expect(screen.getByText('LEAD')).toBeInTheDocument();
    expect(screen.getByText('SUB')).toBeInTheDocument();
    expect(
      screen.getByText('v2.onboarding.footerNote.cockpit'),
    ).toBeInTheDocument();
  });

  it('renders BACK only when back prop is provided', () => {
    const { rerender } = renderLayout();
    expect(
      screen.queryByRole('button', { name: 'v2.voice.back.cockpit' }),
    ).not.toBeInTheDocument();

    const back = vi.fn();
    rerender(
      <OnboardLayout
        step={2}
        title="T"
        lead={{ title: 'L' }}
        back={back}
        onContinue={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.back.cockpit' }),
    );
    expect(back).toHaveBeenCalled();
  });

  it('continue button uses voice.continueAction by default and custom label otherwise', () => {
    const onContinue = vi.fn();
    const { rerender } = renderLayout({ onContinue });
    expect(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    ).toBeInTheDocument();

    rerender(
      <OnboardLayout
        step={2}
        title="T"
        lead={{ title: 'L' }}
        onContinue={onContinue}
        primaryLabel="FINISH"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'FINISH' }));
    expect(onContinue).toHaveBeenCalled();
  });

  it('renders aside content when side prop is provided', () => {
    renderLayout({ side: <div data-testid="side">side content</div> });
    expect(screen.getByTestId('side')).toHaveTextContent('side content');
  });

  it('owns its scrolling — the v2 themes lock the document', () => {
    renderLayout();
    const root = screen.getByTestId('v2-onboard-layout');
    expect(root.style.overflowY).toBe('auto');
    expect(root.style.height).toBe('100vh');
  });

  describe('narrow viewports', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    const stubViewport = (isMobile: boolean) =>
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: isMobile,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      );

    it('puts the side panel beside the content when there is room', () => {
      stubViewport(false);
      renderLayout({ side: <div data-testid="side">side content</div> });
      expect(document.querySelector('aside')).toBeInTheDocument();
    });

    it('stacks the side panel into the flow on a phone, above the actions', () => {
      stubViewport(true);
      renderLayout({
        side: <div data-testid="side">side content</div>,
        back: vi.fn(),
      });

      // A second column half off the screen is unreadable; it belongs in the
      // main flow, before the buttons that leave the step.
      expect(document.querySelector('aside')).not.toBeInTheDocument();
      const side = screen.getByTestId('side');
      expect(side).toBeVisible();

      const continueButton = screen.getByRole('button', {
        name: 'v2.voice.continueAction.cockpit',
      });
      expect(
        side.compareDocumentPosition(continueButton) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });
});
