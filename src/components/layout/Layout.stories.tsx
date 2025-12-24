import type { Meta, StoryObj } from '@storybook/react-vite';
import { Layout } from './Layout';
import { Button } from '../common/Button';

const meta = {
  title: 'Layout/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Layout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    header: {
      logo: <strong>Emergency Supply Tracker</strong>,
      navigation: (
        <>
          <a href="#dashboard">Dashboard</a>
          <a href="#supplies">Supplies</a>
          <a href="#reports">Reports</a>
        </>
      ),
      actions: (
        <>
          <Button size="small" variant="secondary">
            Settings
          </Button>
          <Button size="small">Sign Out</Button>
        </>
      ),
    },
    footer: {
      links: (
        <>
          <a href="#about">About</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </>
      ),
      copyright: <p>© 2024 Emergency Supply Tracker. All rights reserved.</p>,
    },
    children: (
      <div>
        <h1>Welcome to Emergency Supply Tracker</h1>
        <p>This is the main content area of the application.</p>
        <p>
          The layout component provides a consistent structure with header, main
          content, and footer sections.
        </p>
      </div>
    ),
  },
};

export const HeaderOnly: Story = {
  args: {
    header: {
      logo: <strong>Emergency Supply Tracker</strong>,
      navigation: (
        <>
          <a href="#dashboard">Dashboard</a>
          <a href="#supplies">Supplies</a>
        </>
      ),
      actions: <Button size="small">Sign In</Button>,
    },
    children: (
      <div>
        <h1>Layout with Header Only</h1>
        <p>This layout includes only a header, without a footer.</p>
      </div>
    ),
  },
};

export const FooterOnly: Story = {
  args: {
    footer: {
      links: (
        <>
          <a href="#about">About</a>
          <a href="#privacy">Privacy</a>
        </>
      ),
      copyright: <p>© 2024 Emergency Supply Tracker</p>,
    },
    children: (
      <div>
        <h1>Layout with Footer Only</h1>
        <p>This layout includes only a footer, without a header.</p>
      </div>
    ),
  },
};

export const MinimalLayout: Story = {
  args: {
    children: (
      <div>
        <h1>Minimal Layout</h1>
        <p>This layout has no header or footer, just the main content area.</p>
      </div>
    ),
  },
};

export const WithLongContent: Story = {
  args: {
    header: {
      logo: <strong>Emergency Supply Tracker</strong>,
      navigation: (
        <>
          <a href="#dashboard">Dashboard</a>
          <a href="#supplies">Supplies</a>
        </>
      ),
    },
    footer: {
      copyright: <p>© 2024 Emergency Supply Tracker</p>,
    },
    children: (
      <div>
        <h1>Layout with Long Content</h1>
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i}>
            This is paragraph {i + 1}. The layout should handle long content
            gracefully and ensure the footer stays at the bottom of the viewport
            or content, whichever is longer.
          </p>
        ))}
      </div>
    ),
  },
};
