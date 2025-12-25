import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShoppingListExport } from './ShoppingListExport';
import { InventoryProvider } from '../../contexts/InventoryProvider';

const meta = {
  title: 'Settings/ShoppingListExport',
  component: ShoppingListExport,
  decorators: [
    (Story) => (
      <InventoryProvider>
        <Story />
      </InventoryProvider>
    ),
  ],
} satisfies Meta<typeof ShoppingListExport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
