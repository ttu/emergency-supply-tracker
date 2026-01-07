import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';

// Override the global i18next mock with real implementation for this test
// ErrorBoundary uses withTranslation HOC which requires real i18next
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return actual;
});
import { ErrorBoundary } from './ErrorBoundary';

// Initialize i18n for tests
i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      common: {
        errorBoundary: {
          title: 'Something went wrong',
          message:
            'An unexpected error occurred. Please try reloading the page.',
          details: 'Error details',
          reload: 'Reload Page',
          tryAgain: 'Try Again',
        },
      },
    },
  },
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Helper to wrap components with i18n provider
function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    localStorage.clear();
    // Suppress console.error for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    renderWithI18n(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders error UI when a child throws', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows error message in error UI', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText(/An unexpected error occurred/),
    ).toBeInTheDocument();
  });

  it('renders error details section', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Error details')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders reload and try again buttons', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole('button', { name: 'Reload Page' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try Again' }),
    ).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const handleError = vi.fn();

    renderWithI18n(
      <ErrorBoundary onError={handleError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(handleError).toHaveBeenCalled();
    expect(handleError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error UI</div>;

    renderWithI18n(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('resets error state when Try Again is clicked', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Recovered content</div>;
    };

    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      </I18nextProvider>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Fix the component before clicking Try Again
    shouldThrow = false;

    await user.click(screen.getByRole('button', { name: 'Try Again' }));

    // Rerender to show recovered state
    rerender(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      </I18nextProvider>,
    );

    // After reset, should try to render children again
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});
