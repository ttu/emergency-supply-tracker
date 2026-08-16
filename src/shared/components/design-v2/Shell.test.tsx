import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { DesktopShell, MobileShell, type DesignNavId } from './Shell';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

const NAV_IDS: DesignNavId[] = ['home', 'inv', 'help', 'settings'];

const render = (
  ui: React.ReactElement,
  theme: 'cockpit' | 'civil' | 'pantry' = 'cockpit',
) =>
  renderWithProviders(ui, {
    initialAppData: createMockAppData({
      settings: createMockSettings({ theme }),
    }),
  });

describe.each([
  {
    name: 'DesktopShell',
    Component: DesktopShell,
    extraProps: { breadcrumb: 'Water & Beverages' },
  },
  { name: 'MobileShell', Component: MobileShell, extraProps: {} },
])('$name (v2)', ({ Component, extraProps }) => {
  it('renders its children inside the main content area', () => {
    render(
      <Component active="home" onNav={vi.fn()} title="Overview" {...extraProps}>
        <div data-testid="page-content">Dashboard content</div>
      </Component>,
    );
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('renders one nav button per page', () => {
    render(
      <Component active="home" onNav={vi.fn()} title="Overview" {...extraProps}>
        content
      </Component>,
    );
    for (const id of NAV_IDS) {
      expect(screen.getByTestId(`v2-nav-${id}`)).toBeInTheDocument();
    }
  });

  it('marks only the active page with aria-current="page"', () => {
    render(
      <Component
        active="settings"
        onNav={vi.fn()}
        title="Settings"
        {...extraProps}
      >
        content
      </Component>,
    );
    for (const id of NAV_IDS) {
      const button = screen.getByTestId(`v2-nav-${id}`);
      if (id === 'settings') {
        expect(button).toHaveAttribute('aria-current', 'page');
      } else {
        expect(button).not.toHaveAttribute('aria-current');
      }
    }
  });

  it('invokes onNav with the clicked page id', () => {
    const onNav = vi.fn();
    render(
      <Component active="home" onNav={onNav} title="Overview" {...extraProps}>
        content
      </Component>,
    );

    for (const id of NAV_IDS) {
      fireEvent.click(screen.getByTestId(`v2-nav-${id}`));
    }

    expect(onNav).toHaveBeenCalledTimes(NAV_IDS.length);
    for (const id of NAV_IDS) {
      expect(onNav).toHaveBeenCalledWith(id);
    }
  });
});

describe('DesktopShell (v2)', () => {
  it('renders the page title', () => {
    render(
      <DesktopShell active="home" onNav={vi.fn()} title="Overview">
        content
      </DesktopShell>,
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders the breadcrumb when provided, and omits it otherwise', () => {
    const { rerender } = render(
      <DesktopShell
        active="inv"
        onNav={vi.fn()}
        title="Inventory"
        breadcrumb="Water & Beverages"
      >
        content
      </DesktopShell>,
    );
    expect(screen.getByText(/Water & Beverages/)).toBeInTheDocument();

    rerender(
      <DesktopShell active="inv" onNav={vi.fn()} title="Inventory">
        content
      </DesktopShell>,
    );
    expect(screen.queryByText(/Water & Beverages/)).not.toBeInTheDocument();
  });
});

describe('MobileShell (v2)', () => {
  it('renders the page title when provided', () => {
    render(
      <MobileShell active="home" onNav={vi.fn()} title="Overview">
        content
      </MobileShell>,
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('falls back to the app name when no title is given', () => {
    render(
      <MobileShell active="home" onNav={vi.fn()} title="">
        content
      </MobileShell>,
    );
    expect(screen.getByText('v2.voice.appName.cockpit')).toBeInTheDocument();
  });
});
