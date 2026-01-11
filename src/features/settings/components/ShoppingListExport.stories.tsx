import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShoppingListExport } from './ShoppingListExport';
import { InventoryProvider } from '@/features/inventory';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';

const meta = {
  title: 'Settings/ShoppingListExport',
  component: ShoppingListExport,
  decorators: [
    (Story) => (
      <NotificationProvider>
        <InventoryProvider>
          <Story />
        </InventoryProvider>
      </NotificationProvider>
    ),
  ],
} satisfies Meta<typeof ShoppingListExport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
