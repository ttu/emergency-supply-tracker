import type { Meta, StoryObj } from '@storybook/react-vite';
import { Navigation } from './Navigation';
import { useState } from 'react';
import type { PageType } from './Navigation';

const meta = {
  title: 'Common/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Navigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {
  args: {
    currentPage: 'dashboard',
    onNavigate: () => {},
  },
};

export const Inventory: Story = {
  args: {
    currentPage: 'inventory',
    onNavigate: () => {},
  },
};

export const Settings: Story = {
  args: {
    currentPage: 'settings',
    onNavigate: () => {},
  },
};

export const Interactive = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  return <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />;
};
