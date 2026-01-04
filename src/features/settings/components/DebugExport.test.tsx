import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { DebugExport } from './DebugExport';
import * as errorLogger from '@/shared/utils/errorLogger';

// Initialize i18n for tests
i18n.init({
  lng: 'en',
  resources: {
    en: {
      common: {
        settings: {
          debugExport: {
            button: 'Export Debug Log',
            description: 'Download diagnostic data for troubleshooting issues',
            logCount: '{{count}} log entries recorded',
          },
        },
      },
    },
  },
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

describe('DebugExport', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('renders export button', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DebugExport />
      </I18nextProvider>,
    );

    expect(
      screen.getByRole('button', { name: 'Export Debug Log' }),
    ).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DebugExport />
      </I18nextProvider>,
    );

    expect(
      screen.getByText('Download diagnostic data for troubleshooting issues'),
    ).toBeInTheDocument();
  });

  it('calls downloadDebugExport when button is clicked', async () => {
    const user = userEvent.setup();
    const downloadSpy = jest
      .spyOn(errorLogger, 'downloadDebugExport')
      .mockImplementation(() => {});

    render(
      <I18nextProvider i18n={i18n}>
        <DebugExport />
      </I18nextProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Export Debug Log' }));

    expect(downloadSpy).toHaveBeenCalledTimes(1);
  });

  it('shows log count when logs exist', () => {
    jest.spyOn(errorLogger, 'getLogCount').mockReturnValue(5);

    render(
      <I18nextProvider i18n={i18n}>
        <DebugExport />
      </I18nextProvider>,
    );

    expect(screen.getByText('5 log entries recorded')).toBeInTheDocument();
  });

  it('does not show log count when no logs exist', () => {
    jest.spyOn(errorLogger, 'getLogCount').mockReturnValue(0);

    render(
      <I18nextProvider i18n={i18n}>
        <DebugExport />
      </I18nextProvider>,
    );

    expect(screen.queryByText(/log entries recorded/)).not.toBeInTheDocument();
  });
});
