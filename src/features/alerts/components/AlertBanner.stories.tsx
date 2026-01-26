import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertBanner } from './AlertBanner';
import { SettingsProvider } from '@/features/settings';
import { createMockAlert } from '@/shared/utils/test/factories';
import { createAlertId } from '@/shared/types';

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
      createMockAlert({
        id: createAlertId('1'),
        type: 'critical',
        message: 'Item has expired',
        itemName: 'Bottled Water',
      }),
    ],
  },
};

export const WarningAlert: Story = {
  args: {
    alerts: [
      createMockAlert({
        id: createAlertId('1'),
        type: 'warning',
        message: 'Running low on stock',
        itemName: 'Canned Soup',
      }),
    ],
  },
};

export const InfoAlert: Story = {
  args: {
    alerts: [
      createMockAlert({
        id: createAlertId('1'),
        type: 'info',
        message: 'Time to check your supplies',
      }),
    ],
  },
};

export const MultipleAlerts: Story = {
  args: {
    alerts: [
      createMockAlert({
        id: createAlertId('1'),
        type: 'critical',
        message: 'Item has expired',
        itemName: 'First Aid Kit',
      }),
      createMockAlert({
        id: createAlertId('2'),
        type: 'critical',
        message: 'Item has expired',
        itemName: 'Batteries',
      }),
      createMockAlert({
        id: createAlertId('3'),
        type: 'warning',
        message: 'Running low on stock',
        itemName: 'Bottled Water',
      }),
      createMockAlert({
        id: createAlertId('4'),
        type: 'info',
        message: 'Consider adding more variety to your food supplies',
      }),
    ],
  },
};

export const WithDismiss: Story = {
  args: {
    alerts: [
      createMockAlert({
        id: createAlertId('1'),
        type: 'warning',
        message: 'Expiring soon',
        itemName: 'Energy Bars',
      }),
    ],
    onDismiss: (id) => {
      console.log('Dismissed alert:', id);
    },
  },
};

export const ClickableCategoryAlerts: Story = {
  args: {
    alerts: [
      createMockAlert({
        id: createAlertId('category-low-stock-water-beverages'),
        type: 'warning',
        message: 'Running low (35% stocked)',
        itemName: 'Water & Beverages',
        categoryId: 'water-beverages',
      }),
      createMockAlert({
        id: createAlertId('category-critically-low-food'),
        type: 'critical',
        message: 'Critically low (15% stocked)',
        itemName: 'Food',
        categoryId: 'food',
      }),
      createMockAlert({
        id: createAlertId('expired-1'),
        type: 'critical',
        message: 'Item has expired',
        itemName: 'Canned Fish',
        // No categoryId - this alert is not clickable
      }),
    ],
    onAlertClick: (categoryId) => {
      console.log('Navigate to category:', categoryId);
    },
    onDismiss: (id) => {
      console.log('Dismissed alert:', id);
    },
  },
};
