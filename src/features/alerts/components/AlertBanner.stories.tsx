import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertBanner } from './AlertBanner';
import { SettingsProvider } from '@/features/settings';

const meta = {
  title: 'Features/Alerts/AlertBanner',
  component: AlertBanner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <Story />
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof AlertBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    alerts: [],
  },
};

export const CriticalAlert: Story = {
  args: {
    alerts: [
      {
        id: '1',
        type: 'critical',
        message: 'Item has expired',
        itemName: 'Bottled Water',
      },
    ],
  },
};

export const WarningAlert: Story = {
  args: {
    alerts: [
      {
        id: '1',
        type: 'warning',
        message: 'Running low on stock',
        itemName: 'Canned Soup',
      },
    ],
  },
};

export const InfoAlert: Story = {
  args: {
    alerts: [
      {
        id: '1',
        type: 'info',
        message: 'Time to check your supplies',
      },
    ],
  },
};

export const MultipleAlerts: Story = {
  args: {
    alerts: [
      {
        id: '1',
        type: 'critical',
        message: 'Item has expired',
        itemName: 'First Aid Kit',
      },
      {
        id: '2',
        type: 'critical',
        message: 'Item has expired',
        itemName: 'Batteries',
      },
      {
        id: '3',
        type: 'warning',
        message: 'Running low on stock',
        itemName: 'Bottled Water',
      },
      {
        id: '4',
        type: 'info',
        message: 'Consider adding more variety to your food supplies',
      },
    ],
  },
};

export const WithDismiss: Story = {
  args: {
    alerts: [
      {
        id: '1',
        type: 'warning',
        message: 'Expiring soon',
        itemName: 'Energy Bars',
      },
    ],
    onDismiss: (id: string) => {
      console.log('Dismissed alert:', id);
    },
  },
};
